"""Pure tool functions for the personal assistant.

These functions are registered as Pydantic-AI tools via @agent.tool_plain
in agent.py.  They have NO framework dependency so they stay easy to test.

Also exposed via MCP server in mcp_server.py.
"""

from __future__ import annotations

import html
import logging
import os
import re
import subprocess
import threading
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Dict, List, Optional, TypeVar
from urllib.parse import quote_plus, urlparse

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from assistant.config import settings

logger = logging.getLogger(__name__)

# ── Generic retry + fallback wrapper ─────────────────────────────────────────
T = TypeVar("T")


def _safe_tool_call(
    func: Callable[..., T],
    *args: Any,
    retries: int = 1,
    delay: float = 0.5,
    fallback: T | None = None,
    tool_name: str = "",
    **kwargs: Any,
) -> T:
    """Call *func* with automatic retry + friendly fallback on failure.

    - On first failure, waits *delay* seconds then retries up to *retries* times.
    - If all attempts fail, returns *fallback* (or a generic Vietnamese error
      string if fallback is None and T is str).
    - Every exception is logged so debugging is still easy.
    """
    for attempt in range(1 + retries):
        try:
            return func(*args, **kwargs)
        except Exception as exc:
            name = tool_name or func.__name__
            logger.warning(
                "[%s] attempt %d/%d failed: %s",
                name, attempt + 1, 1 + retries, exc,
            )
            if attempt < retries:
                time.sleep(delay)

    # All retries exhausted
    if fallback is not None:
        return fallback  # type: ignore[return-value]
    # Default fallback for str-returning tools
    name = tool_name or func.__name__
    return f"Xin lỗi, không thể thực hiện {name} lúc này. Vui lòng thử lại sau."  # type: ignore[return-value]


# ── TTL Cache ────────────────────────────────────────────────────────────────
_cache_store: Dict[str, tuple[Any, float]] = {}
_cache_lock = threading.Lock()


def _cached(key: str, func: Callable[..., T], ttl_seconds: int, *args: Any, **kwargs: Any) -> T:
    """Return cached result if fresh, otherwise call *func* and cache it.

    Thread-safe.  Cache entries expire after *ttl_seconds*.
    """
    now = time.time()
    with _cache_lock:
        if key in _cache_store:
            result, cached_at = _cache_store[key]
            if now - cached_at < ttl_seconds:
                logger.debug("[cache-hit] %s (age %.1fs)", key, now - cached_at)
                return result  # type: ignore[return-value]

    # Cache miss — call function
    result = func(*args, **kwargs)

    with _cache_lock:
        _cache_store[key] = (result, time.time())
    return result

_HCM = "Ho Chi Minh City"

# Shared session with retry logic and connection pooling for network resilience
_retry_strategy = Retry(
    total=2,
    backoff_factor=0.2,
    status_forcelist=[429, 500, 502, 503, 504],
    allowed_methods=["GET", "POST"],
)
_adapter = HTTPAdapter(max_retries=_retry_strategy, pool_connections=10, pool_maxsize=20)
_session = requests.Session()
_session.mount("https://", _adapter)
_session.mount("http://", _adapter)

_REQUEST_TIMEOUT = 12  # seconds — base timeout for non-Tavily API calls
_TAVILY_SEARCH_URL = "https://api.tavily.com/search"

WEATHER_CODE_MAP = {
    0: "trời quang",
    1: "ít mây",
    2: "có mây",
    3: "nhiều mây",
    45: "sương mù",
    48: "sương mù đóng băng",
    51: "mưa phùn nhẹ",
    53: "mưa phùn vừa",
    55: "mưa phùn dày",
    61: "mưa nhẹ",
    63: "mưa vừa",
    65: "mưa to",
    80: "mưa rào nhẹ",
    81: "mưa rào vừa",
    82: "mưa rào mạnh",
    95: "dông",
    96: "dông kèm mưa đá nhẹ",
    99: "dông kèm mưa đá mạnh",
}


def normalize_location(location: str) -> str:
    """Normalize Vietnamese location names to English for geocoding API."""
    # Clean trailing question phrases first
    cleaned = location.strip()
    lower = cleaned.lower()
    # Remove common Vietnamese question suffixes
    trailing = [
        "là bao nhiêu độ", "bao nhiêu độ", "là bao nhiêu",
        "như thế nào", "thế nào", "ra sao", "hôm nay",
        "ngày mai", "hiện tại", "bây giờ", "lúc này",
        "đang là bao nhiêu", "đang thế nào", "đang ra sao",
        "có mưa không", "có nắng không", "có gió không",
        "nhiệt độ", "thời tiết", "weather", "temperature",
    ]
    for phrase in trailing:
        if lower.endswith(phrase):
            cleaned = cleaned[: len(cleaned) - len(phrase)].strip()
            lower = cleaned.lower()
    cleaned = cleaned.strip(" ?!,.:")
    if not cleaned:
        cleaned = "TPHCM"

    normalized = cleaned.lower()
    alias_map = {
        "tphcm": _HCM,
        "tp hcm": _HCM,
        "tp.hcm": _HCM,
        "tp hồ chí minh": _HCM,
        "thành phố hồ chí minh": _HCM,
        "thành phố hồ chí minhh": _HCM,  # STT double-h error
        "sài gòn": _HCM,
        "sai gon": _HCM,
        "hcm": _HCM,
        "hcmc": _HCM,
        "hồ chí minhh": _HCM,  # STT double-h error
        "hà nội": "Hanoi",
        "ha noi": "Hanoi",
        "đà nẵng": "Da Nang",
        "da nang": "Da Nang",
        "huế": "Hue",
        "hue": "Hue",
        "cần thơ": "Can Tho",
        "can tho": "Can Tho",
        "hải phòng": "Hai Phong",
        "hai phong": "Hai Phong",
        "nha trang": "Nha Trang",
        "đà lạt": "Da Lat",
        "da lat": "Da Lat",
        "vũng tàu": "Vung Tau",
        "vung tau": "Vung Tau",
        "biên hòa": "Bien Hoa",
        "bien hoa": "Bien Hoa",
        "quy nhơn": "Quy Nhon",
        "quy nhon": "Quy Nhon",
        "buôn ma thuột": "Buon Ma Thuot",
        "bình dương": "Binh Duong",
        "long an": "Long An",
        "thái nguyên": "Thai Nguyen",
        "nam định": "Nam Dinh",
        "vinh": "Vinh",
        "thanh hóa": "Thanh Hoa",
        "nghệ an": "Nghe An",
        "phú quốc": "Phu Quoc",
    }
    return alias_map.get(normalized, cleaned.strip())


def geocode_location(location: str) -> Dict[str, Any]:
    response = _session.get(
        "https://geocoding-api.open-meteo.com/v1/search",
        params={
            "name": normalize_location(location),
            "count": 1,
            "language": "vi",
            "format": "json",
        },
        timeout=_REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    data = response.json()
    results = data.get("results", [])
    if not results:
        raise RuntimeError(f"Không tìm thấy địa điểm: {location}")
    return results[0]


def _get_weather_raw(location: str) -> str:
    """Internal: fetch weather data (no cache/retry wrapping)."""
    clean_location = normalize_location(location)

    place = geocode_location(clean_location)  # raises on miss

    response = _session.get(
        "https://api.open-meteo.com/v1/forecast",
        params={
            "latitude": place["latitude"],
            "longitude": place["longitude"],
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
            "timezone": "Asia/Bangkok",
            "forecast_days": 1,
        },
        timeout=_REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    data = response.json()
    current = data.get("current", {})
    daily = data.get("daily", {})
    daily_code = daily.get("weather_code", [current.get("weather_code")])[0]

    resolved = ", ".join(
        str(item)
        for item in [place.get("name"), place.get("admin1"), place.get("country")]
        if item
    )
    weather_text = WEATHER_CODE_MAP.get(current.get("weather_code"), "không rõ")
    daily_weather = WEATHER_CODE_MAP.get(daily_code, "không rõ")

    now_vn = datetime.now(_VN_TZ)
    time_str = now_vn.strftime("%H:%M %d/%m/%Y")

    return (
        f"Thời tiết tại {resolved} (cập nhật lúc {time_str}): "
        f"hiện tại trời {weather_text}, "
        f"nhiệt độ {current.get('temperature_2m')}°C, "
        f"cảm giác như {current.get('apparent_temperature')}°C, "
        f"độ ẩm {current.get('relative_humidity_2m')}%, "
        f"gió {current.get('wind_speed_10m')} km/h, "
        f"lượng mưa {current.get('precipitation')} mm. "
        f"Dự báo hôm nay: {daily_weather}, "
        f"thấp nhất {daily.get('temperature_2m_min', [None])[0]}°C, "
        f"cao nhất {daily.get('temperature_2m_max', [None])[0]}°C, "
        f"khả năng mưa {daily.get('precipitation_probability_max', [None])[0]}%."
    )


def get_weather(location: str) -> str:
    """Lấy thời tiết hiện tại và dự báo hôm nay theo địa điểm.

    Args:
        location: Tên thành phố hoặc địa điểm cần lấy thời tiết.

    Returns:
        Chuỗi mô tả thời tiết bằng tiếng Việt.
    """
    cache_key = f"weather:{normalize_location(location).lower()}"
    return _cached(
        cache_key,
        lambda: _safe_tool_call(
            _get_weather_raw, location,
            retries=1, delay=0.5,
            fallback=f"Không thể lấy dữ liệu thời tiết cho {location} lúc này. Vui lòng thử lại sau.",
            tool_name="get_weather",
        ),
        ttl_seconds=600,  # cache 10 phút
    )


def strip_html_tags(raw_html: str) -> str:
    cleaned = re.sub(r"<.*?>", " ", raw_html)
    cleaned = html.unescape(cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


_PRICE_KEYWORDS = [
    "giá xăng", "giá vàng", "giá dầu", "giá gas", "giá điện",
    "giá bao nhiêu", "bao nhiêu tiền", "giá cả",
]

_STOCK_KEYWORDS = [
    "cổ phiếu", "chứng khoán", "mã chứng khoán", "thị trường chứng khoán",
    "vn-index", "vnindex", "vn30", "hnx", "hose", "upcom",
    "giá cổ phiếu", "stock", "cổ phần",
]

_STOCK_DOMAINS = [
    "finance.yahoo.com", "cafef.vn", "vietstock.vn",
    "vneconomy.vn", "tinnhanhchungkhoan.vn", "fireant.vn",
    "stockbiz.vn", "24hmoney.vn",
]


def _is_price_query(query: str) -> bool:
    """Check if query is about prices."""
    lower = query.lower()
    return any(kw in lower for kw in _PRICE_KEYWORDS)


def _is_stock_query(query: str) -> bool:
    """Check if query is about stocks/securities."""
    lower = query.lower()
    return any(kw in lower for kw in _STOCK_KEYWORDS)


def _build_tavily_request(query: str, is_price: bool, is_stock: bool = False) -> dict:
    """Build Tavily API request payload.

    PERFORMANCE NOTE:
      include_answer=True  → Tavily runs its own AI to generate an answer.
                             Adds 10-15 s to each request.  Only worth it for
                             price/stock queries where the AI answer is helpful.
      include_answer=False → Tavily returns raw search results only (~2-3 s).
                             Our own LLM handles summarization for general queries.
    """
    payload = {
        "api_key": settings.tavily_api_key,
        "query": query,
        "search_depth": "advanced" if (is_price or is_stock) else "basic",
        # Only ask Tavily to generate its own AI answer for price/stock queries.
        # For general queries (political figures, news, people) the overhead is
        # not worth it — our LLM in _handle_direct_realtime already formats well.
        "include_answer": is_price or is_stock,
        "max_results": 8 if (is_price or is_stock) else 5,
        "include_raw_content": is_price or is_stock,
    }
    return payload


def _format_search_results(data: dict, query: str, is_price: bool, is_stock: bool = False) -> str:
    """Format Tavily search results into a readable string."""
    answer = data.get("answer", "")
    results = data.get("results", [])

    parts: List[str] = []
    if answer:
        parts.append(f"Trả lời: {answer}")

    content_limit = 400 if (is_price or is_stock) else 200
    result_limit = 6 if is_stock else (5 if is_price else 3)

    for item in results[:result_limit]:
        title = item.get("title", "")
        content = _get_best_content(item, is_price or is_stock)
        url = item.get("url", "")
        if title and content:
            snippet = content[:content_limit].rsplit(" ", 1)[0] if len(content) > content_limit else content
            if is_stock and url:
                source = _extract_domain(url)
                source_tag = f" (Nguồn: {source})" if source else ""
                parts.append(f"- {title}{source_tag}: {snippet}")
            else:
                parts.append(f"- {title}: {snippet}")

    if not parts:
        return f"Không tìm thấy kết quả cho: {query}"

    suffix = "\nHãy tóm tắt ngắn gọn trọng tâm bằng tiếng Việt, mỗi câu dưới 14 từ."
    if is_stock:
        suffix += (
            "\nNêu rõ GIÁ CỔ PHIẾU hiện tại, biến động tăng/giảm (% và điểm). "
            "LIỆT KÊ các tin tức liên quan đến cổ phiếu này, mỗi tin gồm TÊN BÀI BÁO và TÓM TẮT 1-2 câu chính xác. "
            "Ghi rõ NGUỒN TIN (tên trang báo). "
            "TUYỆT ĐỐI KHÔNG bịa đặt thông tin không có trong dữ liệu tìm kiếm."
        )
    elif is_price:
        suffix += (
            "\nLIỆT KÊ ĐẦY ĐỦ tất cả sản phẩm kèm giá. "
            "Nếu quá nhiều thì liệt kê TOP 5 sản phẩm quan trọng nhất với TÊN ĐẦY ĐỦ và GIÁ CỤ THỂ. "
            "VD: Xăng RON 95-III là X đồng trên lít, Xăng E5 RON 92-II là Y đồng trên lít."
        )

    return f"Kết quả tìm kiếm cho '{query}':\n" + "\n".join(parts) + suffix


def _get_best_content(item: dict, is_price: bool) -> str:
    """Extract best content from a search result item."""
    content = item.get("content", "")
    if is_price:
        raw = item.get("raw_content", "")
        if raw and len(raw) > len(content):
            return raw[:800]
    return content


def _web_search_tavily(query: str) -> str:
    """Internal: call Tavily API (no retry wrapping)."""
    is_price = _is_price_query(query)
    is_stock = _is_stock_query(query)

    # Timeout tuning:
    #   price/stock → include_answer=True  → Tavily AI generates answer (~10-15 s) → 20s
    #   general     → include_answer=False → raw results only (~2-3 s) → 12s
    tavily_timeout = 20 if (is_price or is_stock) else 12

    response = _session.post(
        _TAVILY_SEARCH_URL,
        json=_build_tavily_request(query, is_price, is_stock),
        timeout=tavily_timeout,
    )
    response.raise_for_status()
    data = response.json()
    return _format_search_results(data, query, is_price, is_stock)


def web_search(query: str) -> str:
    """Tìm kiếm thông tin mới nhất trên web bằng Tavily API.

    Sử dụng cho: tin tức, giá cả thị trường, thông tin thời sự,
    sự kiện mới nhất, giá vàng, giá xăng, tỷ giá, crypto,
    chứng khoán, cổ phiếu, ...

    Args:
        query: Truy vấn cần tìm kiếm trên web.

    Returns:
        Kết quả tìm kiếm dạng text ngắn gọn.
    """
    if not settings.tavily_api_key:
        return _web_search_fallback(query)

    # Cache web_search for 5 minutes (same query → same result)
    cache_key = f"web_search:{query.strip().lower()}"

    # NO retry (retries=0): with include_answer=False, Tavily responds in ~3s.
    # Retrying on timeout would double latency and the DDG fallback returns
    # STALE data that causes the LLM to give outdated answers (e.g. wrong
    # president, wrong prime minister).  Better to return "not found" and let
    # the LLM use its training data or ask the user to retry.
    return _cached(
        cache_key,
        lambda: _safe_tool_call(
            _web_search_tavily, query,
            retries=0,
            fallback=f"Không tìm được thông tin mới nhất về '{query}'. Hãy thử hỏi lại hoặc cung cấp thêm từ khóa.",
            tool_name="web_search",
        ),
        ttl_seconds=300,  # cache 5 phút
    )


def _web_search_fallback(query: str) -> str:
    """Fallback to DuckDuckGo if Tavily is unavailable."""
    try:
        search_url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
        response = _session.get(
            search_url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
            },
            timeout=_REQUEST_TIMEOUT,
        )
        response.raise_for_status()
    except requests.RequestException:
        return f"Không thể tìm kiếm '{query}' lúc này. Vui lòng thử lại sau."

    page = response.text
    pattern = re.compile(
        r'<a[^>]*class="result__a"[^>]*href="(?P<href>[^"]+)"[^>]*>(?P<title>[^<]*(?:<[^/][^>]*>[^<]*)*)</a>.*?'
        r'(?:<a[^>]*class="result__snippet"[^>]*>(?P<snippet_a>[^<]*(?:<[^/][^>]*>[^<]*)*)</a>'
        r'|<div[^>]*class="result__snippet"[^>]*>(?P<snippet_div>[^<]*(?:<[^/][^>]*>[^<]*)*)</div>)?',
        re.IGNORECASE | re.DOTALL,
    )

    results: List[str] = []
    for match in pattern.finditer(page):
        title = strip_html_tags(match.group("title") or "")
        snippet = strip_html_tags(match.group("snippet_a") or match.group("snippet_div") or "")
        if title and snippet:
            results.append(f"- {title}: {snippet}")
        elif title:
            results.append(f"- {title}")
        if len(results) >= 3:
            break

    if not results:
        return f"Không tìm thấy kết quả cho: {query}"

    return (
        f"Kết quả tìm kiếm cho '{query}':\n"
        + "\n".join(results)
        + "\nHãy tóm tắt ngắn gọn trọng tâm bằng tiếng Việt."
    )


def save_memory(fact: str) -> str:
    """Lưu một sự thật hoặc sở thích quan trọng của người dùng vào bộ nhớ dài hạn.

    Args:
        fact: Thông tin ngắn gọn cần ghi nhớ về người dùng.

    Returns:
        Xác nhận đã ghi nhớ.
    """
    return f"Đã ghi nhớ: {fact.strip()}"


_VN_TZ = timezone(timedelta(hours=7))
_VN_WEEKDAYS = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"]


def get_current_datetime() -> str:
    """Lấy ngày giờ hiện tại theo múi giờ Việt Nam (UTC+7).

    Returns:
        Chuỗi mô tả ngày giờ hiện tại bằng tiếng Việt.
    """
    now = datetime.now(_VN_TZ)
    return (
        f"Bây giờ là {now.strftime('%H:%M')}, "
        f"{_VN_WEEKDAYS[now.weekday()]}, "
        f"ngày {now.strftime('%d/%m/%Y')} (giờ Việt Nam)."
    )


def calculate(expression: str) -> str:
    """Tính toán biểu thức toán học đơn giản.

    Args:
        expression: Biểu thức toán học cần tính (ví dụ: '1+1', '15*3', '100/4').

    Returns:
        Kết quả phép tính.
    """
    allowed_chars = set("0123456789+-*/().% ")
    sanitized = expression.strip()
    if not sanitized or not all(c in allowed_chars for c in sanitized):
        return f"Biểu thức không hợp lệ: {expression}"
    try:
        result = eval(sanitized)  # noqa: S307 — input is sanitized
        if isinstance(result, float) and result == int(result):
            result = int(result)
        return f"{sanitized} = {result}"
    except Exception:
        return f"Không thể tính: {expression}"


# ── Translation Tool ─────────────────────────────────────────────────────────

_LANG_NAMES = {
    "vi": "Tiếng Việt", "en": "English", "ja": "日本語", "ko": "한국어",
    "zh": "中文", "fr": "Français", "de": "Deutsch", "es": "Español",
    "th": "ไทย", "ru": "Русский", "pt": "Português", "it": "Italiano",
}


def _translate_text_raw(text: str, target: str) -> str:
    """Internal: translate text (no retry wrapping)."""
    response = _session.get(
        "https://api.mymemory.translated.net/get",
        params={"q": text[:500], "langpair": f"autodetect|{target}"},
        timeout=_REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    data = response.json()
    translated = data.get("responseData", {}).get("translatedText", "")
    if not translated or "MYMEMORY" in translated.upper():
        return f"Không thể dịch: '{text[:100]}' sang {_LANG_NAMES.get(target, target)}."
    lang_name = _LANG_NAMES.get(target, target)
    return f"Bản dịch ({lang_name}): {translated}"


def translate_text(text: str, target_lang: str = "en") -> str:
    """Dịch văn bản sang ngôn ngữ khác sử dụng MyMemory API.

    Args:
        text: Văn bản cần dịch.
        target_lang: Mã ngôn ngữ đích (en, vi, ja, ko, zh, fr, de, ...).

    Returns:
        Kết quả dịch kèm ngôn ngữ đích.
    """
    target = target_lang.strip().lower()
    return _safe_tool_call(
        _translate_text_raw, text, target,
        retries=1, delay=0.5,
        fallback="Không thể dịch lúc này. Vui lòng thử lại sau.",
        tool_name="translate_text",
    )


# ── Knowledge Search Tool ────────────────────────────────────────────────────


def _trim_extract(extract: str, max_len: int = 800) -> str:
    """Trim a Wikipedia extract to a reasonable length at a sentence boundary."""
    if len(extract) <= max_len:
        return extract
    cut = extract[:max_len]
    last_dot = cut.rfind(".")
    if last_dot > max_len // 4:
        return cut[: last_dot + 1]
    return cut.rsplit(" ", 1)[0] + "."


def _fetch_wiki_summary(query: str, lang: str) -> str | None:
    """Fetch a Wikipedia summary for the given query and language. Returns None on miss."""
    resp = _session.get(
        f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{quote_plus(query)}",
        headers={"User-Agent": "ROBOTS-Assistant/1.0"},
        timeout=_REQUEST_TIMEOUT,
    )
    if resp.status_code != 200:
        return None
    data = resp.json()
    extract = data.get("extract", "")
    if not extract:
        return None
    title = data.get("title", query)
    label = "Wikipedia tiếng Việt" if lang == "vi" else "Wikipedia"
    return f"Theo {label} — {title}: {_trim_extract(extract)}"


def knowledge_search(query: str, topic: str = "general") -> str:
    """Tìm kiếm kiến thức chuyên sâu từ Wikipedia tiếng Việt.

    Args:
        query: Câu hỏi hoặc chủ đề cần tìm kiếm.
        topic: Lĩnh vực (general, science, tech, history, geography).

    Returns:
        Tóm tắt kiến thức từ Wikipedia.
    """
    def _fetch() -> str:
        for wiki_lang in ["vi", "en"]:
            result = _fetch_wiki_summary(query, wiki_lang)
            if result:
                return result
        return web_search(f"{query} {topic}")

    return _safe_tool_call(
        _fetch,
        retries=1, delay=0.5,
        fallback=web_search(query),
        tool_name="knowledge_search",
    )


# ── Exchange Rate Tool ────────────────────────────────────────────────────────


def _format_rate(rate: float) -> str:
    """Format an exchange rate number for display."""
    if rate >= 1000:
        return f"{rate:,.0f}"
    if rate >= 1:
        return f"{rate:,.2f}"
    return f"{rate:,.6f}"


def _fetch_vcb_rates() -> Optional[Dict[str, Dict[str, str]]]:
    """Fetch Vietcombank exchange rates (XML endpoint).

    Returns dict mapping currency code → {"buy": ..., "sell": ..., "transfer": ...}
    or None on failure.  VCB is the reference bank for VN exchange rates.
    """
    try:
        resp = _session.get(
            "https://portal.vietcombank.com.vn/Usercontrols/TVPortal.TyGia/pXML.aspx?b=68",
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=_REQUEST_TIMEOUT,
        )
        if resp.status_code != 200 or not resp.text:
            return None

        rates: Dict[str, Dict[str, str]] = {}
        for m in re.finditer(
            r'CurrencyCode="([^"]+)"[^>]*'
            r'Buy="([^"]*)"[^>]*'
            r'Transfer="([^"]*)"[^>]*'
            r'Sell="([^"]*)"',
            resp.text,
        ):
            code, buy, transfer, sell = m.group(1), m.group(2), m.group(3), m.group(4)
            rates[code.strip().upper()] = {
                "buy": buy.strip().replace(",", "") if buy.strip() else "",
                "transfer": transfer.strip().replace(",", "") if transfer.strip() else "",
                "sell": sell.strip().replace(",", "") if sell.strip() else "",
            }
        return rates if rates else None
    except Exception:
        return None


def _get_exchange_rate_raw(base: str, target: str) -> str:
    """Internal: fetch exchange rate (no cache/retry wrapping).

    Strategy:
    1. Primary: ExchangeRate-API (realtime, hourly updates, user's API key)
    2. Enrichment: If VND involved, also fetch VCB bank rates (mua/bán/CK)
    3. Fallback: open.er-api if ExchangeRate-API fails
    """
    now_vn = datetime.now(_VN_TZ)
    time_str = now_vn.strftime("%H:%M %d/%m/%Y")

    # ── Primary: ExchangeRate-API (realtime) ────────────────────────────
    api_key = settings.exchangerate_api_key
    rate: Optional[float] = None
    if api_key:
        try:
            resp = _session.get(
                f"https://v6.exchangerate-api.com/v6/{api_key}/latest/{base}",
                timeout=_REQUEST_TIMEOUT,
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("result") == "success":
                    rate = data.get("conversion_rates", {}).get(target)
        except Exception:
            pass

    # ── Fallback: open.er-api ───────────────────────────────────────────
    if rate is None:
        try:
            resp = _session.get(
                f"https://open.er-api.com/v6/latest/{base}",
                timeout=_REQUEST_TIMEOUT,
            )
            resp.raise_for_status()
            data = resp.json()
            if data.get("result") == "success":
                rate = data.get("rates", {}).get(target)
        except Exception:
            pass

    if rate is None:
        return f"Không tìm thấy tỷ giá cho {base}/{target}. Các mã phổ biến: USD, VND, EUR, JPY, GBP, CNY."

    # ── Enrich with VCB bank rates for VND queries ──────────────────────
    if target == "VND" or base == "VND":
        vcb = _fetch_vcb_rates()
        if vcb:
            lookup = base if target == "VND" else target
            info = vcb.get(lookup)
            if info:
                parts = [
                    f"Tỷ giá {base}/{target} ({time_str}): 1 {base} = {_format_rate(rate)} {target}",
                ]
                buy = info.get("buy", "")
                sell = info.get("sell", "")
                transfer = info.get("transfer", "")
                if target == "VND":
                    if sell:
                        parts.append(f"Ngân hàng Vietcombank bán ra: {float(sell):,.0f} VND")
                    if buy:
                        parts.append(f"Mua vào: {float(buy):,.0f} VND")
                    if transfer:
                        parts.append(f"Chuyển khoản: {float(transfer):,.0f} VND")
                else:
                    if sell:
                        parts.append(f"Vietcombank: 1 {lookup} = {float(sell):,.0f} VND (bán ra)")
                return ". ".join(parts) + "."

    # ── Standard format (non-VND or VCB unavailable) ────────────────────
    return (
        f"Tỷ giá {base}/{target}: 1 {base} = {_format_rate(rate)} {target}. "
        f"Cập nhật lúc {time_str}."
    )


def get_exchange_rate(base_currency: str = "USD", target_currency: str = "VND") -> str:
    """Lấy tỷ giá ngoại tệ mới nhất.

    Args:
        base_currency: Mã tiền tệ gốc (ví dụ: USD, EUR, JPY, GBP).
        target_currency: Mã tiền tệ đích (ví dụ: VND, USD, EUR).

    Returns:
        Tỷ giá chuyển đổi giữa hai loại tiền.
    """
    base = base_currency.strip().upper()
    target = target_currency.strip().upper()

    cache_key = f"exchange:{base}_{target}"
    return _cached(
        cache_key,
        lambda: _safe_tool_call(
            _get_exchange_rate_raw, base, target,
            retries=1, delay=0.5,
            fallback=web_search(f"tỷ giá {base} {target} hôm nay"),
            tool_name="get_exchange_rate",
        ),
        ttl_seconds=300,  # cache 5 phút (ExchangeRate-API cập nhật mỗi giờ)
    )


# ── News Tool ─────────────────────────────────────────────────────────────────


def _get_news_raw(topic: str, max_results: int) -> str:
    """Internal: fetch news (no cache/retry wrapping)."""
    now = datetime.now(_VN_TZ)
    date_str = now.strftime("%d/%m/%Y")

    api_key = settings.tavily_api_key
    if not api_key:
        return _web_search_fallback(f"tin tức {topic} mới nhất {date_str}")

    response = _session.post(
        _TAVILY_SEARCH_URL,
        json={
            "api_key": api_key,
            "query": f"tin tức {topic} mới nhất hôm nay {date_str}",
            "search_depth": "basic",
            # include_answer=False: _handle_direct_news already runs LLM formatting.
            # Disabling Tavily's AI answer reduces latency from ~10-15s to ~3s.
            "include_answer": False,
            "max_results": max_results,
            "include_raw_content": False,
        },
        timeout=_REQUEST_TIMEOUT,
    )
    response.raise_for_status()
    data = response.json()
    return _format_news_results(data, topic, date_str, max_results)


def get_news(topic: str = "Việt Nam", max_results: int = 5) -> str:
    """Lấy tin tức mới nhất về một chủ đề cụ thể từ Google News và các trang báo uy tín.

    Args:
        topic: Chủ đề cần lấy tin tức (ví dụ: 'Việt Nam', 'công nghệ', 'thể thao').
        max_results: Số lượng tin tức tối đa trả về (mặc định 5).

    Returns:
        Danh sách tin tức mới nhất gồm tên bài báo, tóm tắt nội dung.
    """
    cache_key = f"news:{topic.strip().lower()}:{max_results}"
    return _cached(
        cache_key,
        lambda: _safe_tool_call(
            _get_news_raw, topic, max_results,
            retries=1, delay=0.5,
            fallback=f"Không thể lấy tin tức về {topic} lúc này. Vui lòng thử lại sau.",
            tool_name="get_news",
        ),
        ttl_seconds=300,  # cache 5 phút
    )


def _format_news_results(data: dict, topic: str, date_str: str, max_results: int) -> str:
    """Format news search results."""
    answer = data.get("answer", "")
    results = data.get("results", [])

    parts: List[str] = []
    if answer:
        parts.append(f"Tổng hợp: {answer}")

    for item in results[:max_results]:
        title = item.get("title", "")
        content = item.get("content", "")
        if not (title and content):
            continue
        snippet = content[:250].rsplit(" ", 1)[0] if len(content) > 250 else content
        source = _extract_domain(item.get("url", ""))
        source_text = f" (Nguồn: {source})" if source else ""
        parts.append(f"{title}{source_text}: {snippet}")

    if not parts:
        return f"Không tìm thấy tin tức về: {topic}"

    return (
        f"Tin tức mới nhất về '{topic}' (ngày {date_str}):\n"
        + "\n".join(parts)
        + "\n\nHãy tóm tắt theo format: Tên bài báo, nội dung tóm tắt. "
        "Nếu có giá cả (xăng, vàng, crypto...) thì nêu cụ thể tên và giá."
    )


def _extract_domain(url: str) -> str:
    """Extract domain name from URL for source attribution."""
    if not url:
        return ""
    try:
        return urlparse(url).netloc.replace("www.", "")
    except Exception:
        return ""


# ── Stock Price API Tool ──────────────────────────────────────────────────────


# Common VN company name → ticker mapping
_VN_COMPANY_TICKERS = {
    "vingroup": "VIC", "vinhomes": "VHM", "vinamilk": "VNM",
    "hòa phát": "HPG", "hoa phat": "HPG",
    "fpt": "FPT", "vietcombank": "VCB", "mb bank": "MBB",
    "techcombank": "TCB", "masan": "MSN", "thế giới di động": "MWG",
    "viettel": "VGI", "sabeco": "SAB", "petrolimex": "PLX",
}

# International company → ticker
_INTL_COMPANY_TICKERS = {
    "nvidia": "NVDA", "apple": "AAPL", "microsoft": "MSFT",
    "google": "GOOGL", "alphabet": "GOOGL",
    "amazon": "AMZN", "tesla": "TSLA",
    "meta": "META", "facebook": "META", "netflix": "NFLX",
}

# Words that are NOT stock tickers (to avoid false positives)
_NON_TICKERS = {"VN", "TP", "HCM", "USD", "VND", "EUR", "JPY", "BTC", "ETH",
                "THE", "FOR", "AND", "NOT", "TOP"}


def extract_stock_ticker(text: str) -> Optional[str]:
    """Extract stock ticker symbol from user text."""
    lower = text.lower()

    # Check VN company names
    for name, ticker in _VN_COMPANY_TICKERS.items():
        if name in lower:
            return ticker

    # Check international company names
    for name, ticker in _INTL_COMPANY_TICKERS.items():
        if name in lower:
            return ticker

    # Look for uppercase ticker pattern (2-5 uppercase letters)
    matches = re.findall(r'\b([A-Z]{2,5})\b', text)
    tickers = [m for m in matches if m not in _NON_TICKERS]
    if tickers:
        return tickers[0]

    return None


def _is_vn_ticker(ticker: str) -> bool:
    """Detect if ticker is likely a Vietnamese stock (3 uppercase letters)."""
    clean = ticker.strip().upper()
    # VN tickers are typically 3 uppercase letters
    # International tickers can be 1-5 letters but common ones are 2-5
    return len(clean) == 3 and clean.isalpha()


def _fetch_vn_stock_price(ticker: str) -> Optional[str]:
    """Fetch real-time VN stock price from SSI iBoard API.

    SSI provides LIVE market data during trading hours:
    matchedPrice, priceChange, bid/offer, volume, etc.
    Outside trading hours, shows last session's closing data.
    """
    try:
        # Detect exchange: try HOSE first, then HNX, then UPCOM
        for exchange in ["hose", "hnx", "upcom"]:
            resp = _session.get(
                f"https://iboard-query.ssi.com.vn/stock/exchange/{exchange}",
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "application/json",
                },
                timeout=_REQUEST_TIMEOUT,
            )
            if resp.status_code != 200:
                continue
            data = resp.json()
            stocks = data.get("data", [])
            for s in stocks:
                if not isinstance(s, dict):
                    continue
                if s.get("stockSymbol", "").upper() != ticker.upper():
                    continue

                # Found the stock — extract data
                matched_price = s.get("matchedPrice", 0)           # giá khớp lệnh
                ref_price = s.get("refPrice", 0)                   # giá tham chiếu
                open_price = s.get("openPrice", 0)                 # giá mở cửa
                highest = s.get("highest", 0)                       # giá cao nhất
                lowest = s.get("lowest", 0)                         # giá thấp nhất
                ceiling = s.get("ceiling", 0)                       # giá trần
                floor = s.get("floor", 0)                           # giá sàn
                price_change = s.get("priceChange", 0)             # thay đổi giá (VND)
                pct_change = s.get("priceChangePercent", 0)        # % thay đổi
                volume = s.get("nmTotalTradedQty", 0) or s.get("stockVol", 0)
                trading_date = s.get("tradingDate", "")
                company_name = s.get("companyNameVi", "") or s.get("clientName", "")
                exchange_name = exchange.upper()

                # SSI prices are in VND (not thousands like CafeF)
                # But older SSI data may have prices in x1000 if < 1000
                # Detect: if price < 1000, it's likely in thousands
                if matched_price and matched_price < 1000:
                    matched_price *= 1000
                    ref_price = (ref_price or 0) * 1000
                    open_price = (open_price or 0) * 1000
                    highest = (highest or 0) * 1000
                    lowest = (lowest or 0) * 1000
                    ceiling = (ceiling or 0) * 1000
                    floor = (floor or 0) * 1000
                    price_change = (price_change or 0) * 1000

                # Format trading date
                date_str = ""
                if trading_date and len(str(trading_date)) == 8:
                    td = str(trading_date)
                    date_str = f"{td[6:8]}/{td[4:6]}/{td[:4]}"
                else:
                    date_str = str(trading_date)

                direction = "tăng" if price_change > 0 else ("giảm" if price_change < 0 else "không đổi")

                parts = [
                    f"Cổ phiếu {ticker.upper()} - {company_name} (sàn {exchange_name}",
                ]
                if date_str:
                    parts[0] += f", phiên {date_str})"
                else:
                    parts[0] += ")"

                if matched_price:
                    parts.append(f"Giá khớp lệnh: {matched_price:,.0f} đồng")
                if price_change != 0:
                    parts.append(f"Biến động: {direction} {abs(price_change):,.0f} đồng ({pct_change:+.2f}%)")
                if ref_price:
                    parts.append(f"Giá tham chiếu: {ref_price:,.0f} đồng")
                if open_price:
                    parts.append(f"Giá mở cửa: {open_price:,.0f} đồng")
                if highest and lowest:
                    parts.append(f"Cao nhất: {highest:,.0f}, Thấp nhất: {lowest:,.0f} đồng")
                if ceiling and floor:
                    parts.append(f"Trần: {ceiling:,.0f}, Sàn: {floor:,.0f} đồng")
                if volume:
                    parts.append(f"Khối lượng giao dịch: {volume:,.0f} cổ phiếu")

                return ". ".join(parts) + "."

        return None
    except Exception:
        return None


def _fetch_intl_stock_price(ticker: str) -> Optional[str]:
    """Fetch real-time international stock price from Yahoo Finance API.

    Tries query2 (more reliable) first, then query1 as fallback.
    """
    yahoo_hosts = [
        "https://query2.finance.yahoo.com",
        "https://query1.finance.yahoo.com",
    ]
    for host in yahoo_hosts:
        try:
            resp = _session.get(
                f"{host}/v8/finance/chart/{ticker.upper()}",
                params={"range": "1d", "interval": "5m"},
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "application/json",
                },
                timeout=_REQUEST_TIMEOUT,
            )
            if resp.status_code != 200:
                continue
            data = resp.json()
            result_list = data.get("chart", {}).get("result", [])
            if not result_list:
                continue

            meta = result_list[0].get("meta", {})
            price = meta.get("regularMarketPrice", 0)
            prev_close = meta.get("previousClose") or meta.get("chartPreviousClose", 0)
            currency = meta.get("currency", "USD")
            symbol = meta.get("symbol", ticker.upper())
            exchange_name = meta.get("exchangeName", "")

            if price and prev_close:
                change = price - prev_close
                pct = (change / prev_close) * 100
                direction = "tăng" if change > 0 else ("giảm" if change < 0 else "không đổi")
                parts = [
                    f"Cổ phiếu {symbol} ({exchange_name or 'Yahoo Finance'})",
                    f"Giá hiện tại: {price:.2f} {currency}",
                    f"Biến động: {direction} {abs(change):.2f} {currency} ({pct:+.2f}%)",
                    f"Phiên trước: {prev_close:.2f} {currency}",
                ]
                return ". ".join(parts) + "."
            elif price:
                return f"Cổ phiếu {symbol} ({exchange_name or 'Yahoo Finance'}). Giá hiện tại: {price:.2f} {currency}."
        except Exception:
            continue
    return None


def _fetch_stock_news(ticker: str, max_results: int = 3) -> Optional[str]:
    """Fetch recent news articles related to a stock ticker via Tavily.

    Returns a formatted string with article titles + short domain sources,
    or None if no results or API unavailable.
    """
    api_key = settings.tavily_api_key
    if not api_key:
        return None
    try:
        resp = _session.post(
            _TAVILY_SEARCH_URL,
            json={
                "api_key": api_key,
                "query": f"cổ phiếu {ticker} tin tức mới nhất",
                "search_depth": "basic",
                "include_answer": False,
                "max_results": max_results,
                "include_raw_content": False,
            },
            timeout=_REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        results = data.get("results", [])
        if not results:
            return None

        lines: List[str] = []
        for r in results:
            title = r.get("title", "").strip()
            url = r.get("url", "")
            if not title:
                continue
            domain = urlparse(url).netloc.replace("www.", "") if url else ""
            if domain:
                lines.append(f"  - {title} [{domain}]")
            else:
                lines.append(f"  - {title}")

        if not lines:
            return None
        return "Tin tức liên quan:\n" + "\n".join(lines)
    except Exception:
        return None


def get_stock_price(ticker: str) -> str:
    """Lấy giá cổ phiếu realtime từ SSI (VN) hoặc Yahoo Finance (quốc tế).

    Args:
        ticker: Mã cổ phiếu (VD: VIC, VNM, HPG, AAPL, NVDA, MSFT).

    Returns:
        Thông tin giá cổ phiếu mới nhất (chỉ giá, không kèm tin tức).
    """
    clean_ticker = ticker.strip().upper()

    def _fetch() -> str:
        # Try VN stock first (3-letter tickers)
        if _is_vn_ticker(clean_ticker):
            result = _fetch_vn_stock_price(clean_ticker)
            if result:
                return result

        # Try international stock
        result = _fetch_intl_stock_price(clean_ticker)
        if result:
            return result

        # Fallback to web search for price
        return web_search(f"giá cổ phiếu {clean_ticker} mới nhất hôm nay")

    cache_key = f"stock:{clean_ticker}"
    return _cached(
        cache_key,
        lambda: _safe_tool_call(
            _fetch,
            retries=1, delay=0.5,
            fallback=f"Không thể lấy giá cổ phiếu {clean_ticker} lúc này. Vui lòng thử lại sau.",
            tool_name="get_stock_price",
        ),
        ttl_seconds=60,  # cache 1 phút
    )


# ── Music Player Tool ─────────────────────────────────────────────────────────
# Opens music in the user's NORMAL browser (default profile, with login/extensions).
# Tab control:
#   - Play:   open URL in normal browser window
#   - Switch: close current tab (Ctrl+W via Windows API) + open new URL
#   - Stop:   close the tab (Ctrl+W via Windows API)
#   - Pause:  media key (OS-level, toggles pause/play)
#   - Resume: media key (same toggle)

_music_lock = threading.Lock()
_music_is_active: bool = False
_music_is_paused: bool = False
_music_song_name: Optional[str] = None


def _search_youtube_url(query: str) -> Optional[str]:
    """Search YouTube for a song and return the first video URL."""
    try:
        search_url = f"https://www.youtube.com/results?search_query={quote_plus(query)}"
        resp = _session.get(
            search_url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
            },
            timeout=_REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        match = re.search(r'"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"', resp.text)
        if match:
            return f"https://www.youtube.com/watch?v={match.group(1)}"
    except Exception:
        pass
    return None


def _resolve_music_url(query: str) -> tuple[str, bool]:
    """Resolve a music query to a URL. Returns (url, is_direct_match)."""
    if query.startswith(("http://", "https://", "www.")):
        return query, True
    found_url = _search_youtube_url(query)
    if found_url:
        return found_url, True
    return f"https://www.youtube.com/results?search_query={quote_plus(query)}", False


def _find_browser_exe() -> Optional[str]:
    """Find Edge or Chrome executable on Windows."""
    import platform
    if platform.system() != "Windows":
        return None
    candidates = []
    for env in ["ProgramFiles", "ProgramFiles(x86)", "LOCALAPPDATA"]:
        base = os.environ.get(env, "")
        if base:
            candidates.extend([
                os.path.join(base, "Microsoft", "Edge", "Application", "msedge.exe"),
                os.path.join(base, "Google", "Chrome", "Application", "chrome.exe"),
            ])
    for path in candidates:
        if os.path.isfile(path):
            return path
    return None


def _open_in_normal_browser(url: str) -> bool:
    """Open URL in the user's default/normal browser (NOT incognito, NOT separate profile).

    This uses the user's existing browser with their login, extensions, etc.
    """
    browser = _find_browser_exe()
    if browser:
        try:
            subprocess.Popen(
                [browser, "--new-window", url],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            return True
        except Exception:
            pass
    # Fallback: OS default browser
    try:
        os.startfile(url)  # type: ignore[attr-defined]
        return True
    except Exception:
        pass
    return False


def _close_youtube_tab() -> bool:
    """Find the YouTube browser window and close the active tab (Ctrl+W).

    Uses Windows API: EnumWindows to find window with 'YouTube' in title,
    SetForegroundWindow to bring it to front, then keybd_event for Ctrl+W.
    """
    import platform
    if platform.system() != "Windows":
        return False
    try:
        import ctypes
        import ctypes.wintypes

        user32 = ctypes.windll.user32
        WNDENUMPROC = ctypes.WINFUNCTYPE(
            ctypes.c_bool, ctypes.wintypes.HWND, ctypes.wintypes.LPARAM,
        )

        found_hwnd = [None]

        def _enum_callback(hwnd, _lParam):
            if user32.IsWindowVisible(hwnd):
                length = user32.GetWindowTextLengthW(hwnd)
                if length > 0:
                    buf = ctypes.create_unicode_buffer(length + 1)
                    user32.GetWindowTextW(hwnd, buf, length + 1)
                    title = buf.value.lower()
                    if "youtube" in title:
                        found_hwnd[0] = hwnd
                        return False  # stop enumeration
            return True

        user32.EnumWindows(WNDENUMPROC(_enum_callback), 0)

        if found_hwnd[0] is None:
            return False

        hwnd = found_hwnd[0]
        # Bring window to foreground
        user32.SetForegroundWindow(hwnd)
        time.sleep(0.3)

        # Send Ctrl+W to close the active tab
        VK_CONTROL = 0x11
        VK_W = 0x57
        user32.keybd_event(VK_CONTROL, 0, 0, 0)  # Ctrl down
        user32.keybd_event(VK_W, 0, 0, 0)         # W down
        time.sleep(0.05)
        user32.keybd_event(VK_W, 0, 2, 0)         # W up
        user32.keybd_event(VK_CONTROL, 0, 2, 0)   # Ctrl up
        return True
    except Exception:
        return False


def play_music(url_or_query: str) -> str:
    """Phát nhạc từ URL hoặc tìm kiếm trên YouTube theo tên bài hát.

    Sử dụng khi người dùng yêu cầu mở nhạc, phát nhạc, nghe nhạc,
    hoặc chuyển sang bài mới.

    Args:
        url_or_query: Đường link bài hát HOẶC tên bài hát/ca sĩ cần tìm.

    Returns:
        Xác nhận đang phát nhạc hoặc thông báo lỗi.
    """
    global _music_is_active, _music_song_name, _music_is_paused

    query = url_or_query.strip()
    if not query:
        return "Vui lòng cho mình biết tên bài hát hoặc gửi link nhạc nhé."

    url, is_direct = _resolve_music_url(query)

    # Track song name for display
    if not query.startswith(("http://", "https://")):
        _music_song_name = query
    else:
        _music_song_name = "nhạc"

    with _music_lock:
        if _music_is_active:
            # Switch song: close old tab, open new URL
            _close_youtube_tab()
            time.sleep(0.5)

        # Open in user's normal browser
        if _open_in_normal_browser(url):
            _music_is_active = True
            _music_is_paused = False
            if is_direct:
                return (
                    f"Đang mở bài {_music_song_name} cho bạn. "
                    "Nói dừng nhạc để tạm dừng, tiếp tục phát để nghe tiếp, "
                    "tắt nhạc để đóng, hoặc chuyển bài nhé."
                )
            return "Mình đã tìm trên YouTube cho bạn. Hãy chọn bài hát bạn muốn nghe nhé."

    return "Không thể mở nhạc lúc này. Vui lòng thử lại sau."


def _send_media_key_pause() -> bool:
    """Send media play/pause key on Windows. This is a TOGGLE: pause↔play."""
    import platform
    if platform.system() != "Windows":
        return False
    try:
        import ctypes
        VK_MEDIA_PLAY_PAUSE = 0xB3
        ctypes.windll.user32.keybd_event(VK_MEDIA_PLAY_PAUSE, 0, 0, 0)
        ctypes.windll.user32.keybd_event(VK_MEDIA_PLAY_PAUSE, 0, 2, 0)
        return True
    except Exception:
        return False


def stop_music() -> str:
    """Tắt nhạc — đóng hoàn toàn tab nhạc đang phát.

    Sử dụng khi người dùng yêu cầu TẮT nhạc, đóng nhạc, không nghe nữa.

    Returns:
        Xác nhận đã tắt nhạc.
    """
    global _music_is_active, _music_is_paused, _music_song_name

    song = _music_song_name or "nhạc"

    with _music_lock:
        if not _music_is_active:
            return "Hiện không có nhạc đang phát."

        closed = _close_youtube_tab()
        _music_is_active = False
        _music_is_paused = False
        _music_song_name = None

        if closed:
            return f"Đã tắt và đóng bài {song}."
        return f"Đã tắt bài {song}. Nếu tab vẫn mở, hãy đóng thủ công nhé."


def pause_music() -> str:
    """Tạm dừng nhạc đang phát (tab nhạc vẫn mở).

    Sử dụng khi người dùng yêu cầu DỪNG nhạc, tạm ngưng, pause.

    Returns:
        Xác nhận đã tạm dừng nhạc.
    """
    global _music_is_paused

    if not _music_is_active:
        return "Hiện không có nhạc đang phát để tạm dừng."
    if _music_is_paused:
        song = _music_song_name or "nhạc"
        return f"Bài {song} đang tạm dừng rồi. Nói tiếp tục phát để nghe tiếp nhé."
    if _send_media_key_pause():
        _music_is_paused = True
        song = _music_song_name or "nhạc"
        return f"Đã tạm dừng bài {song}. Nói tiếp tục phát nhạc để nghe tiếp nhé."
    return "Không thể tạm dừng. Hãy bấm nút pause trên trình duyệt nhé."


def resume_music() -> str:
    """Tiếp tục phát nhạc đang tạm dừng (không mở bài mới).

    Sử dụng khi người dùng yêu cầu TIẾP TỤC PHÁT, nghe tiếp, phát lại.

    Returns:
        Xác nhận đã tiếp tục phát nhạc.
    """
    global _music_is_paused

    if not _music_is_active:
        return "Hiện không có nhạc nào để tiếp tục phát. Nói mở nhạc kèm tên bài hát nhé."
    if not _music_is_paused:
        song = _music_song_name or "nhạc"
        return f"Bài {song} đang phát rồi mà."
    if _send_media_key_pause():  # same key toggles pause↔play
        _music_is_paused = False
        song = _music_song_name or "nhạc"
        return (
            f"Đã tiếp tục phát bài {song}. "
            "Nói dừng nhạc để tạm dừng, tắt nhạc để đóng, hoặc chuyển bài nhé."
        )
    return "Không thể tiếp tục phát. Hãy bấm nút play trên trình duyệt nhé."


def is_music_active() -> bool:
    """Check whether music is currently playing/paused (tab alive)."""
    return _music_is_active


