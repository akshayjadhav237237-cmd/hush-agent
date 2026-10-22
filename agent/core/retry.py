"""Retry utilities with exponential backoff and GenAI content extraction."""
import random
import time
from typing import Any, Callable, Optional, TypeVar

T = TypeVar("T")

RETRYABLE_PATTERNS: tuple[str, ...] = (
    "429",
    "RESOURCE_EXHAUSTED",
    "500",
    "503",
    "UNAVAILABLE",
    "timeout",
    "empty response",
)


def is_retryable_error(exc: BaseException) -> bool:
    """Return True if exception message matches any retryable pattern (case-insensitive)."""
    msg = str(exc).lower()
    return any(pattern.lower() in msg for pattern in RETRYABLE_PATTERNS)


def with_backoff(
    fn: Callable[[], T],
    *,
    retries: int = 5,
    base: float = 2.0,
    cap: float = 60.0,
    sleep: Callable[[float], None] = time.sleep,
    rand: Callable[[], float] = random.random,
    on_retry: Optional[Callable[[int, Exception, float], None]] = None,
) -> T:
    """Execute fn with exponential backoff and jitter upon retryable errors."""
    attempt = 0
    while True:
        try:
            return fn()
        except Exception as exc:
            if not is_retryable_error(exc):
                raise
            if attempt >= retries:
                raise
            delay = min(cap, base ** (attempt + 1)) * (0.8 + 0.4 * rand())
            if on_retry is not None:
                on_retry(attempt + 1, exc, delay)
            sleep(delay)
            attempt += 1


def extract_content(resp: Any) -> Any | None:
    """Safely extract candidate content from a Google GenAI response."""
    if resp is None:
        return None
    if not hasattr(resp, "candidates") or not resp.candidates:
        return None
    candidate = resp.candidates[0]
    if hasattr(candidate, "finish_reason"):
        reason = candidate.finish_reason
        reason_name = getattr(reason, "name", reason)
        if reason in ("SAFETY", "RECITATION", "BLOCKLIST") or reason_name in (
            "SAFETY",
            "RECITATION",
            "BLOCKLIST",
        ):
            return None
    if not hasattr(candidate, "content") or not candidate.content:
        return None
    if not hasattr(candidate.content, "parts") or not candidate.content.parts:
        return None
    return candidate.content
