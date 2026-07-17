# -*- coding: utf-8 -*-
"""Test script to verify music switch song name extraction (FIXED v3)."""
import sys
sys.stdout.reconfigure(encoding='utf-8')

MUSIC_SWITCH_KEYWORDS = [
    "chuyển sang bài", "chuyển sang nhạc", "chuyển bài", "chuyển nhạc",
    "đổi sang bài", "đổi sang nhạc", "đổi bài", "đổi nhạc",
    "nghe bài khác", "phát bài khác",
    "switch song", "bài khác",
]


def extract_song_name(user_text):
    """Reproduce FIXED v3 _handle_switch_song logic."""
    song_query = user_text.lower()
    for kw in MUSIC_SWITCH_KEYWORDS:
        old = song_query
        song_query = song_query.replace(kw, "").strip()
        if old != song_query:
            print(f"  KW [{kw}] matched -> [{song_query}]")
    
    for fragment in ["sang bài", "sang nhạc", "sang"]:
        if song_query.startswith(fragment):
            song_query = song_query[len(fragment):].strip()
            print(f"  Fragment [{fragment}] removed -> [{song_query}]")
    
    # Strip trailing filler phrases (multi-word first, then single-word)
    # "đi" is intentionally NOT stripped as standalone because it
    # appears in valid song titles like "Chạy Ngay Đi"
    for filler in ["đi nhé", "đi nha", "cho tôi", "cho mình", "nhé", "nha", "giùm", "hộ"]:
        old = song_query
        song_query = song_query.strip().removesuffix(filler).strip()
        if old != song_query:
            print(f"  Filler [{filler}] removed -> [{song_query}]")
    
    song_query = song_query.strip(" ,.!?")
    return song_query


# Test cases: (input, expected_song_query, should_play)
test_cases = [
    # === BUG FIX: The original failing case ===
    ("đổi sang bài Ai đưa em về của TIA", "ai đưa em về của tia", True),
    
    # === Core switch patterns ===
    ("chuyển bài Ai đưa em về của TIA", "ai đưa em về của tia", True),
    ("chuyển sang bài Shape of You", "shape of you", True),
    ("đổi nhạc sang bài Anh nhớ em", "anh nhớ em", True),
    ("chuyển nhạc sang bài See You Again", "see you again", True),
    ("đổi sang nhạc Chill", "chill", True),
    
    # === Song names with "đi" (should NOT strip "đi") ===
    ("đổi bài Chạy Ngay Đi", "chạy ngay đi", True),
    
    # === No song name → ask user ===
    ("nghe bài khác đi", "đi", False),   # "đi" alone (len=2) → won't play
    ("chuyển bài đi nhé", None, False),   # "đi nhé" stripped
    ("bài khác nhé", None, False),
    
    # === Edge cases ===
    ("switch song to Bohemian Rhapsody", "to bohemian rhapsody", True),
    ("chuyển sang bài Để Mị Nói Cho Mà Nghe", "để mị nói cho mà nghe", True),
    ("đổi bài cho tôi", None, False),     # filler only
    ("đổi sang bài Lạc Trôi nhé", "lạc trôi", True),  # strip "nhé"
]

passed = 0
failed = 0
for input_text, expected, should_play in test_cases:
    print(f"\n--- Input: [{input_text}]")
    result = extract_song_name(input_text)
    would_play = bool(result and len(result) > 2)
    
    if expected is None:
        ok = not would_play
    else:
        ok = (result == expected) and (would_play == should_play)
    
    status = "PASS" if ok else "FAIL"
    print(f"    Result:   [{result}] (len={len(result)})")
    if expected:
        print(f"    Expected: [{expected}]")
    else:
        print(f"    Expected: (no song name)")
    print(f"    Would play: {would_play}, Expected play: {should_play}")
    print(f"    Status: {status}")
    if ok:
        passed += 1
    else:
        failed += 1

print(f"\n{'='*60}")
print(f"RESULTS: {passed} passed, {failed} failed out of {len(test_cases)} tests")
if failed == 0:
    print("ALL TESTS PASSED!")
else:
    print("SOME TESTS FAILED!")
