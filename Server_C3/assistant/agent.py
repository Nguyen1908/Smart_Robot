"""Personal Assistant Agent powered by Pydantic-AI.

This module wires together:
- A pydantic_ai.Agent with OpenAI-compatible provider
- Tool functions (weather, web search, memory, etc.)
- Memory system for conversation persistence
- Speech service for STT / TTS
- Streaming + parallel processing for sub-10s responses
"""

from __future__ import annotations

import json
import logging
import re
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import List

from pydantic_ai import Agent, RunContext
from pydantic_ai.messages import ModelMessage
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider

from assistant.config import settings
from assistant.memory import AssistantMemory
from assistant.models import AssistantResponse
from assistant.speech import SpeechService
from assistant.tools import (
    get_weather, save_memory, web_search,
    get_current_datetime, calculate,
    translate_text, knowledge_search,
    get_exchange_rate, get_news,
    play_music, stop_music, pause_music, resume_music, is_music_active,
    get_stock_price, extract_stock_ticker,
)

logger = logging.getLogger(__name__)

_VN_TZ = timezone(timedelta(hours=7))
_VN_WEEKDAYS = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"]


def _get_current_datetime_str() -> str:
    """Get current datetime string in Vietnamese for system prompt injection."""
    now = datetime.now(_VN_TZ)
    weekday = _VN_WEEKDAYS[now.weekday()]
    return (
        f"Thời điểm hiện tại: {now.strftime('%H:%M:%S')}, "
        f"{weekday}, ngày {now.strftime('%d')} tháng {now.strftime('%m')} năm {now.strftime('%Y')} "
        f"(giờ Việt Nam, UTC+7). "
        f"ĐÂY LÀ THỜI GIAN THỰC, KHÔNG PHẢI TƯƠNG LAI."
    )


SYSTEM_PROMPT_TEMPLATE = (
    "Bạn là trợ lý AI cá nhân thông minh. "
    "Phong cách: Gen Z nhẹ nhàng, thân thiện, xưng 'mình/bạn'. "
    "Bạn nhận một đoạn văn tiếng Việt từ người dùng và trả lời bằng tiếng Việt. Trong đó đoạn văn này ngôn ngữ không rõ ràng."
    "{current_datetime} "
    "QUY TẮC: "
    "1. Giá cả, tin tức, sự kiện, tỷ giá, crypto: BẮT BUỘC gọi web_search hoặc get_news. "
    "2. Hỏi về NGƯỜI (tổng thống, thủ tướng, nhân vật): BẮT BUỘC web_search vì kiến thức có thể lỗi thời. "
    "3. Tình hình chính trị, kinh tế, chiến sự: BẮT BUỘC web_search. "
    "4. KHÔNG nói 'không thể biết'. LUÔN tìm kiếm trước. "
    "5. Năm hiện tại là THỰC, không phải tương lai. "
    "6. STT sai từ thì đoán ý đúng: 'JD Vans'=JD Vance, 'tân hình'=tình hình. "
    "7. Mở/phát nhạc: gọi play_music với tên bài hát hoặc URL. "
    "Dừng/tạm ngưng nhạc: gọi pause_music. Tiếp tục phát nhạc đang dừng: gọi resume_music. "
    "Tắt nhạc/đóng nhạc: gọi stop_music (đóng tab nhạc). "
    "8. Thuật ngữ lạ không chắc chắn: dùng web_search tra cứu, KHÔNG đoán mò. "
    "9. Cổ phiếu, chứng khoán: gọi get_stock_price(ticker) để lấy giá realtime. "
    "Tools: get_weather, web_search, get_news, get_current_datetime, calculate, "
    "save_memory, translate_text, knowledge_search, get_exchange_rate, "
    "play_music, stop_music, pause_music, resume_music, get_stock_price. "
    # Price listing rules — CRITICAL
    "QUY TẮC GIÁ CẢ (BẮT BUỘC): Khi trả lời về giá xăng, giá vàng, hay bất kỳ giá sản phẩm nào: "
    "LIỆT KÊ ĐẦY ĐỦ TẤT CẢ sản phẩm với TÊN ĐẦY ĐỦ kèm GIÁ CỤ THỂ. "
    "Nếu quá 5 loại thì liệt kê TOP 5 quan trọng nhất. "
    "VD giá xăng: Xăng RON 95-III là 24.330 đồng trên lít, Xăng E10 RON 95-III là 23.690 đồng trên lít, "
    "Xăng E5 RON 92-II là khoảng 23.320 đồng trên lít, "
    "Dầu DO 0,05S-II là 35.440 đồng trên lít, Dầu DO 0,001S-V là 35.640 đồng trên lít. "
    "VD giá vàng: Vàng SJC là X triệu đồng trên lượng (mua vào/bán ra), Vàng nhẫn 9999 là Y triệu. "
    "PHẢI nêu đủ loại, KHÔNG được chỉ nêu 1-2 loại rồi bỏ qua. "
    # News format
    "QUY TẮC TIN TỨC: MỖI TIN có tên bài báo và tóm tắt 1-3 câu nội dung chính. "
    "Cuối cùng tổng hợp 1-2 câu nhận xét. "
    # Response format
    "ĐỊNH DẠNG: Trả lời 5-8 dòng, đầy đủ chính xác. "
    "KHÔNG bịa đặt (tránh Hallucination), chỉ dựa trên dữ liệu từ tools. "
    "KHÔNG markdown, KHÔNG bullet points, KHÔNG ký tự đặc biệt. "
    "Phù hợp đọc thành giọng nói tự nhiên."
)

WEATHER_KEYWORDS = ["thời tiết", "weather", "nhiệt độ", "mưa", "độ ẩm", "gió", "dự báo"]

# Simple news queries that can be answered directly via get_news() without LLM
# (analytical news queries like "tại sao tin X..." still go through LLM path)
_DIRECT_NEWS_KEYWORDS = [
    "tin tức", "tin mới nhất", "tin mới", "tin nóng", "tin hôm nay",
    "tóm tắt tin tức", "tóm tắt tin", "có gì mới", "hôm nay có gì",
    "news", "tin tức hôm nay",
]

# Keywords for exchange rate direct routing (call get_exchange_rate, NOT web_search)
EXCHANGE_RATE_KEYWORDS = [
    "tỷ giá", "exchange rate", "quy đổi tiền", "đổi tiền",
    "đô la", "đô mỹ", "dollar", "usd", "euro", "eur",
    "yên nhật", "yen", "jpy", "bảng anh", "gbp",
    "nhân dân tệ", "cny", "won", "krw",
    "bằng bao nhiêu vnd", "bao nhiêu vnđ", "bao nhiêu đồng",
    "sang vnd", "ra vnd", "quy ra vnd", "đổi ra vnd",
    "sang tiền việt", "ra tiền việt",
]

# Currency code mapping for Vietnamese natural language
_CURRENCY_ALIASES = {
    "đô la": "USD", "đô mỹ": "USD", "dollar": "USD", "đô": "USD",
    "euro": "EUR", "eur": "EUR",
    "yên nhật": "JPY", "yên": "JPY", "yen": "JPY", "jpy": "JPY",
    "bảng anh": "GBP", "bảng": "GBP", "gbp": "GBP",
    "nhân dân tệ": "CNY", "tệ": "CNY", "cny": "CNY",
    "won": "KRW", "won hàn": "KRW", "krw": "KRW",
    "baht": "THB", "thb": "THB",
    "đồng": "VND", "vnd": "VND", "vnđ": "VND", "việt nam đồng": "VND",
    "usd": "USD", "aud": "AUD", "cad": "CAD", "chf": "CHF",
    "sgd": "SGD", "hkd": "HKD", "nzd": "NZD",
}

# Keywords that trigger direct web_search routing (bypass LLM hesitation)
REALTIME_KEYWORDS = [
    # Prices / market
    "giá xăng", "giá vàng", "giá dầu", "giá gas", "giá điện",
    "tỷ giá", "exchange rate",
    "bitcoin", "crypto", "BTC", "ETH",
    "chứng khoán", "VN-Index", "VNIndex", "stock",
    "giá bao nhiêu", "bao nhiêu tiền",
    # Stock / securities
    "cổ phiếu", "mã chứng khoán", "thị trường chứng khoán",
    "VN30", "HNX", "HOSE", "UPCOM",
    "giá cổ phiếu", "cổ phần",
    # News
    "tin tức", "news", "tin mới", "tin nóng", "tin hôm nay",
    "tóm tắt", "tóm tắt tin",
    # Political / current affairs — MUST search, training data is stale
    "tổng thống", "thủ tướng", "phó tổng thống", "chủ tịch nước",
    "tổng bí thư", "bộ trưởng", "thống đốc",
    "hiện tại là ai", "là ai", "ai là",
    "tình hình", "chiến sự", "chiến tranh",
    "ngoại giao", "trừng phạt", "cấm vận",
    # People who change roles
    "JD Vance", "Trump", "Putin", "Zelensky",
    "Tô Lâm", "Phạm Minh Chính", "Lương Cường",
    "Friedrich Merz", "Olaf Scholz",
    "Elon Musk", "Mark Zuckerberg",
]

# Stock-specific keywords for enhanced routing
_STOCK_KEYWORDS_AGENT = [
    "cổ phiếu", "chứng khoán", "mã chứng khoán", "thị trường chứng khoán",
    "vn-index", "vnindex", "vn30", "hnx", "hose", "upcom",
    "giá cổ phiếu", "stock", "cổ phần",
]

# Music keywords for direct routing
MUSIC_KEYWORDS = [
    "mở nhạc", "phát nhạc", "bật nhạc", "nghe nhạc", "play music",
    "chơi nhạc", "mở bài", "phát bài", "bật bài",
]
MUSIC_STOP_KEYWORDS = [
    # "tắt nhạc" = ĐÓNG tab nhạc (Ctrl+W)
    "tắt nhạc", "tắt bài", "tắt bài hát", "tắt phát nhạc",
    "đóng nhạc", "đóng tab nhạc",
]
MUSIC_PAUSE_KEYWORDS = [
    # "dừng nhạc" = TẠM DỪNG (media key pause, tab vẫn mở)
    "dừng nhạc", "ngừng nhạc", "ngưng nhạc", "stop music",
    "dừng bài", "ngừng phát", "dừng phát nhạc",
    "không nghe nữa", "ngừng phát nhạc", "pause music",
    "dừng bài hát",
]
MUSIC_RESUME_KEYWORDS = [
    # "tiếp tục phát" = RESUME (media key play, KHÔNG mở bài mới)
    "tiếp tục phát", "phát tiếp", "nghe tiếp", "tiếp tục nghe",
    "resume music", "tiếp tục bài", "mở lại nhạc", "bật lại nhạc",
    "phát lại nhạc", "phát lại bài",
]
MUSIC_SWITCH_KEYWORDS = [
    # "chuyển bài" = đóng bài cũ, mở bài mới
    # NOTE: Longer phrases MUST come before shorter ones so they match first
    "chuyển sang bài", "chuyển sang nhạc", "chuyển bài", "chuyển nhạc",
    "đổi sang bài", "đổi sang nhạc", "đổi bài", "đổi nhạc",
    "nghe bài khác", "phát bài khác",
    "switch song", "bài khác",
]

# Trailing phrases to strip from extracted weather locations
_WEATHER_TRAILING_PHRASES = [
    "là bao nhiêu độ", "bao nhiêu độ", "là bao nhiêu",
    "như thế nào", "thế nào", "ra sao", "hôm nay",
    "ngày mai", "hiện tại", "bây giờ", "lúc này",
    "đang là bao nhiêu", "đang thế nào", "đang ra sao",
    "có mưa không", "có nắng không", "có gió không",
]

# Signals that the query is ANALYTICAL / complex — even if it contains a
# direct-route keyword (weather, price, stock…) it should go through full
# LLM reasoning instead of the fast direct path.
_ANALYSIS_SIGNALS = [
    # Vietnamese with diacritics (primary — STT outputs diacritics)
    "ảnh hưởng", "tại sao", "vì sao", "nguyên nhân",
    "so sánh", "liên quan", "nên không", "có nên",
    "giải thích", "phân tích", "dự đoán", "dự báo tuần",
    "xu hướng", "triển vọng", "đánh giá", "nhận xét",
    "khác nhau", "giống nhau", "mối quan hệ",
    "lời khuyên", "tư vấn", "gợi ý", "recommend",
    # Non-diacritic fallbacks (for STT edge cases)
    "anh huong", "tai sao", "vi sao", "nguyen nhan",
    "so sanh", "lien quan", "co nen", "phan tich",
    "giai thich", "du doan", "xu huong",
]

MEMORY_PATTERNS = [
    r"\btôi tên là\b",
    r"\bmình tên là\b",
    r"\bhãy nhớ rằng\b",
    r"\bnhớ rằng\b",
    r"\bsở thích của tôi là\b",
    r"\btôi thích\b",
]

@dataclass
class AgentDeps:
    """Dependencies injected into the Pydantic-AI agent at runtime."""
    memory: AssistantMemory


def _build_pydantic_agent() -> Agent[AgentDeps, str]:
    """Create the Pydantic-AI Agent with OpenAI-compatible provider and tools."""
    provider = OpenAIProvider(
        base_url=settings.base_url.rstrip("/") + "/v1",
        api_key=settings.api_key,
    )

    model = OpenAIChatModel(
        model_name=settings.model,
        provider=provider,
    )

    # Build system prompt with current datetime injected
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        current_datetime=_get_current_datetime_str()
    )

    agent = Agent(
        model=model,
        deps_type=AgentDeps,
        instructions=system_prompt,
        model_settings={
            "temperature": settings.llm_temperature,
            "max_tokens": settings.llm_max_completion_tokens,
            # Disable Qwen3 internal chain-of-thought thinking.
            # Qwen3 thinking tokens are NOT capped by max_tokens, so a complex
            # news/search query can spend 20-25 s on internal reasoning before
            # producing the actual answer.  Setting enable_thinking=False cuts
            # search/news latency from ~30 s → ~5-8 s with no quality loss for
            # conversational voice-assistant use-cases.
            # Re-enable only if deeper analytical reasoning is required.
            "extra_body": {"enable_thinking": False},
        },
    )

    # Dynamic instruction: inject memory context (profile + facts)
    @agent.instructions
    def add_memory_context(ctx: RunContext[AgentDeps]) -> str:
        return ctx.deps.memory.get_context_system_prompt()

    # Dynamic instruction: refresh current datetime on every call
    @agent.instructions
    def add_current_datetime(ctx: RunContext[AgentDeps]) -> str:
        return _get_current_datetime_str()

    # Register tools using tool_plain (no RunContext needed)
    agent.tool_plain(get_weather)
    agent.tool_plain(web_search)
    agent.tool_plain(save_memory)
    agent.tool_plain(get_current_datetime)
    agent.tool_plain(calculate)
    agent.tool_plain(translate_text)
    agent.tool_plain(knowledge_search)
    agent.tool_plain(get_exchange_rate)
    agent.tool_plain(get_news)
    agent.tool_plain(play_music)
    agent.tool_plain(stop_music)
    agent.tool_plain(pause_music)
    agent.tool_plain(resume_music)
    agent.tool_plain(get_stock_price)

    return agent


class PersonalAssistantAgent:
    def __init__(self) -> None:
        self.memory = AssistantMemory()
        self.speech = SpeechService()
        self.speech.warmup()
        self._agent = _build_pydantic_agent()
        # Restore music state from persisted memory (survives process restarts)
        self.memory.sync_music_state_to_tools()

    @staticmethod
    def _normalize_answer(answer_text: str, max_chars: int = 0) -> str:
        """Clean and trim answer, preserving complete sentences."""
        limit = max_chars if max_chars > 0 else settings.max_response_chars
        compact = " ".join(answer_text.split())
        if len(compact) <= limit:
            return compact
        # Cut at last complete sentence within limit
        truncated = compact[:limit]
        for sep in [".", "!", "?"]:
            last_idx = truncated.rfind(sep)
            if last_idx > len(truncated) // 3:
                return truncated[: last_idx + 1]
        # Fallback: cut at last space, end with period
        space_idx = truncated.rfind(" ")
        if space_idx > 0:
            return truncated[:space_idx].rstrip(" ,.;:") + "."
        return truncated.rstrip(" ,.;:") + "."

    @staticmethod
    def _is_analytical_query(text: str) -> bool:
        """Detect if the query is analytical/complex and needs full LLM reasoning.

        Example: "thời tiết có ảnh hưởng đến cổ phiếu không?" contains weather
        keywords but is actually an analysis question → should NOT be direct-routed.
        """
        lower = text.lower()
        return any(signal in lower for signal in _ANALYSIS_SIGNALS)

    def _should_route_weather_directly(self, user_text: str) -> bool:
        text = user_text.lower()
        if not (settings.direct_weather_routing and any(keyword in text for keyword in WEATHER_KEYWORDS)):
            return False
        # Analytical query with weather keyword → let LLM handle
        if self._is_analytical_query(user_text):
            logger.debug("Weather keyword found but analytical query detected → LLM path")
            return False
        return True

    @staticmethod
    def _clean_location_text(raw: str) -> str:
        """Remove trailing question phrases from extracted location text."""
        # Strip punctuation FIRST so trailing phrases can match properly
        # (e.g. "bao nhiêu độ?" won't match "bao nhiêu độ" without this)
        cleaned = raw.strip().strip(" ?!,.:")
        lowered = cleaned.lower()
        for phrase in _WEATHER_TRAILING_PHRASES:
            if lowered.endswith(phrase):
                cleaned = cleaned[: len(cleaned) - len(phrase)].strip()
                lowered = cleaned.lower()
        return cleaned.strip(" ?!,.:") or "TPHCM"

    def _extract_weather_location(self, user_text: str) -> str:
        text = user_text.strip()
        lowered = text.lower()

        # Check known cities FIRST — more robust than separator extraction,
        # handles STT errors like "Minhh" since "hồ chí minh" is a substring.
        known_cities = [
            ("hồ chí minh", "TPHCM"), ("tphcm", "TPHCM"), ("tp hcm", "TPHCM"),
            ("sài gòn", "TPHCM"), ("sai gon", "TPHCM"), ("hcm", "TPHCM"),
            ("hà nội", "Hà Nội"), ("ha noi", "Hà Nội"),
            ("đà nẵng", "Đà Nẵng"), ("da nang", "Đà Nẵng"),
            ("huế", "Huế"), ("cần thơ", "Cần Thơ"), ("hải phòng", "Hải Phòng"),
            ("nha trang", "Nha Trang"), ("đà lạt", "Đà Lạt"), ("vũng tàu", "Vũng Tàu"),
            ("biên hòa", "Biên Hòa"), ("quy nhơn", "Quy Nhơn"),
            ("phú quốc", "Phú Quốc"), ("bình dương", "Bình Dương"),
        ]
        for keyword, city in known_cities:
            if keyword in lowered:
                return city

        # Then try separator-based extraction for unknown locations
        for separator in [" tại ", " ở ", " cho "]:
            if separator in lowered:
                index = lowered.rfind(separator)
                raw_location = text[index + len(separator):]
                return self._clean_location_text(raw_location)

        return "TPHCM"

    def _should_route_realtime_directly(self, user_text: str) -> bool:
        """Check if query needs real-time data and should call web_search directly.

        Returns False for analytical queries that contain realtime keywords
        but need LLM reasoning (e.g. "tại sao giá vàng tăng?").
        """
        text = user_text.lower()
        if not any(keyword.lower() in text for keyword in REALTIME_KEYWORDS):
            return False
        # Analytical query → still fetch data, but let LLM reason over it
        if self._is_analytical_query(user_text):
            logger.debug("Realtime keyword found but analytical query detected → LLM path")
            return False
        return True

    def _should_route_exchange_rate(self, user_text: str) -> bool:
        """Check if query is about currency exchange rates."""
        text = user_text.lower()
        return any(kw in text for kw in EXCHANGE_RATE_KEYWORDS)

    @staticmethod
    def _extract_currencies(text: str) -> tuple[str, str]:
        """Extract base and target currencies from user text.

        Returns (base_currency, target_currency) codes.
        Default: USD → VND.
        """
        lower = text.lower()
        found: list[str] = []
        # Sort aliases by length (longest first) to match "nhân dân tệ" before "tệ"
        for alias in sorted(_CURRENCY_ALIASES.keys(), key=len, reverse=True):
            if alias in lower:
                code = _CURRENCY_ALIASES[alias]
                if code not in found:
                    found.append(code)
                if len(found) >= 2:
                    break

        if len(found) == 0:
            return "USD", "VND"
        if len(found) == 1:
            # If user mentions one currency, assume conversion to/from VND
            if found[0] == "VND":
                return "USD", "VND"
            return found[0], "VND"
        return found[0], found[1]

    def _handle_direct_exchange_rate(self, user_text: str, enable_tts: bool) -> AssistantResponse:
        """Handle exchange rate queries via web_search + LLM formatting.

        Uses web_search (Tavily, include_answer=False) directly instead of the
        slow get_exchange_rate() chain (exchangerate-api → open.er-api → fallback).
        Tavily returns accurate bank rates (Vietcombank, etc.) in ~3s.
        """
        started_at = time.perf_counter()

        base, target = self._extract_currencies(user_text)

        # Build a targeted search query that Tavily can answer with bank rates
        search_query = f"tỷ giá {base} {target} Vietcombank mua bán hôm nay mới nhất"

        tool_started = time.perf_counter()
        rate_data = web_search(search_query)
        tool_latency_ms = int((time.perf_counter() - tool_started) * 1000)

        # Pass through LLM for natural response
        augmented_prompt = (
            f"Người dùng hỏi: {user_text}\n\n"
            f"Dữ liệu tỷ giá mới nhất:\n{rate_data}\n\n"
            f"Hãy trả lời ngắn gọn, tự nhiên DỰA TRÊN dữ liệu trên. "
            f"KHÔNG bịa đặt. Nêu rõ con số tỷ giá cụ thể (giá mua, bán nếu có)."
        )

        raw_history = self.memory.get_message_history()
        message_history = self._filter_history_for_api(raw_history)

        llm_started = time.perf_counter()
        try:
            result = self._agent.run_sync(
                augmented_prompt,
                deps=AgentDeps(memory=self.memory),
                message_history=message_history,
            )
        except Exception:
            message_history = []
            result = self._agent.run_sync(
                augmented_prompt,
                deps=AgentDeps(memory=self.memory),
                message_history=message_history,
            )
        llm_latency_ms = int((time.perf_counter() - llm_started) * 1000)

        answer_text = result.output or rate_data
        answer_text = self._normalize_answer(answer_text)

        # Save conversation history from LLM run
        self.memory.set_message_history(result.all_messages())

        audio_path = None
        tts_latency_ms = 0
        if enable_tts:
            tts_started = time.perf_counter()
            audio_path = self.speech.text_to_speech(answer_text)
            tts_latency_ms = int((time.perf_counter() - tts_started) * 1000)

        total_latency_ms = int((time.perf_counter() - started_at) * 1000)

        return AssistantResponse(
            text=answer_text,
            tool_events=[f"get_exchange_rate({base}/{target}) {tool_latency_ms}ms"],
            audio_path=audio_path,
            latency_ms={"tool": tool_latency_ms, "llm": llm_latency_ms, "tts": tts_latency_ms, "total": total_latency_ms},
        )

    def _should_route_music(self, user_text: str) -> bool:
        """Check if query is a music play/stop/pause/resume/switch request."""
        text = user_text.lower()
        all_kws = (MUSIC_KEYWORDS + MUSIC_STOP_KEYWORDS + MUSIC_PAUSE_KEYWORDS
                   + MUSIC_RESUME_KEYWORDS + MUSIC_SWITCH_KEYWORDS)
        return any(kw in text for kw in all_kws)

    def _handle_music(self, user_text: str, enable_tts: bool) -> AssistantResponse:
        """Handle music play/stop/pause/resume/switch requests directly.

        Priority: stop → pause → resume → switch → play.
        """
        started_at = time.perf_counter()
        text = user_text.lower()

        if any(kw in text for kw in MUSIC_STOP_KEYWORDS):
            result_text = stop_music()

        elif any(kw in text for kw in MUSIC_PAUSE_KEYWORDS):
            result_text = pause_music()

        elif any(kw in text for kw in MUSIC_RESUME_KEYWORDS):
            result_text = resume_music()

        elif any(kw in text for kw in MUSIC_SWITCH_KEYWORDS):
            # "chuyển sang bài Ai đưa em về" → extract new song name
            result_text = self._handle_switch_song(user_text)

        else:
            # PLAY — but if no song name and music already active → resume
            result_text = self._handle_play_song(user_text)

        # Sync music state to persistent memory after any music action
        self.memory.sync_music_state_from_tools()

        # Save action to conversation history so LLM knows what happened
        self.memory.add_action_to_history(user_text, result_text)

        audio_path = None
        tts_latency_ms = 0
        if enable_tts:
            tts_started = time.perf_counter()
            audio_path = self.speech.text_to_speech(result_text)
            tts_latency_ms = int((time.perf_counter() - tts_started) * 1000)

        total_latency_ms = int((time.perf_counter() - started_at) * 1000)
        return AssistantResponse(
            text=result_text,
            tool_events=[f"music: {result_text[:200]}"],
            audio_path=audio_path,
            latency_ms={
                "tool": 0,
                "llm": 0,
                "tts": tts_latency_ms,
                "total": total_latency_ms,
            },
        )

    @staticmethod
    def _handle_switch_song(user_text: str) -> str:
        """Extract new song name from switch request, then play it.

        'chuyển sang bài Ai đưa em về' → play_music('Ai đưa em về')
        play_music() internally closes the old song first.
        """
        song_query = user_text.lower()
        # Remove switch keywords (longest first — order matters)
        for kw in MUSIC_SWITCH_KEYWORDS:
            song_query = song_query.replace(kw, "").strip()
        # Strip leftover connector fragments after keyword removal
        for fragment in ["sang bài", "sang nhạc", "sang"]:
            if song_query.startswith(fragment):
                song_query = song_query[len(fragment):].strip()
        # Strip trailing filler phrases (multi-word first, then single-word)
        # "đi" is intentionally NOT stripped as a standalone filler because it
        # appears in valid song titles like "Chạy Ngay Đi"
        for filler in ["đi nhé", "đi nha", "cho tôi", "cho mình", "nhé", "nha", "giùm", "hộ"]:
            song_query = song_query.strip().removesuffix(filler).strip()
        song_query = song_query.strip(" ,.!?")
        # Must be a meaningful song name (>2 chars to avoid filler-only)
        if song_query and len(song_query) > 2:
            return play_music(song_query)
        return "Bạn muốn chuyển sang bài gì? Nói tên bài hát nhé."

    @staticmethod
    def _handle_play_song(user_text: str) -> str:
        """Handle a play request — open new song, or resume if no song name given."""
        import re as _re_local
        url_pattern = _re_local.compile(r'https?://\S+')
        urls = url_pattern.findall(user_text)
        if urls:
            return play_music(urls[0])

        # Extract song name by removing music keywords
        song_query = user_text
        for kw in MUSIC_KEYWORDS:
            song_query = song_query.lower().replace(kw, "").strip()
        song_query = song_query.strip(" ,.!?")

        if (not song_query or len(song_query) <= 1) and is_music_active():
            # No song name + music already active → RESUME instead of duplicate
            return resume_music()
        if song_query and len(song_query) > 1:
            return play_music(song_query)
        return "Bạn muốn nghe bài gì? Nói tên bài hát hoặc gửi link nhạc nhé."

    def _extract_search_query(self, user_text: str) -> str:
        """Extract a clean search query from user text for web_search."""
        # Remove filler words and question marks
        query = user_text.strip().rstrip("?!.")
        lower = query.lower()

        # Stock/securities: enhance query with VN/international source names
        is_stock = any(kw.lower() in lower for kw in _STOCK_KEYWORDS_AGENT)
        if is_stock:
            # Detect if international stock (English context, non-VN keywords)
            intl_markers = ["nasdaq", "nyse", "s&p", "dow jones", "apple", "google",
                            "microsoft", "tesla", "amazon", "meta", "nvidia",
                            "aapl", "msft", "googl", "tsla", "amzn", "nvda"]
            vn_stock_kws = ["cổ phiếu", "chứng khoán", "mã chứng khoán",
                            "vn-index", "vnindex", "vn30", "hnx", "hose", "upcom",
                            "giá cổ phiếu", "cổ phần", "thị trường chứng khoán"]
            has_vn_kw = any(kw in lower for kw in vn_stock_kws)
            is_international = any(m in lower for m in intl_markers)
            if is_international or not has_vn_kw:
                query += " Yahoo Finance stock price today latest"
            else:
                query += " giá mới nhất hôm nay DNSE VietStock cafef"
        # Price queries: use "mới nhất hôm nay" instead of numeric date
        # (numeric dates like "29/03/2026" cause LLM to think it's the future)
        elif any(kw in lower for kw in ["giá", "tỷ giá"]):
            query += " mới nhất hôm nay"
        # Political/people queries
        elif any(kw in lower for kw in [
            "tổng thống", "thủ tướng", "phó tổng thống", "chủ tịch",
            "là ai", "ai là", "hiện tại là",
        ]):
            now = datetime.now(_VN_TZ)
            query += f" {now.strftime('%Y')} hiện tại"
        # Current affairs context
        elif any(kw in lower for kw in ["tình hình", "chiến sự"]):
            now = datetime.now(_VN_TZ)
            query += f" {now.strftime('%m/%Y')}"
        return query

    # ── Direct news routing (bypass LLM — like weather) ─────────────────────

    def _should_route_news_directly(self, user_text: str) -> bool:
        """Return True for simple news queries that can be served by get_news() alone.

        Analytical questions (tại sao, ảnh hưởng, so sánh…) still go to LLM.
        """
        text = user_text.lower()
        if not any(kw in text for kw in _DIRECT_NEWS_KEYWORDS):
            return False
        if self._is_analytical_query(user_text):
            logger.debug("News keyword found but analytical query → LLM path")
            return False
        return True

    @staticmethod
    def _extract_news_topic(user_text: str) -> str:
        """Strip news filler words → extract topic string for get_news(topic=…).

        Handles patterns like:
          "lấy cho tôi 5 tin tức thế giới nóng hổi hôm nay" → "thế giới"
          "tin tức công nghệ hôm nay"                        → "công nghệ"
          "tin tức mới nhất hôm nay"                         → "Việt Nam" (default)
        """
        lower = user_text.lower().strip()

        # 1. Strip leading "lấy [cho tôi / giúp tôi] [số]" patterns first
        lower = re.sub(
            r'^(lấy\s+)?(cho\s+tôi\s+|giúp\s+tôi\s+|cho\s+mình\s+)?(\d+\s+)?',
            '',
            lower,
        ).strip()

        # 2. Remove news-specific filler keywords (longest phrases first)
        for kw in [
            "tin tức mới nhất", "tin tức hôm nay", "tóm tắt tin tức", "tóm tắt tin",
            "tin mới nhất", "tin nóng hổi", "tin nóng", "tin hôm nay", "tin mới",
            "tin tức", "có gì mới", "hôm nay có gì", "news",
            "về chủ đề", "liên quan đến", "về",
            "cho tôi biết", "bạn có thể cho mình biết",
            "mới nhất", "hôm nay", "nóng hổi", "nóng",
        ]:
            lower = lower.replace(kw, " ").strip()

        # 3. Clean up extra whitespace and punctuation
        lower = " ".join(lower.split()).strip(" ?!.,:")

        # Must be at least 3 chars to be a meaningful topic (avoid empty / filler-only)
        return lower if len(lower) >= 3 else "Việt Nam"

    def _handle_direct_news(self, user_text: str, enable_tts: bool) -> AssistantResponse:
        """Serve news queries via get_news() + LLM formatting.

        Flow:
          1. get_news(topic, max_results=3) → raw Tavily data (~3-5 s)
          2. LLM formats it into clean conversational text (~3-5 s)
          3. TTS + memory save concurrently

        Total target: ~6-10 s vs old 28+ s (web_search + full LLM reasoning).
        The LLM step here is FAST because the prompt is short and the output
        is just formatting — no search, no reasoning, just pretty-printing.
        """
        started_at = time.perf_counter()
        topic = self._extract_news_topic(user_text)

        tool_started = time.perf_counter()
        # max_results=3 instead of 5 → 40% less Tavily payload
        news_result = get_news(topic=topic, max_results=3)
        tool_latency_ms = int((time.perf_counter() - tool_started) * 1000)

        # ── LLM formatting step (short prompt → fast output) ───────────────
        # Pass raw Tavily data through LLM so the response is:
        #   • conversational Vietnamese (not raw source snippets)
        #   • no YouTube URLs or "(Nguồn: youtube.com)" noise
        #   • proper news format as defined in SYSTEM_PROMPT (1-3 câu/tin)
        augmented_prompt = (
            f"Người dùng hỏi: {user_text}\n\n"
            f"Dữ liệu tin tức mới nhất (chủ đề: {topic}):\n{news_result}\n\n"
            f"Hãy tóm tắt các tin tức quan trọng theo đúng QUY TẮC TIN TỨC: "
            f"MỖI TIN có tên bài và tóm tắt 1-3 câu nội dung chính. "
            f"Cuối cùng tổng hợp 1-2 câu nhận xét. "
            f"KHÔNG markdown, KHÔNG bullet points, KHÔNG URL, KHÔNG tên nguồn. "
            f"Phù hợp đọc thành giọng nói tự nhiên."
        )

        raw_history = self.memory.get_message_history()
        message_history = self._filter_history_for_api(raw_history)

        llm_started = time.perf_counter()
        try:
            result = self._agent.run_sync(
                augmented_prompt,
                deps=AgentDeps(memory=self.memory),
                message_history=message_history,
            )
        except Exception:
            message_history = []
            result = self._agent.run_sync(
                augmented_prompt,
                deps=AgentDeps(memory=self.memory),
                message_history=message_history,
            )
        llm_latency_ms = int((time.perf_counter() - llm_started) * 1000)

        answer_text = result.output or news_result
        answer_text = self._normalize_answer(answer_text, max_chars=900)

        # Run memory save + TTS concurrently (same pattern as _handle_direct_realtime)
        all_msgs = result.all_messages()
        audio_path = None
        tts_latency_ms = 0

        if enable_tts:
            tts_started = time.perf_counter()
            with ThreadPoolExecutor(max_workers=2) as pool:
                mem_future = pool.submit(self.memory.set_message_history, all_msgs)
                tts_future = pool.submit(self.speech.text_to_speech, answer_text)
                audio_path = tts_future.result()
                mem_future.result()
            tts_latency_ms = int((time.perf_counter() - tts_started) * 1000)
        else:
            self.memory.set_message_history(all_msgs)

        total_latency_ms = int((time.perf_counter() - started_at) * 1000)
        return AssistantResponse(
            text=answer_text,
            tool_events=[f"get_news(direct, topic={topic!r}): {news_result[:300]}"],
            audio_path=audio_path,
            latency_ms={
                "tool": tool_latency_ms,
                "llm": llm_latency_ms,
                "tts": tts_latency_ms,
                "total": total_latency_ms,
            },
        )

    def _handle_direct_realtime(self, user_text: str, enable_tts: bool) -> AssistantResponse:
        """Directly call web_search for real-time queries, then pass results through LLM."""
        started_at = time.perf_counter()

        # Detect query type
        lower_text = user_text.lower()
        is_stock = any(kw.lower() in lower_text for kw in _STOCK_KEYWORDS_AGENT)
        is_price = any(kw in lower_text for kw in [
            "giá xăng", "giá vàng", "giá dầu", "giá gas", "giá điện",
            "giá bao nhiêu", "bao nhiêu tiền",
        ])

        tool_started = time.perf_counter()

        if is_stock:
            # STOCK: Get real-time price via API
            ticker = extract_stock_ticker(user_text)
            stock_price_data = get_stock_price(ticker) if ticker else ""
            if stock_price_data:
                search_result = f"GIÁ REALTIME:\n{stock_price_data}"
            else:
                search_query = self._extract_search_query(user_text)
                search_result = web_search(search_query)
        else:
            search_query = self._extract_search_query(user_text)
            search_result = web_search(search_query)

        tool_latency_ms = int((time.perf_counter() - tool_started) * 1000)

        if is_stock:
            augmented_prompt = (
                f"Người dùng hỏi: {user_text}\n\n"
                f"Dữ liệu THỜI GIAN THỰC:\n{search_result}\n\n"
                f"ĐÂY LÀ DỮ LIỆU THỰC TẾ HIỆN TẠI, KHÔNG PHẢI TƯƠNG LAI. "
                f"Hãy trả lời đầy đủ, chính xác DỰA TRÊN DỮ LIỆU TRÊN. "
                f"Nêu rõ GIÁ CỔ PHIẾU hiện tại, biến động tăng/giảm (% và điểm) nếu có. "
                f"CHỈ NÊU THÔNG TIN GIÁ, KHÔNG liệt kê tin tức hay bài báo. "
                f"TUYỆT ĐỐI KHÔNG nói 'không thể cung cấp' hay 'dữ liệu tương lai'. "
                f"TUYỆT ĐỐI KHÔNG bịa đặt thông tin không có trong dữ liệu."
            )
        elif is_price:
            augmented_prompt = (
                f"Người dùng hỏi: {user_text}\n\n"
                f"Dữ liệu tìm kiếm mới nhất:\n{search_result}\n\n"
                f"LIỆT KÊ ĐẦY ĐỦ TẤT CẢ sản phẩm với TÊN ĐẦY ĐỦ và GIÁ CỤ THỂ. "
                f"Nếu quá 5 loại thì liệt kê TOP 5 quan trọng nhất. "
                f"Nêu rõ đơn vị (đồng/lít, triệu/lượng, ...). "
                f"KHÔNG bịa đặt thông tin không có trong dữ liệu."
            )
        else:
            augmented_prompt = (
                f"Người dùng hỏi: {user_text}\n\n"
                f"Dữ liệu tìm kiếm mới nhất:\n{search_result}\n\n"
                f"Hãy trả lời đầy đủ, chính xác dựa trên dữ liệu trên. "
                f"Trả lời khoảng 5-6 câu, cung cấp đủ thông tin quan trọng. "
                f"Nếu có giá cả thì nêu cụ thể tên và giá. "
                f"KHÔNG bịa đặt thông tin không có trong dữ liệu."
            )

        raw_history = self.memory.get_message_history()
        message_history = self._filter_history_for_api(raw_history)

        llm_started = time.perf_counter()
        try:
            result = self._agent.run_sync(
                augmented_prompt,
                deps=AgentDeps(memory=self.memory),
                message_history=message_history,
            )
        except Exception:
            message_history = []
            result = self._agent.run_sync(
                augmented_prompt,
                deps=AgentDeps(memory=self.memory),
                message_history=message_history,
            )
        llm_latency_ms = int((time.perf_counter() - llm_started) * 1000)

        answer_text = result.output or "Xin lỗi, mình chưa tìm được thông tin phù hợp."
        # Use larger char limit for price/stock queries to list all info
        char_limit = 1000 if is_stock else (900 if is_price else 0)
        answer_text = self._normalize_answer(answer_text, max_chars=char_limit)

        # Run memory save + TTS concurrently using ThreadPoolExecutor
        all_msgs = result.all_messages()
        tts_latency_ms = 0
        audio_path = None

        if enable_tts:
            tts_started = time.perf_counter()
            with ThreadPoolExecutor(max_workers=2) as pool:
                # Save history in background while TTS processes
                mem_future = pool.submit(self.memory.set_message_history, all_msgs)
                tts_future = pool.submit(self.speech.text_to_speech, answer_text)
                audio_path = tts_future.result()
                mem_future.result()  # ensure save completes
            tts_latency_ms = int((time.perf_counter() - tts_started) * 1000)
        else:
            self.memory.set_message_history(all_msgs)

        total_latency_ms = int((time.perf_counter() - started_at) * 1000)
        return AssistantResponse(
            text=answer_text,
            tool_events=[f"web_search(direct): {search_result[:300]}"],
            audio_path=audio_path,
            latency_ms={
                "tool": tool_latency_ms,
                "llm": llm_latency_ms,
                "tts": tts_latency_ms,
                "total": total_latency_ms,
            },
        )

    def _should_save_memory_directly(self, user_text: str) -> bool:
        if not settings.direct_memory_routing:
            return False
        normalized = user_text.lower()
        return any(re.search(pattern, normalized) for pattern in MEMORY_PATTERNS)

    def _save_memory_directly(self, user_text: str, enable_tts: bool) -> AssistantResponse:
        fact = " ".join(user_text.strip().split())
        self.memory.remember_fact(fact)
        answer_text = self._normalize_answer("Mình đã ghi nhớ thông tin này rồi nhé.")

        # Save to conversation history for context continuity
        self.memory.add_action_to_history(user_text, answer_text)

        audio_path = None
        if enable_tts:
            audio_path = self.speech.text_to_speech(answer_text)

        return AssistantResponse(
            text=answer_text,
            tool_events=[f"save_memory: {json.dumps({'fact': fact, 'status': 'recorded'}, ensure_ascii=False)}"],
            audio_path=audio_path,
            latency_ms={"llm": 0, "tts": 0, "total": 0},
        )

    def _handle_direct_weather(self, user_text: str, enable_tts: bool) -> AssistantResponse:
        started_at = time.perf_counter()
        location = self._extract_weather_location(user_text)
        tool_started = time.perf_counter()
        weather_result = get_weather(location)
        tool_latency_ms = int((time.perf_counter() - tool_started) * 1000)

        answer_text = self._normalize_answer(weather_result)

        # Save to conversation history for context continuity
        self.memory.add_action_to_history(user_text, answer_text)

        tts_latency_ms = 0
        audio_path = None
        if enable_tts:
            tts_started = time.perf_counter()
            audio_path = self.speech.text_to_speech(answer_text)
            tts_latency_ms = int((time.perf_counter() - tts_started) * 1000)
        total_latency_ms = int((time.perf_counter() - started_at) * 1000)

        return AssistantResponse(
            text=answer_text,
            tool_events=[f"get_weather(direct): {weather_result[:200]}"],
            audio_path=audio_path,
            latency_ms={
                "tool": tool_latency_ms,
                "llm": 0,
                "tts": tts_latency_ms,
                "total": total_latency_ms,
            },
        )

    @staticmethod
    def _filter_history_for_api(messages: List[ModelMessage]) -> List[ModelMessage]:
        """Remove messages containing tool-call or tool-return parts."""
        clean: List[ModelMessage] = []
        for msg in messages:
            has_tool_part = any(
                getattr(part, "part_kind", "") in ("tool-call", "tool-return")
                for part in msg.parts
            )
            if not has_tool_part:
                clean.append(msg)
        return clean

    def chat(self, user_text: str, enable_tts: bool = True) -> AssistantResponse:
        """Process a text message. Uses parallel LLM + TTS for speed."""
        # Direct routing shortcuts (bypass LLM)
        if self._should_route_weather_directly(user_text):
            try:
                return self._handle_direct_weather(user_text, enable_tts)
            except Exception as exc:
                logger.warning("Direct weather routing failed: %s — falling back to LLM", exc)

        if self._should_save_memory_directly(user_text):
            try:
                return self._save_memory_directly(user_text, enable_tts)
            except Exception as exc:
                logger.warning("Direct memory save failed: %s — falling back to LLM", exc)

        # Music routing (play/stop)
        if self._should_route_music(user_text):
            try:
                return self._handle_music(user_text, enable_tts)
            except Exception as exc:
                logger.warning("Music routing failed: %s — falling back to LLM", exc)

        # Exchange rate routing (call get_exchange_rate directly)
        if self._should_route_exchange_rate(user_text):
            try:
                return self._handle_direct_exchange_rate(user_text, enable_tts)
            except Exception as exc:
                logger.warning("Exchange rate routing failed: %s — falling back to LLM", exc)

        # Direct news routing (get_news() only, NO LLM) — must come BEFORE
        # _should_route_realtime_directly because "tin tức" is in REALTIME_KEYWORDS
        # and would otherwise fall into the slower realtime+LLM path.
        if self._should_route_news_directly(user_text):
            try:
                return self._handle_direct_news(user_text, enable_tts)
            except Exception as exc:
                logger.warning("Direct news routing failed: %s — falling back to LLM", exc)

        # Direct routing for real-time data queries (prices, political, etc.) + LLM
        if self._should_route_realtime_directly(user_text):
            try:
                return self._handle_direct_realtime(user_text, enable_tts)
            except Exception as exc:
                logger.warning("Direct realtime routing failed: %s — falling back to LLM", exc)

        # Full LLM path via Pydantic-AI
        started_at = time.perf_counter()

        # Get existing message history, filter out stale tool messages
        raw_history = self.memory.get_message_history()
        message_history = self._filter_history_for_api(raw_history)

        llm_started = time.perf_counter()
        try:
            try:
                result = self._agent.run_sync(
                    user_text,
                    deps=AgentDeps(memory=self.memory),
                    message_history=message_history,
                )
            except Exception:
                message_history = []
                result = self._agent.run_sync(
                    user_text,
                    deps=AgentDeps(memory=self.memory),
                    message_history=message_history,
                )
        except Exception as exc:
            # ALL LLM attempts failed — return friendly error, NEVER crash
            logger.error("LLM path completely failed: %s", exc)
            error_text = "Xin lỗi, mình không thể xử lý yêu cầu này lúc này. Vui lòng thử lại sau nhé."
            audio_path = None
            if enable_tts:
                try:
                    audio_path = self.speech.text_to_speech(error_text)
                except Exception:
                    pass
            total_latency_ms = int((time.perf_counter() - started_at) * 1000)
            return AssistantResponse(
                text=error_text,
                tool_events=[f"error: {str(exc)[:200]}"],
                audio_path=audio_path,
                latency_ms={"llm": 0, "tts": 0, "total": total_latency_ms},
            )

        llm_latency_ms = int((time.perf_counter() - llm_started) * 1000)

        answer_text = result.output or "Xin lỗi, tôi chưa tạo được câu trả lời phù hợp."
        answer_text = self._normalize_answer(answer_text)

        # Extract tool events from messages
        tool_events = self._extract_tool_events(result.new_messages())

        # Handle save_memory tool calls — persist facts
        self._persist_memory_from_messages(result.new_messages())

        # Run memory save + TTS concurrently using ThreadPoolExecutor
        all_msgs = result.all_messages()
        tts_latency_ms = 0
        audio_path = None

        if enable_tts:
            tts_started = time.perf_counter()
            with ThreadPoolExecutor(max_workers=2) as pool:
                mem_future = pool.submit(self.memory.set_message_history, all_msgs)
                tts_future = pool.submit(self.speech.text_to_speech, answer_text)
                audio_path = tts_future.result()
                mem_future.result()
            tts_latency_ms = int((time.perf_counter() - tts_started) * 1000)
        else:
            self.memory.set_message_history(all_msgs)

        total_latency_ms = int((time.perf_counter() - started_at) * 1000)
        return AssistantResponse(
            text=answer_text,
            tool_events=tool_events,
            audio_path=audio_path,
            latency_ms={
                "llm": llm_latency_ms,
                "tts": tts_latency_ms,
                "total": total_latency_ms,
            },
        )

    def chat_from_audio(self, audio_path: str, enable_tts: bool = True) -> AssistantResponse:
        """Process audio input: STT -> LLM -> TTS with timing."""
        started_at = time.perf_counter()
        stt_started = time.perf_counter()
        transcript = self.speech.transcribe(audio_path)
        stt_latency_ms = int((time.perf_counter() - stt_started) * 1000)

        response = self.chat(transcript, enable_tts=enable_tts)
        response.transcript = transcript
        response.latency_ms["stt"] = stt_latency_ms
        response.latency_ms["end_to_end"] = int((time.perf_counter() - started_at) * 1000)
        return response

    @staticmethod
    def _extract_tool_events(messages: List[ModelMessage]) -> List[str]:
        """Extract tool call info from Pydantic-AI messages for UI display."""
        events: List[str] = []
        for msg in messages:
            for part in msg.parts:
                part_kind = getattr(part, "part_kind", "")
                if part_kind == "tool-return":
                    tool_name = getattr(part, "tool_name", "unknown")
                    content = getattr(part, "content", "")
                    events.append(f"{tool_name}: {content}")
        return events

    @staticmethod
    def _extract_fact_from_tool_call(part) -> str:
        """Extract fact string from a save_memory tool-call part."""
        args = getattr(part, "args", {})
        fact = args.get("fact", "") if isinstance(args, dict) else str(args)
        return fact.strip()

    def _persist_memory_from_messages(self, messages: List[ModelMessage]) -> None:
        """Scan tool-call parts for save_memory invocations and persist facts."""
        for msg in messages:
            for part in msg.parts:
                is_save = (
                    getattr(part, "part_kind", "") == "tool-call"
                    and getattr(part, "tool_name", "") == "save_memory"
                )
                if not is_save:
                    continue
                fact = self._extract_fact_from_tool_call(part)
                if fact:
                    self.memory.remember_fact(fact)
