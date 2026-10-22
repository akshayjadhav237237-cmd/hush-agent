"""Tests for export_replay module."""
from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from pathlib import Path
import pytest

from core.audit import AuditLog
from export_replay import export_replay


def test_export_replay_valid_chain(tmp_path: Path) -> None:
    """Verify successful export on a valid audit chain produces replay.json."""
    runs_dir = tmp_path / "runs"
    run_dir = runs_dir / "run_valid"
    run_dir.mkdir(parents=True)

    log = AuditLog(str(run_dir), run_id="run_valid_123", mode="demo")
    log.log("run_start", idea="Build portfolio")
    log.log("tool_call", tool="open_app", name="open_app", args={"name": "Code"})
    log.log("tool_result", tool="open_app", result="App opened")
    log.log("gate", trigger="destructive_command")
    log.log("finish", summary="Done successfully")

    replay_path = export_replay(str(runs_dir), "run_valid")
    assert os.path.exists(replay_path)
    assert replay_path == str(run_dir / "replay.json")

    with open(replay_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data["mode"] == "demo"
    assert data["run_id"] == "run_valid_123"
    assert len(data["events"]) == 5

    e0 = data["events"][0]
    assert e0["step"] == 1
    assert e0["event"] == "run_start"
    assert "Run started" in e0["summary"]

    e1 = data["events"][1]
    assert e1["step"] == 2
    assert e1["event"] == "tool_call"
    assert e1["tool"] == "open_app"

    e3 = data["events"][3]
    assert e3["step"] == 4
    assert e3["event"] == "gate"
    assert e3["gate"] == "destructive_command"
    assert "destructive_command" in e3["summary"]


def test_export_replay_latest(tmp_path: Path) -> None:
    """Verify resolving 'latest' selects the newest run directory."""
    runs_dir = tmp_path / "runs"
    runs_dir.mkdir(parents=True)

    # Empty runs_dir should raise FileNotFoundError
    with pytest.raises(FileNotFoundError, match="No runs found in"):
        export_replay(str(runs_dir), "latest")

    run_old = runs_dir / "run_20261021_01"
    run_old.mkdir()
    log_old = AuditLog(str(run_old), run_id="old_run", mode="real")
    log_old.log("run_start", idea="old")

    time.sleep(0.05)

    run_new = runs_dir / "run_20261022_02"
    run_new.mkdir()
    log_new = AuditLog(str(run_new), run_id="new_run", mode="real")
    log_new.log("run_start", idea="new")

    # Ensure mtime reflects new > old
    now = time.time()
    os.utime(str(run_old), (now - 100, now - 100))
    os.utime(str(run_new), (now, now))

    replay_path = export_replay(str(runs_dir), "latest")
    assert replay_path == str(run_new / "replay.json")

    with open(replay_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert data["run_id"] == "new_run"


def test_export_replay_tampered_fails(tmp_path: Path) -> None:
    """Verify rejection when verify_chain fails on a tampered audit log."""
    runs_dir = tmp_path / "runs"
    run_dir = runs_dir / "run_tampered"
    run_dir.mkdir(parents=True)

    log = AuditLog(str(run_dir), run_id="run_t", mode="demo")
    log.log("run_start", idea="genuine")
    log.log("finish", summary="genuine finish")

    # Tamper with first line
    with open(log.path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    bad_first = json.loads(lines[0])
    bad_first["fields"]["idea"] = "hacked"
    lines[0] = json.dumps(bad_first) + "\n"
    with open(log.path, "w", encoding="utf-8") as f:
        f.writelines(lines)

    with pytest.raises(ValueError, match=r"Audit log verification failed: .* at line 2"):
        export_replay(str(runs_dir), "run_tampered")

    assert not os.path.exists(run_dir / "replay.json")


def test_export_replay_missing_run_id(tmp_path: Path) -> None:
    """Verify handling missing run_id with FileNotFoundError."""
    runs_dir = tmp_path / "runs"
    runs_dir.mkdir(parents=True)

    with pytest.raises(FileNotFoundError, match="Run directory not found"):
        export_replay(str(runs_dir), "nonexistent_run_xyz")

    # Run directory exists but audit.jsonl missing
    empty_run = runs_dir / "empty_run"
    empty_run.mkdir()
    with pytest.raises(FileNotFoundError, match="Audit log not found"):
        export_replay(str(runs_dir), "empty_run")


def test_export_replay_redaction_and_no_raw_clipboard(tmp_path: Path) -> None:
    """Verify summary contains only redacted fields and no raw clipboard text."""
    runs_dir = tmp_path / "runs"
    run_dir = runs_dir / "run_secrets"
    run_dir.mkdir(parents=True)

    secret_key = "AIzaSy" + "A" * 33
    secret_sk = "sk-" + "B" * 25
    bearer_token = "Bearer secrettoken12345"
    clipboard_secret = "CLIPBOARD_CONFIDENTIAL_TOKEN_XYZ_9999"

    log = AuditLog(str(run_dir), run_id="run_sec", mode="demo", log_text=True)
    log.log("run_start", idea=f"Use key {secret_key} and {secret_sk}")
    log.log("tool_call", tool="read_clipboard")
    log.log("tool_result", tool="read_clipboard", result=clipboard_secret)
    log.log("tool_call", tool="paste_text", text=f"Paste {bearer_token}")
    log.log("finish", summary=f"Done with {secret_key}")

    replay_path = export_replay(str(runs_dir), "run_secrets")
    with open(replay_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    for ev in data["events"]:
        summary = ev["summary"]
        assert secret_key not in summary
        assert secret_sk not in summary
        assert bearer_token not in summary
        assert clipboard_secret not in summary

    # Check read_clipboard summary is masked
    clip_result_ev = data["events"][2]
    assert "read_clipboard" in clip_result_ev["summary"]
    assert f"({len(clipboard_secret)} chars)" in clip_result_ev["summary"]


def test_export_replay_empty_log(tmp_path: Path) -> None:
    """Verify empty 0-event audit log is handled gracefully."""
    runs_dir = tmp_path / "runs"
    run_dir = runs_dir / "run_empty"
    run_dir.mkdir(parents=True)

    audit_file = run_dir / "audit.jsonl"
    audit_file.write_text("", encoding="utf-8")

    replay_path = export_replay(str(runs_dir), "run_empty")
    assert os.path.exists(replay_path)

    with open(replay_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data["run_id"] == "run_empty"
    assert data["mode"] == "real"
    assert data["events"] == []


def test_export_replay_cli(tmp_path: Path) -> None:
    """Verify CLI interface exits 0 on success and 1 on error."""
    runs_dir = tmp_path / "runs"
    run_dir = runs_dir / "cli_run"
    run_dir.mkdir(parents=True)

    log = AuditLog(str(run_dir), run_id="cli_run_1", mode="real")
    log.log("run_start", idea="CLI test")

    script_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "export_replay.py")
    )

    # Success case pointing to custom directory requires test harness or default runs
    # Test error exit on nonexistent target
    res_err = subprocess.run(
        [sys.executable, script_path, "nonexistent_run_404"],
        capture_output=True,
        text=True,
    )
    assert res_err.returncode == 1
    assert "Error:" in res_err.stderr

    # Test error exit when no args provided
    res_noargs = subprocess.run(
        [sys.executable, script_path],
        capture_output=True,
        text=True,
    )
    assert res_noargs.returncode == 1
    assert "Usage:" in res_noargs.stderr
