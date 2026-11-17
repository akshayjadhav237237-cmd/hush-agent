"""Mobile push notifications and human intervention gating."""
from __future__ import annotations

import secrets
import warnings
from typing import Any, Callable, Optional

SECURITY_NOTICE: str = (
    "SECURITY NOTICE: ntfy.sh topics are public by default. Anyone who knows or guesses "
    "the topic name can read messages or publish fake prompts. Use a cryptographically secure "
    "random topic or a self-hosted instance with authentication tokens (I-012)."
)

DEFAULT_PUBLIC_TOPICS: frozenset[str] = frozenset({
    "hush",
    "default",
    "test",
    "alerts",
    "notifications",
    "hush-agent",
})


def generate_random_topic(prefix: str = "hush") -> str:
    """Generate a cryptographically randomized private topic name for ntfy."""
    return f"{prefix}-{secrets.token_hex(16)}"


class Notifier:
    """Manages push notifications to ntfy.sh and human interaction gates."""

    def __init__(
        self,
        topic: Optional[str] = None,
        post: Optional[Callable[..., Any]] = None,
        input_fn: Callable[[], str] = input,
        auto_answer: Optional[str] = None,
        audit: Optional[Any] = None,
        auth_token: Optional[str] = None,
        timeout: int = 10,
    ) -> None:
        """Initialize Notifier with topic, HTTP post function, input prompt, and audit log."""
        if topic and topic.strip().lower() in DEFAULT_PUBLIC_TOPICS:
            warnings.warn(
                f"Topic '{topic}' is a well-known public default topic on ntfy.sh. {SECURITY_NOTICE}",
                UserWarning,
                stacklevel=2,
            )
        self.topic = topic
        self.post = post
        self.input_fn = input_fn
        self.auto_answer = auto_answer
        self.audit = audit
        self.auth_token = auth_token
        self.timeout = timeout

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

        headers = {"Title": "Agent needs you"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"

        try:
            post_fn(
                f"https://ntfy.sh/{self.topic}",
                data=safe_msg.encode("utf-8"),
                headers=headers,
                timeout=self.timeout,
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
