from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List


@dataclass(slots=True)
class ChatMessage:
    role: str
    content: str

    def to_dict(self) -> Dict[str, str]:
        return {"role": self.role, "content": self.content}


@dataclass(slots=True)
class AssistantResponse:
    text: str
    tool_events: List[str] = field(default_factory=list)
    audio_path: str | None = None
    transcript: str | None = None
    latency_ms: Dict[str, int] = field(default_factory=dict)
