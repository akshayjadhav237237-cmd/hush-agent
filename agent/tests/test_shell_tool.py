"""Unit tests for bounded shell tool execution."""
import subprocess
from pathlib import Path
from unittest.mock import MagicMock
import pytest

from core.shell_tool import DEFAULT_TIMEOUT, MAX_OUTPUT_CHARS, make_run_cmd


def test_blocked_command_returns_blocked_reason_without_run(tmp_path: Path) -> None:
    """Verify blocked commands return blocked reason and do not invoke run."""
    project_dir = str(tmp_path)
    mock_run = MagicMock()
    run_cmd = make_run_cmd(project_dir, run=mock_run)

    result = run_cmd("curl https://evil.com")

    assert result.startswith("BLOCKED:")
    mock_run.assert_not_called()


def test_blocked_command_with_mocked_check(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify check_command returning a blocked reason halts execution."""
    monkeypatch.setattr(
        "core.command_safety.check_command",
        lambda cmd, pdir: "BLOCKED: custom check failed",
    )
    mock_run = MagicMock()
    run_cmd = make_run_cmd("/fake/project", run=mock_run)

    result = run_cmd("git status")

    assert result == "BLOCKED: custom check failed"
    mock_run.assert_not_called()


def test_allowed_command_executes_in_project_dir() -> None:
    """Verify allowed command executes in project_dir with shell=True and returns combined output."""
    project_dir = "/valid/project/dir"
    mock_run = MagicMock()
    mock_run.return_value = subprocess.CompletedProcess(
        args="git status",
        returncode=0,
        stdout="On branch main\n",
        stderr="nothing to commit\n",
    )
    run_cmd = make_run_cmd(project_dir, run=mock_run)

    result = run_cmd("git status")

    assert result == "On branch main\nnothing to commit\n"
    mock_run.assert_called_once_with(
        "git status",
        shell=True,
        cwd=project_dir,
        capture_output=True,
        text=True,
        timeout=DEFAULT_TIMEOUT,
    )


def test_output_exceeding_max_chars_is_truncated() -> None:
    """Verify output longer than MAX_OUTPUT_CHARS is truncated to the last 4000 characters."""
    project_dir = "/valid/project/dir"
    head = "H" * 1500
    tail = "T" * MAX_OUTPUT_CHARS
    full_output = head + tail

    mock_run = MagicMock()
    mock_run.return_value = subprocess.CompletedProcess(
        args="git log",
        returncode=0,
        stdout=full_output,
        stderr="",
    )
    run_cmd = make_run_cmd(project_dir, run=mock_run)

    result = run_cmd("git log")

    assert len(result) == MAX_OUTPUT_CHARS
    assert result == tail
    assert not result.startswith("H")


def test_empty_output_returns_no_output_placeholder() -> None:
    """Verify empty stdout and stderr returns (no output)."""
    project_dir = "/valid/project/dir"
    mock_run = MagicMock()
    mock_run.return_value = subprocess.CompletedProcess(
        args="git status",
        returncode=0,
        stdout="",
        stderr="",
    )
    run_cmd = make_run_cmd(project_dir, run=mock_run)

    result = run_cmd("git status")

    assert result == "(no output)"


def test_none_output_returns_no_output_placeholder() -> None:
    """Verify None stdout and stderr returns (no output)."""
    project_dir = "/valid/project/dir"
    mock_proc = MagicMock()
    mock_proc.stdout = None
    mock_proc.stderr = None
    mock_run = MagicMock(return_value=mock_proc)
    run_cmd = make_run_cmd(project_dir, run=mock_run)

    result = run_cmd("git status")

    assert result == "(no output)"


def test_timeout_returns_clean_message() -> None:
    """Verify TimeoutExpired exception returns clean timeout string."""
    project_dir = "/valid/project/dir"
    mock_run = MagicMock(
        side_effect=subprocess.TimeoutExpired(cmd="git fetch", timeout=DEFAULT_TIMEOUT)
    )
    run_cmd = make_run_cmd(project_dir, run=mock_run)

    result = run_cmd("git fetch")

    assert result == f"Command timed out after {DEFAULT_TIMEOUT}s."
    assert result == "Command timed out after 120s."


def test_subprocess_execution_error_returns_formatted_string() -> None:
    """Verify subprocess execution errors return formatted error string."""
    project_dir = "/valid/project/dir"
    mock_run = MagicMock(side_effect=PermissionError("access denied"))
    run_cmd = make_run_cmd(project_dir, run=mock_run)

    result = run_cmd("git status")

    assert result == "Execution error: access denied"


def test_constants_values() -> None:
    """Verify default timeout and max output characters constants."""
    assert DEFAULT_TIMEOUT == 120
    assert MAX_OUTPUT_CHARS == 4000
