"""Unit tests for synthetic demo screen rendering."""
from __future__ import annotations

import io
import sys
from typing import Any
import pytest
from PIL import Image

from core.demo.screens import (
    HEIGHT,
    SUPPORTED_APPS,
    WIDTH,
    _PALETTES,
    render_screen,
)

PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def test_render_screen_returns_valid_png_signature() -> None:
    """Test 1: render_screen returns valid PNG bytes with standard signature."""
    raw_bytes = render_screen("desktop", {"lines": ["Welcome to Hush Demo"]})
    assert isinstance(raw_bytes, bytes)
    assert len(raw_bytes) > 0
    assert raw_bytes.startswith(PNG_SIGNATURE)


def test_render_screen_output_dimensions_strictly_1280x720() -> None:
    """Test 2: output dimensions are strictly 1280x720 across different apps."""
    for app in SUPPORTED_APPS:
        raw_bytes = render_screen(app, {"lines": [f"Testing {app}"]})
        with Image.open(io.BytesIO(raw_bytes)) as img:
            assert img.size == (1280, 720)
            assert img.width == WIDTH
            assert img.height == HEIGHT
            assert img.format == "PNG"


def test_render_screen_deterministic_bytes() -> None:
    """Test 3: identical app + state produces identical byte output."""
    state = {
        "lines": ["Line 1", "Line 2", "Status: OK"],
        "buttons": ["[F1] Run", "[F2] Copy"],
    }
    bytes_1 = render_screen("antigravity", state)
    bytes_2 = render_screen("antigravity", state)
    assert bytes_1 == bytes_2


def test_different_states_produce_different_bytes() -> None:
    """Test 4: different states or text lines produce different bytes."""
    state_a = {"lines": ["Alpha test text"]}
    state_b = {"lines": ["Beta test text with different words"]}
    bytes_a = render_screen("claude", state_a)
    bytes_b = render_screen("claude", state_b)
    assert bytes_a != bytes_b

    # State with buttons vs different buttons
    bytes_btn1 = render_screen("claude", {"buttons": ["[F1] Run"]})
    bytes_btn2 = render_screen("claude", {"buttons": ["[F9] Stop"]})
    assert bytes_btn1 != bytes_btn2


def test_all_supported_apps_render_cleanly() -> None:
    """Test 5: all 4 supported apps render cleanly without error and with distinct palettes."""
    expected_apps = {"desktop", "claude", "gemini", "antigravity"}
    assert SUPPORTED_APPS == expected_apps

    rendered: dict[str, bytes] = {}
    for app in SUPPORTED_APPS:
        png_data = render_screen(app, {"lines": [f"Active App: {app}"]})
        assert png_data.startswith(PNG_SIGNATURE)
        rendered[app] = png_data

    # Ensure different apps have distinct visual renderings (palettes)
    app_list = list(SUPPORTED_APPS)
    for i in range(len(app_list)):
        for j in range(i + 1, len(app_list)):
            assert rendered[app_list[i]] != rendered[app_list[j]]


def test_buttons_and_shortcuts_are_drawn() -> None:
    """Test 6: buttons and shortcuts are drawn onto the image and alter pixels."""
    # Screen with no buttons
    bytes_no_btn = render_screen("desktop", {"lines": [], "buttons": []})
    # Screen with custom button
    button_label = "[F1] TestAction"
    bytes_with_btn = render_screen("desktop", {"lines": [], "buttons": [button_label]})

    assert bytes_no_btn != bytes_with_btn

    with Image.open(io.BytesIO(bytes_no_btn)) as img_no:
        with Image.open(io.BytesIO(bytes_with_btn)) as img_btn:
            # The button is positioned at x=40, y=615..655
            # At (60, 630), img_no has desktop background color (24, 24, 27)
            # img_btn has the button background color (63, 63, 70) or text color
            pixel_no = img_no.getpixel((60, 630))
            pixel_btn = img_btn.getpixel((60, 630))
            assert pixel_no == _PALETTES["desktop"]["bg"]
            assert pixel_btn != pixel_no
            assert pixel_btn == _PALETTES["desktop"]["button_bg"]


def test_default_buttons_rendered_when_omitted() -> None:
    """Verify default shortcuts [F1] Run, [F2] Copy reply, [Enter] Submit appear when omitted."""
    bytes_default = render_screen("gemini", {})
    bytes_empty_buttons = render_screen("gemini", {"buttons": []})
    assert bytes_default != bytes_empty_buttons

    with Image.open(io.BytesIO(bytes_default)) as img:
        # Default button is drawn at (60, 630)
        assert img.getpixel((60, 630)) == _PALETTES["gemini"]["button_bg"]


def test_unsupported_app_fallback() -> None:
    """Verify unknown apps fallback gracefully to desktop palette."""
    bytes_unknown = render_screen("unknown_custom_app", {"lines": ["Hello"]})
    bytes_desktop = render_screen("desktop", {"lines": ["Hello"]})
    assert bytes_unknown.startswith(PNG_SIGNATURE)
    # Background and dimensions match desktop
    with Image.open(io.BytesIO(bytes_unknown)) as img:
        assert img.size == (WIDTH, HEIGHT)
        # Pixel at (5, 55) is in background area
        assert img.getpixel((5, 55)) == _PALETTES["desktop"]["bg"]


def test_pillow_not_imported_at_screens_module_level() -> None:
    """Verify Pillow is lazily imported inside render_screen, not at module top level."""
    # Ensure screens module itself does not expose Image or ImageDraw as top-level globals
    import core.demo.screens as screens_mod

    assert "Image" not in screens_mod.__dict__
    assert "ImageDraw" not in screens_mod.__dict__
    assert "ImageFont" not in screens_mod.__dict__
