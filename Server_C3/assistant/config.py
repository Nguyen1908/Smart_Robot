from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict

# ── Suppress HuggingFace Hub warnings on Windows ────────────────────────────
# Disable symlink warning (Windows doesn't support symlinks without Dev Mode)
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")
# Disable progress bars for cleaner logs
os.environ.setdefault("HF_HUB_DISABLE_PROGRESS_BARS", "1")


# ── Profile definitions ─────────────────────────────────────────────────────
# Each profile maps setting names to their override values.
# Only settings NOT already set via environment variables are applied.

_PROFILE_DEMO_FAST: Dict[str, Any] = {
    "whisper_model_size": "large-v3-turbo",
    "stt_beam_size": 1,
    "stt_best_of": 1,
    "stt_vad_min_silence_ms": 200,
    "max_response_chars": 800,
    "llm_temperature": 0.2,
    "llm_max_completion_tokens": 500,
    "tts_rate": "+50%",
}

_PROFILE_BALANCED: Dict[str, Any] = {
    "whisper_model_size": "large-v3-turbo",
    "stt_beam_size": 1,
    "max_response_chars": 700,
    "llm_max_completion_tokens": 450,
}

_PROFILE_ACCURATE: Dict[str, Any] = {
    "whisper_model_size": "large-v3-turbo",
    "stt_beam_size": 2,
    "stt_best_of": 2,
    "max_response_chars": 800,
    "llm_temperature": 0.25,
    "llm_max_completion_tokens": 500,
}

_PROFILES: Dict[str, Dict[str, Any]] = {
    "demo_fast": _PROFILE_DEMO_FAST,
    "balanced": _PROFILE_BALANCED,
    "accurate": _PROFILE_ACCURATE,
}

# Map setting names → environment variable names for "already set?" check
_SETTING_ENV_MAP: Dict[str, str] = {
    "whisper_model_size": "ASSISTANT_WHISPER_MODEL",
    "stt_beam_size": "ASSISTANT_STT_BEAM_SIZE",
    "stt_best_of": "ASSISTANT_STT_BEST_OF",
    "stt_vad_min_silence_ms": "ASSISTANT_STT_VAD_MIN_SILENCE_MS",
    "max_response_chars": "ASSISTANT_MAX_RESPONSE_CHARS",
    "llm_temperature": "ASSISTANT_LLM_TEMPERATURE",
    "llm_max_completion_tokens": "ASSISTANT_LLM_MAX_COMPLETION_TOKENS",
    "tts_rate": "ASSISTANT_TTS_RATE",
}


@dataclass(slots=True)
class Settings:
    api_key: str = os.getenv("ASSISTANT_API_KEY", "sk-thisisnhatanh2806")
    base_url: str = os.getenv("ASSISTANT_BASE_URL", "https://api1.6766676.xyz")
    model: str = os.getenv("ASSISTANT_MODEL", "gemini-3-flash")
    runtime_profile: str = os.getenv("ASSISTANT_RUNTIME_PROFILE", "demo_fast")
    tts_voice: str = os.getenv("ASSISTANT_TTS_VOICE", "vi-VN-NamMinhNeural")
    tts_rate: str = os.getenv("ASSISTANT_TTS_RATE", "+30%")
    whisper_model_size: str = os.getenv("ASSISTANT_WHISPER_MODEL", "large-v3-turbo")
    whisper_device: str = os.getenv("ASSISTANT_WHISPER_DEVICE", "auto")
    whisper_compute_type: str = os.getenv("ASSISTANT_WHISPER_COMPUTE_TYPE", "int8")
    whisper_cpu_threads: int = int(os.getenv("ASSISTANT_WHISPER_CPU_THREADS", "4"))
    whisper_num_workers: int = int(os.getenv("ASSISTANT_WHISPER_NUM_WORKERS", "1"))
    stt_beam_size: int = int(os.getenv("ASSISTANT_STT_BEAM_SIZE", "1"))
    stt_best_of: int = int(os.getenv("ASSISTANT_STT_BEST_OF", "1"))
    stt_temperature: float = float(os.getenv("ASSISTANT_STT_TEMPERATURE", "0.0"))
    stt_no_speech_threshold: float = float(os.getenv("ASSISTANT_STT_NO_SPEECH_THRESHOLD", "0.45"))
    stt_vad_min_silence_ms: int = int(os.getenv("ASSISTANT_STT_VAD_MIN_SILENCE_MS", "300"))
    stt_condition_on_previous_text: bool = os.getenv("ASSISTANT_STT_CONDITION_ON_PREVIOUS_TEXT", "false").lower() == "true"
    max_response_chars: int = int(os.getenv("ASSISTANT_MAX_RESPONSE_CHARS", "800"))
    llm_temperature: float = float(os.getenv("ASSISTANT_LLM_TEMPERATURE", "0.3"))
    llm_max_completion_tokens: int = int(os.getenv("ASSISTANT_LLM_MAX_COMPLETION_TOKENS", "500"))
    direct_weather_routing: bool = os.getenv("ASSISTANT_DIRECT_WEATHER_ROUTING", "true").lower() == "true"
    direct_memory_routing: bool = os.getenv("ASSISTANT_DIRECT_MEMORY_ROUTING", "true").lower() == "true"
    memory_max_messages: int = int(os.getenv("ASSISTANT_MEMORY_MAX_MESSAGES", "12"))
    data_dir: Path = Path(os.getenv("ASSISTANT_DATA_DIR", "data"))
    audio_dir: Path = Path(os.getenv("ASSISTANT_AUDIO_DIR", "data/audio"))
    memory_file: Path = Path(os.getenv("ASSISTANT_MEMORY_FILE", "data/memory.json"))
    request_timeout: int = int(os.getenv("ASSISTANT_REQUEST_TIMEOUT", "90"))
    tavily_api_key: str = os.getenv("TAVILY_API_KEY", "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")
    exchangerate_api_key: str = os.getenv("EXCHANGERATE_API_KEY", "53dbf0bd3a8a382bad1d1370")

    def ensure_directories(self) -> None:
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.audio_dir.mkdir(parents=True, exist_ok=True)
        self.memory_file.parent.mkdir(parents=True, exist_ok=True)

    def apply_runtime_profile(self) -> None:
        """Apply profile overrides for settings not already set via env vars."""
        profile_overrides = _PROFILES.get(self.runtime_profile.strip().lower())
        if not profile_overrides:
            return
        for setting_name, value in profile_overrides.items():
            env_var = _SETTING_ENV_MAP.get(setting_name, "")
            if env_var and os.getenv(env_var) is None:
                setattr(self, setting_name, value)


settings = Settings()
settings.apply_runtime_profile()
settings.ensure_directories()
