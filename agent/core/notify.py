"""Mobile push notifications and human intervention gating."""
from __future__ import annotations

from typing import Any, Callable, Optional


class Notifier:
    """Manages push notifications to ntfy.sh and human interaction gates."""

    def __init__(
        self,
        topic: Optional[str] = None,
        post: Optional[Callable[..., Any]] = None,
        input_fn: Callable[[], str] = input,
        auto_answer: Optional[str] = None,
        audit: Optional[Any] = None,
    ) -> None:
        """Initialize Notifier with topic, HTTP post function, input prompt, and audit log."""
        self.topic = topic
        self.post = post
        self.input_fn = input_fn
        self.auto_answer = auto_answer
        self.audit = audit

    def push(self, message: str) -> bool:
        """Push a notification to ntfy.sh with secret redaction and 200 char limit.

        Non-blocking and never raises on failure.
        """
        if not self.topic:
            return False

        from core.audit import redact

        safe_msg = redact(message, limit=200)
        post_fn = self.post
        if post_fn is None:
            try:
                import requests

                post_fn = requests.post
            except Exception:
                return False

        try:
            post_fn(
                f"https://ntfy.sh/{self.topic}",
                data=safe_msg.encode("utf-8"),
                headers={"Title": "Agent needs you"},
                timeout=10,
            )
            return True
        except Exception:
            return False

    def ask_human(self, message: str) -> str:
        """Alert human operator via push, log gate event, and obtain reply."""
        self.push(message)
        print(f"\n[!] ATTENTION NEEDED: {message}\n")
        if self.audit:
            self.audit.log("gate", trigger="human_notification", reason=message[:200])
        if self.auto_answer is not None:
            reply = self.auto_answer
        else:
            reply = self.input_fn()
        return f"Human replied: {reply}"
