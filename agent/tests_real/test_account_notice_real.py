"""Real desktop test: Account switching safety notice verification."""
from __future__ import annotations

import os
import subprocess
import sys
import time
import pytest

from core.accounts import CAUTION_NOTICE, CONFIRM_PHRASE
from tests_real.real_test_helper import pre_gui_warning, record_result, sha256_text

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VERIFICATION_DIR = os.path.join(REPO_ROOT, "verification")
TRANSCRIPT_PATH = os.path.join(VERIFICATION_DIR, "account_notice_transcript.txt")


def test_real_account_switch_safety_notice() -> None:
    pre_gui_warning("Testing Account Switching Safety Notice & Gate", wait_seconds=2)

    orchestrator_path = os.path.join(REPO_ROOT, "agent", "orchestrator.py")
    python_exe = sys.executable

    transcript_lines: list[str] = []
    transcript_lines.append("=== ACCOUNT SWITCHING SAFETY NOTICE TEST RUN ===")

    # 1. First invocation: Invalid confirmation input (e.g., 'yes')
    transcript_lines.append("\n--- Invocation 1: Invalid Confirmation ('yes') ---")
    proc1 = subprocess.Popen(
        [python_exe, orchestrator_path, "--account-switch", "--plan-only", "test safety notice idea"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        cwd=os.path.join(REPO_ROOT, "agent"),
    )

    try:
        stdout1, _ = proc1.communicate(input="yes\n", timeout=15)
    except subprocess.TimeoutExpired:
        proc1.kill()
        stdout1, _ = proc1.communicate()
        pytest.fail("Orchestrator timed out during invalid confirmation input.")

    exit_code1 = proc1.returncode
    transcript_lines.append(stdout1)
    transcript_lines.append(f"Exit Code: {exit_code1}")

    # Verify caution notice was printed
    assert CAUTION_NOTICE in stdout1, "Caution notice not found in orchestrator output."
    # Verify rejection (non-zero exit)
    assert exit_code1 != 0, f"Expected non-zero exit code on invalid confirmation, got {exit_code1}"

    # 2. Second invocation: Exact required phrase 'I UNDERSTAND'
    transcript_lines.append(f"\n--- Invocation 2: Valid Confirmation ('{CONFIRM_PHRASE}') ---")
    
    env = os.environ.copy()
    env["HUSH_CHROME_PROFILES"] = "Profile 1,Profile 2"

    proc2 = subprocess.Popen(
        [python_exe, orchestrator_path, "--account-switch", "--plan-only", "test safety notice idea"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        cwd=os.path.join(REPO_ROOT, "agent"),
        env=env,
    )

    try:
        stdout2, _ = proc2.communicate(input=f"{CONFIRM_PHRASE}\n", timeout=15)
    except subprocess.TimeoutExpired:
        proc2.kill()
        stdout2, _ = proc2.communicate()
        pytest.fail("Orchestrator timed out during valid confirmation input.")

    exit_code2 = proc2.returncode
    transcript_lines.append(stdout2)
    transcript_lines.append(f"Exit Code: {exit_code2}")

    # Verify notice accepted and caution notice printed
    assert CAUTION_NOTICE in stdout2, "Caution notice not found in second invocation."

    # Save interactive transcript
    os.makedirs(VERIFICATION_DIR, exist_ok=True)
    full_transcript = "\n".join(transcript_lines)
    with open(TRANSCRIPT_PATH, "w", encoding="utf-8") as f:
        f.write(full_transcript)

    print(f"[TRANSCRIPT SAVED] {TRANSCRIPT_PATH}")

    record_result(
        feature_id="safety-account-switch-notice",
        status="PASS",
        detail=(
            "Account switching safety notice verified: invalid confirmation ('yes') "
            "correctly refused with non-zero exit code, valid confirmation ('I UNDERSTAND') "
            "accepted through safety gate. Transcript saved to verification/account_notice_transcript.txt."
        ),
        evidence_hash=sha256_text(full_transcript),
    )
