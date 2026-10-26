"""Real hardware desktop test for the loop breaker.
- Prints 5-second countdown warning before any GUI interaction: 'Starting loop breaker test in 5s...'.
- Captures 3 screenshots of a static screen (with 1s delay), computes perceptual or pixel hash/distance. Asserts that loop breaker detects static repetition and triggers an alert/flag.
- Then captures 3 screenshots where a cursor blinks or small movement occurs (or dynamic change), asserting NO static loop alert.
- Saves the 6 PNGs to verification/shots/ (static_1.png .. static_3.png, dynamic_1.png .. dynamic_3.png).
- Writes their SHA-256 hashes and pairwise Hamming / difference distances to verification/loopbreaker_real.json.
- Ensures top-left failsafe and clean error handling are preserved.
- Follows repo patterns and imports from agent/core/loop_breaker.py.
"""
from __future__ import annotations

import datetime
import hashlib
import json
import os
import sys
import time
import tkinter as tk
from typing import Any, Optional
import ctypes

import pyautogui
import pytest

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(REPO_ROOT, "agent"))

from core.loopbreaker import LoopBreaker, dhash, hamming
from core.killswitch import is_failsafe
from tests_real.real_test_helper import pre_gui_warning, record_result, sha256_text

VERIFICATION_DIR = os.path.join(REPO_ROOT, "verification")
SHOTS_DIR = os.path.join(VERIFICATION_DIR, "shots")
JSON_OUTPUT_PATH = os.path.join(VERIFICATION_DIR, "loopbreaker_real.json")


def _sha256_file(path: str) -> str:
    """Compute sha256 hash of a file."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            chunk = f.read(8192)
            if not chunk:
                break
            h.update(chunk)
    return f"sha256:{h.hexdigest()}"


def test_loopbreaker_real_desktop() -> None:
    """Real desktop hardware test for loop breaker with static and dynamic screen captures."""
    # 1. OpenDesktopW and SetThreadDesktop for Windows non-interactive/scripted sessions
    try:
        user32 = ctypes.windll.user32
        hdesk = user32.OpenDesktopW("Default", 0, False, 0x01FF)
        if hdesk:
            user32.SetThreadDesktop(hdesk)
    except Exception:
        pass

    # 2. Print 5-second countdown warning before GUI interaction
    print("Starting loop breaker test in 5s...")
    pre_gui_warning("Real desktop LoopBreaker test capturing static and dynamic screenshots", wait_seconds=5)

    # 3. Ensure top-left failsafe and clean error handling
    pyautogui.FAILSAFE = True
    
    try:
        pos = pyautogui.position()
        if pos.x == 0 and pos.y == 0:
            raise RuntimeError("Failsafe triggered: Mouse pointer is at top-left corner (0, 0).")
    except Exception as exc:
        if is_failsafe(exc):
            pytest.fail("Mouse is in failsafe corner (0,0). Aborting test.")
        raise

    os.makedirs(SHOTS_DIR, exist_ok=True)
    os.makedirs(VERIFICATION_DIR, exist_ok=True)

    breaker = LoopBreaker(same_threshold=2, max_distance=4)
    breaker.reset()

    static_shots = []
    static_hashes = []
    static_png_bytes = []

    print("[INFO] Capturing 3 screenshots of static screen (1s delay)...")
    try:
        for i in range(1, 4):
            pos = pyautogui.position()
            if pos.x == 0 and pos.y == 0:
                raise RuntimeError("Failsafe triggered during static capture.")

            img = pyautogui.screenshot()
            shot_path = os.path.join(SHOTS_DIR, f"static_{i}.png")
            img.save(shot_path, format="PNG")

            with open(shot_path, "rb") as f:
                b = f.read()
            static_png_bytes.append(b)
            static_shots.append(shot_path)

            h = dhash(b)
            static_hashes.append(h)

            if i < 3:
                time.sleep(1.0)
    except Exception as exc:
        if is_failsafe(exc):
            pytest.fail("Failsafe activated during static screen capture.")
        raise

    # Observe static frames through loop breaker
    static_alerts = []
    alert = breaker.observe(static_hashes[0], last_action_kind="act")
    static_alerts.append(alert)

    for i in range(1, 3):
        alert = breaker.observe(static_hashes[i], last_action_kind="act")
        static_alerts.append(alert)

    triggered_static = any(a is not None for a in static_alerts)
    assert triggered_static is True, "Loop breaker failed to detect static repetition across static screenshots."

    # Now capture 3 dynamic screenshots using a real screen-changing tkinter scratch window
    print("[INFO] Capturing 3 screenshots with dynamic changes via scratch window...")
    dynamic_shots = []
    dynamic_hashes = []
    dynamic_png_bytes = []

    breaker.reset()

    root = tk.Tk()
    root.geometry("1200x800+100+100")
    root.title("LoopBreaker Dynamic Test")
    canvas = tk.Canvas(root, width=1200, height=800, bg="black")
    canvas.pack(fill=tk.BOTH, expand=True)

    try:
        for i in range(1, 4):
            pos = pyautogui.position()
            if pos.x == 0 and pos.y == 0:
                raise RuntimeError("Failsafe triggered during dynamic capture.")

            if i == 1:
                canvas.configure(bg="black")
            elif i == 2:
                canvas.configure(bg="white")
            elif i == 3:
                canvas.configure(bg="blue")

            root.update_idletasks()
            root.update()

            time.sleep(0.5)

            img = pyautogui.screenshot()
            shot_path = os.path.join(SHOTS_DIR, f"dynamic_{i}.png")
            img.save(shot_path, format="PNG")

            with open(shot_path, "rb") as f:
                b = f.read()
            dynamic_png_bytes.append(b)
            dynamic_shots.append(shot_path)

            h = dhash(b)
            dynamic_hashes.append(h)

            if i < 3:
                time.sleep(1.0)
    except Exception as exc:
        if is_failsafe(exc):
            pytest.fail("Failsafe activated during dynamic screen capture.")
        raise
    finally:
        try:
            root.destroy()
        except Exception:
            pass

    # Observe dynamic frames
    dynamic_alerts = []
    for i, h in enumerate(dynamic_hashes):
        action_kind = "act" if i > 0 else "act"
        alert = breaker.observe(h, last_action_kind=action_kind)
        dynamic_alerts.append(alert)

    triggered_dynamic = any(a is not None for a in dynamic_alerts)
    assert triggered_dynamic is False, "Loop breaker incorrectly triggered static loop alert on dynamic screen changes."

    # Compute distances and hashes
    static_file_hashes = [_sha256_file(p) for p in static_shots]
    dynamic_file_hashes = [_sha256_file(p) for p in dynamic_shots]

    static_distances = []
    for i in range(len(static_hashes) - 1):
        static_distances.append({
            "from_index": i + 1,
            "to_index": i + 2,
            "hamming_distance": hamming(static_hashes[i], static_hashes[i+1])
        })

    dynamic_distances = []
    for i in range(len(dynamic_hashes) - 1):
        dynamic_distances.append({
            "from_index": i + 1,
            "to_index": i + 2,
            "hamming_distance": hamming(dynamic_hashes[i], dynamic_hashes[i+1])
        })

    report_data = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).astimezone().isoformat(),
        "failsafe_status": "active_at_top_left_0_0",
        "static_screenshots": [
            {
                "path": os.path.abspath(p),
                "sha256": fh,
                "dhash_int": dh,
            }
            for p, fh, dh in zip(static_shots, static_file_hashes, static_hashes)
        ],
        "dynamic_screenshots": [
            {
                "path": os.path.abspath(p),
                "sha256": fh,
                "dhash_int": dh,
            }
            for p, fh, dh in zip(dynamic_shots, dynamic_file_hashes, dynamic_hashes)
        ],
        "static_distances": static_distances,
        "dynamic_distances": dynamic_distances,
        "static_loop_detected": triggered_static,
        "dynamic_loop_detected": triggered_dynamic,
    }

    with open(JSON_OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(report_data, f, indent=2)

    record_result(
        feature_id="real-desktop-loopbreaker",
        status="PASS",
        detail="Real desktop loop breaker verified. Captured static and dynamic screenshots via tkinter scratch window, verified static repetition alert and absence of false positive on dynamic changes, preserved top-left failsafe.",
        evidence_hash=sha256_text(json.dumps(report_data, sort_keys=True)),
        screenshot_hash=static_file_hashes[0],
        extra={"report_path": os.path.abspath(JSON_OUTPUT_PATH)},
    )
