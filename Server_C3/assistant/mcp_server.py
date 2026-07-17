"""MCP Server — expose all assistant tools via Model Context Protocol.

Run standalone:
    python -m assistant.mcp_server

Or import and attach to the Pydantic-AI agent for MCP-native tool routing.
"""

from __future__ import annotations

from fastmcp import FastMCP

from assistant.tools import (
    calculate,
    get_current_datetime,
    get_weather,
    save_memory,
    web_search,
    knowledge_search,
    translate_text,
    get_exchange_rate,
    get_news,
    play_music,
    stop_music,
    pause_music,
    resume_music,
    get_stock_price,
)

mcp = FastMCP("ROBOTS Personal Assistant")


# ── Weather ──────────────────────────────────────────────────────────────────
@mcp.tool()
def mcp_get_weather(location: str) -> str:
    """Lấy thời tiết hiện tại và dự báo hôm nay theo địa điểm.

    Args:
        location: Tên thành phố hoặc địa điểm cần lấy thời tiết.
    """
    return get_weather(location)


# ── Web Search ───────────────────────────────────────────────────────────────
@mcp.tool()
def mcp_web_search(query: str) -> str:
    """Tìm kiếm thông tin mới nhất trên web.

    Args:
        query: Truy vấn cần tìm kiếm trên web.
    """
    return web_search(query)


# ── Save Memory ──────────────────────────────────────────────────────────────
@mcp.tool()
def mcp_save_memory(fact: str) -> str:
    """Lưu một sự thật hoặc sở thích quan trọng của người dùng vào bộ nhớ dài hạn.

    Args:
        fact: Thông tin ngắn gọn cần ghi nhớ về người dùng.
    """
    return save_memory(fact)


# ── Current Datetime ─────────────────────────────────────────────────────────
@mcp.tool()
def mcp_get_current_datetime() -> str:
    """Lấy ngày giờ hiện tại theo múi giờ Việt Nam (UTC+7)."""
    return get_current_datetime()


# ── Calculate ────────────────────────────────────────────────────────────────
@mcp.tool()
def mcp_calculate(expression: str) -> str:
    """Tính toán biểu thức toán học đơn giản.

    Args:
        expression: Biểu thức toán học cần tính (ví dụ: '1+1', '15*3', '100/4').
    """
    return calculate(expression)


# ── Translate ────────────────────────────────────────────────────────────────
@mcp.tool()
def mcp_translate_text(text: str, target_lang: str = "en") -> str:
    """Dịch văn bản sang ngôn ngữ khác.

    Args:
        text: Văn bản cần dịch.
        target_lang: Mã ngôn ngữ đích (en, vi, ja, ko, zh, fr, de, ...).
    """
    return translate_text(text, target_lang)


# ── Knowledge Search ─────────────────────────────────────────────────────────
@mcp.tool()
def mcp_knowledge_search(query: str, topic: str = "general") -> str:
    """Tìm kiếm kiến thức chuyên sâu về một chủ đề cụ thể.

    Args:
        query: Câu hỏi hoặc chủ đề cần tìm kiếm.
        topic: Lĩnh vực (general, science, tech, history, geography).
    """
    return knowledge_search(query, topic)


# ── Exchange Rate ─────────────────────────────────────────────────────────────
@mcp.tool()
def mcp_get_exchange_rate(base_currency: str = "USD", target_currency: str = "VND") -> str:
    """Lấy tỷ giá ngoại tệ mới nhất.

    Args:
        base_currency: Mã tiền tệ gốc (ví dụ: USD, EUR, JPY, GBP).
        target_currency: Mã tiền tệ đích (ví dụ: VND, USD, EUR).
    """
    return get_exchange_rate(base_currency, target_currency)


# ── News ──────────────────────────────────────────────────────────────────────
@mcp.tool()
def mcp_get_news(topic: str = "Việt Nam", max_results: int = 5) -> str:
    """Lấy tin tức mới nhất về một chủ đề cụ thể.

    Args:
        topic: Chủ đề cần lấy tin tức (ví dụ: 'Việt Nam', 'công nghệ', 'thể thao').
        max_results: Số lượng tin tức tối đa trả về.
    """
    return get_news(topic, max_results)


# ── Play Music ────────────────────────────────────────────────────────────────
@mcp.tool()
def mcp_play_music(url: str) -> str:
    """Phát nhạc từ URL (YouTube, SoundCloud, hoặc link MP3 trực tiếp).

    Args:
        url: Đường link bài hát (YouTube URL, SoundCloud URL, hoặc link MP3).
    """
    return play_music(url)


# ── Stop Music ────────────────────────────────────────────────────────────────
@mcp.tool()
def mcp_stop_music() -> str:
    """Tắt nhạc — đóng cửa sổ/tab nhạc đang phát."""
    return stop_music()


# ── Pause Music ───────────────────────────────────────────────────────────────
@mcp.tool()
def mcp_pause_music() -> str:
    """Tạm dừng nhạc đang phát (không đóng tab)."""
    return pause_music()


# ── Resume Music ──────────────────────────────────────────────────────────────
@mcp.tool()
def mcp_resume_music() -> str:
    """Tiếp tục phát nhạc đang tạm dừng (không mở tab mới)."""
    return resume_music()


# ── Stock Price ───────────────────────────────────────────────────────────────
@mcp.tool()
def mcp_get_stock_price(ticker: str) -> str:
    """Lấy giá cổ phiếu realtime từ CafeF (VN) hoặc Yahoo Finance (quốc tế).

    Args:
        ticker: Mã cổ phiếu (VD: VIC, VNM, HPG, AAPL, NVDA, MSFT).
    """
    return get_stock_price(ticker)


# ── MCP Resources (contextual info) ─────────────────────────────────────────
@mcp.resource("assistant://info")
def assistant_info() -> str:
    """Thông tin về assistant hiện tại."""
    from assistant.config import settings
    return (
        f"ROBOTS Personal Assistant\n"
        f"Model: {settings.model}\n"
        f"Profile: {settings.runtime_profile}\n"
        f"TTS Voice: {settings.tts_voice}\n"
        f"Whisper: {settings.whisper_model_size}\n"
        f"Max tokens: {settings.llm_max_completion_tokens}"
    )


if __name__ == "__main__":
    mcp.run()
