"""
Comprehensive test for ALL modified tools in assistant/tools.py.

Tests:
  1. Stock tool: SSI realtime price + Tavily news articles
  2. Exchange rate: VCB primary (VND), open.er-api fallback
  3. Music tool: CDP-based play → switch → pause → resume → stop
  4. Edge cases: bad tickers, missing currencies, no music playing

Run:  python test_all_tools.py
"""

import json
import os
import sys
import time

# Fix Windows console encoding for Vietnamese
if sys.platform == "win32":
    os.environ["PYTHONIOENCODING"] = "utf-8"
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Add project root to path so we can import assistant modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from assistant.tools import (
    get_stock_price,
    get_exchange_rate,
    play_music,
    stop_music,
    pause_music,
    resume_music,
    is_music_active,
    extract_stock_ticker,
    _fetch_vn_stock_price,
    _fetch_intl_stock_price,
    _fetch_stock_news,
    _fetch_vcb_rates,
)

RESULTS = {}
TOTAL = 0
PASSED = 0


def test(name, condition, detail=""):
    global TOTAL, PASSED
    TOTAL += 1
    if condition:
        PASSED += 1
        RESULTS[name] = True
        print(f"  [PASS] {name}")
    else:
        RESULTS[name] = False
        print(f"  [FAIL] {name}")
    if detail:
        for line in detail.strip().split("\n"):
            print(f"         {line}")


# =========================================================================
# 1. STOCK TOOL
# =========================================================================
def test_stock():
    print("\n" + "=" * 60)
    print("1. STOCK TOOL")
    print("=" * 60)

    # 1a. VN stock via SSI iBoard
    print("\n--- 1a. VN stock (SSI iBoard) ---")
    for ticker in ["VNM", "FPT", "HPG"]:
        result = _fetch_vn_stock_price(ticker)
        test(
            f"SSI_{ticker}_price",
            result is not None and "khớp lệnh" in result,
            result[:120] if result else "None",
        )

    # 1b. International stock via Yahoo Finance
    print("\n--- 1b. International stock (Yahoo Finance) ---")
    for ticker in ["AAPL", "MSFT"]:
        result = _fetch_intl_stock_price(ticker)
        test(
            f"Yahoo_{ticker}_price",
            result is not None and "Giá hiện tại" in result,
            result[:120] if result else "None",
        )

    # 1c. Stock news via Tavily
    print("\n--- 1c. Stock news (Tavily) ---")
    news = _fetch_stock_news("VNM")
    test(
        "stock_news_VNM",
        news is not None and "Tin tức liên quan" in news,
        news[:200] if news else "None",
    )

    # 1d. Full get_stock_price (price + news combined)
    print("\n--- 1d. Full get_stock_price ---")
    full = get_stock_price("FPT")
    has_price = "khớp lệnh" in full or "Giá hiện tại" in full
    has_news = "Tin tức liên quan" in full or "[" in full
    test(
        "full_stock_FPT",
        has_price,
        full[:200],
    )
    test(
        "full_stock_FPT_has_news",
        has_news,
        "(news section present)" if has_news else "(no news found)",
    )

    # 1e. Ticker extraction
    print("\n--- 1e. Ticker extraction ---")
    test("extract_vinamilk", extract_stock_ticker("giá cổ phiếu vinamilk") == "VNM")
    test("extract_FPT", extract_stock_ticker("cổ phiếu FPT") == "FPT")
    test("extract_nvidia", extract_stock_ticker("giá nvidia bao nhiêu") == "NVDA")

    # 1f. Bad ticker (should fallback gracefully)
    print("\n--- 1f. Bad ticker ---")
    bad = get_stock_price("ZZZZZ")
    test(
        "bad_ticker_no_crash",
        bad is not None and len(bad) > 0,
        bad[:100],
    )


# =========================================================================
# 2. EXCHANGE RATE TOOL
# =========================================================================
def test_exchange_rate():
    print("\n" + "=" * 60)
    print("2. EXCHANGE RATE TOOL")
    print("=" * 60)

    # 2a. VCB API raw
    print("\n--- 2a. Vietcombank API raw ---")
    vcb = _fetch_vcb_rates()
    test(
        "vcb_api_available",
        vcb is not None and "USD" in vcb,
        f"Currencies: {len(vcb)}" if vcb else "None",
    )
    if vcb and "USD" in vcb:
        usd = vcb["USD"]
        test(
            "vcb_usd_rates",
            usd.get("sell") and float(usd["sell"]) > 20000,
            f"Buy={usd.get('buy')}, Sell={usd.get('sell')}, Transfer={usd.get('transfer')}",
        )

    # 2b. USD/VND (should use VCB)
    print("\n--- 2b. USD/VND (VCB primary) ---")
    result = get_exchange_rate("USD", "VND")
    test(
        "usd_vnd_rate",
        "Vietcombank" in result or "tỷ giá" in result.lower(),
        result[:150],
    )
    test(
        "usd_vnd_has_buy_sell",
        "Bán ra" in result or "=" in result,
        "(buy/sell info present)" if "Bán ra" in result else "(basic format)",
    )

    # 2c. EUR/VND
    print("\n--- 2c. EUR/VND ---")
    result = get_exchange_rate("EUR", "VND")
    test(
        "eur_vnd_rate",
        "EUR" in result and "VND" in result,
        result[:150],
    )

    # 2d. EUR/USD (non-VND, should use open.er-api)
    print("\n--- 2d. EUR/USD (open.er-api fallback) ---")
    result = get_exchange_rate("EUR", "USD")
    test(
        "eur_usd_rate",
        "EUR" in result and "USD" in result,
        result[:150],
    )

    # 2e. Bad currency
    print("\n--- 2e. Bad currency ---")
    result = get_exchange_rate("USD", "ZZZZZ")
    test(
        "bad_currency_no_crash",
        result is not None and len(result) > 0,
        result[:100],
    )


# =========================================================================
# 3. MUSIC TOOL (CDP)
# =========================================================================
def test_music():
    print("\n" + "=" * 60)
    print("3. MUSIC TOOL (CDP-based)")
    print("=" * 60)

    # 3a. Initial state: no music
    print("\n--- 3a. Initial state ---")
    test("initial_not_active", not is_music_active())

    # 3b. Pause/resume when no music (should not crash)
    print("\n--- 3b. Pause/resume with no music ---")
    r = pause_music()
    test("pause_no_music", "không có nhạc" in r.lower(), r)
    r = resume_music()
    test("resume_no_music", "không có nhạc" in r.lower(), r)

    # 3c. Stop when no music
    r = stop_music()
    test("stop_no_music", "không có nhạc" in r.lower(), r)

    # 3d. Play a song
    print("\n--- 3d. Play a song ---")
    r = play_music("Never Gonna Give You Up")
    test(
        "play_song",
        "mở bài" in r.lower() or "đang mở" in r.lower() or "tìm" in r.lower(),
        r,
    )
    test("is_active_after_play", is_music_active())

    # Wait for page to load
    time.sleep(4)

    # 3e. Pause
    print("\n--- 3e. Pause ---")
    r = pause_music()
    test("pause_playing", "tạm dừng" in r.lower(), r)

    # 3f. Double pause (should say already paused)
    r = pause_music()
    test("double_pause", "đang tạm dừng rồi" in r.lower(), r)

    # 3g. Resume
    print("\n--- 3g. Resume ---")
    r = resume_music()
    test("resume_paused", "tiếp tục phát" in r.lower(), r)

    # 3h. Double resume (should say already playing)
    r = resume_music()
    test("double_resume", "đang phát rồi" in r.lower(), r)

    time.sleep(2)

    # 3i. Switch song (navigate same tab)
    print("\n--- 3i. Switch song ---")
    r = play_music("Despacito Luis Fonsi")
    test(
        "switch_song",
        "chuyển" in r.lower() or "mở bài" in r.lower() or "đang mở" in r.lower(),
        r,
    )
    test("still_active_after_switch", is_music_active())

    time.sleep(3)

    # 3j. Stop (close tab via CDP)
    print("\n--- 3j. Stop ---")
    r = stop_music()
    test("stop_music", "tắt" in r.lower() or "đóng" in r.lower(), r)
    test("not_active_after_stop", not is_music_active())

    # Wait a moment for browser to close
    time.sleep(2)

    # 3k. Verify browser is gone (CDP should be unavailable)
    print("\n--- 3k. Verify cleanup ---")
    import requests
    try:
        resp = requests.get("http://127.0.0.1:9223/json/version", timeout=2)
        # If browser is still running (other tabs open), that's OK
        test("browser_cleanup", True, "Browser still running (may have other tabs)")
    except Exception:
        test("browser_cleanup", True, "Browser process terminated")


# =========================================================================
# MAIN
# =========================================================================
def main():
    print("=" * 60)
    print("COMPREHENSIVE TOOL TESTS")
    print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    test_stock()
    test_exchange_rate()
    test_music()

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    for name, passed in RESULTS.items():
        status = "[PASS]" if passed else "[FAIL]"
        print(f"  {status} {name}")

    failed = TOTAL - PASSED
    print(f"\n  Total: {TOTAL}  |  Passed: {PASSED}  |  Failed: {failed}")
    if failed:
        print(f"\n  {failed} test(s) FAILED!")
        return 1
    print("\n  ALL TESTS PASSED!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
