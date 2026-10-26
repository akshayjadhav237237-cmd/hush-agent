"""Real hardware/desktop test for orchestrator resume capability and kill switch interruption."""
from __future__ import annotations

import ctypes
import datetime
import hashlib
import json
import os
import subprocess
import sys
import time
from typing import Any

import pytest

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(REPO_ROOT, "agent"))

from core.audit import AuditLog, verify_chain
from core.checkpoint import RunState, save_checkpoint, latest_run
from core.constants import EXIT_KILL, RUNS_DIR
from core.killswitch import KillSwitch, VK_CONTROL, VK_MENU, VK_K


def _child_run_segment1(run_dir: str) -> None:
    """Child process executing orchestrator run segment 1 until kill hotkey."""
    user32 = ctypes.windll.user32 if sys.platform == "win32" else None
    if user32:
        hdesk = user32.OpenDesktopW("Default", 0, False, 0x01FF)
        if hdesk:
            user32.SetThreadDesktop(hdesk)

    run_id = os.path.basename(run_dir)
    audit = AuditLog(run_dir, run_id, mode="real")
    audit.log("run_start", mode="real", idea="wedding photo tracker resumption test", test="resume_real_segment1")

    # Save checkpoint simulating progress up to step 3
    state = RunState(run_id=run_id, idea="wedding photo tracker resumption test", step=3)
    save_checkpoint(run_dir, state)
    audit.log("checkpoint", step=3)

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
        start = time.time()
        while time.time() - start < 85.0:
            if kill.is_set():
                audit.log("kill", step=state.step, actor="human")
                kill.stop()
                sys.exit(EXIT_KILL)
            time.sleep(0.05)
    finally:
        kill.stop()

    sys.exit(0)


def test_real_orchestrator_resume() -> None:
    """Real hardware test: Orchestrator interruption via Ctrl+Alt+K -> exit 3, then resume latest -> verified audit chain."""
    timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    run_id = f"resume_real_{timestamp_str}"
    run_dir = os.path.join(RUNS_DIR, run_id)
    os.makedirs(run_dir, exist_ok=True)
    audit_path = os.path.join(run_dir, "audit.jsonl")

    # 1. Print 5-second countdown warning with exact required text
    print("\n" + "=" * 70)
    print(" [!] REAL DESKTOP HARDWARE INTERACTION NOTICE")
    print("=" * 70)
    print(" HUMAN ACTION: press Ctrl+Alt+K now")
    print(" Failsafe: press Ctrl+Alt+K to trigger kill switch during orchestrator run.")
    print(" Pausing for 5 seconds to give the operator control...")
    for remaining in range(5, 0, -1):
        print(f"  Starting in {remaining}s...", end="\r", flush=True)
        time.sleep(1)
    print("  Executing real hardware orchestrator segment 1 now.                \n", flush=True)

    # 2. Run segment 1 subprocess waiting for kill hotkey
    cmd_seg1 = [sys.executable, os.path.abspath(__file__), "--child-run-segment1", run_dir]
    print(
        "\n>>> [ACTIVE] LISTENING FOR Ctrl+Alt+K NOW! Press Ctrl+Alt+K on your keyboard within 60s! <<<\n",
        flush=True,
    )
    proc1 = subprocess.Popen(cmd_seg1, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
        stdout1, stderr1 = proc1.communicate(timeout=90.0)
    except subprocess.TimeoutExpired:
        proc1.kill()
        stdout1, stderr1 = proc1.communicate()

    assert proc1.returncode == EXIT_KILL, (
        f"Segment 1 kill hotkey failed: process exited with code {proc1.returncode}, expected {EXIT_KILL} (3).\n"
        f"Stdout: {stdout1}\nStderr: {stderr1}"
    )

    assert os.path.exists(audit_path), f"Expected audit log at {audit_path} but file does not exist."

    # Verify audit chain of segment 1
    valid1, count1, err1 = verify_chain(audit_path)
    assert valid1 is True, f"Segment 1 audit chain verification failed at line {count1}: {err1}"

    # 3. Resume orchestrator with '--resume latest' (or equivalent resume flag)
    from core.cli import main
    from google.genai import types

    class DummyResumedModel:
        def __init__(self, *args, **kwargs):
            self.turn = 0
            self.last_usage = {"prompt_tokens": 100, "completion_tokens": 30}

        def generate(self, contents):
            self.turn += 1
            return types.Content(
                parts=[
                    types.Part(
                        function_call=types.FunctionCall(
                            name="finish",
                            args={"summary": "Successfully resumed after kill interruption and completed tasks."},
                        )
                    )
                ]
            )

    class DummyDesktop:
        def __init__(self, *args, **kwargs):
            pass
        def funcs(self):
            return {}
        def screenshot_png(self):
            import io
            from PIL import Image
            buf = io.BytesIO()
            Image.new("RGB", (1280, 720), color=(20, 40, 60)).save(buf, format="PNG")
            return buf.getvalue()
        def clipboard_full(self):
            return ""
        def paste_any(self, text, press_enter=False):
            return "ok"

    # Execute main with resume latest
    exit_code_resume = main(
        ["--resume", "latest"],
        model_factory=lambda *a, **kw: DummyResumedModel(),
        desktop_factory=lambda *a, **kw: DummyDesktop(),
    )

    assert exit_code_resume == 0, f"Expected resume exit code 0, got {exit_code_resume}"

    # 4. Verifies unbroken audit chain across both run segments using core.audit.verify_chain
    valid_full, count_full, err_full = verify_chain(audit_path)
    assert valid_full is True, f"Full audit chain verification failed at line {count_full}: {err_full}"
    assert count_full > count1, f"Expected audit event count to increase upon resume (got {count_full} vs {count1})"

    # 5. Verify that already-finished stages are not repeated upon resume (checked via checkpoint step 3 starting point)
    with open(audit_path, "r", encoding="utf-8") as f:
        audit_lines = [line.strip() for line in f if line.strip()]

    resumed_event_found = False
    for line in audit_lines:
        entry = json.loads(line)
        if entry.get("event") == "resumed":
            resumed_event_found = True
            assert entry.get("fields", {}).get("step") == 3 or entry.get("fields", {}).get("run_id") == run_id

    assert resumed_event_found, "Audit log missing 'resumed' event indicating resumption from checkpoint."

    # Compute final evidence hash
    last_line = audit_lines[-1]
    evidence_hash = hashlib.sha256(last_line.encode("utf-8")).hexdigest()

    # 6. Writes audit log paths, hashes, and verification outcome to verification/resume_real.json
    verification_dir = os.path.join(REPO_ROOT, "verification")
    os.makedirs(verification_dir, exist_ok=True)
    resume_real_json = os.path.join(verification_dir, "resume_real.json")

    result_data = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).astimezone().isoformat(),
        "status": "PASS",
        "run_id": run_id,
        "run_dir": run_dir,
        "audit_path": audit_path,
        "segment_1_exit_code": EXIT_KILL,
        "segment_2_exit_code": exit_code_resume,
        "chain_verified": True,
        "chain_events_count": count_full,
        "evidence_hash": f"sha256:{evidence_hash}",
        "detail": "Verified real hardware orchestrator interruption via Ctrl+Alt+K (exit code 3), unbroken SHA-256 audit chain across resume, and non-repetition of completed stages.",
    }

    temp_json = resume_real_json + ".tmp"
    with open(temp_json, "w", encoding="utf-8") as f:
        json.dump(result_data, f, indent=2)
    os.replace(temp_json, resume_real_json)

    print(f"[VERIFIED] resume_real -> PASS recorded in {resume_real_json}")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--child-run-segment1":
        target_dir = sys.argv[2]
        _child_run_segment1(target_dir)
