"""Loop breaker and static screen detection."""
from __future__ import annotations

import io
from typing import Optional

DEFAULT_SAME_THRESHOLD: int = 3
DEFAULT_WAIT_THRESHOLD: int = 15
DEFAULT_MAX_DISTANCE: int = 4

ACT_ACTIONS: frozenset[str] = frozenset({
    "click",
    "press_keys",
    "paste_text",
    "paste_artifact",
    "open_app",
    "open_url",
    "focus_window",
    "scroll",
})


def action_kind(tool_name: str) -> str:
    """Categorize a tool name into 'act', 'wait', or 'other'."""
    if tool_name in ACT_ACTIONS:
        return "act"
    if tool_name == "wait":
        return "wait"
    return "other"


def hamming(a: int, b: int) -> int:
    """Calculate the Hamming distance between two integers."""
    return (a ^ b).bit_count()


def dhash(png_bytes: bytes) -> int:
    """Convert PNG bytes to a 64-bit difference hash."""
    from PIL import Image

    image = Image.open(io.BytesIO(png_bytes)).convert("L")
    resample = getattr(Image.Resampling, "LANCZOS", Image.LANCZOS) if hasattr(Image, "Resampling") else Image.LANCZOS
    resized = image.resize((9, 8), resample=resample)
    pixels = resized.load()

    hash_val = 0
    for y in range(8):
        for x in range(8):
            hash_val = (hash_val << 1) | (1 if pixels[x, y] > pixels[x + 1, y] else 0)
    return hash_val


class LoopBreaker:
    """Detects repeated static screen loops across actions or waits."""

    def __init__(
        self,
        same_threshold: int = DEFAULT_SAME_THRESHOLD,
        wait_threshold: int = DEFAULT_WAIT_THRESHOLD,
        max_distance: int = DEFAULT_MAX_DISTANCE,
    ) -> None:
        self.same_threshold: int = same_threshold
        self.wait_threshold: int = wait_threshold
        self.max_distance: int = max_distance
        self.last_hash: Optional[int] = None
        self.same_count: int = 0
        self.wait_count: int = 0

    def reset(self) -> None:
        """Reset internal counters and last seen image hash."""
        self.same_count = 0
        self.wait_count = 0
        self.last_hash = None

    def observe(self, image_hash: int, last_action_kind: str) -> Optional[str]:
        """Observe screen hash and return reason string if static threshold met."""
        if self.last_hash is None:
            self.last_hash = image_hash
            return None

        distance = hamming(self.last_hash, image_hash)
        is_similar = distance <= self.max_distance

        if not is_similar:
            self.last_hash = image_hash
            self.same_count = 0
            self.wait_count = 0
            return None

        self.last_hash = image_hash
        if last_action_kind == "act":
            self.same_count += 1
            if self.same_count >= self.same_threshold:
                return f"Screen remained static across {self.same_count} consecutive interactive actions."
        elif last_action_kind == "wait":
            self.wait_count += 1
            if self.wait_count >= self.wait_threshold:
                return f"Screen remained static across {self.wait_count} consecutive wait intervals."

        return None
