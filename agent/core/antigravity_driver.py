"""Antigravity IDE desktop driver and coordinate calibration."""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import time
from typing import Any, Callable, Optional

CALIBRATION_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config", "calibration.json"
)

DEFAULT_ANTIGRAVITY_PATH = os.path.expandvars(
    r"%LOCALAPPDATA%\Programs\antigravity\Antigravity.exe"
)


def load_calibration() -> dict[str, Any]:
    """Load UI coordinates and hotkeys from config/calibration.json."""
    if os.path.exists(CALIBRATION_PATH):
        try:
            with open(CALIBRATION_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "agent_input": {"x": 1050, "y": 800, "hotkey": "ctrl+l"},
        "editor_area": {"x": 600, "y": 450},
    }


def find_antigravity_exe() -> Optional[str]:
    """Locate the Antigravity executable."""
    candidates = [
        shutil.which("antigravity"),
        shutil.which("agy"),
        DEFAULT_ANTIGRAVITY_PATH,
    ]
    for cand in candidates:
        if cand and os.path.exists(cand):
            return cand
    return None


class AntigravityDriver:
    """Automates Antigravity IDE code generation in a supervised scratch window."""

    def __init__(
        self,
        desktop_tools: Any,
        ask_human: Optional[Callable[[str], str]] = None,
        audit: Optional[Any] = None,
    ) -> None:
        self.desktop = desktop_tools
        self.ask_human = ask_human
        self.audit = audit
        self.calibration = load_calibration()

    def open_workspace(self, folder: str, new_window: bool = True) -> str:
        """Open a directory in Antigravity in a separate window."""
        exe = find_antigravity_exe()
        if not exe:
            raise FileNotFoundError("Antigravity executable not found on system.")

        os.makedirs(folder, exist_ok=True)
        args = [exe]
        if new_window:
            args.append("-n")
        args.append(folder)

        subprocess.Popen(args)
        time.sleep(3.0)
        self.desktop.focus_window("Antigravity")
        return f"Opened {folder} in Antigravity (new window)."

    def focus_agent_input(self) -> None:
        """Focus the Antigravity prompt input via hotkey or calibrated coordinate."""
        self.desktop.focus_window("Antigravity")
        time.sleep(0.3)

        cal = self.calibration.get("agent_input", {})
        hotkey = cal.get("hotkey", "ctrl+l")

        # Try hotkey chord
        self.desktop.press_keys(hotkey)
        time.sleep(0.5)

        # Fallback to calibrated coordinate click if configured
        x = cal.get("x")
        y = cal.get("y")
        if x and y:
            self.desktop.click(x, y)
            time.sleep(0.3)

    def submit_prompt(self, prompt: str) -> str:
        """Paste prompt into focused input and press Enter."""
        self.focus_agent_input()
        res = self.desktop.paste_any(prompt, press_enter=True)
        if self.audit:
            self.audit.log("antigravity_prompt_submitted", chars=len(prompt))
        return res

    def wait_completion(
        self,
        project_dir: str,
        stable_seconds: int = 10,
        timeout_seconds: int = 600,
    ) -> bool:
        """Wait until code generation finishes (no filesystem updates for stable_seconds)."""
        start_time = time.time()
        last_mtime = self._latest_mtime(project_dir)
        stable_count = 0

        while time.time() - start_time < timeout_seconds:
            time.sleep(1.0)
            current_mtime = self._latest_mtime(project_dir)
            if current_mtime == last_mtime:
                stable_count += 1
                if stable_count >= stable_seconds:
                    return True
            else:
                stable_count = 0
                last_mtime = current_mtime

        if self.ask_human:
            reply = self.ask_human(
                "Antigravity build has been running for 10 minutes. "
                "Has it finished generating code? [y/N]: "
            )
            return reply.strip().lower() in ("y", "yes")
        return False

    def _latest_mtime(self, folder: str) -> float:
        """Return newest modification timestamp in folder."""
        latest = 0.0
        try:
            for root, _, files in os.walk(folder):
                for f in files:
                    try:
                        mt = os.path.getmtime(os.path.join(root, f))
                        if mt > latest:
                            latest = mt
                    except OSError:
                        pass
        except Exception:
            pass
        return latest


def run_calibration() -> int:
    """Interactive CLI routine to calibrate Antigravity UI coordinates."""
    import pyautogui

    print("\n" + "=" * 70)
    print(" 🎯 HUSH ANTIGRAVITY COORDINATE CALIBRATOR (--calibrate)")
    print("=" * 70)
    print("This utility records screen coordinates for Antigravity UI elements.")
    print("Ensure Antigravity is open and visible on your primary display.\n")

    targets = [
        ("agent_input", "Hover your mouse over the Antigravity Agent chat input field"),
        ("editor_area", "Hover your mouse over the Central Code Editor pane"),
    ]

    calibration_data: dict[str, Any] = load_calibration()

    for key, instruction in targets:
        print(f"\nTarget: {key.upper()}")
        print(f"Instruction: {instruction}")
        print("Capturing mouse position in 5 seconds...")
        for remaining in range(5, 0, -1):
            print(f"  {remaining}...", end="\r", flush=True)
            time.sleep(1.0)

        pos = pyautogui.position()
        print(f"  Captured position: (x={pos.x}, y={pos.y})           ")
        if key not in calibration_data:
            calibration_data[key] = {}
        calibration_data[key]["x"] = pos.x
        calibration_data[key]["y"] = pos.y

    os.makedirs(os.path.dirname(CALIBRATION_PATH), exist_ok=True)
    with open(CALIBRATION_PATH, "w", encoding="utf-8") as f:
        json.dump(calibration_data, f, indent=2)

    print("\n" + "-" * 70)
    print(f"Calibration saved successfully to: {CALIBRATION_PATH}")
    print("=" * 70 + "\n")
    return 0
