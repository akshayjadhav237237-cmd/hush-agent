"""Unit tests for DesktopTools implementation and safety behavior."""
from __future__ import annotations

import io
from unittest.mock import MagicMock
import pytest

from core.desktop_tools import (
    MAX_PASTE_TEXT_CHARS,
    MAX_READ_CLIPBOARD_CHARS,
    MAX_WAIT_SECONDS,
    SHOT_WIDTH,
    DesktopTools,
)


def test_funcs_returns_all_standard_desktop_tools() -> None:
    """Verify funcs() returns mapping with all standard desktop tools."""
    dt = DesktopTools(
        pyautogui=MagicMock(),
        pyperclip=MagicMock(),
        gw=MagicMock(),
        webbrowser=MagicMock(),
        sleep=lambda _: None,
    )
    tools = dt.funcs()
    expected_tools = {
        "open_app",
        "open_url",
        "focus_window",
        "paste_text",
        "press_keys",
        "click",
        "scroll",
        "read_clipboard",
        "wait",
    }
    assert set(tools.keys()) == expected_tools
    for name, func in tools.items():
        assert callable(func)


def test_read_clipboard_truncates_and_clipboard_full_complete() -> None:
    """Verify read_clipboard() truncates to 4000 characters while clipboard_full() returns all."""
    mock_pyperclip = MagicMock()
    long_content = "X" * 6000
    mock_pyperclip.paste.return_value = long_content

    dt = DesktopTools(pyperclip=mock_pyperclip)
    assert dt.clipboard_full() == long_content
    assert len(dt.clipboard_full()) == 6000

    truncated = dt.read_clipboard()
    assert len(truncated) == MAX_READ_CLIPBOARD_CHARS
    assert truncated == "X" * 4000
    assert dt.funcs()["read_clipboard"]() == "X" * 4000


def test_paste_text_rejects_long_text_with_use_paste_artifact() -> None:
    """Verify paste_text() rejects text over 2000 chars with 'Too long: use paste_artifact'."""
    mock_pyperclip = MagicMock()
    mock_pyautogui = MagicMock()
    dt = DesktopTools(pyautogui=mock_pyautogui, pyperclip=mock_pyperclip, sleep=lambda _: None)

    # Within limit of 2000 characters
    ok_text = "a" * MAX_PASTE_TEXT_CHARS
    res_ok = dt.paste_text(ok_text)
    assert f"Pasted {MAX_PASTE_TEXT_CHARS} characters." == res_ok
    mock_pyperclip.copy.assert_called_with(ok_text)

    mock_pyperclip.copy.reset_mock()
    # Exceeding limit: 2001 characters
    long_text = "a" * (MAX_PASTE_TEXT_CHARS + 1)
    res_rejected = dt.paste_text(long_text)
    assert res_rejected == "Too long: use paste_artifact"
    mock_pyperclip.copy.assert_not_called()


def test_paste_any_pastes_strings_exceeding_limit() -> None:
    """Verify paste_any() pastes strings > 2000 characters without rejection."""
    mock_pyperclip = MagicMock()
    mock_pyautogui = MagicMock()
    sleep_calls: list[float] = []
    dt = DesktopTools(
        pyautogui=mock_pyautogui,
        pyperclip=mock_pyperclip,
        sleep=sleep_calls.append,
    )

    huge_text = "z" * 5000
    res = dt.paste_any(huge_text, press_enter=True)
    assert res == "Pasted 5000 characters and pressed Enter."
    mock_pyperclip.copy.assert_called_once_with(huge_text)
    mock_pyautogui.hotkey.assert_called_once_with("ctrl", "v")
    mock_pyautogui.press.assert_called_once_with("enter")
    assert sleep_calls == [0.5]


def test_screenshot_png_computes_scale_and_returns_png() -> None:
    """Verify screenshot_png() computes scale, resizes image, and returns PNG bytes."""
    from PIL import Image

    # 2560x1440 image -> scale = 2560 / 1280 = 2.0
    original_img = Image.new("RGB", (2560, 1440), color="blue")
    mock_pyautogui = MagicMock()
    mock_pyautogui.screenshot.return_value = original_img

    dt = DesktopTools(pyautogui=mock_pyautogui)
    assert dt._scale == 1.0

    png_bytes = dt.screenshot_png()
    assert isinstance(png_bytes, bytes)
    assert png_bytes.startswith(b"\x89PNG")
    assert dt._scale == 2560 / SHOT_WIDTH
    assert dt._scale == 2.0

    # Verify resized image dimensions
    result_img = Image.open(io.BytesIO(png_bytes))
    assert result_img.size == (SHOT_WIDTH, 720)


def test_click_scales_coordinates_using_scale() -> None:
    """Verify click() scales coordinates using self._scale."""
    mock_pyautogui = MagicMock()
    dt = DesktopTools(pyautogui=mock_pyautogui)
    dt._scale = 1.75

    res = dt.click(100, 200)
    assert res == "Clicked (100,200)"
    mock_pyautogui.click.assert_called_once_with(175, 350)


def test_wait_caps_at_max_wait_seconds() -> None:
    """Verify wait() caps sleep duration at 120 seconds."""
    slept: list[float] = []
    dt = DesktopTools(sleep=slept.append)

    # Below cap
    res_under = dt.wait(15)
    assert res_under == "Waited 15s"
    assert slept[-1] == 15

    # Above cap
    res_over = dt.wait(300)
    assert res_over == f"Waited {MAX_WAIT_SECONDS}s"
    assert slept[-1] == MAX_WAIT_SECONDS


def test_failsafe_exception_propagates_uncaught() -> None:
    """Verify FailSafeException from pyautogui propagates uncaught."""

    class FailSafeException(Exception):
        """Mock FailSafeException mimicking pyautogui."""

    mock_pyautogui = MagicMock()
    mock_pyautogui.click.side_effect = FailSafeException("Failsafe corner trip on click")
    mock_pyautogui.hotkey.side_effect = FailSafeException("Failsafe corner trip on hotkey")
    mock_pyautogui.screenshot.side_effect = FailSafeException("Failsafe corner trip on shot")

    dt = DesktopTools(pyautogui=mock_pyautogui, sleep=lambda _: None)

    # click() propagates
    with pytest.raises(FailSafeException):
        dt.click(50, 50)

    # funcs()["click"] propagates
    with pytest.raises(FailSafeException):
        dt.funcs()["click"](50, 50)

    # screenshot_png() propagates
    with pytest.raises(FailSafeException):
        dt.screenshot_png()

    # paste_text() propagates
    with pytest.raises(FailSafeException):
        dt.paste_text("test")

    # focus_window() propagates if window activation raises FailSafeException
    mock_win = MagicMock()
    mock_win.activate.side_effect = FailSafeException("Failsafe during activate")
    mock_gw = MagicMock()
    mock_gw.getWindowsWithTitle.return_value = [mock_win]
    dt_gw = DesktopTools(gw=mock_gw, sleep=lambda _: None)
    with pytest.raises(FailSafeException):
        dt_gw.focus_window("target")


def test_open_app_and_open_url() -> None:
    """Verify open_app and open_url execute expected workflows."""
    mock_pyautogui = MagicMock()
    mock_browser = MagicMock()
    slept: list[float] = []

    dt = DesktopTools(
        pyautogui=mock_pyautogui,
        webbrowser=mock_browser,
        sleep=slept.append,
    )

    res_app = dt.open_app("calculator")
    assert "calculator" in res_app
    mock_pyautogui.press.assert_any_call("win")
    mock_pyautogui.write.assert_called_once_with("calculator", interval=0.03)
    mock_pyautogui.press.assert_any_call("enter")

    res_url = dt.open_url("https://example.com")
    assert "https://example.com" in res_url
    mock_browser.open.assert_called_once_with("https://example.com")


def test_focus_window_scenarios() -> None:
    """Verify focus_window handles missing pygetwindow, window not found, and errors."""
    # pygetwindow missing
    dt_nogw = DesktopTools(gw=None)
    dt_nogw.gw = None
    assert "pygetwindow unavailable" in dt_nogw.focus_window("Chrome")

    # window not found
    mock_gw = MagicMock()
    mock_gw.getWindowsWithTitle.return_value = []
    dt = DesktopTools(gw=mock_gw)
    assert "No window containing 'Chrome'" in dt.focus_window("Chrome")

    # window found and restored/activated
    mock_win = MagicMock()
    mock_win.title = "Google Chrome"
    mock_win.isMinimized = True
    mock_gw.getWindowsWithTitle.return_value = [mock_win]
    dt_found = DesktopTools(gw=mock_gw, sleep=lambda _: None)
    res = dt_found.focus_window("Chrome")
    assert res == "Focused window: Google Chrome"
    mock_win.restore.assert_called_once()
    mock_win.activate.assert_called_once()

    # non-failsafe exception captured gracefully
    mock_win_err = MagicMock()
    mock_win_err.activate.side_effect = RuntimeError("Activation failed")
    mock_gw.getWindowsWithTitle.return_value = [mock_win_err]
    res_err = dt_found.focus_window("Chrome")
    assert "Could not focus window: Activation failed" in res_err


def test_press_keys_and_scroll() -> None:
    """Verify press_keys and scroll invoke pyautogui methods."""
    mock_pyautogui = MagicMock()
    dt = DesktopTools(pyautogui=mock_pyautogui)

    res_keys = dt.press_keys("ctrl + alt + del")
    assert res_keys == "Pressed ctrl + alt + del"
    mock_pyautogui.hotkey.assert_called_once_with("ctrl", "alt", "del")

    res_scroll = dt.scroll(-120)
    assert res_scroll == "Scrolled -120"
    mock_pyautogui.scroll.assert_called_once_with(-120)


def test_default_init_and_missing_deps_handling() -> None:
    """Verify fallback handling when optional dependencies are None."""
    dt = DesktopTools(pyautogui=None, pyperclip=None, gw=None, webbrowser=None)
    # Ensure they are None for headless tests
    dt.pyautogui = None
    dt.pyperclip = None
    dt.gw = None

    assert dt.clipboard_full() == ""
    assert dt.read_clipboard() == ""
    assert dt.open_app("notepad") == "pyautogui unavailable."
    assert dt.press_keys("enter") == "pyautogui unavailable."
    assert dt.click(10, 10) == "pyautogui unavailable."
    assert dt.scroll(100) == "pyautogui unavailable."
    assert dt.paste_any("text") == "pyautogui unavailable."
    with pytest.raises(RuntimeError, match="pyautogui is not available"):
        dt.screenshot_png()
