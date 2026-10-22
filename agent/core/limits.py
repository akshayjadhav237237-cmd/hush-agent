"""Rate and usage limit wait management."""
from __future__ import annotations

import time
from typing import Any, Callable, Optional

DEFAULT_MAX_MINUTES: int = 360
DEFAULT_CHUNK_SECONDS: int = 30


def wait_for_reset(
    minutes: int,
    *,
    notify: Callable[[str], Any],
    kill: Any,
    sleep: Optional[Callable[[float], None]] = None,
    max_minutes: int = DEFAULT_MAX_MINUTES,
    chunk_seconds: int = DEFAULT_CHUNK_SECONDS,
) -> str:
    """Wait for service usage limit reset with periodic kill checks."""
    actual_sleep = sleep if sleep is not None else time.sleep
    chunk_seconds = max(1, chunk_seconds)
    minutes = max(1, min(minutes, max_minutes))
    total_seconds = minutes * 60

    notify(f"Waiting {minutes} minutes for service usage limit reset...")

    elapsed = 0
    while elapsed < total_seconds:
        if kill.is_set():
            notify("Usage limit wait aborted by kill switch.")
            return "killed"
        step_chunk = min(chunk_seconds, total_seconds - elapsed)
        actual_sleep(step_chunk)
        elapsed += step_chunk

    if kill.is_set():
        notify("Usage limit wait aborted by kill switch.")
        return "killed"

    if minutes >= max_minutes:
        notify(f"Wait reached maximum time limit cap ({max_minutes} minutes).")
        return "capped"

    notify(f"Wait complete ({minutes} minutes elapsed). Resuming task.")
    return "resumed"
