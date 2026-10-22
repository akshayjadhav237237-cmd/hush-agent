"""Vision utilities for converting screenshots and managing conversation image history."""
from __future__ import annotations

from typing import Any


def png_part(png_bytes: bytes) -> Any:
    """Create a Part object from PNG image bytes."""
    from google.genai import types

    return types.Part.from_bytes(data=png_bytes, mime_type="image/png")


def strip_old_images(contents: list[Any], keep: int = 2) -> None:
    """Retain up to `keep` newest screenshots in contents and replace older ones with placeholders."""
    from google.genai import types

    seen = 0
    for content in reversed(contents):
        parts = getattr(content, "parts", None)
        if parts is None and isinstance(content, dict):
            parts = content.get("parts")
        if not parts:
            continue
        for i, part in enumerate(parts):
            if getattr(part, "inline_data", None) is not None:
                seen += 1
                if seen > keep:
                    parts[i] = types.Part.from_text(text="[old screenshot removed]")
