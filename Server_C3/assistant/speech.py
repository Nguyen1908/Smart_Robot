from __future__ import annotations

import asyncio
import logging
import os
import re as _re
import time
from pathlib import Path
from typing import Optional

import edge_tts
from faster_whisper import WhisperModel

from assistant.config import settings  # noqa: E402 — config sets env vars first

# Suppress HuggingFace Hub unauthenticated request warnings
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")
logging.getLogger("huggingface_hub").setLevel(logging.ERROR)

import warnings  # noqa: E402

warnings.filterwarnings("ignore", message=".*huggingface_hub.*")
warnings.filterwarnings("ignore", message=".*unauthenticated.*")
warnings.filterwarnings("ignore", message=".*symlinks.*")

# Vietnamese initial prompt to prime Whisper for correct tone/diacritics recognition.
# Includes political figures, proper nouns, and common phrases that Whisper often mishears.
_VI_INITIAL_PROMPT = (
    "Xin chào, tôi muốn hỏi về thời tiết hôm nay thế nào? "
    "Nhiệt độ bao nhiêu độ? Một cộng một bằng mấy? "
    "Tôi tên là Nhật Anh. Sở thích của tôi là lập trình. "
    "Giá xăng hiện tại là bao nhiêu? Hãy nhớ rằng tôi thích ăn phở. "
    "Hồ Chí Minh, Hà Nội, Đà Nẵng, tin tức, thị trường. "
    "Bitcoin, Ethereum, vàng, xăng, đô la, giá cả. "
    # Political figures and proper nouns — helps Whisper recognize these correctly
    "Tổng thống Donald Trump. Phó Tổng thống JD Vance. "
    "Thủ tướng Đức Friedrich Merz. Tổng thống Nga Vladimir Putin. "
    "Chủ tịch Trung Quốc Tập Cận Bình. Thủ tướng Nhật Bản. "
    "Tổng thống Ukraine Volodymyr Zelensky. Tổng thống Iran. "
    "Tổng thống Hàn Quốc. Thủ tướng Ấn Độ Narendra Modi. "
    "Tổng Bí thư Tô Lâm. Chủ tịch nước Lương Cường. Thủ tướng Phạm Minh Chính. "
    # Common Vietnamese phrases that Whisper often gets wrong
    "Tình hình kinh tế. Tình hình chính trị. Tình hình tài chính. "
    "Thủ tướng hiện tại là ai? Tổng thống hiện tại là ai? "
    "Phó Tổng thống Mỹ là ai? Ai là người đứng đầu? "
    "Tình hình chiến sự. Tình hình thế giới. "
    "Elon Musk, Mark Zuckerberg, Jeff Bezos, Bill Gates. "
    # Music and directions commands
    "Mở nhạc, phát nhạc, bật nhạc, dừng nhạc, tắt nhạc. "
    "Không nghe nữa, ngừng phát nhạc, dừng bài hát, tắt bài hát. "
    "Đường đi từ Hà Nội đến Sài Gòn. Lộ trình, chỉ đường, khoảng cách. "
    "Tóm tắt tin tức, tin tức hôm nay, tin nóng. "
    # Stock / securities terms
    "Cổ phiếu, chứng khoán, thị trường chứng khoán, mã chứng khoán. "
    "VN-Index, VN30, HNX, HOSE, UPCOM. "
    "Giá cổ phiếu VNM, VIC, HPG, FPT, VCB, MBB, TCB, MSN. "
    "Cổ phần, cổ đông, sàn giao dịch, phiên giao dịch."
)

# Common Whisper misrecognitions for Vietnamese — (wrong, correct)
# Order matters: longer/more-specific patterns FIRST to avoid partial matches.
_HCM_CORRECT = "Hồ Chí Minh"

_VI_CORRECTIONS = [
    # ── Political titles & Vietnamese government ─────────────────────────
    ("thổ tướng", "thủ tướng"),
    ("thỗ tướng", "thủ tướng"),
    ("thô tướng", "thủ tướng"),
    ("thó tướng", "thủ tướng"),
    ("phó tổng tống", "phó tổng thống"),
    ("tổng tống", "tổng thống"),
    ("tống thống", "tổng thống"),
    ("chủ tịt", "chủ tịch"),
    ("chủ tịt nước", "chủ tịch nước"),

    # ── Political figures — proper noun corrections ──────────────────────
    # JD Vance (VP of US)
    ("jd vans", "JD Vance"),
    ("jd van", "JD Vance"),
    ("jd vance", "JD Vance"),
    ("jay d vance", "JD Vance"),
    ("jay di vance", "JD Vance"),
    ("giây di vance", "JD Vance"),
    ("giê đi vance", "JD Vance"),
    ("jd vans.", "JD Vance."),
    # Trump
    ("trùm ảnh", "Trump"),
    ("trăm p", "Trump"),
    ("trăm pờ", "Trump"),
    ("donald trùm", "Donald Trump"),
    ("đô nần trùm", "Donald Trump"),
    # Putin
    ("pu tin", "Putin"),
    ("pu tinh", "Putin"),
    ("bu tin", "Putin"),
    # Zelensky
    ("giê len xki", "Zelensky"),
    ("de len xki", "Zelensky"),
    ("ze len sky", "Zelensky"),
    ("giê lên xki", "Zelensky"),
    # Xi Jinping / Tập Cận Bình
    ("tập cấn bình", "Tập Cận Bình"),
    ("tập cận binh", "Tập Cận Bình"),
    ("tấp cận bình", "Tập Cận Bình"),
    # Friedrich Merz
    ("phít rích mẹt", "Friedrich Merz"),
    ("phờ rít rich mẹt", "Friedrich Merz"),
    # Elon Musk
    ("ê lôn mắc", "Elon Musk"),
    ("ê lon mắc", "Elon Musk"),
    ("ê lon mát", "Elon Musk"),
    ("i lôn mắc", "Elon Musk"),
    # Vietnamese leaders
    ("tô lầm", "Tô Lâm"),
    ("tô lam", "Tô Lâm"),
    ("phạm minh chín", "Phạm Minh Chính"),
    ("lương cườn", "Lương Cường"),

    # ── Vietnamese misheard words/phrases ────────────────────────────────
    # "tình hình" is very commonly misheard
    ("tân hình", "tình hình"),
    ("tần hình", "tình hình"),
    ("tâm hình", "tình hình"),
    ("tinh hình", "tình hình"),
    ("tình hình hình tài", "tình hình tài chính"),
    ("hình tài", "tài chính"),
    # Common phrase misrecognitions
    ("bằng máy", "bằng mấy"),
    ("bang may", "bằng mấy"),
    ("bao nhiêu đô", "bao nhiêu độ"),
    ("trăm lái", "trả lời"),
    ("trăm lời", "trả lời"),
    ("hiện tạ", "hiện tại"),
    ("hiện tại lại", "hiện tại"),
    ("là ái", "là ai"),

    # ── Geographic corrections ───────────────────────────────────────────
    ("hồ chí minhh", "Hồ Chí Minh"),  # STT double-h error
    ("hồ chứ minh", _HCM_CORRECT),
    ("hồ chữ minh", _HCM_CORRECT),
    ("hồ chí min", _HCM_CORRECT),
    ("hồ chỉ minh", _HCM_CORRECT),
    ("i ran", "Iran"),
    ("i rắc", "Iraq"),
    ("u cờ ren", "Ukraine"),
    ("u cờ rai na", "Ukraine"),
    ("uy gơ", "Uyghur"),

    # ── Common news/market terms ─────────────────────────────────────────
    ("tình tức", "tin tức"),
    ("tin tứt", "tin tức"),
    ("tin tứ", "tin tức"),
    ("giá sắng", "giá xăng"),
    ("giá sàng", "giá xăng"),
    ("giá săng", "giá xăng"),
    ("bít coin", "Bitcoin"),
    ("bít co in", "Bitcoin"),
    ("bit coin", "Bitcoin"),
    ("e the ri um", "Ethereum"),
    ("ê the ri âm", "Ethereum"),
    ("i thi ri ầm", "Ethereum"),
    ("chứng khoáng", "chứng khoán"),
    ("chứn khoán", "chứng khoán"),

    # ── Common misheard single words ─────────────────────────────────────
    ("dịt", "dịch"),
    ("tìm kiến", "tìm kiếm"),
    ("tiềm kiếm", "tìm kiếm"),
    ("chiến tranh", "chiến tranh"),
    ("chiến trang", "chiến tranh"),
    ("kinh tê", "kinh tế"),
    ("chính trí", "chính trị"),
    ("chín trị", "chính trị"),
    ("ngoại giao", "ngoại giao"),
    ("ngoại dao", "ngoại giao"),

    # ── Music and directions ─────────────────────────────────────────────
    ("mờ nhạc", "mở nhạc"),
    ("phác nhạc", "phát nhạc"),
    ("bặt nhạc", "bật nhạc"),
    ("dừng nhắc", "dừng nhạc"),
    ("tắc nhạc", "tắt nhạc"),
    ("không nghe nhạc nữa", "không nghe nữa"),
    ("ngừng phác nhạc", "ngừng phát nhạc"),
    ("lỗ trình", "lộ trình"),
    ("lồ trình", "lộ trình"),
    ("chì đường", "chỉ đường"),
    ("chỉ đướng", "chỉ đường"),
    ("khoản cách", "khoảng cách"),
    ("tóm tắc", "tóm tắt"),
    ("tóm tất", "tóm tắt"),

    # ── Stock / securities ────────────────────────────────────────────────
    ("cổ phiếu", "cổ phiếu"),
    ("cổ phiểu", "cổ phiếu"),
    ("cỗ phiếu", "cổ phiếu"),
    ("chứng khoáng", "chứng khoán"),
    ("chứn khoán", "chứng khoán"),
    ("chứng khoàn", "chứng khoán"),
    ("vn index", "VN-Index"),
    ("vi en index", "VN-Index"),
    ("vi n index", "VN-Index"),
]

# Emoji pattern for stripping before TTS
_EMOJI_PATTERN = _re.compile(
    "["
    "\U0001F600-\U0001F64F"  # emoticons
    "\U0001F300-\U0001F5FF"  # symbols & pictographs
    "\U0001F680-\U0001F6FF"  # transport & map
    "\U0001F1E0-\U0001F1FF"  # flags
    "\U00002702-\U000027B0"  # dingbats
    "\U000024C2-\U0001F251"
    "\U0001F900-\U0001F9FF"  # supplemental symbols
    "\U0001FA00-\U0001FA6F"  # chess symbols
    "\U0001FA70-\U0001FAFF"  # symbols extended-A
    "\U00002600-\U000026FF"  # misc symbols
    "\U0000FE00-\U0000FE0F"  # variation selectors
    "\U0000200D"             # zero-width joiner
    "\U00000023\U000020E3"   # keycap #
    "\U0000002A\U000020E3"   # keycap *
    "]+",
    flags=_re.UNICODE,
)

# Emoji-to-expression map for expressive TTS
_EXPR_HEHE = " hehe "
_EXPR_HAHA = " haha "
_EXPR_EMPTY = " "

_EMOJI_EXPRESSIONS = {
    "😊": _EXPR_HEHE,
    "😂": _EXPR_HAHA,
    "🤣": _EXPR_HAHA,
    "😄": _EXPR_HEHE,
    "😁": " hì hì ",
    "😆": _EXPR_HAHA,
    "😅": _EXPR_HEHE,
    "🥰": _EXPR_EMPTY,
    "😍": _EXPR_EMPTY,
    "😢": " huhu ",
    "😭": " huhu ",
    "😤": _EXPR_EMPTY,
    "😠": _EXPR_EMPTY,
    "😱": " ối ",
    "🤔": " hmm ",
    "👍": _EXPR_EMPTY,
    "👏": _EXPR_EMPTY,
    "❤️": _EXPR_EMPTY,
    "🔥": _EXPR_EMPTY,
    "✨": _EXPR_EMPTY,
    "💪": _EXPR_EMPTY,
    "🎉": _EXPR_EMPTY,
    "😎": _EXPR_EMPTY,
    "🤗": _EXPR_EMPTY,
    "😘": _EXPR_EMPTY,
}

# Sentence split pattern for concurrent TTS
_SENTENCE_SPLIT = _re.compile(r'(?<=[.!?])\s+')


def strip_emojis_for_tts(text: str) -> str:
    """Replace emojis with expressive sounds, then strip remaining emojis."""
    result = text
    # First replace known emojis with expressions
    for emoji, expression in _EMOJI_EXPRESSIONS.items():
        result = result.replace(emoji, expression)
    # Strip any remaining emojis
    result = _EMOJI_PATTERN.sub(" ", result)
    # Clean up multiple spaces
    result = " ".join(result.split()).strip()
    return result


def _post_process_vietnamese(text: str) -> str:
    """Fix common Whisper Vietnamese misrecognitions."""
    result = text
    for wrong, correct in _VI_CORRECTIONS:
        pattern = _re.compile(_re.escape(wrong), _re.IGNORECASE)
        result = pattern.sub(correct, result)

    # Fix "1,1" that should be "1+1" (common math dictation error)
    result = _re.sub(r"(\d+)\s*,\s*(\d+)\s*bằng", r"\1+\2 bằng", result)

    # Clean up extra whitespace
    result = " ".join(result.split()).strip()
    return result


class SpeechService:
    _model: Optional[WhisperModel] = None
    _loaded_device: Optional[str] = None
    _loaded_compute_type: Optional[str] = None

    def __init__(self) -> None:
        self.audio_dir = settings.audio_dir
        self.voice = settings.tts_voice
        self.tts_rate = settings.tts_rate

    # Models that are too slow on CPU and should auto-downgrade
    _LARGE_MODELS = {"large-v3-turbo", "large-v3", "large-v2", "large-v1", "large"}
    _CPU_FALLBACK_MODEL = "medium"  # Best speed/accuracy tradeoff for Vietnamese on CPU

    @classmethod
    def _effective_model_size(cls, device: str) -> str:
        """Auto-select model size based on device. Large models are too slow on CPU."""
        model = settings.whisper_model_size
        if device == "cpu" and model in cls._LARGE_MODELS:
            print(f"[STT] Auto-downgrade: {model} → {cls._CPU_FALLBACK_MODEL} (CPU mode, ~3x faster)")
            return cls._CPU_FALLBACK_MODEL
        return model

    @classmethod
    def _load_model(cls, device: str, compute_type: str) -> WhisperModel:
        model_size = cls._effective_model_size(device)
        cls._model = WhisperModel(
            model_size,
            device=device,
            compute_type=compute_type,
            cpu_threads=settings.whisper_cpu_threads,
            num_workers=settings.whisper_num_workers,
        )
        cls._loaded_device = device
        cls._loaded_compute_type = compute_type
        print(f"[STT] Loaded: {model_size} on {device} ({compute_type})")
        return cls._model

    @classmethod
    def whisper_model(cls) -> WhisperModel:
        if cls._model is not None:
            return cls._model

        preferred_device = settings.whisper_device.lower()
        preferred_compute_type = settings.whisper_compute_type

        if preferred_device == "auto":
            try:
                return cls._load_model(device="cuda", compute_type=preferred_compute_type)
            except Exception:
                return cls._load_model(device="cpu", compute_type="int8")

        try:
            return cls._load_model(device=preferred_device, compute_type=preferred_compute_type)
        except Exception:
            if preferred_device != "cpu":
                return cls._load_model(device="cpu", compute_type="int8")
            raise

    @staticmethod
    def _collect_transcript(segments) -> str:
        transcript = " ".join(segment.text.strip() for segment in segments).strip()
        return _post_process_vietnamese(transcript)

    def warmup(self) -> None:
        self.whisper_model()

    def transcribe(self, audio_path: str) -> str:
        model = self.whisper_model()
        decode_options = {
            "beam_size": settings.stt_beam_size,
            "best_of": settings.stt_best_of,
            "temperature": settings.stt_temperature,
            "vad_filter": True,
            "vad_parameters": {
                "min_silence_duration_ms": settings.stt_vad_min_silence_ms,
                "speech_pad_ms": 30,
            },
            "language": "vi",
            "initial_prompt": _VI_INITIAL_PROMPT,
            "condition_on_previous_text": settings.stt_condition_on_previous_text,
            "compression_ratio_threshold": 2.4,
            "no_speech_threshold": settings.stt_no_speech_threshold,
            "without_timestamps": True,
            "chunk_length": 15,  # Shorter chunks = faster processing
        }

        try:
            segments, _ = model.transcribe(audio_path, **decode_options)
            return self._collect_transcript(segments)
        except RuntimeError as exc:
            error_text = str(exc).lower()
            if "cublas64_12.dll" in error_text or "cudnn" in error_text or "cuda" in error_text:
                model = self._load_model(device="cpu", compute_type="int8")
                segments, _ = model.transcribe(audio_path, **decode_options)
                return self._collect_transcript(segments)
            raise

    # ── TTS: Concurrent sentence processing ──────────────────────────────

    async def _synthesize(self, text: str, output_path: Path) -> None:
        communicate = edge_tts.Communicate(text=text, voice=self.voice, rate=self.tts_rate)
        await communicate.save(str(output_path))

    def _synthesize_concurrent_sync(self, text: str, output_path: Path) -> None:
        """Split text into sentences and synthesize them concurrently.

        Edge-TTS API calls are I/O-bound (network), so running multiple
        sentences in parallel cuts TTS time by ~50-60%.
        MP3 frames are self-contained, so simple byte concatenation works.
        """
        sentences = [s.strip() for s in _SENTENCE_SPLIT.split(text) if s.strip()]

        if len(sentences) <= 2:
            # Short text — single request is faster (no overhead)
            asyncio.run(self._synthesize(text, output_path))
            return

        # Process sentences concurrently in batches
        ts = int(time.time() * 1000)
        temp_files: list[Path] = []
        tasks: list = []

        for i, sentence in enumerate(sentences):
            temp = self.audio_dir / f"_chunk_{ts}_{i}.mp3"
            temp_files.append(temp)
            tasks.append(self._synthesize(sentence, temp))

        # Run all TTS requests concurrently via asyncio.gather
        async def _run_all() -> None:
            await asyncio.gather(*tasks)

        asyncio.run(_run_all())

        # Concatenate MP3 files (MP3 frames are independent, concat is safe)
        with open(output_path, "wb") as out:
            for temp in temp_files:
                if temp.exists():
                    out.write(temp.read_bytes())
                    temp.unlink()

    def text_to_speech(self, text: str) -> str:
        """Convert text to speech with concurrent sentence processing."""
        clean_text = strip_emojis_for_tts(text)
        if not clean_text:
            clean_text = "Xin lỗi, mình không có gì để nói."
        output_path = self.audio_dir / f"reply_{int(time.time() * 1000)}.mp3"
        self._synthesize_concurrent_sync(clean_text, output_path)
        return str(output_path)

    def text_to_speech_streaming(self, sentences: list[str]) -> str:
        """Convert multiple sentences to a single audio file.

        Processes all sentences as one combined text for faster TTS.
        """
        combined = " ".join(strip_emojis_for_tts(s) for s in sentences if s.strip())
        if not combined.strip():
            combined = "Xin lỗi, mình không có gì để nói."
        output_path = self.audio_dir / f"reply_{int(time.time() * 1000)}.mp3"
        self._synthesize_concurrent_sync(combined, output_path)
        return str(output_path)
