"""Memory manager for the personal assistant.

Handles four tiers of memory:
- profile: key-value user profile
- facts: list of long-term remembered facts
- action_states: ongoing action states (music playing, timers, etc.)
- conversation: Pydantic-AI ModelMessage history (serialised as JSON)

The conversation history is stored using Pydantic-AI's native
ModelMessagesTypeAdapter so it round-trips perfectly through
message_history.

Action states track ongoing activities (e.g., music playing) so the
assistant can remember context across conversation turns — even when the
user switches topics in between.
"""

from __future__ import annotations

import json
import threading
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List

from pydantic_ai.messages import (
    ModelMessage,
    ModelMessagesTypeAdapter,
    ModelRequest,
    ModelResponse,
    UserPromptPart,
    TextPart,
)

from assistant.config import settings

_VN_TZ = timezone(timedelta(hours=7))


@dataclass(slots=True)
class MemoryStore:
    profile: Dict[str, str] = field(default_factory=dict)
    facts: List[str] = field(default_factory=list)
    action_states: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    conversation: List[ModelMessage] = field(default_factory=list)


class AssistantMemory:
    def __init__(self, file_path: Path | None = None, max_messages: int | None = None) -> None:
        self.file_path = file_path or settings.memory_file
        self.max_messages = max_messages or settings.memory_max_messages
        self._lock = threading.Lock()
        self.store = self._load()

    def _load(self) -> MemoryStore:
        if not self.file_path.exists():
            return MemoryStore()

        data = json.loads(self.file_path.read_text(encoding="utf-8"))

        conversation: List[ModelMessage] = []
        raw_conversation = data.get("conversation", [])
        if raw_conversation:
            try:
                conversation = ModelMessagesTypeAdapter.validate_python(raw_conversation)
                # Filter out messages with stale tool-call/tool-return parts
                conversation = self._clean_tool_messages(conversation)
            except Exception:
                conversation = []

        return MemoryStore(
            profile=data.get("profile", {}),
            facts=data.get("facts", []),
            action_states=data.get("action_states", {}),
            conversation=conversation,
        )

    @staticmethod
    def _clean_tool_messages(messages: List[ModelMessage]) -> List[ModelMessage]:
        """Remove messages that contain tool-call or tool-return parts.

        These cause ModelHTTPError when replayed because the API cannot
        match stale tool_call_ids from previous runs.
        """
        return [
            msg for msg in messages
            if not any(
                getattr(part, "part_kind", "") in ("tool-call", "tool-return")
                for part in msg.parts
            )
        ]

    def save(self) -> None:
        from pydantic_core import to_jsonable_python

        conversation_data = to_jsonable_python(self.store.conversation)

        payload = {
            "profile": self.store.profile,
            "facts": self.store.facts,
            "action_states": self.store.action_states,
            "conversation": conversation_data,
        }
        self.file_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    def get_message_history(self) -> List[ModelMessage]:
        """Return the current conversation as Pydantic-AI ModelMessage list."""
        return list(self.store.conversation)

    def set_message_history(self, messages: List[ModelMessage]) -> None:
        """Replace conversation history, keeping only the last N messages."""
        self.store.conversation = messages[-self.max_messages:]
        self.save()

    def remember_fact(self, fact: str) -> None:
        normalized = fact.strip()
        if normalized and normalized not in self.store.facts:
            self.store.facts.append(normalized)
            self.save()

    def set_profile(self, key: str, value: str) -> None:
        self.store.profile[key] = value.strip()
        self.save()

    # ── Action State Management ──────────────────────────────────────────────

    def get_action_state(self, action_type: str) -> Dict[str, Any]:
        """Get the current state of an action type (e.g., 'music').

        Returns empty dict if no state exists for this action type.
        """
        return dict(self.store.action_states.get(action_type, {}))

    def set_action_state(self, action_type: str, state: Dict[str, Any]) -> None:
        """Set/update the state of an action type and persist to disk.

        Thread-safe. Replaces the entire state for the given action type.
        """
        with self._lock:
            self.store.action_states[action_type] = state
            self.save()

    def clear_action_state(self, action_type: str) -> None:
        """Remove the state of an action type and persist to disk."""
        with self._lock:
            self.store.action_states.pop(action_type, None)
            self.save()

    # ── Music State Sync (tools.py globals ↔ memory) ─────────────────────────

    def sync_music_state_to_tools(self) -> None:
        """Restore tools.py music globals from persisted action state.

        Called on startup to restore music state after process restart.
        """
        import assistant.tools as tools

        state = self.get_action_state("music")
        if not state:
            return

        tools._music_is_active = state.get("active", False)
        tools._music_is_paused = state.get("paused", False)
        tools._music_song_name = state.get("song", None)

    def sync_music_state_from_tools(self) -> None:
        """Save tools.py music globals to persisted action state.

        Called after music actions to persist the current state.
        """
        import assistant.tools as tools

        if tools._music_is_active:
            self.set_action_state("music", {
                "active": tools._music_is_active,
                "paused": tools._music_is_paused,
                "song": tools._music_song_name,
            })
        else:
            self.clear_action_state("music")

    # ── Direct-Route Conversation History ─────────────────────────────────────

    def add_action_to_history(
        self,
        user_text: str,
        assistant_text: str,
    ) -> None:
        """Add a user/assistant message pair to conversation history.

        Used by direct-routed actions (music, weather) that bypass the LLM
        but should still appear in conversation context for future turns.
        """
        now = datetime.now(_VN_TZ)

        # Create user request message
        user_msg = ModelRequest(
            parts=[UserPromptPart(content=user_text, timestamp=now)],
        )

        # Create assistant response message
        assistant_msg = ModelResponse(
            parts=[TextPart(content=assistant_text)],
        )

        self.store.conversation.append(user_msg)
        self.store.conversation.append(assistant_msg)

        # Trim to max messages
        if len(self.store.conversation) > self.max_messages:
            self.store.conversation = self.store.conversation[-self.max_messages:]

        self.save()

    # ── System Prompt Context ────────────────────────────────────────────────

    def get_context_system_prompt(self) -> str:
        """Build a system prompt snippet with profile + facts + action states context."""
        parts: List[str] = []

        if self.store.profile:
            profile_text = "\n".join(f"- {key}: {value}" for key, value in self.store.profile.items())
            parts.append(f"Thông tin hồ sơ người dùng đã biết:\n{profile_text}")

        if self.store.facts:
            fact_text = "\n".join(f"- {fact}" for fact in self.store.facts[-20:])
            parts.append(f"Các facts dài hạn cần ghi nhớ:\n{fact_text}")

        # Inject action states into system prompt
        action_context = self._build_action_state_prompt()
        if action_context:
            parts.append(action_context)

        return "\n\n".join(parts)

    def _build_action_state_prompt(self) -> str:
        """Build system prompt snippet describing active action states.

        This tells the LLM what's currently happening so it can handle
        follow-up commands correctly (e.g., "dừng nhạc" when music is playing).
        """
        lines: List[str] = []

        # Music state
        music_state = self.get_action_state("music")
        if music_state and music_state.get("active"):
            song = music_state.get("song", "nhạc")
            if music_state.get("paused"):
                lines.append(
                    f"Nhạc: bài \"{song}\" đang tạm dừng. "
                    "User có thể nói 'tiếp tục phát' để nghe tiếp hoặc 'tắt nhạc' để đóng."
                )
            else:
                lines.append(
                    f"Nhạc: bài \"{song}\" đang phát. "
                    "User có thể nói 'dừng nhạc' để tạm dừng, 'tắt nhạc' để đóng, "
                    "hoặc 'chuyển bài' để đổi sang bài khác."
                )

        if not lines:
            return ""

        return "TRẠNG THÁI HÀNH ĐỘNG HIỆN TẠI:\n" + "\n".join(lines)
