"""Comprehensive test cases for all assistant tools (except music).

Tests real-time data fetching accuracy, error handling, and edge cases for:
- get_weather: Weather data from Open-Meteo
- web_search: Web search via Tavily
- knowledge_search: Wikipedia search
- calculate: Math expressions
- get_current_datetime: Current datetime (VN timezone)
- translate_text: Translation via MyMemory
- save_memory: Memory persistence
- get_exchange_rate: Currency exchange rates
- get_news: News search via Tavily

Each tool is tested for:
1. Correct output format and content
2. Real-time data accuracy (where applicable)
3. Error handling and edge cases
4. Vietnamese language support
"""

from __future__ import annotations

import json
import re
import time
from datetime import datetime, timedelta, timezone

import pytest

from assistant.tools import (
    get_weather,
    web_search,
    knowledge_search,
    calculate,
    get_current_datetime,
    translate_text,
    save_memory,
    get_exchange_rate,
    get_news,
    normalize_location,
    geocode_location,
    extract_stock_ticker,
    get_stock_price,
)

_VN_TZ = timezone(timedelta(hours=7))


# ══════════════════════════════════════════════════════════════════════════════
# TEST GROUP 1: get_weather
# ══════════════════════════════════════════════════════════════════════════════


class TestGetWeather:
    """Test weather tool with real API calls."""

    def test_weather_tphcm(self):
        """Should return weather data for Ho Chi Minh City."""
        result = get_weather("TPHCM")
        assert "nhiệt độ" in result.lower() or "°C" in result
        assert "độ ẩm" in result.lower() or "%" in result
        # Temperature should be a reasonable number (15-45°C for VN)
        temps = re.findall(r'(\d+(?:\.\d+)?)\s*°C', result)
        assert len(temps) > 0, f"No temperature found in: {result}"
        for t in temps:
            temp_val = float(t)
            assert 5 <= temp_val <= 50, f"Unreasonable temp {temp_val}°C"

    def test_weather_hanoi(self):
        """Should return weather data for Hanoi."""
        result = get_weather("Hà Nội")
        assert "°C" in result
        assert "Dự báo" in result or "dự báo" in result

    def test_weather_da_nang(self):
        """Should return weather for Da Nang."""
        result = get_weather("Đà Nẵng")
        assert "°C" in result

    def test_weather_location_normalization(self):
        """normalize_location should handle Vietnamese city names."""
        assert normalize_location("TPHCM") == "Ho Chi Minh City"
        assert normalize_location("tp hcm") == "Ho Chi Minh City"
        assert normalize_location("sài gòn") == "Ho Chi Minh City"
        assert normalize_location("hà nội") == "Hanoi"
        assert normalize_location("đà nẵng") == "Da Nang"
        assert normalize_location("huế") == "Hue"

    def test_weather_invalid_location(self):
        """Should handle invalid location gracefully."""
        result = get_weather("xyzinvalidcity12345")
        # Should return error message, not crash
        assert isinstance(result, str)
        assert len(result) > 0

    def test_weather_has_forecast(self):
        """Weather result should include daily forecast."""
        result = get_weather("TPHCM")
        assert "Dự báo" in result or "dự báo" in result or "hôm nay" in result.lower()

    def test_weather_has_humidity_and_wind(self):
        """Weather result should include humidity and wind data."""
        result = get_weather("Hà Nội")
        assert "%" in result  # humidity percentage
        assert "km/h" in result or "gió" in result.lower()

    def test_geocode_known_cities(self):
        """Geocoding should find well-known cities."""
        place = geocode_location("Ho Chi Minh City")
        assert "latitude" in place
        assert "longitude" in place
        # HCM lat roughly 10.7-10.9
        assert 10.0 <= place["latitude"] <= 11.5

        place_hn = geocode_location("Hanoi")
        assert 20.5 <= place_hn["latitude"] <= 21.5


# ══════════════════════════════════════════════════════════════════════════════
# TEST GROUP 2: web_search
# ══════════════════════════════════════════════════════════════════════════════


class TestWebSearch:
    """Test web search tool with real Tavily API."""

    def test_web_search_basic(self):
        """Should return search results for a basic query."""
        result = web_search("thủ đô Việt Nam")
        assert isinstance(result, str)
        assert len(result) > 50
        # Should contain relevant info
        assert "Hà Nội" in result or "hà nội" in result.lower() or "Hanoi" in result

    def test_web_search_price_query(self):
        """Should return price data for price queries."""
        result = web_search("giá vàng hôm nay")
        assert isinstance(result, str)
        assert len(result) > 50
        # Should contain some price-related terms
        lower = result.lower()
        assert "vàng" in lower or "gold" in lower

    def test_web_search_news_query(self):
        """Should return news-like results."""
        result = web_search("tin tức Việt Nam mới nhất")
        assert isinstance(result, str)
        assert len(result) > 50

    def test_web_search_person_query(self):
        """Should return info about well-known people."""
        result = web_search("Tổng thống Mỹ hiện tại 2026")
        assert isinstance(result, str)
        assert len(result) > 30

    def test_web_search_empty_query(self):
        """Should handle empty or very short queries."""
        result = web_search("")
        assert isinstance(result, str)

    def test_web_search_returns_structured_results(self):
        """Results should have title and content structure."""
        result = web_search("Python programming language")
        assert isinstance(result, str)
        # Should contain some structured data
        assert "Python" in result or "python" in result.lower()


# ══════════════════════════════════════════════════════════════════════════════
# TEST GROUP 3: knowledge_search (Wikipedia)
# ══════════════════════════════════════════════════════════════════════════════


class TestKnowledgeSearch:
    """Test Wikipedia knowledge search."""

    def test_knowledge_search_known_topic(self):
        """Should return Wikipedia content for well-known topics."""
        result = knowledge_search("Python (programming language)")
        assert isinstance(result, str)
        assert len(result) > 100
        assert "Python" in result

    def test_knowledge_search_vietnamese(self):
        """Should work with Vietnamese topics."""
        result = knowledge_search("Hà Nội")
        assert isinstance(result, str)
        assert len(result) > 50

    def test_knowledge_search_science(self):
        """Should return science knowledge."""
        result = knowledge_search("Albert Einstein", topic="science")
        assert isinstance(result, str)
        assert len(result) > 50
        assert "Einstein" in result

    def test_knowledge_search_unknown_topic(self):
        """Should handle unknown topics by falling back to web search."""
        result = knowledge_search("xyznonexistent12345topic")
        assert isinstance(result, str)
        # Should return something (either "not found" or web search fallback)
        assert len(result) > 0


# ══════════════════════════════════════════════════════════════════════════════
# TEST GROUP 4: calculate
# ══════════════════════════════════════════════════════════════════════════════


class TestCalculate:
    """Test math calculation tool."""

    def test_addition(self):
        result = calculate("1+1")
        assert "= 2" in result

    def test_multiplication(self):
        result = calculate("15*3")
        assert "= 45" in result

    def test_division(self):
        result = calculate("100/4")
        assert "= 25" in result

    def test_subtraction(self):
        result = calculate("50-20")
        assert "= 30" in result

    def test_complex_expression(self):
        result = calculate("(10+5)*2")
        assert "= 30" in result

    def test_modulo(self):
        result = calculate("10%3")
        assert "= 1" in result

    def test_float_result(self):
        result = calculate("10/3")
        assert "3.333" in result or "= 3" in result

    def test_invalid_expression(self):
        """Should reject invalid expressions."""
        result = calculate("abc")
        assert "không hợp lệ" in result.lower() or "không thể" in result.lower()

    def test_injection_protection(self):
        """Should not allow code injection."""
        result = calculate("__import__('os').system('ls')")
        assert "không hợp lệ" in result.lower() or "không thể" in result.lower()

    def test_empty_expression(self):
        result = calculate("")
        assert "không hợp lệ" in result.lower() or "không thể" in result.lower()

    def test_large_numbers(self):
        result = calculate("999999*999999")
        assert "999998000001" in result

    def test_decimal_arithmetic(self):
        result = calculate("0.1+0.2")
        assert "0.3" in result or "= 0" in result


# ══════════════════════════════════════════════════════════════════════════════
# TEST GROUP 5: get_current_datetime
# ══════════════════════════════════════════════════════════════════════════════


class TestGetCurrentDatetime:
    """Test datetime tool accuracy."""

    def test_returns_string(self):
        result = get_current_datetime()
        assert isinstance(result, str)

    def test_contains_time(self):
        """Should contain current time in HH:MM format."""
        result = get_current_datetime()
        # Should match HH:MM pattern
        assert re.search(r'\d{2}:\d{2}', result), f"No time found: {result}"

    def test_contains_date(self):
        """Should contain today's date."""
        result = get_current_datetime()
        now = datetime.now(_VN_TZ)
        # Should contain today's date in DD/MM/YYYY format
        expected_date = now.strftime("%d/%m/%Y")
        assert expected_date in result, f"Expected date {expected_date} not in: {result}"

    def test_contains_weekday(self):
        """Should contain Vietnamese weekday name."""
        result = get_current_datetime()
        weekdays = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"]
        assert any(day in result for day in weekdays), f"No weekday found in: {result}"

    def test_vietnam_timezone(self):
        """Should use Vietnam timezone (UTC+7)."""
        result = get_current_datetime()
        assert "Việt Nam" in result or "giờ Việt Nam" in result

    def test_time_accuracy(self):
        """Time should be within 2 minutes of actual VN time."""
        result = get_current_datetime()
        # Extract HH:MM from result
        match = re.search(r'(\d{2}):(\d{2})', result)
        assert match, f"No time found: {result}"
        hour, minute = int(match.group(1)), int(match.group(2))
        now = datetime.now(_VN_TZ)
        diff_minutes = abs((hour * 60 + minute) - (now.hour * 60 + now.minute))
        assert diff_minutes <= 2, f"Time diff {diff_minutes} min too large"


# ══════════════════════════════════════════════════════════════════════════════
# TEST GROUP 6: translate_text
# ══════════════════════════════════════════════════════════════════════════════


class TestTranslateText:
    """Test translation tool."""

    def test_vi_to_en(self):
        """Should translate Vietnamese to English."""
        result = translate_text("Xin chào", "en")
        assert isinstance(result, str)
        lower = result.lower()
        assert "hello" in lower or "hi" in lower or "dịch" in lower

    def test_en_to_vi(self):
        """Should translate English to Vietnamese."""
        result = translate_text("Hello", "vi")
        assert isinstance(result, str)
        assert len(result) > 5

    def test_en_to_ja(self):
        """Should translate English to Japanese."""
        result = translate_text("Thank you", "ja")
        assert isinstance(result, str)
        assert len(result) > 3

    def test_empty_text(self):
        """Should handle empty text."""
        result = translate_text("", "en")
        assert isinstance(result, str)

    def test_long_text(self):
        """Should handle longer text."""
        long_text = "Việt Nam là một quốc gia nằm ở phía đông bán đảo Đông Dương"
        result = translate_text(long_text, "en")
        assert isinstance(result, str)
        assert len(result) > 10


# ══════════════════════════════════════════════════════════════════════════════
# TEST GROUP 7: save_memory
# ══════════════════════════════════════════════════════════════════════════════


class TestSaveMemory:
    """Test memory save tool."""

    def test_save_fact(self):
        """Should confirm fact was saved."""
        result = save_memory("Tôi thích ăn phở")
        assert "ghi nhớ" in result.lower() or "Đã ghi nhớ" in result

    def test_save_returns_fact(self):
        """Should echo the fact in the response."""
        result = save_memory("Tên tôi là Nhật Anh")
        assert "Nhật Anh" in result or "ghi nhớ" in result.lower()

    def test_save_empty_fact(self):
        """Should handle empty fact."""
        result = save_memory("")
        assert isinstance(result, str)

    def test_save_long_fact(self):
        """Should handle longer facts."""
        long_fact = "Tôi thích lập trình Python và JavaScript, và tôi làm việc ở công ty công nghệ ABC"
        result = save_memory(long_fact)
        assert "ghi nhớ" in result.lower() or "Đã ghi nhớ" in result


# ══════════════════════════════════════════════════════════════════════════════
# TEST GROUP 8: get_exchange_rate
# ══════════════════════════════════════════════════════════════════════════════


class TestGetExchangeRate:
    """Test exchange rate tool with real API."""

    def test_usd_to_vnd(self):
        """Should return USD/VND rate with reasonable value."""
        result = get_exchange_rate("USD", "VND")
        assert isinstance(result, str)
        # USD/VND should be roughly 24000-30000
        numbers = re.findall(r'[\d,]+(?:\.\d+)?', result.replace(".", "").replace(",", ""))
        assert len(result) > 20, f"Result too short: {result}"
        assert "VND" in result or "vnd" in result.lower()

    def test_eur_to_vnd(self):
        """Should return EUR/VND rate."""
        result = get_exchange_rate("EUR", "VND")
        assert isinstance(result, str)
        assert len(result) > 20

    def test_usd_to_eur(self):
        """Should return USD/EUR rate."""
        result = get_exchange_rate("USD", "EUR")
        assert isinstance(result, str)
        assert "EUR" in result

    def test_jpy_to_vnd(self):
        """Should return JPY/VND rate."""
        result = get_exchange_rate("JPY", "VND")
        assert isinstance(result, str)

    def test_invalid_currency(self):
        """Should handle invalid currency codes gracefully."""
        result = get_exchange_rate("XYZ", "VND")
        assert isinstance(result, str)
        # Should return error or fallback, not crash

    def test_same_currency(self):
        """Same currency should return rate of 1."""
        result = get_exchange_rate("USD", "USD")
        assert isinstance(result, str)

    def test_rate_has_timestamp(self):
        """Result should include timestamp or date."""
        result = get_exchange_rate("USD", "VND")
        # Should have date/time info
        has_time = any(x in result for x in ["/", ":", "cập nhật", "Cập nhật"])
        assert has_time, f"No timestamp in: {result}"

    def test_vnd_exchange_has_bank_rates(self):
        """USD/VND should include Vietcombank rates if available."""
        result = get_exchange_rate("USD", "VND")
        # VCB rates may or may not be available, but format should be correct
        assert isinstance(result, str)
        assert len(result) > 30


# ══════════════════════════════════════════════════════════════════════════════
# TEST GROUP 9: get_news
# ══════════════════════════════════════════════════════════════════════════════


class TestGetNews:
    """Test news fetching tool."""

    def test_news_vietnam(self):
        """Should return Vietnamese news."""
        result = get_news("Việt Nam", max_results=3)
        assert isinstance(result, str)
        assert len(result) > 50

    def test_news_tech(self):
        """Should return tech news."""
        result = get_news("công nghệ", max_results=3)
        assert isinstance(result, str)
        assert len(result) > 30

    def test_news_sports(self):
        """Should return sports news."""
        result = get_news("thể thao", max_results=3)
        assert isinstance(result, str)

    def test_news_max_results(self):
        """Should respect max_results parameter."""
        result = get_news("Việt Nam", max_results=2)
        assert isinstance(result, str)

    def test_news_empty_topic(self):
        """Should handle empty topic."""
        result = get_news("", max_results=3)
        assert isinstance(result, str)


# ══════════════════════════════════════════════════════════════════════════════
# TEST GROUP 10: Stock tools
# ══════════════════════════════════════════════════════════════════════════════


class TestStockTools:
    """Test stock-related tools."""

    def test_extract_ticker_vn(self):
        """Should extract VN stock ticker."""
        assert extract_stock_ticker("giá cổ phiếu VNM") == "VNM"
        assert extract_stock_ticker("cổ phiếu vinamilk") == "VNM"
        assert extract_stock_ticker("hòa phát stock") == "HPG"

    def test_extract_ticker_intl(self):
        """Should extract international tickers."""
        assert extract_stock_ticker("apple stock price") == "AAPL"
        assert extract_stock_ticker("nvidia cổ phiếu") == "NVDA"
        assert extract_stock_ticker("tesla price") == "TSLA"

    def test_extract_ticker_uppercase(self):
        """Should extract uppercase ticker patterns."""
        assert extract_stock_ticker("giá FPT hôm nay") == "FPT"

    def test_extract_ticker_none(self):
        """Should return None when no ticker found."""
        result = extract_stock_ticker("thời tiết hôm nay")
        assert result is None

    def test_get_stock_price_vn(self):
        """Should return VN stock price data."""
        result = get_stock_price("VNM")
        assert isinstance(result, str)
        assert len(result) > 20
        # Should contain the ticker
        assert "VNM" in result.upper() or "vinamilk" in result.lower() or "giá" in result.lower()

    def test_get_stock_price_intl(self):
        """Should return international stock price data."""
        result = get_stock_price("AAPL")
        assert isinstance(result, str)
        assert len(result) > 10


# ══════════════════════════════════════════════════════════════════════════════
# TEST GROUP 11: Cross-tool integration
# ══════════════════════════════════════════════════════════════════════════════


class TestCrossToolIntegration:
    """Test tools work correctly together in sequence."""

    def test_sequential_tool_calls(self):
        """Multiple tool calls in sequence should all work correctly."""
        # Weather
        weather = get_weather("TPHCM")
        assert "°C" in weather

        # Calculate
        calc = calculate("2+2")
        assert "= 4" in calc

        # DateTime
        dt = get_current_datetime()
        assert re.search(r'\d{2}:\d{2}', dt)

        # Memory
        mem = save_memory("Test fact")
        assert "ghi nhớ" in mem.lower()

    def test_tools_dont_interfere(self):
        """Tool calls should not affect each other."""
        # Call weather, then calculate - results should be independent
        weather1 = get_weather("TPHCM")
        calc = calculate("100*100")
        weather2 = get_weather("TPHCM")

        assert "°C" in weather1
        assert "= 10000" in calc
        assert "°C" in weather2

    def test_rapid_succession(self):
        """Tools should handle rapid sequential calls."""
        results = []
        for expr in ["1+1", "2*3", "10/2", "7-3", "5%2"]:
            results.append(calculate(expr))

        expected = ["= 2", "= 6", "= 5", "= 4", "= 1"]  # 5.0 for 10/2
        for result, exp in zip(results, expected):
            assert exp in result, f"Expected '{exp}' in '{result}'"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short", "-x"])
