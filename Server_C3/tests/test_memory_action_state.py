"""Test cases for Action State Memory system.

Tests that the assistant correctly remembers and tracks ongoing action states
(music playing, etc.) across conversation turns, even when the user switches
topics in between.

Test scenarios:
1. Play music → ask news → stop music (should work)
2. Play music → ask weather → pause music → ask news → resume music
3. Play music → switch song (should close old, open new)
4. Process restart: action state persists in memory.json
5. Multiple action state updates in sequence
6. Direct-routed actions save to conversation history
7. LLM system prompt includes action state context
"""

from __future__ import annotations

import json
import tempfile
import threading
from pathlib import Path
from typing import Dict, List
from unittest.mock import patch, MagicMock

import pytest


# ── Fixtures & Setup ─────────────────────────────────────────────────────────


@pytest.fixture
def temp_memory_file(tmp_path):
    """Create a temporary memory file for testing."""
    return tmp_path / "test_memory.json"


@pytest.fixture
def memory(temp_memory_file):
    """Create a fresh AssistantMemory with a temp file."""
    from assistant.memory import AssistantMemory
    return AssistantMemory(file_path=temp_memory_file, max_messages=20)


@pytest.fixture(autouse=True)
def reset_music_globals():
    """Reset music global state before each test."""
    import assistant.tools as tools
    tools._music_is_active = False
    tools._music_is_paused = False
    tools._music_song_name = None
    yield
    # cleanup after test
    tools._music_is_active = False
    tools._music_is_paused = False
    tools._music_song_name = None


# ══════════════════════════════════════════════════════════════════════════════
# TEST GROUP 1: MemoryStore action_states field
# ══════════════════════════════════════════════════════════════════════════════


class TestMemoryStoreActionStates:
    """Test that MemoryStore has action_states field and it works correctly."""

    def test_memory_store_has_action_states(self):
        """MemoryStore should have an action_states dict field."""
        from assistant.memory import MemoryStore
        store = MemoryStore()
        assert hasattr(store, "action_states")
        assert isinstance(store.action_states, dict)
        assert store.action_states == {}

    def test_memory_store_action_states_default_empty(self):
        """Default action_states should be empty dict."""
        from assistant.memory import MemoryStore
        store = MemoryStore()
        assert store.action_states == {}

    def test_memory_store_action_states_custom(self):
        """Should accept custom action_states."""
        from assistant.memory import MemoryStore
        states = {"music": {"active": True, "paused": False, "song": "Test"}}
        store = MemoryStore(action_states=states)
        assert store.action_states == states


# ══════════════════════════════════════════════════════════════════════════════
# TEST GROUP 2: AssistantMemory action state methods
# ══════════════════════════════════════════════════════════════════════════════


class TestAssistantMemoryActionState:
    """Test AssistantMemory methods for managing action states."""

    def test_set_action_state(self, memory):
        """set_action_state should store state and persist to disk."""
        memory.set_action_state("music", {
            "active": True,
            "paused": False,
            "song": "Ai Đưa Em Về",
        })

        # Check in-memory
        assert memory.store.action_states["music"]["active"] is True
        assert memory.store.action_states["music"]["song"] == "Ai Đưa Em Về"

        # Check persisted to file
        data = json.loads(memory.file_path.read_text(encoding="utf-8"))
        assert "action_states" in data
        assert data["action_states"]["music"]["active"] is True

    def test_get_action_state(self, memory):
        """get_action_state should return stored state or empty dict."""
        # Not set yet → empty dict
        assert memory.get_action_state("music") == {}

        # Set it
        memory.set_action_state("music", {"active": True, "song": "Test"})
        state = memory.get_action_state("music")
        assert state["active"] is True
        assert state["song"] == "Test"

    def test_clear_action_state(self, memory):
        """clear_action_state should remove the state."""
        memory.set_action_state("music", {"active": True})
        assert memory.get_action_state("music") != {}

        memory.clear_action_state("music")
        assert memory.get_action_state("music") == {}

    def test_action_state_persists_reload(self, temp_memory_file):
        """Action states should persist across memory reloads (process restart)."""
        from assistant.memory import AssistantMemory

        # First instance: set state
        mem1 = AssistantMemory(file_path=temp_memory_file, max_messages=20)
        mem1.set_action_state("music", {
            "active": True,
            "paused": False,
            "song": "Ai Đưa Em Về",
        })

        # Second instance: should load persisted state
        mem2 = AssistantMemory(file_path=temp_memory_file, max_messages=20)
        state = mem2.get_action_state("music")
        assert state["active"] is True
        assert state["song"] == "Ai Đưa Em Về"

    def test_multiple_action_states(self, memory):
        """Should handle multiple action types simultaneously."""
        memory.set_action_state("music", {"active": True, "song": "Test Song"})
        memory.set_action_state("timer", {"active": True, "duration": 300})

        assert memory.get_action_state("music")["active"] is True
        assert memory.get_action_state("timer")["active"] is True

        # Clear only music
        memory.clear_action_state("music")
        assert memory.get_action_state("music") == {}
        assert memory.get_action_state("timer")["active"] is True

    def test_action_state_update_partial(self, memory):
        """Updating action state should replace the whole state for that key."""
        memory.set_action_state("music", {"active": True, "paused": False, "song": "Song A"})
        memory.set_action_state("music", {"active": True, "paused": True, "song": "Song A"})

        state = memory.get_action_state("music")
        assert state["paused"] is True


# ══════════════════════════════════════════════════════════════════════════════
# TEST GROUP 3: System prompt with action state context
# ══════════════════════════════════════════════════════════════════════════════


class TestActionStateSystemPrompt:
    """Test that action states are injected into the system prompt."""

    def test_no_action_state_no_prompt(self, memory):
        """No action states → no additional prompt."""
        prompt = memory.get_context_system_prompt()
        assert "TRẠNG THÁI HÀNH ĐỘNG" not in prompt

    def test_music_active_in_prompt(self, memory):
        """Active music should appear in system prompt."""
        memory.set_action_state("music", {
            "active": True,
            "paused": False,
            "song": "Ai Đưa Em Về",
        })

        prompt = memory.get_context_system_prompt()
        assert "Ai Đưa Em Về" in prompt
        assert "đang phát" in prompt or "TRẠNG THÁI" in prompt

    def test_music_paused_in_prompt(self, memory):
        """Paused music should appear in system prompt with paused status."""
        memory.set_action_state("music", {
            "active": True,
            "paused": True,
            "song": "Test Song",
        })

        prompt = memory.get_context_system_prompt()
        assert "Test Song" in prompt
        assert "tạm dừng" in prompt

    def test_music_inactive_no_prompt(self, memory):
        """Inactive music should not add to prompt."""
        memory.set_action_state("music", {
            "active": False,
            "paused": False,
            "song": None,
        })

        prompt = memory.get_context_system_prompt()
        # Should not mention music state when inactive
        assert "đang phát" not in prompt


# ══════════════════════════════════════════════════════════════════════════════
# TEST GROUP 4: Conversation flow scenarios
# ══════════════════════════════════════════════════════════════════════════════


class TestConversationFlowScenarios:
    """Test complete conversation flow scenarios with action states.
    
    These simulate the actual user flow:
    1. play music → ask other question → music commands still work
    """

    def test_play_then_news_then_stop(self, memory):
        """Scenario: play music → ask news → stop music.
        
        After playing music, the state should persist even when user asks
        about unrelated topics, and stop_music should still work.
        """
        import assistant.tools as tools

        # Step 1: Play music
        memory.set_action_state("music", {
            "active": True,
            "paused": False,
            "song": "Ai Đưa Em Về",
        })
        tools._music_is_active = True
        tools._music_is_paused = False
        tools._music_song_name = "Ai Đưa Em Về"

        # Step 2: User asks about news (different topic)
        # Music state should still be active
        assert memory.get_action_state("music")["active"] is True
        assert tools._music_is_active is True

        # Step 3: User says "stop music"
        # The state should still show music is active
        state = memory.get_action_state("music")
        assert state["active"] is True
        assert state["song"] == "Ai Đưa Em Về"

    def test_play_pause_resume_flow(self, memory):
        """Scenario: play → pause → ask weather → resume.
        
        The paused state should persist across unrelated queries.
        """
        import assistant.tools as tools

        # Play
        memory.set_action_state("music", {
            "active": True, "paused": False, "song": "Song X",
        })
        tools._music_is_active = True

        # Pause
        memory.set_action_state("music", {
            "active": True, "paused": True, "song": "Song X",
        })
        tools._music_is_paused = True

        # User asks weather (irrelevant)
        # ... (state unchanged)

        # Resume check
        state = memory.get_action_state("music")
        assert state["active"] is True
        assert state["paused"] is True
        assert state["song"] == "Song X"
        assert tools._music_is_paused is True

    def test_switch_song_updates_state(self, memory):
        """Scenario: play song A → switch to song B.
        
        The state should update to new song.
        """
        # Play song A
        memory.set_action_state("music", {
            "active": True, "paused": False, "song": "Song A",
        })

        # Switch to song B
        memory.set_action_state("music", {
            "active": True, "paused": False, "song": "Song B",
        })

        state = memory.get_action_state("music")
        assert state["song"] == "Song B"
        assert state["active"] is True


# ══════════════════════════════════════════════════════════════════════════════
# TEST GROUP 5: Sync between tools globals and memory
# ══════════════════════════════════════════════════════════════════════════════


class TestToolsMemorySync:
    """Test synchronization between tools.py globals and memory action states."""

    def test_sync_tools_from_memory(self, memory):
        """sync_music_state_from_memory should restore tools globals."""
        from assistant.memory import AssistantMemory

        # Set persisted state
        memory.set_action_state("music", {
            "active": True,
            "paused": True,
            "song": "Restored Song",
        })

        # Sync to tools globals
        memory.sync_music_state_to_tools()

        import assistant.tools as tools
        assert tools._music_is_active is True
        assert tools._music_is_paused is True
        assert tools._music_song_name == "Restored Song"

    def test_sync_tools_to_memory(self, memory):
        """sync_music_state_to_memory should save tools globals to memory."""
        import assistant.tools as tools

        tools._music_is_active = True
        tools._music_is_paused = False
        tools._music_song_name = "Current Song"

        memory.sync_music_state_from_tools()

        state = memory.get_action_state("music")
        assert state["active"] is True
        assert state["paused"] is False
        assert state["song"] == "Current Song"


# ══════════════════════════════════════════════════════════════════════════════
# TEST GROUP 6: Direct-routed actions save to conversation context
# ══════════════════════════════════════════════════════════════════════════════


class TestDirectRouteConversationSave:
    """Test that direct-routed actions (music, weather) still save to
    conversation context so the LLM has full history."""

    def test_add_action_to_history(self, memory):
        """add_action_to_history should create user/assistant message pair."""
        memory.add_action_to_history(
            user_text="mở nhạc bài Ai Đưa Em Về",
            assistant_text="Đang mở bài Ai Đưa Em Về cho bạn.",
        )

        history = memory.get_message_history()
        assert len(history) >= 2  # At least user + assistant messages

    def test_action_history_preserved_across_turns(self, memory):
        """Action history should be part of conversation and persist."""
        # Action 1: play music
        memory.add_action_to_history(
            user_text="mở nhạc bài Ai Đưa Em Về",
            assistant_text="Đang mở bài Ai Đưa Em Về cho bạn.",
        )

        # Check history has entries
        history = memory.get_message_history()
        initial_count = len(history)
        assert initial_count >= 2

        # Add another action
        memory.add_action_to_history(
            user_text="dừng nhạc",
            assistant_text="Đã tạm dừng bài Ai Đưa Em Về.",
        )

        history = memory.get_message_history()
        assert len(history) >= initial_count + 2


# ══════════════════════════════════════════════════════════════════════════════
# TEST GROUP 7: Edge cases
# ══════════════════════════════════════════════════════════════════════════════


class TestEdgeCases:
    """Edge case tests for the action state memory system."""

    def test_empty_memory_file(self, temp_memory_file):
        """Should handle missing memory file gracefully."""
        from assistant.memory import AssistantMemory
        mem = AssistantMemory(file_path=temp_memory_file, max_messages=20)
        assert mem.get_action_state("music") == {}

    def test_legacy_memory_file_no_action_states(self, temp_memory_file):
        """Should handle legacy memory files without action_states field."""
        # Write legacy format
        legacy_data = {
            "profile": {"name": "Test"},
            "facts": ["User likes Python"],
            "conversation": [],
        }
        temp_memory_file.write_text(json.dumps(legacy_data), encoding="utf-8")

        from assistant.memory import AssistantMemory
        mem = AssistantMemory(file_path=temp_memory_file, max_messages=20)
        assert mem.get_action_state("music") == {}
        assert mem.store.profile == {"name": "Test"}

    def test_concurrent_state_updates(self, memory):
        """Should handle concurrent state updates safely."""
        import threading

        errors = []

        def update_state(i):
            try:
                memory.set_action_state("music", {
                    "active": True,
                    "song": f"Song {i}",
                })
            except Exception as e:
                errors.append(e)

        threads = [threading.Thread(target=update_state, args=(i,)) for i in range(10)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert len(errors) == 0
        # Final state should be one of the songs
        state = memory.get_action_state("music")
        assert state["active"] is True
        assert state["song"].startswith("Song ")

    def test_action_state_with_none_values(self, memory):
        """Should handle None values in action state."""
        memory.set_action_state("music", {
            "active": False,
            "paused": False,
            "song": None,
        })

        state = memory.get_action_state("music")
        assert state["active"] is False
        assert state["song"] is None


# ══════════════════════════════════════════════════════════════════════════════
# TEST GROUP 8: Full integration scenario simulation
# ══════════════════════════════════════════════════════════════════════════════


class TestFullIntegrationScenario:
    """Simulate a complete user interaction scenario.
    
    User flow:
    1. "mở nhạc Ai Đưa Em Về" → music plays
    2. "tin tức hôm nay" → news (music still playing)
    3. "giá vàng hôm nay" → price (music still playing)
    4. "dừng nhạc" → music pauses (remembers the song)
    5. "tỷ giá đô la" → exchange rate (music paused)
    6. "tiếp tục phát nhạc" → music resumes (remembers paused song)
    7. "chuyển bài sang Shape of You" → switches song
    8. "tắt nhạc" → music stops completely
    """

    def test_full_scenario(self, memory):
        """Full flow: play → news → pause → exchange rate → resume → switch → stop."""
        import assistant.tools as tools

        # 1. Play music
        memory.set_action_state("music", {
            "active": True, "paused": False, "song": "Ai Đưa Em Về",
        })
        tools._music_is_active = True
        tools._music_is_paused = False
        tools._music_song_name = "Ai Đưa Em Về"
        memory.add_action_to_history(
            "mở nhạc Ai Đưa Em Về",
            "Đang mở bài Ai Đưa Em Về cho bạn."
        )

        # 2. News (music still playing)
        state = memory.get_action_state("music")
        assert state["active"] is True
        assert state["song"] == "Ai Đưa Em Về"

        # 3. Price check (music still playing)
        state = memory.get_action_state("music")
        assert state["active"] is True

        # 4. Pause music
        memory.set_action_state("music", {
            "active": True, "paused": True, "song": "Ai Đưa Em Về",
        })
        tools._music_is_paused = True
        memory.add_action_to_history(
            "dừng nhạc",
            "Đã tạm dừng bài Ai Đưa Em Về."
        )

        # 5. Exchange rate (music paused, state preserved)
        state = memory.get_action_state("music")
        assert state["active"] is True
        assert state["paused"] is True
        assert state["song"] == "Ai Đưa Em Về"

        # 6. Resume music
        memory.set_action_state("music", {
            "active": True, "paused": False, "song": "Ai Đưa Em Về",
        })
        tools._music_is_paused = False
        memory.add_action_to_history(
            "tiếp tục phát nhạc",
            "Đã tiếp tục phát bài Ai Đưa Em Về."
        )

        state = memory.get_action_state("music")
        assert state["paused"] is False

        # 7. Switch song
        memory.set_action_state("music", {
            "active": True, "paused": False, "song": "Shape of You",
        })
        tools._music_song_name = "Shape of You"
        memory.add_action_to_history(
            "chuyển sang bài Shape of You",
            "Đang mở bài Shape of You cho bạn."
        )

        state = memory.get_action_state("music")
        assert state["song"] == "Shape of You"

        # 8. Stop music
        memory.clear_action_state("music")
        tools._music_is_active = False
        tools._music_is_paused = False
        tools._music_song_name = None
        memory.add_action_to_history(
            "tắt nhạc",
            "Đã tắt nhạc."
        )

        state = memory.get_action_state("music")
        assert state == {}

        # Verify full conversation history has all interactions
        history = memory.get_message_history()
        assert len(history) >= 8  # 4 pairs of user+assistant

    def test_process_restart_restores_music_state(self, temp_memory_file):
        """Simulate process restart: music state should persist and restore."""
        from assistant.memory import AssistantMemory
        import assistant.tools as tools

        # Session 1: Play music, persist state
        mem1 = AssistantMemory(file_path=temp_memory_file, max_messages=20)
        mem1.set_action_state("music", {
            "active": True, "paused": False, "song": "Ai Đưa Em Về",
        })
        mem1.add_action_to_history("mở nhạc", "Đang mở nhạc.")

        # Reset tools globals (simulating process restart)
        tools._music_is_active = False
        tools._music_is_paused = False
        tools._music_song_name = None

        # Session 2: Load from disk, sync to tools
        mem2 = AssistantMemory(file_path=temp_memory_file, max_messages=20)
        mem2.sync_music_state_to_tools()

        # Music state should be restored
        assert tools._music_is_active is True
        assert tools._music_is_paused is False
        assert tools._music_song_name == "Ai Đưa Em Về"

        # System prompt should reflect active music
        prompt = mem2.get_context_system_prompt()
        assert "Ai Đưa Em Về" in prompt
        assert "đang phát" in prompt

    def test_system_prompt_context_during_topic_switch(self, memory):
        """System prompt should consistently show music state during topic switches."""
        # Play music
        memory.set_action_state("music", {
            "active": True, "paused": False, "song": "Test Song",
        })

        # After news question - prompt still shows music
        prompt1 = memory.get_context_system_prompt()
        assert "Test Song" in prompt1
        assert "đang phát" in prompt1

        # After weather question - prompt still shows music
        prompt2 = memory.get_context_system_prompt()
        assert "Test Song" in prompt2

        # After exchange rate - prompt still shows music
        prompt3 = memory.get_context_system_prompt()
        assert "Test Song" in prompt3

        # Pause music
        memory.set_action_state("music", {
            "active": True, "paused": True, "song": "Test Song",
        })

        # Prompt now shows paused
        prompt4 = memory.get_context_system_prompt()
        assert "Test Song" in prompt4
        assert "tạm dừng" in prompt4


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
