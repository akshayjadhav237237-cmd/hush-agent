"""Tests for compare_runs module."""
from __future__ import annotations

import json
from pathlib import Path
import pytest

from core.audit import AuditLog
from compare_runs import (
    compare_runs,
    format_table,
    locate_audit_log,
    main,
    parse_audit_log,
    RunMetrics,
)


def _parse_table_rows(table_str: str) -> dict[str, tuple[str, str]]:
    """Helper to parse key -> (run_a_val, run_b_val) from aligned table output."""
    rows: dict[str, tuple[str, str]] = {}
    lines = [line.strip() for line in table_str.strip().splitlines()]
    if len(lines) < 3:
        return rows
    # Line 0 is header, line 1 is divider, lines 2+ are data
    for line in lines[2:]:
        parts = [p.strip() for p in line.split("|")]
        if len(parts) == 3:
            rows[parts[0]] = (parts[1], parts[2])
    return rows


def test_valid_run_comparison_output(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    """Verify comparing two valid runs outputs an aligned table matching all metrics."""
    dir_a = tmp_path / "run_alpha"
    dir_b = tmp_path / "run_beta"

    log_a = AuditLog(str(dir_a), run_id="run_alpha", mode="demo")
    log_a.log("run_start", idea="Build app", provider="gemma", model="gemma-4-26b-it")
    log_a.log("model_text", text="Let's begin", prompt_tokens=150, completion_tokens=50)
    log_a.log("checkpoint", step=1)
    log_a.log("gate", trigger="human_notification")
    log_a.log("model_text", text="Finishing up", prompt_tokens=250, completion_tokens=100)
    log_a.log("checkpoint", step=2)
    log_a.log("finish", summary="Success")

    log_b = AuditLog(str(dir_b), run_id="run_beta", mode="demo")
    log_b.log("run_start", idea="Build portfolio", provider="openai", model="gpt-4o")
    log_b.log("retry", attempt=1, error="Rate limit")
    log_b.log("model_text", text="Generating code", prompt_tokens=500, completion_tokens=200)
    log_b.log("checkpoint", step=1)
    log_b.log("kill", step=1)

    exit_code = main([str(dir_a), str(dir_b)])
    assert exit_code == 0

    captured = capsys.readouterr()
    output = captured.out
    assert "Metric" in output
    assert "Run A (run_alpha)" in output
    assert "Run B (run_beta)" in output

    rows = _parse_table_rows(output)
    assert rows["provider"] == ("gemma", "openai")
    assert rows["model"] == ("gemma-4-26b-it", "gpt-4o")
    assert rows["steps"] == ("2", "1")
    assert rows["retries"] == ("0", "1")
    assert rows["gate count"] == ("1", "0")
    assert rows["kill count"] == ("0", "1")
    assert rows["prompt_tokens"] == ("400", "500")
    assert rows["completion_tokens"] == ("150", "200")
    assert rows["wall_time"][0].endswith("s")
    assert rows["wall_time"][1].endswith("s")
    assert "cost" not in rows


def test_cost_calculation_with_price_flags(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    """Verify cost is correctly calculated and formatted when price flags are provided."""
    dir_a = tmp_path / "run_cost_a"
    dir_b = tmp_path / "run_cost_b"

    log_a = AuditLog(str(dir_a), run_id="run_cost_a", mode="real")
    log_a.log("run_start", provider="gemma", model="gemma-model")
    log_a.log("model_text", prompt_tokens=100_000, completion_tokens=50_000)

    log_b = AuditLog(str(dir_b), run_id="run_cost_b", mode="real")
    log_b.log("run_start", provider="openai", model="gpt-4o")
    log_b.log("model_text", prompt_tokens=200_000, completion_tokens=100_000)

    # Prices: $2.50 per 1M input, $10.00 per 1M output
    # Run A: (100,000 * 2.5 / 1,000,000) + (50,000 * 10 / 1,000,000) = 0.25 + 0.50 = 0.7500
    # Run B: (200,000 * 2.5 / 1,000,000) + (100,000 * 10 / 1,000,000) = 0.50 + 1.00 = 1.5000
    exit_code = main([
        str(dir_a),
        str(dir_b),
        "--price-in",
        "2.50",
        "--price-out",
        "10.00",
    ])
    assert exit_code == 0

    captured = capsys.readouterr()
    rows = _parse_table_rows(captured.out)
    assert "cost" in rows
    assert rows["cost"] == ("$0.7500", "$1.5000")


def test_cost_omitted_when_partial_prices(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    """Verify cost is omitted when only one of the price flags is specified."""
    dir_a = tmp_path / "run_pa"
    dir_b = tmp_path / "run_pb"

    log_a = AuditLog(str(dir_a), run_id="run_pa", mode="demo")
    log_a.log("run_start")
    log_b = AuditLog(str(dir_b), run_id="run_pb", mode="demo")
    log_b.log("run_start")

    # Only --price-in
    main([str(dir_a), str(dir_b), "--price-in", "1.5"])
    rows1 = _parse_table_rows(capsys.readouterr().out)
    assert "cost" not in rows1

    # Only --price-out
    main([str(dir_a), str(dir_b), "--price-out", "5.0"])
    rows2 = _parse_table_rows(capsys.readouterr().out)
    assert "cost" not in rows2


def test_refusal_when_tampered(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    """Verify refusal and exit code 1 when an audit log fails cryptographic verification."""
    dir_valid = tmp_path / "run_valid"
    dir_tampered = tmp_path / "run_tampered"

    log_v = AuditLog(str(dir_valid), run_id="run_valid", mode="demo")
    log_v.log("run_start")
    log_v.log("finish")

    log_t = AuditLog(str(dir_tampered), run_id="run_tampered", mode="demo")
    log_t.log("run_start", idea="original")
    log_t.log("finish")

    # Tamper with the first entry in run_tampered
    audit_file = dir_tampered / "audit.jsonl"
    lines = audit_file.read_text(encoding="utf-8").splitlines()
    first_entry = json.loads(lines[0])
    first_entry["fields"]["idea"] = "tampered_payload"
    lines[0] = json.dumps(first_entry)
    audit_file.write_text("\n".join(lines) + "\n", encoding="utf-8")

    # When first run is tampered
    exit_code_1 = main([str(dir_tampered), str(dir_valid)])
    assert exit_code_1 == 1
    captured_1 = capsys.readouterr()
    assert "Audit log verification failed" in captured_1.err
    assert captured_1.out == ""

    # When second run is tampered
    exit_code_2 = main([str(dir_valid), str(dir_tampered)])
    assert exit_code_2 == 1
    captured_2 = capsys.readouterr()
    assert "Audit log verification failed" in captured_2.err
    assert captured_2.out == ""

    # Direct function call raises ValueError
    with pytest.raises(ValueError, match="Audit log verification failed"):
        compare_runs(str(dir_tampered), str(dir_valid))


def test_locate_runs_in_runs_dir(tmp_path: Path, capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify locating runs by ID inside RUNS_DIR."""
    runs_dir = tmp_path / "runs"
    run_1_dir = runs_dir / "run_001"
    run_2_dir = runs_dir / "run_002"

    log_1 = AuditLog(str(run_1_dir), run_id="run_001", mode="demo")
    log_1.log("run_start", provider="gemma", model="gemma-3")

    log_2 = AuditLog(str(run_2_dir), run_id="run_002", mode="demo")
    log_2.log("run_start", provider="openai", model="gpt-4o-mini")

    # Patch RUNS_DIR in core.constants
    monkeypatch.setattr("core.constants.RUNS_DIR", str(runs_dir))

    exit_code = main(["run_001", "run_002"])
    assert exit_code == 0
    captured = capsys.readouterr()
    assert "Run A (run_001)" in captured.out
    assert "Run B (run_002)" in captured.out
    rows = _parse_table_rows(captured.out)
    assert rows["provider"] == ("gemma", "openai")


def test_direct_file_path_resolution(tmp_path: Path) -> None:
    """Verify passing direct path to audit.jsonl files works correctly."""
    dir_a = tmp_path / "direct_a"
    dir_b = tmp_path / "direct_b"

    log_a = AuditLog(str(dir_a), run_id="dir_a", mode="demo")
    log_a.log("run_start")
    log_b = AuditLog(str(dir_b), run_id="dir_b", mode="demo")
    log_b.log("run_start")

    file_a = dir_a / "audit.jsonl"
    file_b = dir_b / "audit.jsonl"

    output = compare_runs(str(file_a), str(file_b))
    assert "Run A (dir_a)" in output
    assert "Run B (dir_b)" in output


def test_missing_run_returns_error(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    """Verify error reporting when a run cannot be found."""
    exit_code = main(["non_existent_run_x", "non_existent_run_y"])
    assert exit_code == 1
    captured = capsys.readouterr()
    assert "Audit log not found" in captured.err


def test_defaults_when_events_missing_fields(tmp_path: Path) -> None:
    """Verify default values when events have empty or missing fields."""
    dir_empty = tmp_path / "run_empty"
    log = AuditLog(str(dir_empty), run_id="run_empty", mode="demo")
    # Log run_start without provider or model
    log.log("run_start")

    audit_file = str(dir_empty / "audit.jsonl")
    metrics = parse_audit_log(audit_file, fallback_run_id="run_empty")
    assert metrics.provider == "gemma"
    assert metrics.model == "unknown"
    assert metrics.steps == 0
    assert metrics.retries == 0
    assert metrics.gate_count == 0
    assert metrics.kill_count == 0
    assert metrics.prompt_tokens == 0
    assert metrics.completion_tokens == 0
    assert metrics.wall_time == 0.0
