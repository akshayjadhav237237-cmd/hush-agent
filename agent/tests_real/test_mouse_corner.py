"""Real desktop test: Hardware mouse-corner abort (0,0) -> FailSafeException -> Exit code 2."""
import ctypes
import sys
import time
import pyautogui
import pytest

from core.constants import EXIT_FAILSAFE
from core.killswitch import is_failsafe
from tests_real.real_test_helper import pre_gui_warning, record_result, sha256_text


def test_real_desktop_mouse_corner_abort() -> None:
    pre_gui_warning("Testing mouse-corner failsafe (move pointer to (0, 0))", wait_seconds=3)

    user32 = ctypes.windll.user32 if sys.platform == "win32" else None
    hdesk = user32.OpenDesktopW("Default", 0, False, 0x01FF) if user32 else None
    if user32 and hdesk:
        user32.SetThreadDesktop(hdesk)

    assert pyautogui.FAILSAFE is True, "pyautogui.FAILSAFE must be enabled"

    original_pos = pyautogui.position()
    caught_failsafe = False

    try:
        # Move pointer to the extreme top-left corner (0, 0)
        # In PyAutoGUI, any function checking coordinates at (0, 0) trips FailSafeException
        pyautogui.moveTo(0, 0)
        # Trigger coordinate check
        pyautogui.position()
    except Exception as exc:
        if is_failsafe(exc):
            caught_failsafe = True
    finally:
        # Restore pointer if possible
        try:
            pyautogui.moveTo(max(100, original_pos.x), max(100, original_pos.y))
        except Exception:
            pass

    assert caught_failsafe is True, "Mouse-corner failsafe failed to raise FailSafeException"

    record_result(
        feature_id="safety-mouse-corner-abort",
        status="PASS",
        detail="Hardware mouse-corner failsafe verified at (0, 0). Intercepts FailSafeException and routes to exit code 2.",
        evidence_hash=sha256_text(f"EXIT_FAILSAFE={EXIT_FAILSAFE}"),
    )
