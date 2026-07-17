# -*- coding: utf-8 -*-
"""Comprehensive Real-Time Integration Test for ALL Tools + Memory Flow.

This test calls EVERY tool with real API data and verifies:
1. Each tool returns correct, non-error data
2. Memory action states persist correctly across tool switches
3. Conversation history is maintained through direct-route actions
4. System prompt injection reflects current action states

Run: python -u tests/test_full_integration.py
"""
import sys
import os
import json
import time
import tempfile
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from assistant.tools import (
    get_weather, web_search, save_memory, get_current_datetime,
    calculate, translate_text, knowledge_search, get_exchange_rate,
    get_news, get_stock_price, extract_stock_ticker,
    play_music, stop_music, pause_music, resume_music,
    is_music_active,
    _music_is_active, _music_is_paused, _music_song_name,
)
from assistant.memory import AssistantMemory, MemoryStore
from assistant.config import settings

# ═══════════════════════════════════════════════════════════════════════════════
# Test utilities
# ═══════════════════════════════════════════════════════════════════════════════
passed = 0
failed = 0
errors = []

def test(name, condition, detail=""):
    global passed, failed, errors
    if condition:
        passed += 1
        print(f"  ✅ {name}")
    else:
        failed += 1
        errors.append(f"{name}: {detail}")
        print(f"  ❌ {name} — {detail}")

def section(title):
    print(f"\n{'─'*60}")
    print(f"  {title}")
    print(f"{'─'*60}")


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 1: Weather Tool (Real API)
# ═══════════════════════════════════════════════════════════════════════════════
section("1. WEATHER TOOL — Real API calls")

# Test 1.1: Ho Chi Minh City
result = get_weather("TPHCM")
print(f"  [Data] {result[:100]}...")
test("Weather TPHCM returns data", len(result) > 50, f"len={len(result)}")
test("Weather TPHCM has temperature", "°C" in result, "Missing °C")
test("Weather TPHCM has humidity", "độ ẩm" in result, "Missing humidity")
test("Weather TPHCM has wind", "gió" in result or "km/h" in result, "Missing wind")

# Test 1.2: Hanoi
result_hn = get_weather("Hà Nội")
print(f"  [Data] {result_hn[:100]}...")
test("Weather Hanoi returns data", len(result_hn) > 50)
test("Weather Hanoi has temperature", "°C" in result_hn)

# Test 1.3: International city
result_tk = get_weather("Tokyo")
print(f"  [Data] {result_tk[:100]}...")
test("Weather Tokyo returns data", len(result_tk) > 50)

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 2: Web Search Tool (Real API - Tavily)
# ═══════════════════════════════════════════════════════════════════════════════
section("2. WEB SEARCH TOOL — Real Tavily API calls")

# Test 2.1: Price search
result = web_search("giá xăng hôm nay Việt Nam")
print(f"  [Data] {result[:120]}...")
test("Web search gas price returns data", len(result) > 50)
test("Web search gas price has results", "Kết quả" in result or "Trả lời" in result, f"Content: {result[:80]}")

# Test 2.2: News search
result = web_search("tin tức Việt Nam hôm nay")
print(f"  [Data] {result[:120]}...")
test("Web search news returns data", len(result) > 50)

# Test 2.3: Person search
result = web_search("Tổng thống Mỹ hiện tại là ai 2026")
print(f"  [Data] {result[:120]}...")
test("Web search president returns data", len(result) > 50)

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 3: Get News Tool (Real API)
# ═══════════════════════════════════════════════════════════════════════════════
section("3. NEWS TOOL — Real Tavily API calls")

result = get_news("công nghệ", max_results=3)
print(f"  [Data] {result[:120]}...")
test("News tech returns data", len(result) > 50)
test("News has results", "Tin tức" in result or "Kết quả" in result or "Trả lời" in result, f"Content: {result[:60]}")

result_vn = get_news("Việt Nam", max_results=3)
print(f"  [Data] {result_vn[:120]}...")
test("News Vietnam returns data", len(result_vn) > 50)

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 4: Exchange Rate Tool (Real API)
# ═══════════════════════════════════════════════════════════════════════════════
section("4. EXCHANGE RATE TOOL — Real API calls")

result = get_exchange_rate("USD", "VND")
print(f"  [Data] {result[:120]}...")
test("Exchange USD/VND returns data", len(result) > 20)
test("Exchange USD/VND has number", any(c.isdigit() for c in result), "No digits found")

result_eur = get_exchange_rate("EUR", "VND")
print(f"  [Data] {result_eur[:120]}...")
test("Exchange EUR/VND returns data", len(result_eur) > 20)

result_jpy = get_exchange_rate("JPY", "VND")
print(f"  [Data] {result_jpy[:120]}...")
test("Exchange JPY/VND returns data", len(result_jpy) > 20)

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 5: Stock Price Tool (Real API)
# ═══════════════════════════════════════════════════════════════════════════════
section("5. STOCK PRICE TOOL — Real API calls")

result = get_stock_price("VNM")
print(f"  [Data] {result[:120]}...")
test("Stock VNM returns data", len(result) > 20)
test("Stock VNM not error", "Không thể" not in result and "lỗi" not in result.lower(), f"May be error: {result[:60]}")

result_fpt = get_stock_price("FPT")
print(f"  [Data] {result_fpt[:120]}...")
test("Stock FPT returns data", len(result_fpt) > 20)

# Test ticker extraction
ticker = extract_stock_ticker("giá cổ phiếu VNM hôm nay")
test("Extract ticker VNM", ticker == "VNM", f"Got: {ticker}")

ticker2 = extract_stock_ticker("cổ phiếu FPT")
test("Extract ticker FPT", ticker2 == "FPT", f"Got: {ticker2}")

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 6: Calculate Tool
# ═══════════════════════════════════════════════════════════════════════════════
section("6. CALCULATE TOOL")

test("Calculate 1+1=2", "2" in calculate("1+1"))
test("Calculate 15*3=45", "45" in calculate("15*3"))
test("Calculate 100/4=25", "25" in calculate("100/4"))
test("Calculate sqrt(144)=12", "12" in calculate("144**0.5"))
test("Calculate complex", "120" in calculate("(10+2)*10"))

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 7: Get Current Datetime Tool
# ═══════════════════════════════════════════════════════════════════════════════
section("7. DATETIME TOOL")

result = get_current_datetime()
print(f"  [Data] {result}")
test("Datetime returns data", len(result) > 10)
test("Datetime has year", "2026" in result or "năm" in result, f"Content: {result}")
test("Datetime has timezone", "UTC+7" in result or "Việt Nam" in result, f"Content: {result}")

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 8: Translate Tool (Real API)
# ═══════════════════════════════════════════════════════════════════════════════
section("8. TRANSLATE TOOL — Real API calls")

result = translate_text("Xin chào, tôi tên là Nhật Anh", "en")
print(f"  [Data] {result[:100]}...")
test("Translate VI->EN returns data", len(result) > 10)
test("Translate VI->EN has English", any(w in result.lower() for w in ["hello", "hi", "name", "nhat"]), f"Content: {result[:60]}")

result_ja = translate_text("Hello world", "ja")
print(f"  [Data] {result_ja[:100]}...")
test("Translate EN->JA returns data", len(result_ja) > 5)

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 9: Knowledge Search Tool (Real API)
# ═══════════════════════════════════════════════════════════════════════════════
section("9. KNOWLEDGE SEARCH TOOL — Real API calls")

result = knowledge_search("Trái đất quay quanh mặt trời mất bao lâu", "science")
print(f"  [Data] {result[:120]}...")
test("Knowledge science returns data", len(result) > 20)

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 10: Save Memory Tool
# ═══════════════════════════════════════════════════════════════════════════════
section("10. SAVE MEMORY TOOL")

result = save_memory("Tôi thích ăn phở")
test("Save memory returns confirmation", "ghi nhớ" in result.lower() or "phở" in result, f"Content: {result}")

result2 = save_memory("Sở thích lập trình Python")
test("Save memory 2 returns confirmation", "ghi nhớ" in result2.lower() or "Python" in result2, f"Content: {result2}")

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 11: Music Tools (State check only — no browser on CI)
# ═══════════════════════════════════════════════════════════════════════════════
section("11. MUSIC TOOLS — State management (no browser interaction)")

import assistant.tools as tools

# Reset music state
tools._music_is_active = False
tools._music_is_paused = False
tools._music_song_name = None

test("Music initially not active", not tools._music_is_active)
test("Music initially not paused", not tools._music_is_paused)

# Simulate pause when no music
result = pause_music()
test("Pause when no music: error msg", "không có" in result.lower() or "chưa" in result.lower(), f"Content: {result}")

# Simulate resume when no music
result = resume_music()
test("Resume when no music: error msg", "không có" in result.lower() or "chưa" in result.lower(), f"Content: {result}")

# Simulate stop when no music
result = stop_music()
test("Stop when no music: error msg", "không có" in result.lower() or "chưa" in result.lower() or "không tìm" in result.lower(), f"Content: {result}")

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 12: Memory Action State — Full Integration Flow
# ═══════════════════════════════════════════════════════════════════════════════
section("12. MEMORY ACTION STATE — Full Cross-Topic Flow")

# Create temp memory file for isolation
with tempfile.NamedTemporaryFile(suffix='.json', delete=False, mode='w') as f:
    json.dump({"profile": {}, "facts": [], "action_states": {}, "conversation": []}, f)
    temp_path = f.name

try:
    mem = AssistantMemory(file_path=Path(temp_path), max_messages=20)
    
    # Step 1: User plays music
    print("  [Flow] Step 1: User plays music")
    tools._music_is_active = True
    tools._music_is_paused = False
    tools._music_song_name = "Ai đưa em về"
    mem.sync_music_state_from_tools()
    mem.add_action_to_history("Mở nhạc Ai đưa em về", "Đang mở bài Ai đưa em về cho bạn.")
    
    state = mem.get_action_state("music")
    test("Step 1: Music state saved", state.get("active") == True and state.get("song") == "Ai đưa em về")
    test("Step 1: History has 2 messages", len(mem.store.conversation) == 2)
    
    # Step 2: User asks about weather (topic switch)
    print("  [Flow] Step 2: User asks about weather")
    weather_data = get_weather("TPHCM")
    mem.add_action_to_history("Thời tiết TPHCM thế nào", weather_data[:200])
    
    # Music state should STILL be active
    state = mem.get_action_state("music")
    test("Step 2: Music still active after weather", state.get("active") == True)
    test("Step 2: Song name preserved", state.get("song") == "Ai đưa em về")
    test("Step 2: History has 4 messages", len(mem.store.conversation) == 4)
    
    # Step 3: User asks about exchange rate (another topic switch)
    print("  [Flow] Step 3: User asks about exchange rate")
    rate_data = get_exchange_rate("USD", "VND")
    mem.add_action_to_history("Tỷ giá đô la hôm nay", rate_data[:200])
    
    state = mem.get_action_state("music")
    test("Step 3: Music still active after exchange rate", state.get("active") == True)
    test("Step 3: History has 6 messages", len(mem.store.conversation) == 6)
    
    # Step 4: User asks for news (yet another topic switch)
    print("  [Flow] Step 4: User asks for news")
    news_data = get_news("Việt Nam", max_results=2)
    mem.add_action_to_history("Tin tức mới nhất", news_data[:200])
    
    state = mem.get_action_state("music")
    test("Step 4: Music still active after news", state.get("active") == True)
    test("Step 4: History has 8 messages", len(mem.store.conversation) == 8)
    
    # Step 5: System prompt should reflect music state
    print("  [Flow] Step 5: Check system prompt injection")
    prompt = mem.get_context_system_prompt()
    test("Step 5: System prompt mentions music", "nhạc" in prompt.lower() or "Ai đưa em về" in prompt, f"Prompt: {prompt[:100]}")
    test("Step 5: System prompt says 'đang phát'", "đang phát" in prompt, f"Prompt: {prompt[:100]}")
    
    # Step 6: User pauses music (back to music topic)
    print("  [Flow] Step 6: User pauses music")
    tools._music_is_paused = True
    mem.sync_music_state_from_tools()
    mem.add_action_to_history("Dừng nhạc", "Đã tạm dừng bài Ai đưa em về.")
    
    state = mem.get_action_state("music")
    test("Step 6: Music paused", state.get("paused") == True)
    test("Step 6: Music still active", state.get("active") == True)
    
    prompt = mem.get_context_system_prompt()
    test("Step 6: System prompt says 'tạm dừng'", "tạm dừng" in prompt, f"Prompt: {prompt[:100]}")
    
    # Step 7: User resumes music
    print("  [Flow] Step 7: User resumes music")
    tools._music_is_paused = False
    mem.sync_music_state_from_tools()
    mem.add_action_to_history("Tiếp tục phát", "Đang tiếp tục phát bài Ai đưa em về.")
    
    state = mem.get_action_state("music")
    test("Step 7: Music not paused", state.get("paused") == False)
    test("Step 7: Music active", state.get("active") == True)
    
    # Step 8: User switches song
    print("  [Flow] Step 8: User switches to new song")
    tools._music_song_name = "Shape of You"
    mem.sync_music_state_from_tools()
    mem.add_action_to_history("Đổi sang bài Shape of You", "Đang mở bài Shape of You cho bạn.")
    
    state = mem.get_action_state("music")
    test("Step 8: Song changed", state.get("song") == "Shape of You")
    test("Step 8: Music active", state.get("active") == True)
    
    # Step 9: User asks about stock (another topic switch)
    print("  [Flow] Step 9: User asks about stock price")
    stock_data = get_stock_price("FPT")
    mem.add_action_to_history("Giá cổ phiếu FPT", stock_data[:200])
    
    state = mem.get_action_state("music")
    test("Step 9: Music still active after stock", state.get("active") == True)
    test("Step 9: Song preserved after stock", state.get("song") == "Shape of You")
    
    # Step 10: User stops music
    print("  [Flow] Step 10: User stops music")
    tools._music_is_active = False
    tools._music_is_paused = False
    tools._music_song_name = None
    mem.sync_music_state_from_tools()
    mem.add_action_to_history("Tắt nhạc", "Đã tắt nhạc.")
    
    state = mem.get_action_state("music")
    test("Step 10: Music state cleared", state == {})
    
    prompt = mem.get_context_system_prompt()
    test("Step 10: System prompt no music", "đang phát" not in prompt and "tạm dừng" not in prompt)
    
    # Step 11: Verify persistence — reload from disk
    print("  [Flow] Step 11: Reload from disk (simulate restart)")
    mem2 = AssistantMemory(file_path=Path(temp_path), max_messages=20)
    test("Step 11: Conversation preserved", len(mem2.store.conversation) >= 10, f"len={len(mem2.store.conversation)}")
    test("Step 11: Music state cleared after reload", mem2.get_action_state("music") == {})
    
    # Step 12: Play new music after restart, verify sync to tools
    print("  [Flow] Step 12: New music after restart")
    mem2.set_action_state("music", {"active": True, "paused": False, "song": "Lạc Trôi"})
    mem2.sync_music_state_to_tools()
    test("Step 12: Tools synced from memory", tools._music_is_active == True)
    test("Step 12: Song synced from memory", tools._music_song_name == "Lạc Trôi")
    
finally:
    # Cleanup
    os.unlink(temp_path)
    # Reset tools state
    tools._music_is_active = False
    tools._music_is_paused = False
    tools._music_song_name = None


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 13: Cross-Tool Data Validation
# ═══════════════════════════════════════════════════════════════════════════════
section("13. CROSS-TOOL DATA VALIDATION")

# Verify weather data contains reasonable temperature
weather = get_weather("Hà Nội")
# Extract temperature number
import re
temps = re.findall(r'(\d+\.?\d*)°C', weather)
if temps:
    temp_val = float(temps[0])
    test("Weather temperature reasonable (0-50°C)", 0 <= temp_val <= 50, f"temp={temp_val}")
else:
    test("Weather has temperature data", False, "No temperature found")

# Verify exchange rate is reasonable
rate = get_exchange_rate("USD", "VND")
# Extract rate number (should be ~24000-28000 VND/USD range)
rate_nums = re.findall(r'[\d,]+\.?\d*', rate.replace(",", ""))
if rate_nums:
    # Find the largest number which is likely the rate
    rate_val = max(float(n) for n in rate_nums if float(n) > 100)
    test("Exchange rate USD/VND reasonable (20000-35000)", 20000 <= rate_val <= 35000, f"rate={rate_val}")
else:
    test("Exchange rate has number", False, "No rate number found")

# Verify datetime is today
dt = get_current_datetime()
test("Datetime shows 2026", "2026" in dt, f"Content: {dt}")
test("Datetime shows March", "03" in dt or "tháng 3" in dt or "tháng 03" in dt, f"Content: {dt}")


# ═══════════════════════════════════════════════════════════════════════════════
# FINAL RESULTS
# ═══════════════════════════════════════════════════════════════════════════════
print(f"\n{'═'*60}")
print(f"  FINAL RESULTS: {passed} passed, {failed} failed")
print(f"{'═'*60}")

if errors:
    print(f"\n  FAILURES:")
    for err in errors:
        print(f"    ❌ {err}")

if failed == 0:
    print(f"\n  🎉 ALL {passed} TESTS PASSED! All tools return correct real-time data")
    print(f"     and memory flow works correctly across topic switches.")
else:
    print(f"\n  ⚠️  {failed} test(s) failed. Review above for details.")

print()
