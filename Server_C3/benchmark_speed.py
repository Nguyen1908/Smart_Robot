"""
Speed benchmark: Tools & LLM response time
Usage: python benchmark_speed.py
"""
import sys
import time

# Force UTF-8 output so Vietnamese characters survive file redirection on Windows
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

print("=" * 65)
print("  SPEED BENCHMARK — Tools & LLM Response Time")
print("=" * 65)

# ── 1. Import time ────────────────────────────────────────────
t0 = time.perf_counter()
from assistant.agent import PersonalAssistantAgent
t1 = time.perf_counter()
print(f"[IMPORT] PersonalAssistantAgent import : {t1-t0:.2f}s")

# ── 2. Agent init time ────────────────────────────────────────
t0 = time.perf_counter()
agent = PersonalAssistantAgent()
t1 = time.perf_counter()
print(f"[INIT]   Agent init (Whisper warm-up)  : {t1-t0:.2f}s")

# ── 3. Per-query benchmarks ───────────────────────────────────
questions = [
    ("Simple LLM",   "Một cộng một bằng mấy?"),
    ("Memory tool",  "Tên tôi là gì?"),
    ("Weather tool", "Thời tiết Hà Nội hôm nay thế nào?"),
    ("Stock tool",   "Giá cổ phiếu FPT hiện tại là bao nhiêu?"),
    ("Search tool",  "Tin tức mới nhất hôm nay là gì?"),
]

print()
print(f"{'#':<3} {'Tool/Type':<18} {'Question':<42} {'Time':>7}")
print("-" * 73)

for i, (label, q) in enumerate(questions, 1):
    t0 = time.perf_counter()
    resp = agent.chat(q, enable_tts=False)
    elapsed = time.perf_counter() - t0

    preview = resp.text[:70].replace("\n", " ")
    status = "✅" if elapsed < 5 else ("⚠️ " if elapsed < 10 else "❌")
    print(f"{i:<3} {label:<18} {q:<42} {elapsed:>6.2f}s {status}")
    print(f"     → {preview}")
    print()

print("=" * 65)
print("Benchmark done.")
print()
print("Rating guide:  < 3s=FAST  3-7s=OK  7-12s=SLOW  >12s=TOO SLOW")
