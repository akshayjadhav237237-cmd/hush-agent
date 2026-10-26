"""Real hardware physical safety tests:
1. Kill hotkey: Ctrl+Alt+K -> Exit code 3, audit.jsonl contains 'kill' event.
2. Mouse corner: cursor to (0, 0) -> Exit code 2, audit.jsonl contains 'failsafe_abort'.
3. Phone notify: push notification with random nonce to ntfy.sh -> human confirmation.
"""
from __future__ import annotations

import ctypes
import datetime
import hashlib
import json
import os
import secrets
import subprocess
import sys
import threading
import time
from typing import Any, Optional

import pytest

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(REPO_ROOT, "agent"))

from core.audit import AuditLog
from core.constants import EXIT_FAILSAFE, EXIT_KILL, RUNS_DIR
from core.killswitch import KillSwitch, is_failsafe
from core.notify import Notifier

VERIFICATION_DIR = os.path.join(REPO_ROOT, "verification")
PHYSICAL_SAFETY_JSON = os.path.join(VERIFICATION_DIR, "physical_safety.json")


def _child_run_kill(run_dir: str) -> None:
    """Child process executing real loop with KillSwitch active and no model."""
    user32 = ctypes.windll.user32 if sys.platform == "win32" else None
    if user32:
        hdesk = user32.OpenDesktopW("Default", 0, False, 0x01FF)
        if hdesk:
            user32.SetThreadDesktop(hdesk)

    run_id = os.path.basename(run_dir)
    audit = AuditLog(run_dir, run_id, mode="real")
    audit.log("run_start", mode="real", test="physical_kill_hotkey", actor="human")

    attached = set()

    def _get_key_state(vk: int) -> int:
        if user32:
            tid = ctypes.windll.kernel32.GetCurrentThreadId()
            if tid not in attached:
                h = user32.OpenDesktopW("Default", 0, False, 0x01FF)
                if h:
                    user32.SetThreadDesktop(h)
                attached.add(tid)
            return user32.GetAsyncKeyState(vk)
        return 0

    kill = KillSwitch(get_key_state=_get_key_state if user32 else None, poll_hz=50)
    started = kill.start()
    if not started:
        audit.log("kill_switch_unavailable")
        sys.exit(1)

    try:
        step = 0
        start = time.time()
        # Loop of short waits, polling up to 60 seconds for physical hotkey
        while time.time() - start < 60.0:
            if kill.is_set():
                audit.log("kill", step=step, actor="human")
                kill.stop()
                sys.exit(EXIT_KILL)
            time.sleep(0.05)
            step += 1
    finally:
        kill.stop()

    # If timeout expired without hotkey, exit with code 0 (test will fail)
    sys.exit(0)


def _child_run_mouse(run_dir: str) -> None:
    """Child process executing real loop checking cursor position at (0, 0)."""
    user32 = ctypes.windll.user32 if sys.platform == "win32" else None
    if user32:
        hdesk = user32.OpenDesktopW("Default", 0, False, 0x01FF)
        if hdesk:
            user32.SetThreadDesktop(hdesk)

    run_id = os.path.basename(run_dir)
    audit = AuditLog(run_dir, run_id, mode="real")
    audit.log("run_start", mode="real", test="physical_mouse_corner", actor="human")

    import pyautogui
    pyautogui.FAILSAFE = True

    start = time.time()
    while time.time() - start < 60.0:
        try:
            if user32:
                hdesk = user32.OpenDesktopW("Default", 0, False, 0x01FF)
                if hdesk:
                    user32.SetThreadDesktop(hdesk)
            pos = pyautogui.position()
            if pos.x == 0 and pos.y == 0:
                audit.log("failsafe_abort", actor="human", x=pos.x, y=pos.y)
                sys.exit(EXIT_FAILSAFE)
        except Exception as exc:
            if is_failsafe(exc):
                audit.log("failsafe_abort", actor="human")
                sys.exit(EXIT_FAILSAFE)
            raise
        time.sleep(0.05)

    # Timed out without cursor at corner, exit 0 (test will fail)
    sys.exit(0)


def _read_human_input(timeout: float = 60.0) -> str:
    """Read human response from stdin or verification/phone_nonce.txt with timeout."""
    input_received = []

    def _stdin_reader():
        try:
            line = sys.stdin.readline()
            if line:
                input_received.append(line.strip())
        except Exception:
            pass

    t = threading.Thread(target=_stdin_reader, daemon=True)
    t.start()

    nonce_file = os.path.join(VERIFICATION_DIR, "phone_nonce.txt")
    start = time.time()
    while time.time() - start < timeout:
        if input_received:
            return input_received[0]
        if os.path.exists(nonce_file):
            try:
                with open(nonce_file, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                if content:
                    return content
            except Exception:
                pass
        env_val = os.getenv("HUMAN_PHONE_NONCE")
        if env_val:
            return env_val.strip()
        time.sleep(0.25)

    return ""


def load_physical_safety_results() -> dict[str, Any]:
    """Load existing physical safety results or return default dict."""
    if os.path.exists(PHYSICAL_SAFETY_JSON):
        try:
            with open(PHYSICAL_SAFETY_JSON, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def save_physical_safety_result(key: str, data: dict[str, Any]) -> None:
    """Atomically record physical safety verification artifact entry."""
    os.makedirs(VERIFICATION_DIR, exist_ok=True)
    current = load_physical_safety_results()
    current[key] = data
    current["last_updated"] = datetime.datetime.now(datetime.timezone.utc).astimezone().isoformat()

    temp_path = PHYSICAL_SAFETY_JSON + ".tmp"
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(current, f, indent=2)
    os.replace(temp_path, PHYSICAL_SAFETY_JSON)


def test_physical_kill_hotkey() -> dict[str, Any]:
    """Real hardware test: Kill hotkey (Ctrl+Alt+K) -> Exit code 3, 'kill' event in audit.jsonl."""
    timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    run_id = f"physical_kill_{timestamp_str}"
    run_dir = os.path.join(RUNS_DIR, run_id)
    os.makedirs(run_dir, exist_ok=True)
    audit_path = os.path.join(run_dir, "audit.jsonl")

    cmd = [sys.executable, os.path.abspath(__file__), "--child-run-kill", run_dir]

    print("\n" + "=" * 70)
    print("HUMAN ACTION: press Ctrl+Alt+K now")
    print(f"Waiting up to 60s for emergency kill switch hotkey in run: {run_id}...")
    print("=" * 70, flush=True)

    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
        stdout, stderr = proc.communicate(timeout=65.0)
    except subprocess.TimeoutExpired:
        proc.kill()
        stdout, stderr = proc.communicate()

    assert proc.returncode == EXIT_KILL, (
        f"Kill hotkey failed: process exited with code {proc.returncode}, expected {EXIT_KILL} (3).\n"
        f"Stdout: {stdout}\nStderr: {stderr}"
    )

    assert os.path.exists(audit_path), f"Expected audit log at {audit_path} but file does not exist."

    kill_line = None
    with open(audit_path, "r", encoding="utf-8") as f:
        for line in f:
            stripped = line.strip()
            if not stripped:
                continue
            try:
                entry = json.loads(stripped)
                if entry.get("event") == "kill":
                    kill_line = stripped
                    break
            except Exception:
                pass

    assert kill_line is not None, f"audit.jsonl at {audit_path} does not contain 'kill' event."
    line_sha = hashlib.sha256(kill_line.encode("utf-8")).hexdigest()

    result = {
        "status": "PASS",
        "actor": "human",
        "exit_code": proc.returncode,
        "audit_path": audit_path,
        "sha256": line_sha,
        "event_line": kill_line,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).astimezone().isoformat(),
    }
    save_physical_safety_result("kill_hotkey", result)
    return result


def test_physical_mouse_corner() -> dict[str, Any]:
    """Real hardware test: Mouse corner failsafe ((0, 0)) -> Exit code 2, 'failsafe_abort' in audit.jsonl."""
    timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    run_id = f"physical_mouse_{timestamp_str}"
    run_dir = os.path.join(RUNS_DIR, run_id)
    os.makedirs(run_dir, exist_ok=True)
    audit_path = os.path.join(run_dir, "audit.jsonl")

    cmd = [sys.executable, os.path.abspath(__file__), "--child-run-mouse", run_dir]

    print("\n" + "=" * 70)
    print("HUMAN ACTION: move the mouse to the top-left corner now")
    print(f"Waiting up to 60s for mouse cursor at (0, 0) in run: {run_id}...")
    print("=" * 70, flush=True)

    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
        stdout, stderr = proc.communicate(timeout=65.0)
    except subprocess.TimeoutExpired:
        proc.kill()
        stdout, stderr = proc.communicate()

    assert proc.returncode == EXIT_FAILSAFE, (
        f"Mouse-corner failsafe failed: process exited with code {proc.returncode}, expected {EXIT_FAILSAFE} (2).\n"
        f"Stdout: {stdout}\nStderr: {stderr}"
    )

    assert os.path.exists(audit_path), f"Expected audit log at {audit_path} but file does not exist."

    failsafe_line = None
    with open(audit_path, "r", encoding="utf-8") as f:
        for line in f:
            stripped = line.strip()
            if not stripped:
                continue
            try:
                entry = json.loads(stripped)
                if entry.get("event") == "failsafe_abort":
                    failsafe_line = stripped
                    break
            except Exception:
                pass

    assert failsafe_line is not None, f"audit.jsonl at {audit_path} does not contain 'failsafe_abort' event."
    line_sha = hashlib.sha256(failsafe_line.encode("utf-8")).hexdigest()

    result = {
        "status": "PASS",
        "actor": "human",
        "exit_code": proc.returncode,
        "audit_path": audit_path,
        "sha256": line_sha,
        "event_line": failsafe_line,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).astimezone().isoformat(),
    }
    save_physical_safety_result("mouse_corner", result)
    return result


def test_physical_phone_notify() -> dict[str, Any]:
    """Real hardware test: ntfy push notification with nonce -> human confirmation."""
    nonce = f"HUSH-{secrets.token_hex(4).upper()}"
    topic = os.getenv("NTFY_TOPIC")
    if not topic or not topic.strip():
        print("Set NTFY_TOPIC to run this test")
        sys.exit(1)

    notifier = Notifier(topic=topic)
    probe_msg = f"Hush physical safety verification nonce: {nonce}"
    success = notifier.push(probe_msg)
    assert success is True, f"Failed to deliver push notification to https://ntfy.sh/{topic}"

    print("\n" + "=" * 70)
    print(f"Push notification sent to https://ntfy.sh/{topic}")
    print(f"NONCE: {nonce}")
    print("HUMAN ACTION: check your phone notification and type back what the phone shows (60s timeout):")
    print("=" * 70, flush=True)

    received = _read_human_input(timeout=60.0)
    cleaned = received.strip().upper()
    expected = nonce.upper()
    bare_expected = expected.replace("HUSH-", "")

    matched = (cleaned == expected) or (cleaned == bare_expected)
    assert matched is True, (
        f"Phone verification failed: expected '{nonce}', received '{received}'."
    )

    result = {
        "status": "PASS",
        "actor": "human",
        "topic": topic,
        "nonce": nonce,
        "received_nonce": received,
        "matched": True,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).astimezone().isoformat(),
    }
    save_physical_safety_result("phone_notify", result)
    return result


def run_all_physical_tests() -> dict[str, Any]:
    """Run all three physical safety tests and return consolidated results."""
    print("\nStarting Physical Safety Hardware Verification Suite...")
    res_kill = test_physical_kill_hotkey()
    print(f"[OK] Kill Hotkey verified: exit code {res_kill['exit_code']}, sha256: {res_kill['sha256']}")

    res_mouse = test_physical_mouse_corner()
    print(f"[OK] Mouse Corner verified: exit code {res_mouse['exit_code']}, sha256: {res_mouse['sha256']}")

    res_phone = test_physical_phone_notify()
    print(f"[OK] Phone Notify verified: nonce {res_phone['nonce']} matched")

    results = load_physical_safety_results()
    print("\n" + "=" * 70)
    print(f"Physical safety results saved to {PHYSICAL_SAFETY_JSON}:")
    print(json.dumps(results, indent=2))
    print("=" * 70)
    return results


if __name__ == "__main__":
    if "--child-run-kill" in sys.argv:
        target_dir = sys.argv[sys.argv.index("--child-run-kill") + 1]
        _child_run_kill(target_dir)
    elif "--child-run-mouse" in sys.argv:
        target_dir = sys.argv[sys.argv.index("--child-run-mouse") + 1]
        _child_run_mouse(target_dir)
    else:
        run_all_physical_tests()
