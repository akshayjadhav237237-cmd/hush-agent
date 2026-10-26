"""Helper utilities for real desktop automated smoke tests."""
from __future__ import annotations

import datetime
import hashlib
import json
import os
import sys
import time
from typing import Any, Optional


REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VERIFICATION_DIR = os.path.join(REPO_ROOT, "verification")
RESULTS_FILE = os.path.join(VERIFICATION_DIR, "real_desktop_results.json")


def pre_gui_warning(action_description: str, wait_seconds: int = 5) -> None:
    """Print intent and pause before any real hardware interaction."""
    print("\n" + "=" * 70)
    print(" [!] REAL DESKTOP HARDWARE INTERACTION NOTICE")
    print("=" * 70)
    print(f" Action:   {action_description}")
    print(" Failsafe: Slam mouse to TOP-LEFT CORNER (0, 0) or press Ctrl+Alt+K to abort.")
    print(f" Pausing for {wait_seconds} seconds to give the operator control...")
    for remaining in range(wait_seconds, 0, -1):
        print(f"  Starting in {remaining}s...", end="\r", flush=True)
        time.sleep(1)
    print("  Executing real desktop interaction now.                         \n")


def sha256_bytes(data: bytes) -> str:
    """Compute sha256 hash of bytes."""
    return f"sha256:{hashlib.sha256(data).hexdigest()}"


def sha256_text(text: str) -> str:
    """Compute sha256 hash of UTF-8 text."""
    return sha256_bytes(text.encode("utf-8"))


def load_results() -> dict[str, Any]:
    """Load existing results or return empty dict."""
    if os.path.exists(RESULTS_FILE):
        try:
            with open(RESULTS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def record_result(
    feature_id: str,
    status: str,
    detail: str,
    *,
    evidence_hash: Optional[str] = None,
    screenshot_hash: Optional[str] = None,
    extra: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    """Atomically record a verified real-desktop test result."""
    os.makedirs(VERIFICATION_DIR, exist_ok=True)
    results = load_results()

    now_iso = datetime.datetime.now(datetime.timezone.utc).astimezone().isoformat()
    entry: dict[str, Any] = {
        "feature_id": feature_id,
        "status": status,
        "timestamp": now_iso,
        "detail": detail,
        "evidence_hash": evidence_hash or sha256_text(detail),
        "screenshot_hash": screenshot_hash,
    }
    if extra:
        entry.update(extra)

    results[feature_id] = entry

    temp_path = RESULTS_FILE + ".tmp"
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    os.replace(temp_path, RESULTS_FILE)

    print(f"[VERIFIED] {feature_id} -> {status} recorded in {RESULTS_FILE}")
    return entry
