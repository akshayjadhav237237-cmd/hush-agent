"""Tests for the tamper-evident audit logging module."""
from __future__ import annotations

import hashlib
import json
import os
import pytest
from core.audit import (
    AuditLog,
    verify_chain,
    redact,
    EVENTS,
    INITIAL_PREV_HASH,
)


def test_chain_verifies_successfully_on_genuine_sequence(
    tmp_path: pytest.TempPathFactory,
) -> None:
    """Verify that a genuine sequence of log events passes hash-chain verification."""
    run_dir = str(tmp_path / "genuine_run")
    log = AuditLog(run_dir, run_id="run-abc", mode="demo")

    e1 = log.log("run_start", user="developer")
    e2 = log.log("model_text", text="Starting project scaffolding.")
    e3 = log.log("tool_call", tool="open_app", args={"name": "terminal"})
    e4 = log.log("tool_result", tool="open_app", status="ok")
    e5 = log.log("finish", summary="Task finished successfully.")

    assert e1["seq"] == 1
    assert e2["seq"] == 2
    assert e3["seq"] == 3
    assert e4["seq"] == 4
    assert e5["seq"] == 5

    assert e1["prev"] == INITIAL_PREV_HASH
    assert e1["run_id"] == "run-abc"
    assert e1["mode"] == "demo"

    ok, count, err = verify_chain(log.path)
    assert ok is True
    assert count == 5
    assert err is None


def test_tampering_fails_verify_chain(
    tmp_path: pytest.TempPathFactory,
) -> None:
    """Verify that altering payload, sequence, prev hash, or json structure fails verification."""
    run_dir = str(tmp_path / "tamper_run")
    log = AuditLog(run_dir, run_id="run-tamper", mode="demo")

    log.log("run_start", role="user")
    log.log("tool_call", tool="open_url", url="https://example.com")
    log.log("finish", summary="all done")

    ok, count, err = verify_chain(log.path)
    assert ok is True
    assert count == 3

    with open(log.path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Case A: Tampering with line 1's payload invalidates line 2's prev hash check
    tampered_payload = lines.copy()
    entry1 = json.loads(tampered_payload[0])
    entry1["fields"]["role"] = "attacker"
    tampered_payload[0] = json.dumps(entry1) + "\n"

    path_a = os.path.join(run_dir, "tampered_payload.jsonl")
    with open(path_a, "w", encoding="utf-8") as f:
        f.writelines(tampered_payload)

    ok, line_num, err = verify_chain(path_a)
    assert ok is False
    assert line_num == 2
    assert err is not None and "Hash mismatch" in err

    # Case B: Tampering with sequence number
    tampered_seq = lines.copy()
    entry2 = json.loads(tampered_seq[1])
    entry2["seq"] = 99
    tampered_seq[1] = json.dumps(entry2) + "\n"

    path_b = os.path.join(run_dir, "tampered_seq.jsonl")
    with open(path_b, "w", encoding="utf-8") as f:
        f.writelines(tampered_seq)

    ok, line_num, err = verify_chain(path_b)
    assert ok is False
    assert line_num == 2
    assert err is not None and "Sequence mismatch" in err

    # Case C: Tampering with initial prev hash
    tampered_prev = lines.copy()
    entry1_bad_prev = json.loads(tampered_prev[0])
    entry1_bad_prev["prev"] = "f" * 64
    tampered_prev[0] = json.dumps(entry1_bad_prev) + "\n"

    path_c = os.path.join(run_dir, "tampered_prev.jsonl")
    with open(path_c, "w", encoding="utf-8") as f:
        f.writelines(tampered_prev)

    ok, line_num, err = verify_chain(path_c)
    assert ok is False
    assert line_num == 1
    assert err is not None and "Hash mismatch" in err

    # Case D: Malformed JSON syntax
    tampered_json = lines.copy()
    tampered_json[1] = "INVALID_JSON_CORRUPTED_LINE\n"

    path_d = os.path.join(run_dir, "tampered_json.jsonl")
    with open(path_d, "w", encoding="utf-8") as f:
        f.writelines(tampered_json)

    ok, line_num, err = verify_chain(path_d)
    assert ok is False
    assert line_num == 2
    assert err is not None and "Invalid JSON" in err


def test_redaction_of_each_secret_pattern() -> None:
    """Verify redaction of AIza..., sk-..., ghp_..., github_pat_..., and Bearer ... secrets."""
    secrets = [
        (
            "AIzaSyD" + "0123456789" * 3 + "abc",
            "AIzaSyD012345678901234567890123456789abc",
        ),
        ("sk-" + "key" * 7, "sk-keykeykeykeykeykeykey"),
        ("ghp_" + "token12345token12345", "ghp_token12345token12345"),
        (
            "github_pat_" + "pat12345678901234567890",
            "github_pat_pat12345678901234567890",
        ),
        (
            "Bearer test-secret-token.v1.abc_123",
            "Bearer test-secret-token.v1.abc_123",
        ),
    ]

    for raw, secret_sub in secrets:
        redacted = redact(f"Prefix {raw} Suffix")
        assert "[REDACTED]" in redacted
        assert secret_sub not in redacted

    multi = (
        "Config: AIza01234567890123456789012345678901234 and "
        "sk-1234567890abcdefghij and Bearer my_bearer_token"
    )
    redacted_multi = redact(multi)
    assert redacted_multi.count("[REDACTED]") == 3
    assert "AIza" not in redacted_multi
    assert "sk-" not in redacted_multi
    assert "Bearer" not in redacted_multi


def test_truncation_to_200_chars(
    tmp_path: pytest.TempPathFactory,
) -> None:
    """Verify free text fields and direct redact calls are truncated to 200 characters."""
    long_string = "A" * 350
    assert len(redact(long_string)) == 200

    secret_and_long = "AIza01234567890123456789012345678901234 " + ("B" * 300)
    res = redact(secret_and_long)
    assert len(res) == 200
    assert res.startswith("[REDACTED] ")

    custom = redact("hello world", limit=5)
    assert custom == "hello"

    run_dir = str(tmp_path / "trunc_run")
    log = AuditLog(run_dir, run_id="run-trunc", mode="demo")
    entry = log.log("model_text", text="C" * 250, details={"nested": "D" * 250})
    assert len(entry["fields"]["text"]) == 200
    assert len(entry["fields"]["details"]["nested"]) == 200


def test_log_text_false_hides_raw_text(
    tmp_path: pytest.TempPathFactory,
) -> None:
    """Verify log_text=False masks paste_text, read_clipboard, paste_artifact arguments and results."""
    run_dir = str(tmp_path / "suppress_run")
    log_false = AuditLog(run_dir, run_id="run-hide", mode="real", log_text=False)

    secret_paste = "super_sensitive_code_to_paste"
    secret_clip = "confidential_clipboard_content"
    secret_art = "secret_artifact_data"

    e1 = log_false.log(
        "tool_call", tool="paste_text", args={"text": secret_paste}
    )
    e2 = log_false.log(
        "tool_result", tool="read_clipboard", result=secret_clip
    )
    e3 = log_false.log(
        "tool_call", tool="paste_artifact", args={"artifact": secret_art}
    )

    expected_paste = {
        "len": len(secret_paste),
        "sha256": hashlib.sha256(secret_paste.encode()).hexdigest()[:12],
    }
    expected_clip = {
        "len": len(secret_clip),
        "sha256": hashlib.sha256(secret_clip.encode()).hexdigest()[:12],
    }
    expected_art = {
        "len": len(secret_art),
        "sha256": hashlib.sha256(secret_art.encode()).hexdigest()[:12],
    }

    assert e1["fields"]["args"]["text"] == expected_paste
    assert e2["fields"]["result"] == expected_clip
    assert e3["fields"]["args"]["artifact"] == expected_art

    with open(log_false.path, "r", encoding="utf-8") as f:
        file_content = f.read()
    assert secret_paste not in file_content
    assert secret_clip not in file_content
    assert secret_art not in file_content

    # Contrast with log_text=True
    run_dir_true = str(tmp_path / "reveal_run")
    log_true = AuditLog(
        run_dir_true, run_id="run-show", mode="real", log_text=True
    )
    e4 = log_true.log(
        "tool_call", tool="paste_text", args={"text": "visible_text"}
    )
    assert e4["fields"]["args"]["text"] == "visible_text"


def test_append_across_two_instances_preserves_chain(
    tmp_path: pytest.TempPathFactory,
) -> None:
    """Verify that multiple AuditLog instances pointing to the same file maintain hash chain."""
    run_dir = str(tmp_path / "multi_instance_run")
    log1 = AuditLog(run_dir, run_id="run-persist", mode="demo")

    log1.log("run_start", initiator="agent")
    log1.log("tool_call", tool="open_app", name="editor")

    assert log1.seq == 2
    hash_after_log1 = log1.prev_hash

    # Second instance opens existing audit.jsonl
    log2 = AuditLog(run_dir, run_id="run-persist", mode="demo")
    assert log2.seq == 2
    assert log2.prev_hash == hash_after_log1

    log2.log("tool_result", tool="editor", status="ready")
    log2.log("finish", summary="complete")

    assert log2.seq == 4

    ok, count, err = verify_chain(log2.path)
    assert ok is True
    assert count == 4
    assert err is None


def test_clock_timing_and_events_set(
    tmp_path: pytest.TempPathFactory,
) -> None:
    """Verify custom clock timing computation and events set completeness."""
    now = 1000.0

    def fake_clock() -> float:
        return now

    run_dir = str(tmp_path / "clock_run")
    log = AuditLog(run_dir, run_id="run-clock", mode="demo", clock=fake_clock)
    e1 = log.log("run_start")
    assert e1["t"] == 0.0

    now = 1002.3456
    e2 = log.log("gate", decision="approve")
    assert e2["t"] == 2.346

    assert "run_start" in EVENTS
    assert "kill_switch_unavailable" in EVENTS
    assert "failsafe_abort" in EVENTS

    # Missing file returns failure gracefully
    missing_path = os.path.join(run_dir, "nonexistent.jsonl")
    ok, count, err = verify_chain(missing_path)
    assert ok is False
    assert count == 0
    assert err is not None and "File not found" in err
