"""Core type definitions, protocols, and run context."""
from __future__ import annotations
from dataclasses import dataclass
from typing import Callable, Protocol, Any, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from core.audit import AuditLog
    from core.killswitch import KillSwitch
    from core.loopbreaker import LoopBreaker
    from core.notify import Notifier
    from core.accounts import AccountSwitcher
    from core.checkpoint import RunState

ToolFunc = Callable[..., str]


class Desktop(Protocol):
    """Protocol defining desktop interaction capabilities."""

    def funcs(self) -> dict[str, ToolFunc]:
        """Return registered tool functions."""
        ...

    def paste_any(self, text: str, press_enter: bool = False) -> str:
        """Paste any string regardless of size."""
        ...

    def clipboard_full(self) -> str:
        """Return the complete unfiltered clipboard content."""
        ...

    def screenshot_png(self) -> bytes:
        """Capture and return the current display as PNG bytes."""
        ...


@dataclass
class RunContext:
    """Execution context carrying shared state and services."""

    run_id: str
    run_dir: str
    project_dir: str
    mode: str  # "real" | "demo"
    audit: Any  # AuditLog
    kill: Any  # KillSwitch
    breaker: Any  # LoopBreaker
    notifier: Any  # Notifier
    switcher: Optional[Any]  # Optional[AccountSwitcher]
    state: Any  # RunState
    max_steps: int
    log_text: bool = False
    browser: Optional[Any] = None
    plan_only: bool = False
