from __future__ import annotations

import base64
import hashlib
import time
from pathlib import Path

import streamlit as st
from audio_recorder_streamlit import audio_recorder

from assistant.agent import PersonalAssistantAgent
from assistant.config import settings


@st.cache_resource
def preload_agent() -> PersonalAssistantAgent:
    return PersonalAssistantAgent()


def get_agent() -> PersonalAssistantAgent:
    if "assistant_agent" not in st.session_state:
        st.session_state.assistant_agent = preload_agent()
    return st.session_state.assistant_agent


def autoplay_audio(audio_path: str) -> None:
    audio_file = Path(audio_path)
    if not audio_file.exists():
        return

    audio_bytes = audio_file.read_bytes()
    audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
    st.markdown(
        f"""
        <audio autoplay controls style="width: 100%;">
            <source src="data:audio/mp3;base64,{audio_base64}" type="audio/mp3">
        </audio>
        """,
        unsafe_allow_html=True,
    )


def render_latency(latency_ms: dict[str, int]) -> None:
    if not latency_ms:
        return

    metric_order = [
        ("stt", "STT"),
        ("tool", "Tool"),
        ("llm", "LLM"),
        ("tts", "TTS"),
        ("end_to_end", "E2E"),
    ]
    visible_metrics = [(key, label) for key, label in metric_order if key in latency_ms]
    if not visible_metrics:
        return

    columns = st.columns(len(visible_metrics))
    for index, (key, label) in enumerate(visible_metrics):
        columns[index].metric(label, f"{latency_ms[key]} ms")


def _render_assistant_meta(item: dict) -> None:
    """Render assistant-specific metadata (transcript, latency)."""
    if item.get("transcript"):
        st.caption(f"🎤 {item['transcript']}")
    if item.get("latency_ms"):
        render_latency(item["latency_ms"])


def _render_tool_events(item: dict) -> None:
    """Render tool events in an expander."""
    if not item.get("tool_events"):
        return
    with st.expander("🔧 Tools"):
        for event in item["tool_events"]:
            st.code(event)


def _render_audio(item: dict, is_last_assistant: bool) -> None:
    """Render audio player: autoplay for last assistant msg, normal player otherwise."""
    if not item.get("audio_path"):
        return
    audio_path = Path(item["audio_path"])
    if not audio_path.exists():
        return
    if is_last_assistant:
        autoplay_audio(str(audio_path))
    else:
        st.audio(str(audio_path), format="audio/mp3")


def render_history() -> None:
    history = st.session_state.get("history", [])
    last_index = len(history) - 1
    for index, item in enumerate(history):
        is_assistant = item["role"] == "assistant"
        with st.chat_message(item["role"]):
            st.markdown(item["content"])
            if is_assistant:
                _render_assistant_meta(item)
            _render_tool_events(item)
            _render_audio(item, is_last_assistant=(is_assistant and index == last_index))


def push_history(
    role: str,
    content: str,
    tool_events: list[str] | None = None,
    audio_path: str | None = None,
    transcript: str | None = None,
    latency_ms: dict[str, int] | None = None,
) -> None:
    st.session_state.setdefault("history", []).append(
        {
            "role": role,
            "content": content,
            "tool_events": tool_events or [],
            "audio_path": audio_path,
            "transcript": transcript,
            "latency_ms": latency_ms or {},
        }
    )


def handle_text_prompt(agent: PersonalAssistantAgent, prompt: str, enable_tts: bool) -> None:
    push_history("user", prompt)
    response = agent.chat(prompt, enable_tts=enable_tts)
    push_history(
        "assistant",
        response.text,
        tool_events=response.tool_events,
        audio_path=response.audio_path,
        transcript=response.text,
        latency_ms=response.latency_ms,
    )


def handle_audio_bytes(agent: PersonalAssistantAgent, audio_bytes: bytes, enable_tts: bool) -> None:
    temp_audio_path = settings.audio_dir / f"input_recording_{int(time.time() * 1000)}.wav"
    temp_audio_path.write_bytes(audio_bytes)
    response = agent.chat_from_audio(str(temp_audio_path), enable_tts=enable_tts)
    user_text = response.transcript or "[Không nhận diện được giọng nói]"
    push_history("user", user_text)
    push_history(
        "assistant",
        response.text,
        tool_events=response.tool_events,
        audio_path=response.audio_path,
        transcript=response.text,
        latency_ms=response.latency_ms,
    )


def render_voice_recorder(agent: PersonalAssistantAgent, enable_tts: bool) -> None:
    """Render voice recorder in a fixed container to prevent disappearing."""
    audio_bytes = audio_recorder(
        text="",
        recording_color="#e74c3c",
        neutral_color="#2c3e50",
        icon_name="microphone",
        icon_size="2x",
        pause_threshold=0.6,
        sample_rate=16_000,
        key="voice_recorder_main",
    )

    if audio_bytes:
        fingerprint = hashlib.md5(audio_bytes).hexdigest()  # noqa: S324
        if st.session_state.get("last_voice_fingerprint") != fingerprint:
            st.session_state["last_voice_fingerprint"] = fingerprint
            with st.spinner("Đang xử lý giọng nói..."):
                handle_audio_bytes(agent, audio_bytes, enable_tts)
            st.rerun()


def main() -> None:
    st.set_page_config(page_title="ROBOTS Personal Assistant", page_icon="🤖", layout="wide")
    st.title("🤖 ROBOTS Personal Assistant")
    st.caption("Trợ lý AI cá nhân — 13 tools, MCP server, faster-whisper STT, Edge TTS")

    st.session_state.setdefault("last_voice_fingerprint", None)
    agent = get_agent()

    with st.sidebar:
        st.header("⚙️ Cấu hình")
        st.write(f"Model: **{settings.model}**")
        st.write(f"Profile: {settings.runtime_profile}")
        st.write(f"Whisper: {settings.whisper_model_size}")
        st.write(f"Max tokens: {settings.llm_max_completion_tokens}")
        enable_tts = st.toggle("Bật TTS", value=True)

        with st.expander("🔧 Tools"):
            st.markdown(
                "- **get_weather**: Thời tiết\n"
                "- **web_search**: Tìm kiếm (Tavily)\n"
                "- **knowledge_search**: Wikipedia\n"
                "- **calculate**: Tính toán\n"
                "- **get_current_datetime**: Ngày giờ\n"
                "- **translate_text**: Dịch ngôn ngữ\n"
                "- **save_memory**: Ghi nhớ\n"
                "- **get_exchange_rate**: Tỷ giá ngoại tệ\n"
                "- **get_news**: Tin tức mới nhất\n"
                "- **play_music**: Phát nhạc (mở tab mới)\n"
                "- **pause_music**: Tạm dừng nhạc\n"
                "- **resume_music**: Tiếp tục phát nhạc\n"
                "- **stop_music**: Tắt nhạc (đóng tab)\n"
                "- **get_stock_price**: Giá cổ phiếu realtime"
            )

        with st.expander("🔌 MCP Server"):
            st.code("python -m assistant.mcp_server", language="bash")

        st.divider()
        # Voice recorder in sidebar — stays fixed, never disappears
        st.subheader("🎙️ Ghi âm")
        st.caption("Nhấn micro, nói xong sẽ tự gửi.")
        render_voice_recorder(agent, enable_tts)

        st.divider()
        if st.button("🗑️ Xóa lịch sử"):
            st.session_state["history"] = []
            st.session_state["last_voice_fingerprint"] = None
            st.rerun()

    # Main chat area
    render_history()

    prompt = st.chat_input("Nhập câu hỏi hoặc yêu cầu...")
    if prompt:
        with st.spinner("Đang xử lý..."):
            handle_text_prompt(agent, prompt, enable_tts)
        st.rerun()
