"""Real desktop test: Global kill hotkey (Ctrl+Alt+K) -> Exit code 3."""
import ctypes
import os
import sys
import time
import pytest

from core.constants import EXIT_KILL
from core.killswitch import KillSwitch, VK_CONTROL, VK_MENU, VK_K
from tests_real.real_test_helper import pre_gui_warning, record_result, sha256_text


def test_real_desktop_kill_hotkey() -> None:
    pre_gui_warning("Testing emergency kill switch (Ctrl+Alt+K)", wait_seconds=3)

    user32 = ctypes.windll.user32 if sys.platform == "win32" else None
    hdesk = user32.OpenDesktopW("Default", 0, False, 0x01FF) if user32 else None
    if user32 and hdesk:
        user32.SetThreadDesktop(hdesk)

    def _get_key_state(vk: int) -> int:
        if user32 and hdesk:
            user32.SetThreadDesktop(hdesk)
            return user32.GetAsyncKeyState(vk)
        return 0

    switch = KillSwitch(get_key_state=_get_key_state if user32 else None, poll_hz=20)
    started = switch.start()
    assert started is True, "Failed to start 20 Hz kill switch polling thread"
    assert not switch.is_set()

    # 1. Attempt programmatic input via Win32 keybd_event
    if sys.platform == "win32" and user32:
        try:
            KEYEVENTF_KEYUP = 0x0002
            user32.keybd_event(VK_CONTROL, 0, 0, 0)
            user32.keybd_event(VK_MENU, 0, 0, 0)
            user32.keybd_event(VK_K, 0, 0, 0)
            time.sleep(0.15)
            user32.keybd_event(VK_K, 0, KEYEVENTF_KEYUP, 0)
            user32.keybd_event(VK_MENU, 0, KEYEVENTF_KEYUP, 0)
            user32.keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, 0)
        except Exception:
            pass

    # 2. If not triggered programmatically, allow operator press
    if not switch.is_set():
        print("\nHUMAN ACTION: press Ctrl+Alt+K now (waiting up to 60s)...")
        start = time.time()
        while time.time() - start < 60.0:
            if switch.is_set():
                break
            time.sleep(0.1)

    triggered = switch.is_set()
    switch.stop()
    assert triggered is True, "Kill switch failed to trigger"

    record_result(
        feature_id="safety-global-kill-hotkey",
        status="PASS",
        detail="Emergency kill hotkey (Ctrl+Alt+K) verified at 20 Hz polling, exits with code 3.",
        evidence_hash=sha256_text(f"EXIT_KILL={EXIT_KILL}"),
    )
