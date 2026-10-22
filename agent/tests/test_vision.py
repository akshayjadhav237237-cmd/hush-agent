"""Unit tests for vision utilities and image retention management."""
from __future__ import annotations

from typing import Any

from core.vision import png_part, strip_old_images


def test_png_part_creates_part_with_mime_type() -> None:
    """Verify png_part creates a types.Part with image/png mime type and data."""
    data = b"\x89PNG\r\n\x1a\nfake_image_bytes"
    part = png_part(data)
    assert part.inline_data is not None
    assert part.inline_data.mime_type == "image/png"
    assert part.inline_data.data == data


def test_strip_old_images_retains_up_to_keep_and_replaces_older() -> None:
    """Verify strip_old_images retains keep screenshots and replaces older ones."""
    from google.genai import types

    contents = [
        types.Content(parts=[png_part(b"img1")]),
        types.Content(parts=[png_part(b"img2")]),
        types.Content(parts=[png_part(b"img3")]),
        types.Content(parts=[png_part(b"img4")]),
    ]

    strip_old_images(contents, keep=2)

    # Oldest 2 (index 0 and 1) must be replaced
    assert contents[0].parts[0].inline_data is None
    assert contents[0].parts[0].text == "[old screenshot removed]"

    assert contents[1].parts[0].inline_data is None
    assert contents[1].parts[0].text == "[old screenshot removed]"

    # Newest 2 (index 2 and 3) must be retained
    assert contents[2].parts[0].inline_data is not None
    assert contents[2].parts[0].inline_data.data == b"img3"

    assert contents[3].parts[0].inline_data is not None
    assert contents[3].parts[0].inline_data.data == b"img4"


def test_strip_old_images_leaves_text_parts_unmodified() -> None:
    """Verify strip_old_images leaves non-image parts completely unmodified."""
    from google.genai import types

    contents = [
        types.Content(parts=[types.Part.from_text(text="User Turn 1"), png_part(b"img1")]),
        types.Content(parts=[types.Part.from_text(text="User Turn 2"), png_part(b"img2")]),
        types.Content(parts=[types.Part.from_text(text="User Turn 3"), png_part(b"img3")]),
    ]

    strip_old_images(contents, keep=1)

    # Text parts must remain intact across all turns
    assert contents[0].parts[0].text == "User Turn 1"
    assert contents[1].parts[0].text == "User Turn 2"
    assert contents[2].parts[0].text == "User Turn 3"

    # Images: turn 1 and 2 replaced, turn 3 retained
    assert contents[0].parts[1].text == "[old screenshot removed]"
    assert contents[0].parts[1].inline_data is None

    assert contents[1].parts[1].text == "[old screenshot removed]"
    assert contents[1].parts[1].inline_data is None

    assert contents[2].parts[1].inline_data is not None
    assert contents[2].parts[1].inline_data.data == b"img3"


def test_strip_old_images_handles_empty_and_no_images() -> None:
    """Verify strip_old_images gracefully handles empty contents and turns without images."""
    from google.genai import types

    # Empty contents list
    empty_list: list[Any] = []
    strip_old_images(empty_list, keep=2)
    assert empty_list == []

    # Contents with only text parts
    text_only = [
        types.Content(parts=[types.Part.from_text(text="hello")]),
        types.Content(parts=[types.Part.from_text(text="world")]),
    ]
    strip_old_images(text_only, keep=2)
    assert text_only[0].parts[0].text == "hello"
    assert text_only[1].parts[0].text == "world"

    # Contents with empty parts
    empty_parts_content = types.Content(parts=[])
    strip_old_images([empty_parts_content], keep=2)
    assert empty_parts_content.parts == []


def test_strip_old_images_fewer_images_than_keep() -> None:
    """Verify strip_old_images does nothing when image count is <= keep."""
    contents = [
        png_part(b"img1"),
        png_part(b"img2"),
    ]
    from google.genai import types

    wrapped = [types.Content(parts=[c]) for c in contents]
    strip_old_images(wrapped, keep=5)
    assert wrapped[0].parts[0].inline_data is not None
    assert wrapped[0].parts[0].inline_data.data == b"img1"
    assert wrapped[1].parts[0].inline_data is not None
    assert wrapped[1].parts[0].inline_data.data == b"img2"


def test_vision_lazy_import_no_module_level_genai() -> None:
    """Verify core.vision does not import google.genai at module level."""
    import core.vision as vision_mod

    assert "genai" not in vision_mod.__dict__
    assert "types" not in vision_mod.__dict__
