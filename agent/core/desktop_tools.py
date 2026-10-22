"""Desktop automation tools and screen interaction management."""
from __future__ import annotations

import io
import time
from typing import Any, Callable, Optional

from core.killswitch import is_failsafe
from core.types import ToolFunc

SHOT_WIDTH: int = 1280
MAX_READ_CLIPBOARD_CHARS: int = 4000
MAX_PASTE_TEXT_CHARS: int = 2000
MAX_WAIT_SECONDS: int = 120


class DesktopTools:
    """Desktop interaction implementation using GUI automation tools."""

    def __init__(
        self,
        pyautogui: Optional[Any] = None,
        pyperclip: Optional[Any] = None,
        gw: Optional[Any] = None,
        webbrowser: Optional[Any] = None,
        sleep: Callable[[float], None] = time.sleep,
    ) -> None:
        """Initialize desktop tools with optional injected dependencies."""
        if pyautogui is None:
            try:
                import pyautogui as _pyautogui

                _pyautogui.FAILSAFE = True
                _pyautogui.PAUSE = 0.4
                pyautogui = _pyautogui
            except Exception:
                pyautogui = None

        if pyperclip is None:
            try:
                import pyperclip as _pyperclip

                pyperclip = _pyperclip
            except Exception:
                pyperclip = None

        if gw is None:
            try:
                import pygetwindow as _gw

                gw = _gw
            except Exception:
                gw = None

        if webbrowser is None:
            try:
                import webbrowser as _webbrowser

                webbrowser = _webbrowser
            except Exception:
                webbrowser = None

        self.pyautogui = pyautogui
        self.pyperclip = pyperclip
        self.gw = gw
        self.webbrowser = webbrowser
        self.sleep = sleep
        self._scale: float = 1.0

    def clipboard_full(self) -> str:
        """Return complete unfiltered clipboard content."""
        if self.pyperclip is None:
            return ""
        text = self.pyperclip.paste()
        return text if text is not None else ""

    def paste_any(self, text: str, press_enter: bool = False) -> str:
        """Paste any string regardless of size via clipboard."""
        if self.pyperclip is not None:
            self.pyperclip.copy(text)
        if self.pyautogui is None:
            return "pyautogui unavailable."
        self.pyautogui.hotkey("ctrl", "v")
        self.sleep(0.5)
        if press_enter:
            self.pyautogui.press("enter")
        return f"Pasted {len(text)} characters" + (" and pressed Enter." if press_enter else ".")

    def screenshot_png(self) -> bytes:
        """Capture display, scale to SHOT_WIDTH, and return PNG bytes."""
        if self.pyautogui is None:
            raise RuntimeError("pyautogui is not available")
        img = self.pyautogui.screenshot()
        w, h = img.size
        self._scale = w / SHOT_WIDTH
        new_h = int(h / self._scale)
        resized = img.resize((SHOT_WIDTH, new_h))
        buf = io.BytesIO()
        resized.save(buf, format="PNG")
        return buf.getvalue()

    def open_app(self, name: str) -> str:
        """Open an application via the Windows Start menu."""
        if self.pyautogui is None:
            return "pyautogui unavailable."
        self.pyautogui.press("win")
        self.sleep(0.8)
        self.pyautogui.write(name, interval=0.03)
        self.sleep(1.2)
        self.pyautogui.press("enter")
        self.sleep(5.0)
        return f"Tried to open '{name}' via the Start menu. Take a screenshot to verify."

    def open_url(self, url: str) -> str:
        """Open a URL in the default browser."""
        if self.webbrowser is not None:
            self.webbrowser.open(url)
        self.sleep(4.0)
        return f"Opened {url} in the default browser."

    def focus_window(self, title_contains: str) -> str:
        """Focus a window containing the given title substring."""
        if self.gw is None:
            return "pygetwindow unavailable; use alt+tab via press_keys."
        wins = self.gw.getWindowsWithTitle(title_contains)
        if not wins:
            return f"No window containing '{title_contains}'."
        try:
            w = wins[0]
            if getattr(w, "isMinimized", False):
                w.restore()
            w.activate()
            self.sleep(0.8)
            return f"Focused window: {getattr(w, 'title', title_contains)}"
        except Exception as exc:
            if is_failsafe(exc):
                raise
            return f"Could not focus window: {exc}"

    def paste_text(self, text: str, press_enter: bool = False) -> str:
        """Paste text within limit or reject if too long."""
        if len(text) > MAX_PASTE_TEXT_CHARS:
            return "Too long: use paste_artifact"
        return self.paste_any(text, press_enter=press_enter)

    def press_keys(self, keys: str) -> str:
        """Press keyboard shortcut keys combination."""
        if self.pyautogui is None:
            return "pyautogui unavailable."
        parts = [k.strip() for k in keys.split("+")]
        self.pyautogui.hotkey(*parts)
        return f"Pressed {keys}"

    def click(self, x: int, y: int) -> str:
        """Click at scaled coordinates."""
        if self.pyautogui is None:
            return "pyautogui unavailable."
        scaled_x = int(x * self._scale)
        scaled_y = int(y * self._scale)
        self.pyautogui.click(scaled_x, scaled_y)
        return f"Clicked ({x},{y})"

    def scroll(self, amount: int) -> str:
        """Scroll mouse wheel by specified amount."""
        if self.pyautogui is None:
            return "pyautogui unavailable."
        self.pyautogui.scroll(amount)
        return f"Scrolled {amount}"

    def read_clipboard(self) -> str:
        """Return clipboard content truncated to MAX_READ_CLIPBOARD_CHARS."""
        return self.clipboard_full()[:MAX_READ_CLIPBOARD_CHARS]

    def wait(self, seconds: int) -> str:
        """Sleep for specified seconds capped at MAX_WAIT_SECONDS."""
        duration = min(int(seconds), MAX_WAIT_SECONDS)
        self.sleep(duration)
        return f"Waited {duration}s"

    def funcs(self) -> dict[str, ToolFunc]:
        """Return dictionary of exposed desktop tool functions."""
        return {
            "open_app": self.open_app,
            "open_url": self.open_url,
            "focus_window": self.focus_window,
            "paste_text": self.paste_text,
            "press_keys": self.press_keys,
            "click": self.click,
            "scroll": self.scroll,
            "read_clipboard": self.read_clipboard,
            "wait": self.wait,
        }
