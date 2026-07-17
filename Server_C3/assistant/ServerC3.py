"""
🎙️ VOICE ASSISTANT - ESP32 UDP (Integrated with testTTS)
=========================================================
FLOW:
  [ESP32 Mic] --UDP--> [Wake Word "Hey Bro"]
  --> TTS "Chào bạn..." --> [Thu câu hỏi]
  --> PersonalAssistantAgent.chat() --> TTS câu trả lời
  --> TTS "Tôi đã trả lời xong..."
  --> Lặp lại

Integration bridges (giữ nguyên logic gốc, chỉ thay điểm kết nối):
  - WAKE WORD: Whisper tiny.en + SBERT (giữ nguyên, model riêng để đảm bảo tốc độ)
  - STT:       PCM numpy array → temp WAV (soundfile) → SpeechService.transcribe()
               (kế thừa VI initial prompt, VAD filter, corrections của project)
  - TTS:       text → SpeechService.text_to_speech() (→ MP3) → pydub → PCM → UDP
  - AI:        PersonalAssistantAgent.chat(question, enable_tts=False)
               (full AI: memory, web search, weather, music, stock...)

REQUIRES (added to requirements.txt):
  sentence-transformers>=2.7.0
  pydub>=0.25.1
"""

from __future__ import annotations

import asyncio
import collections
import logging
import os
import re
import socket
import tempfile
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import TYPE_CHECKING, Optional

import numpy as np
import soundfile as sf
import torch
from faster_whisper import WhisperModel
from pydub import AudioSegment

# sentence_transformers is imported LAZILY inside _load_wake_models()
# to prevent Streamlit's file watcher from inspecting the full `transformers`
# library on startup (which causes hundreds of torchvision-related warnings).
# sentence_transformers / transformers are only loaded when the UDP server
# actually starts — never when the Streamlit UI imports the assistant package.
if TYPE_CHECKING:
    from sentence_transformers import SentenceTransformer  # type: ignore[import]

from assistant.agent import PersonalAssistantAgent
from assistant.config import settings

logger = logging.getLogger(__name__)

# ============================================================
#  NETWORK UTILITIES
# ============================================================


def _get_local_ip() -> str:
    """Get local IP address by connecting to a remote socket."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


# ============================================================
#  DEVICE CONNECTION TRACKING
# ============================================================

@dataclass
class ESP32Device:
    """Track ESP32 device connection state."""
    addr: tuple  # (IP, port)
    first_seen: float  # Timestamp when first detected
    last_seen: float = field(default_factory=time.time)
    packets_received: int = 0
    packets_sent: int = 0
    status: str = "connected"  # "connected", "idle", "lost"
    
    def update_activity(self) -> None:
        """Update last seen timestamp."""
        self.last_seen = time.time()
    
    def get_idle_time(self) -> float:
        """Get seconds since last activity."""
        return time.time() - self.last_seen
    
    def __str__(self) -> str:
        """String representation."""
        idle_sec = self.get_idle_time()
        return f"{self.addr[0]}:{self.addr[1]} [{self.status}] (idle: {idle_sec:.1f}s, rx: {self.packets_received}, tx: {self.packets_sent})"


class DeviceManager:
    """
    Manage ESP32 device connections and disconnections.
    
    Features:
    - Auto-detect new device connections
    - Detect device disconnections (idle timeout)
    - Track packet stats
    - Log connection events
    """
    
    DEVICE_TIMEOUT = 10.0  # seconds - timeout after no activity
    CHECK_INTERVAL = 2.0   # seconds - check for disconnected devices
    
    def __init__(self):
        self.devices: dict[tuple, ESP32Device] = {}
        self.last_check = time.time()
    
    def on_packet_received(self, addr: tuple) -> bool:
        """
        Record packet received from device.
        Returns True if new device, False if existing.
        """
        is_new = addr not in self.devices
        
        if is_new:
            device = ESP32Device(addr=addr, first_seen=time.time())
            self.devices[addr] = device
            self._print_connected(device)
        else:
            self.devices[addr].packets_received += 1
            self.devices[addr].update_activity()
        
        return is_new
    
    def on_packet_sent(self, addr: tuple) -> None:
        """Record packet sent to device."""
        if addr in self.devices:
            self.devices[addr].packets_sent += 1
            self.devices[addr].update_activity()
    
    def check_disconnections(self) -> None:
        """Check for idle devices and mark them as lost."""
        now = time.time()
        if now - self.last_check < self.CHECK_INTERVAL:
            return
        
        self.last_check = now
        disconnected = []
        
        for addr, device in self.devices.items():
            if device.status == "connected" and device.get_idle_time() > self.DEVICE_TIMEOUT:
                device.status = "lost"
                disconnected.append(device)
                self._print_disconnected(device)
        
        # Remove lost devices after logging
        for device in disconnected:
            del self.devices[device.addr]
    
    def get_active_devices(self) -> list[ESP32Device]:
        """Get list of connected devices."""
        return [d for d in self.devices.values() if d.status == "connected"]
    
    def get_device_status(self) -> str:
        """Get human-readable status of all devices."""
        if not self.devices:
            return "📵 No devices connected"
        
        lines = [f"📱 Connected devices: {len(self.get_active_devices())}/{len(self.devices)}"]
        for device in self.devices.values():
            lines.append(f"   └─ {device}")
        return "\n".join(lines)
    
    @staticmethod
    def _print_connected(device: ESP32Device) -> None:
        """Print connected message."""
        print(f"✅ NEW DEVICE CONNECTED: {device.addr[0]}:{device.addr[1]}")
        print(f"   Connected at: {time.strftime('%H:%M:%S', time.localtime(device.first_seen))}")
    
    @staticmethod
    def _print_disconnected(device: ESP32Device) -> None:
        """Print disconnected message."""
        idle_time = device.get_idle_time()
        print(f"❌ DEVICE DISCONNECTED: {device.addr[0]}:{device.addr[1]}")
        print(f"   Last activity: {idle_time:.1f}s ago")
        print(f"   Total packets: RX={device.packets_received}, TX={device.packets_sent}")

# ============================================================
#  CONFIG (overridable via environment variables)
# ============================================================

UDP_IP   = os.getenv("ESP32_UDP_IP",   "0.0.0.0")
UDP_PORT = int(os.getenv("ESP32_UDP_PORT", "12345"))

# Wake word (original logic preserved)
WAKE_WORD       = os.getenv("ESP32_WAKE_WORD",        "hey bro")
WAKE_MODEL_SIZE = os.getenv("ESP32_WAKE_MODEL",       "tiny.en")   # Fast model for wake detection
SBERT_MODEL     = os.getenv("ESP32_SBERT_MODEL",      "paraphrase-multilingual-MiniLM-L12-v2")
WAKE_THRESHOLD  = float(os.getenv("ESP32_WAKE_THRESHOLD", "0.75"))

# Audio (original values preserved)
SAMPLE_RATE      = int(os.getenv("ESP32_SAMPLE_RATE",      "16000"))
CHUNK_SIZE       = int(os.getenv("ESP32_CHUNK_SIZE",       "2048"))
WINDOW_SECONDS   = float(os.getenv("ESP32_WINDOW_SECONDS", "1.5"))
SILENCE_RMS      = int(os.getenv("ESP32_SILENCE_RMS",      "300"))
SILENCE_DURATION = float(os.getenv("ESP32_SILENCE_DURATION", "1.5"))
QUESTION_TIMEOUT = float(os.getenv("ESP32_QUESTION_TIMEOUT", "4.0"))

# TTS streaming to ESP32 (original values preserved)
TTS_CHUNK_SIZE = int(os.getenv("ESP32_TTS_CHUNK_SIZE", "1024"))

# Cache dir for pre-generated fixed TTS responses
_DEFAULT_CACHE_DIR = str(settings.audio_dir / "esp32_cache")
CACHE_DIR = Path(os.getenv("ESP32_CACHE_DIR", _DEFAULT_CACHE_DIR))

# ============================================================
#  INTERNAL HELPERS
# ============================================================


def _clean_text(text: str) -> str:
    """Strip non-alphanumeric chars and lowercase — same as original ESP32 code."""
    return re.sub(r'[^a-zA-Z0-9\s]', '', text.lower()).strip()


def _mp3_to_pcm(mp3_path: str) -> bytes:
    """Convert MP3 file → raw PCM 16 kHz mono 16-bit bytes (for UDP streaming)."""
    audio = AudioSegment.from_file(mp3_path, format="mp3")
    audio = audio.set_frame_rate(SAMPLE_RATE).set_channels(1).set_sample_width(2)
    return audio.raw_data


def _numpy_pcm_to_wav(audio_np: np.ndarray, wav_path: str) -> None:
    """
    Save a float32 numpy array (values in [-1, 1]) as a 16 kHz mono WAV file.
    Used to bridge ESP32 PCM chunks → SpeechService.transcribe(file_path).
    """
    pcm_int16 = (np.clip(audio_np, -1.0, 1.0) * 32767).astype(np.int16)
    sf.write(wav_path, pcm_int16, SAMPLE_RATE, subtype="PCM_16")


# ============================================================
#  WAKE WORD MODELS (lightweight, separate from project's STT)
# ============================================================


def _load_wake_models(
    device: str,
    compute_type: str,
) -> tuple[WhisperModel, object, object, object]:
    """
    Load dedicated lightweight models for wake word detection.
    Kept separate from SpeechService to preserve detection speed.

    sentence_transformers is imported HERE (lazy) so that the Streamlit app
    does NOT trigger loading of the full `transformers` library on startup,
    preventing hundreds of torchvision-related watcher warnings.
    """
    # ── Lazy import (only executed when UDP server actually starts) ──────
    from sentence_transformers import SentenceTransformer  # noqa: PLC0415
    from sentence_transformers import util as st_util       # noqa: PLC0415

    print(f"⏳ Loading wake word models on {device.upper()}...")
    whisper_wake = WhisperModel(
        WAKE_MODEL_SIZE,
        device=device,
        compute_type=compute_type,
    )
    sbert    = SentenceTransformer(SBERT_MODEL, device=device)
    wake_emb = sbert.encode(WAKE_WORD, convert_to_tensor=True)
    print(f"✅ Wake word models ready on {device.upper()}")
    # Return st_util so the caller can call st_util.cos_sim without a top-level import
    return whisper_wake, sbert, wake_emb, st_util


# ============================================================
#  TTS BRIDGE: text → SpeechService → MP3 → PCM bytes
# ============================================================


async def _text_to_pcm_bytes(
    text: str,
    agent: PersonalAssistantAgent,
    cache_filename: Optional[str] = None,
) -> bytes:
    """
    Convert text to raw PCM bytes ready for ESP32 UDP streaming.

    Bridge:
      text → agent.speech.text_to_speech() (saves .mp3)
           → pydub AudioSegment → 16kHz mono 16-bit PCM bytes

    Caches result to disk if cache_filename is given (for fixed phrases).
    """
    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    if cache_filename:
        cached_path = CACHE_DIR / cache_filename
        if cached_path.exists():
            return cached_path.read_bytes()

    print(f"🎙️  TTS: '{text[:60]}{'...' if len(text) > 60 else ''}'")

    loop = asyncio.get_event_loop()

    # Run blocking TTS synthesis in thread pool (non-blocking for event loop)
    mp3_path: str = await loop.run_in_executor(
        None, agent.speech.text_to_speech, text
    )

    # Convert MP3 → PCM in thread pool
    pcm: bytes = await loop.run_in_executor(None, _mp3_to_pcm, mp3_path)

    if cache_filename:
        (CACHE_DIR / cache_filename).write_bytes(pcm)

    return pcm


# ============================================================
#  UDP SEND (original logic preserved)
# ============================================================


async def _send_pcm_to_esp32(
    pcm_data: bytes,
    sock: socket.socket,
    addr: tuple,
    device_manager: DeviceManager = None,
) -> None:
    """Send PCM bytes to ESP32 via UDP with 2-byte sequence number header.

    Format: [SEQ (2 bytes LE)] [AUDIO (TTS_CHUNK_SIZE bytes)]
    Timing formula preserved (delay * 0.85 compensation factor).
    
    Args:
        pcm_data: Raw PCM audio data
        sock: UDP socket
        addr: ESP32 address (IP, port)
        device_manager: Optional device manager to track packets
    """
    delay = TTS_CHUNK_SIZE / (SAMPLE_RATE * 2)
    seq_num = 0
    
    for i in range(0, len(pcm_data), TTS_CHUNK_SIZE):
        chunk = pcm_data[i : i + TTS_CHUNK_SIZE]
        
        # ✅ Prepend 2-byte sequence number (little-endian uint16)
        seq_bytes = seq_num.to_bytes(2, byteorder='little', signed=False)
        packet = seq_bytes + chunk
        
        sock.sendto(packet, addr)
        
        # ✅ Track packet sent
        if device_manager:
            device_manager.on_packet_sent(addr)
        
        seq_num += 1
        await asyncio.sleep(delay * 0.85)


# ============================================================
#  RECORD QUESTION (original logic preserved + STT bridge)
# ============================================================


async def _record_question(
    sock: socket.socket,
    loop: asyncio.AbstractEventLoop,
    agent: PersonalAssistantAgent,
) -> str:
    """
    Collect audio frames from ESP32 UDP after wake word is detected.
    Original silence/timeout logic preserved.

    ESP32 packet format: [SEQ (2 bytes)] [PCM AUDIO (variable)]
    Bridge (replaces inline whisper_stt.transcribe in original):
      numpy PCM array → temp WAV file → agent.speech.transcribe()
      (inherits: VI initial_prompt, VAD filter, Vietnamese corrections)
    """
    print("👂 Listening for question...")
    audio_frames: list[np.ndarray] = []
    silent_chunks = 0
    start_time = loop.time()

    chunks_per_second   = SAMPLE_RATE / CHUNK_SIZE
    silence_chunk_limit = int(SILENCE_DURATION * chunks_per_second)

    # ── Original audio collection loop ──────────────────────
    while True:
        if (loop.time() - start_time) > QUESTION_TIMEOUT:
            print("⏰ Question timeout.")
            break

        try:
            data, _ = await asyncio.wait_for(
                loop.sock_recvfrom(sock, 2048),
                timeout=1.0,
            )
        except asyncio.TimeoutError:
            break

        # ✅ Extract sequence number and skip first 2 bytes
        if len(data) < 2:
            continue
        
        seq_num = int.from_bytes(data[:2], byteorder='little', signed=False)
        audio_data = data[2:]  # Skip 2-byte SEQ header
        
        if len(audio_data) == 0:
            continue

        chunk = np.frombuffer(audio_data, dtype=np.int16)
        audio_frames.append(chunk)

        rms = (
            np.sqrt(np.mean(chunk.astype(np.float32) ** 2))
            if len(chunk) > 0
            else 0
        )

        if rms < SILENCE_RMS:
            silent_chunks += 1
        else:
            silent_chunks = 0  # reset on speech

        if (
            silent_chunks >= silence_chunk_limit
            and len(audio_frames) > int(chunks_per_second)
        ):
            print("🔇 Silence detected → stop recording.")
            break

    if not audio_frames:
        return ""

    # ── STT bridge ──────────────────────────────────────────
    # Concatenate all PCM frames, normalize float32 [-1, 1]
    full_audio = np.concatenate(audio_frames).astype(np.float32) / 32768.0

    print("⏳ Transcribing question...")

    # Save to temp WAV → call SpeechService.transcribe() (has VI corrections)
    tmp_fd, tmp_path = tempfile.mkstemp(suffix=".wav")
    os.close(tmp_fd)
    try:
        await loop.run_in_executor(None, _numpy_pcm_to_wav, full_audio, tmp_path)
        transcript: str = await loop.run_in_executor(
            None, agent.speech.transcribe, tmp_path
        )
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    print(f"📝 Question: '{transcript}'")
    return transcript


# ============================================================
#  AI ANSWER BRIDGE
# ============================================================


async def _get_ai_answer(question: str, agent: PersonalAssistantAgent) -> str:
    """
    Get AI-powered answer via PersonalAssistantAgent.chat().

    Replaces original get_answer() fixed-string function.
    Full features available: memory, web search, weather, music, stock, etc.
    TTS disabled here (enable_tts=False) because we handle PCM streaming separately.
    """
    print(f"🤖 Processing: '{question}'")
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: agent.chat(question, enable_tts=False),
    )
    return response.text


# ============================================================
#  MAIN UDP SERVER LOOP
# ============================================================


async def run_udp_server(
    agent: Optional[PersonalAssistantAgent] = None,
) -> None:
    """
    Main event loop for the ESP32 UDP Voice Assistant.

    Phases (original flow preserved):
      1. Listen for wake word ("Hey Bro")
      2. Play "Chào bạn, tôi đang nghe đây."
      3. Record question from ESP32
      4. Get AI answer (PersonalAssistantAgent)
      5. TTS answer → send PCM to ESP32
      6. Play "Tôi đã trả lời xong..."
      → repeat

    Args:
        agent: Pre-created PersonalAssistantAgent. Created fresh if None.
    """
    loop = asyncio.get_event_loop()

    # ── Initialize agent ──────────────────────────────────────
    if agent is None:
        print("⏳ Initializing PersonalAssistantAgent (loads Whisper + LLM)...")
        agent = await loop.run_in_executor(None, PersonalAssistantAgent)
        print("✅ PersonalAssistantAgent ready.")

    # ── Load wake word models ─────────────────────────────────
    device      = "cuda" if torch.cuda.is_available() else "cpu"
    compute     = "float16" if device == "cuda" else "int8"
    whisper_wake, sbert, wake_emb, st_util = _load_wake_models(device, compute)

    # ── Pre-cache fixed TTS responses ─────────────────────────
    print("⏳ Pre-generating fixed TTS responses...")
    hello_pcm = await _text_to_pcm_bytes(
        "Chào bạn, tôi đang nghe đây.",
        agent,
        "esp32_hello.pcm",
    )
    goodbye_pcm = await _text_to_pcm_bytes(
        "Tôi đã trả lời xong. Nếu bạn còn câu hỏi nào nữa thì hãy gọi tôi.",
        agent,
        "esp32_goodbye.pcm",
    )
    print("✅ Fixed TTS responses ready.")

    # ── Create UDP socket (original setup preserved) ──────────
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind((UDP_IP, UDP_PORT))
    sock.setblocking(False)

    # ── Initialize device manager ────────────────────────────
    device_manager = DeviceManager()

    # Wake word detection state
    audio_buffer    = collections.deque(maxlen=int(SAMPLE_RATE * WINDOW_SECONDS))
    last_infer_time = 0.0
    infer_interval  = 0.4  # seconds between wake word inference runs
    esp32_addr: Optional[tuple] = None

    # Get local IP for info logging
    local_ip = _get_local_ip()

    print(f"\n{'='*60}")
    print(f"  🚀 ESP32 VOICE ASSISTANT STARTED")
    print(f"  📡 UDP Server on {UDP_IP}:{UDP_PORT}")
    print(f"  🖥️  Machine IP: {local_ip}")
    print(f"  ⚠️  ESP32 should connect to: {local_ip}:12345")
    print(f"     (Configure serverIP = \"{local_ip}\" in ESP32 code)")
    print(f"  🔑 Wake word : '{WAKE_WORD.upper()}'")
    print(f"  🤖 AI model  : {settings.model}")
    print(f"  🎤 STT model : {settings.whisper_model_size} (project)")
    print(f"  🔊 TTS voice : {settings.tts_voice}")
    print(f"  📱 Device monitoring: ENABLED")
    print(f"{'='*60}\n")

    # ════════════════════════════════════════════════════════
    #  MAIN LOOP
    # ════════════════════════════════════════════════════════
    while True:

        # ── Check for device disconnections ──────────────────
        device_manager.check_disconnections()

        # ── PHASE 1: Wait for wake word ──────────────────────
        if not device_manager.get_active_devices():
            print("🎤 Listening for wake word... (waiting for connection)")
        
        audio_buffer.clear()
        wake_detected = False

        while not wake_detected:
            try:
                data, addr = await asyncio.wait_for(
                    loop.sock_recvfrom(sock, 2048),
                    timeout=0.1,
                )
            except asyncio.TimeoutError:
                # Check periodically for disconnected devices
                device_manager.check_disconnections()
                continue

            # ✅ Track device connection
            is_new_device = device_manager.on_packet_received(addr)
            
            # ✅ Extract sequence number and skip first 2 bytes
            if len(data) < 2:
                print(f"⚠️  Packet too small: {len(data)} bytes from {addr}")
                continue
            
            seq_num = int.from_bytes(data[:2], byteorder='little', signed=False)
            audio_data = data[2:]  # Skip 2-byte SEQ header
            
            if len(audio_data) == 0:
                continue

            esp32_addr = addr  # remember ESP32 address for sending back
            
            chunk = np.frombuffer(audio_data, dtype=np.int16)
            audio_buffer.extend(chunk)

            now = loop.time()
            if (now - last_infer_time) < infer_interval:
                continue
            if len(audio_buffer) < audio_buffer.maxlen:
                continue

            rms = (
                np.sqrt(np.mean(chunk.astype(np.float32) ** 2))
                if len(chunk) > 0
                else 0
            )
            if rms <= SILENCE_RMS:
                continue  # skip silent frames

            # Whisper tiny.en transcription (original logic)
            audio_np = np.array(audio_buffer).astype(np.float32) / 32768.0
            segments, _ = whisper_wake.transcribe(audio_np, language="en", beam_size=1)

            for seg in segments:
                text = _clean_text(seg.text)
                if not text:
                    continue
                text_emb = sbert.encode(text, convert_to_tensor=True)
                score    = st_util.cos_sim(text_emb, wake_emb).item()
                print(f"   [{text}] score={score:.2f}", end="\r")

                if score > WAKE_THRESHOLD:
                    print(f"\n✨ Wake word detected! '{text}' (score={score:.2f})")
                    wake_detected = True
                    break

            last_infer_time = now

        # ── PHASE 2: Play "Chào bạn..." ──────────────────────
        print("🔊 Playing: 'Chào bạn, tôi đang nghe đây...'")
        await _send_pcm_to_esp32(hello_pcm, sock, esp32_addr, device_manager)
        await asyncio.sleep(0.3)

        # ── PHASE 3: Record question ──────────────────────────
        question = await _record_question(sock, loop, agent)

        # ── PHASE 4: Get AI answer ────────────────────────────
        if question:
            answer = await _get_ai_answer(question, agent)
        else:
            answer = (
                "Xin lỗi, tôi không nghe rõ câu hỏi của bạn. "
                "Bạn có thể nói lại không?"
            )

        # ── PHASE 5: TTS answer → ESP32 ──────────────────────
        print(f"🔊 Playing answer: '{answer[:60]}...'")
        answer_pcm = await _text_to_pcm_bytes(answer, agent)  # no cache (dynamic)
        await _send_pcm_to_esp32(answer_pcm, sock, esp32_addr, device_manager)
        await asyncio.sleep(0.3)

        # ── PHASE 6: Play "Tôi đã trả lời xong..." ───────────
        print("🔊 Playing: 'Tôi đã trả lời xong...'")
        await _send_pcm_to_esp32(goodbye_pcm, sock, esp32_addr, device_manager)
        await asyncio.sleep(0.5)

        # → Back to Phase 1
        print("\n" + "─" * 50)
        # Print device status periodically
        print(device_manager.get_device_status())


# ============================================================
#  ENTRY POINT
# ============================================================


def main() -> None:
    """CLI entry point: python -m assistant.udp_server"""
    try:
        asyncio.run(run_udp_server())
    except KeyboardInterrupt:
        print("\n\n👋 ESP32 Voice Assistant stopped.")


if __name__ == "__main__":
    main()
