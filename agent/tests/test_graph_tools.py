"""Unit tests for GraphTools and Graphify integrations."""
from __future__ import annotations

import hashlib
import os
import subprocess
from typing import Any
import pytest

from core.checkpoint import RunState
from core.graph_tools import (
    GRAPHIFY_INSTALL_HELP,
    MAX_REPORT_CHARS,
    GraphTools,
)


def test_funcs_returns_all_six_tools(tmp_path: Any) -> None:
    """Verify funcs() returns a dictionary with all 6 callable tool functions."""
    tools = GraphTools(project_dir=str(tmp_path))
    funcs = tools.funcs()
    expected_keys = {
        "graph_build",
        "graph_update",
        "graph_report",
        "graph_query",
        "graph_explain",
        "graph_path",
    }
    assert set(funcs.keys()) == expected_keys
    for name, func in funcs.items():
        assert callable(func)


def test_file_not_found_returns_install_help() -> None:
    """Verify FileNotFoundError returns exact install message with two y's."""
    def mock_run(*args: Any, **kwargs: Any) -> Any:
        raise FileNotFoundError("graphify binary not found")

    tools = GraphTools(project_dir="/fake/project", run=mock_run)
    result = tools._graphify("status")
    assert result == "graphify is not installed. Install with: uv tool install graphifyy"
    assert result == GRAPHIFY_INSTALL_HELP
    assert result.endswith("graphifyy")


def test_graph_build_runs_commands_sequentially(tmp_path: Any) -> None:
    """Verify graph_build runs extract, cluster-only, export html in order."""
    calls: list[list[str]] = []

    def mock_run(cmd: list[str], **kwargs: Any) -> Any:
        calls.append(cmd)
        return subprocess.CompletedProcess(
            args=cmd,
            returncode=0,
            stdout=f"ok {cmd[1]}",
            stderr="",
        )

    tools = GraphTools(project_dir=str(tmp_path), run=mock_run)
    res = tools.graph_build()

    assert calls == [
        ["graphify", "extract", ".", "--code-only"],
        ["graphify", "cluster-only", ".", "--no-label"],
        ["graphify", "export", "html"],
    ]
    assert "ok extract" in res
    assert "ok cluster-only" in res
    assert "ok export" in res
    expected_html = os.path.join(str(tmp_path), "graphify-out", "graph.html")
    assert f"Graph HTML: {expected_html}" in res


def test_graph_update_detects_stall_twice_and_calls_notifier(tmp_path: Any) -> None:
    """Verify graph_update increments stalls and alerts human when hash repeats twice."""
    out_dir = tmp_path / "graphify-out"
    out_dir.mkdir(parents=True, exist_ok=True)
    report_file = out_dir / "GRAPH_REPORT.md"
    report_file.write_text("# Graph Report Content", encoding="utf-8")

    class MockNotifier:
        def __init__(self) -> None:
            self.calls: list[str] = []

        def ask_human(self, message: str) -> str:
            self.calls.append(message)
            return "Human acknowledges build issue"

    def mock_run(cmd: list[str], **kwargs: Any) -> Any:
        return subprocess.CompletedProcess(args=cmd, returncode=0, stdout="done", stderr="")

    notifier = MockNotifier()
    state = RunState(run_id="run-1", idea="test")
    tools = GraphTools(
        project_dir=str(tmp_path),
        run=mock_run,
        notifier=notifier,
        state=state,
    )

    # First update: establishes baseline hash
    res1 = tools.graph_update()
    assert state.graph_stalls == 0
    assert state.graph_last_hash is not None
    assert len(notifier.calls) == 0
    assert "[!] ATTENTION:" not in res1

    # Second update (stall 1): identical hash
    res2 = tools.graph_update()
    assert state.graph_stalls == 1
    assert len(notifier.calls) == 0
    assert "[!] ATTENTION:" not in res2

    # Third update (stall 2): identical hash again -> alerts human
    res3 = tools.graph_update()
    assert state.graph_stalls == 2
    assert len(notifier.calls) == 1
    alert_msg = (
        "The code graph has not changed for 2 rounds in a row. "
        "The build may be stuck."
    )
    assert notifier.calls[0] == alert_msg
    assert f"[!] ATTENTION: {alert_msg}" in res3
    assert "Human acknowledges build issue" in res3


def test_graph_update_resets_stalls_on_different_hash(tmp_path: Any) -> None:
    """Verify different GRAPH_REPORT.md hash resets state.graph_stalls to 0."""
    out_dir = tmp_path / "graphify-out"
    out_dir.mkdir(parents=True, exist_ok=True)
    report_file = out_dir / "GRAPH_REPORT.md"
    report_file.write_text("Report Content Version 2", encoding="utf-8")

    def mock_run(cmd: list[str], **kwargs: Any) -> Any:
        return subprocess.CompletedProcess(args=cmd, returncode=0, stdout="updated", stderr="")

    state = RunState(
        run_id="run-1",
        idea="test",
        graph_stalls=2,
        graph_last_hash="previous_stalled_hash",
    )
    tools = GraphTools(project_dir=str(tmp_path), run=mock_run, state=state)

    res = tools.graph_update()
    assert state.graph_stalls == 0
    expected_hash = hashlib.sha256(b"Report Content Version 2").hexdigest()
    assert state.graph_last_hash == expected_hash
    assert "[!] ATTENTION:" not in res


def test_graph_report_reads_and_truncates(tmp_path: Any) -> None:
    """Verify graph_report reads report file and truncates to MAX_REPORT_CHARS."""
    missing_tools = GraphTools(project_dir=str(tmp_path / "nonexistent"))
    assert missing_tools.graph_report() == "No report yet. Call graph_build first."

    out_dir = tmp_path / "graphify-out"
    out_dir.mkdir(parents=True, exist_ok=True)
    report_file = out_dir / "GRAPH_REPORT.md"

    long_text = "A" * 7500
    report_file.write_text(long_text, encoding="utf-8")

    tools = GraphTools(project_dir=str(tmp_path))
    content = tools.graph_report()
    assert len(content) == MAX_REPORT_CHARS
    assert len(content) == 6000
    assert content == "A" * 6000


def test_graph_query_explain_path_pass_arguments(tmp_path: Any) -> None:
    """Verify graph_query, graph_explain, and graph_path forward arguments."""
    calls: list[list[str]] = []

    def mock_run(cmd: list[str], **kwargs: Any) -> Any:
        calls.append(cmd)
        return subprocess.CompletedProcess(
            args=cmd,
            returncode=0,
            stdout=f"ans-{cmd[1]}",
            stderr="",
        )

    tools = GraphTools(project_dir=str(tmp_path), run=mock_run)

    q_res = tools.graph_query("where is auth handled?")
    assert calls[-1] == ["graphify", "query", "where is auth handled?"]
    assert q_res == "ans-query"

    e_res = tools.graph_explain("AuthToken")
    assert calls[-1] == ["graphify", "explain", "AuthToken"]
    assert e_res == "ans-explain"

    p_res = tools.graph_path("Frontend", "Backend")
    assert calls[-1] == ["graphify", "path", "Frontend", "Backend"]
    assert p_res == "ans-path"


def test_timeout_expired_returns_timed_out(tmp_path: Any) -> None:
    """Verify subprocess.TimeoutExpired returns timeout message."""
    def mock_run(*args: Any, **kwargs: Any) -> Any:
        raise subprocess.TimeoutExpired(cmd=["graphify", "query"], timeout=300)

    tools = GraphTools(project_dir=str(tmp_path), run=mock_run)
    assert tools._graphify("query", "test") == "graphify timed out."


def test_graph_update_missing_report_file(tmp_path: Any) -> None:
    """Verify graph_update returns note when GRAPH_REPORT.md is absent."""
    def mock_run(cmd: list[str], **kwargs: Any) -> Any:
        return subprocess.CompletedProcess(args=cmd, returncode=0, stdout="done", stderr="")

    tools = GraphTools(project_dir=str(tmp_path), run=mock_run)
    res = tools.graph_update()
    assert "(no GRAPH_REPORT.md found; run graph_build first)" in res


def test_graph_update_stall_without_notifier(tmp_path: Any) -> None:
    """Verify graph_update alerts correctly when notifier is None."""
    out_dir = tmp_path / "graphify-out"
    out_dir.mkdir(parents=True, exist_ok=True)
    report_file = out_dir / "GRAPH_REPORT.md"
    report_file.write_text("static-content", encoding="utf-8")

    def mock_run(cmd: list[str], **kwargs: Any) -> Any:
        return subprocess.CompletedProcess(args=cmd, returncode=0, stdout="done", stderr="")

    content_hash = hashlib.sha256(b"static-content").hexdigest()
    state = RunState(
        run_id="run-1",
        idea="test",
        graph_stalls=1,
        graph_last_hash=content_hash,
    )
    tools = GraphTools(project_dir=str(tmp_path), run=mock_run, notifier=None, state=state)
    res = tools.graph_update()
    assert state.graph_stalls == 2
    alert_msg = (
        "The code graph has not changed for 2 rounds in a row. "
        "The build may be stuck."
    )
    assert f"\n[!] ATTENTION: {alert_msg}" in res
