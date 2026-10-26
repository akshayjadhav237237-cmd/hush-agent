"""Real desktop test: Notepad open, paste text, read back, and close cleanly."""
import os
import subprocess
import time
import psutil
import pyautogui
import pyperclip
import pytest

from core.desktop_tools import DesktopTools
from tests_real.real_test_helper import pre_gui_warning, record_result, sha256_text


def test_real_desktop_notepad_interaction() -> None:
    pre_gui_warning("Opening Notepad, pasting text verification probe, and closing", wait_seconds=3)

    test_content = f"Hush Real Desktop Verification Probe - {time.time()}"
    desktop = DesktopTools()

    # Launch Notepad
    proc = subprocess.Popen(["notepad.exe"])
    time.sleep(2.0)

    # Find running Notepad process PID
    notepad_pids = [
        p.pid for p in psutil.process_iter(["name", "pid"])
        if p.info["name"] and "notepad" in p.info["name"].lower()
    ]

    try:
        # Focus window
        desktop.focus_window("Notepad")
        time.sleep(0.5)

        # If pointer is parked at (0, 0) by headless/background OS session,
        # temporarily disable failsafe for this specific paste to avoid false trip
        pos = pyautogui.position()
        was_failsafe = pyautogui.FAILSAFE
        if pos == (0, 0):
            pyautogui.FAILSAFE = False

        try:
            desktop.paste_any(test_content, press_enter=True)
            time.sleep(0.5)

            # Select all and copy to verify text is present in the Notepad buffer
            desktop.press_keys("ctrl+a")
            time.sleep(0.2)
            desktop.press_keys("ctrl+c")
            time.sleep(0.2)
        finally:
            pyautogui.FAILSAFE = was_failsafe

        copied = pyperclip.paste()
        assert test_content in copied, f"Expected '{test_content}' in copied buffer, got: '{copied}'"

        detail = f"Notepad opened, text pasted and verified via buffer on real Windows desktop."
        record_result(
            feature_id="desktop-notepad-paste-verify",
            status="PASS",
            detail=detail,
            evidence_hash=sha256_text(test_content),
        )
    finally:
        # Close Notepad processes cleanly without saving
        for pid in notepad_pids:
            try:
                p = psutil.Process(pid)
                p.terminate()
            except Exception:
                pass
