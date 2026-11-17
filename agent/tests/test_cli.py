"""Unit tests for Hush CLI parser and entrypoint."""
from __future__ import annotations

import os
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from core.checkpoint import RunState, save_checkpoint
from core.cli import (
    EXIT_ERROR,
    EXIT_FAILSAFE,
    EXIT_HUMAN_TIMEOUT,
    EXIT_KILL,
    EXIT_MAX_STEPS,
    EXIT_SUCCESS,
    main,
    parse_args,
)
from core.constants import EXIT_OK


@pytest.fixture(autouse=True)
def mock_build_tools_for_cli_tests(monkeypatch: pytest.MonkeyPatch) -> None:
    """Mock build_tools to isolate CLI logic from schema definitions."""
    monkeypatch.setattr("core.tool_schema.build_tools", lambda **kw: MagicMock(name="mock_tools"))


class FakeModel:
    """Mock model client."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        pass

    def generate(self, contents: list[Any]) -> Any:
        return MagicMock()


class FakeDesktop:
    """Mock desktop."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        pass

    def funcs(self) -> dict[str, Any]:
        return {}

    def paste_any(self, text: str, press_enter: bool = False) -> str:
        return "pasted"

    def clipboard_full(self) -> str:
        return ""

    def screenshot_png(self) -> bytes:
        return b"fake"


def test_parse_args_positional_idea() -> None:
    args = parse_args(["build", "a", "weather", "app"])
    assert args.idea == ["build", "a", "weather", "app"]
    assert args.resume is None
    assert not args.demo
    assert args.max_steps == 80


def test_parse_args_resume_flag() -> None:
    # No arg to resume -> "latest"
    args_default = parse_args(["--resume"])
    assert args_default.resume == "latest"

    # Specific run ID
    args_explicit = parse_args(["--resume", "20261022-120000"])
    assert args_explicit.resume == "20261022-120000"


def test_parse_args_all_flags() -> None:
    args = parse_args([
        "portfolio",
        "--demo",
        "--demo-limit",
        "--demo-answer",
        "PostgreSQL",
        "--account-switch",
        "--i-accept-account-switch-terms",
        "--log-text",
        "--max-steps",
        "42",
    ])
    assert args.idea == ["portfolio"]
    assert args.demo is True
    assert args.demo_limit is True
    assert args.demo_answer == "PostgreSQL"
    assert args.account_switch is True
    assert args.i_accept_account_switch_terms is True
    assert args.log_text is True
    assert args.max_steps == 42


def test_main_help_exits_zero_without_api_key(monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]) -> None:
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    with pytest.raises(SystemExit) as exc_info:
        main(["--help"])
    assert exc_info.value.code == 0
    captured = capsys.readouterr()
    assert "Hush" in captured.out
    assert "--resume" in captured.out
    assert "--provider" in captured.out


def test_demo_help_text_states_gemini_api_key_required(capsys: pytest.CaptureFixture[str]) -> None:
    with pytest.raises(SystemExit) as exc_info:
        main(["--help"])
    assert exc_info.value.code == 0
    captured = capsys.readouterr()
    normalized_out = " ".join(captured.out.split())
    assert "Simulate desktop environment; still requires GEMINI_API_KEY for model inference" in normalized_out


def test_main_empty_idea_returns_error(capsys: pytest.CaptureFixture[str]) -> None:
    code = main([])
    assert code == EXIT_ERROR
    captured = capsys.readouterr()
    assert "Error: Please provide a project idea" in captured.out


def test_main_fresh_run_with_factories(tmp_path: Any, monkeypatch: pytest.MonkeyPatch) -> None:
    fake_runs = str(tmp_path / "runs")
    monkeypatch.setattr("core.cli.RUNS_DIR", fake_runs)
    monkeypatch.setattr("core.constants.RUNS_DIR", fake_runs)

    with patch("core.loop.run_loop", return_value=EXIT_OK) as mock_loop:
        code = main(
            ["a", "todo", "app"],
            model_factory=lambda **kw: FakeModel(),
            desktop_factory=lambda **kw: FakeDesktop(),
        )
        assert code == EXIT_OK
        mock_loop.assert_called_once()
        ctx = mock_loop.call_args[0][0]
        assert ctx.state.idea == "a todo app"
        assert os.path.exists(os.path.join(ctx.run_dir, "checkpoint.json"))


def test_main_resume_no_saved_runs_fails(tmp_path: Any, monkeypatch: pytest.MonkeyPatch) -> None:
    fake_runs = str(tmp_path / "runs")
    monkeypatch.setattr("core.cli.RUNS_DIR", fake_runs)
    monkeypatch.setattr("core.constants.RUNS_DIR", fake_runs)

    code = main(["--resume"])
    assert code == EXIT_ERROR


def test_main_resume_existing_run(tmp_path: Any, monkeypatch: pytest.MonkeyPatch) -> None:
    fake_runs = str(tmp_path / "runs")
    monkeypatch.setattr("core.cli.RUNS_DIR", fake_runs)
    monkeypatch.setattr("core.constants.RUNS_DIR", fake_runs)

    run_dir = os.path.join(fake_runs, "20261022-100000")
    save_checkpoint(run_dir, RunState(run_id="20261022-100000", idea="Original idea", step=3))

    with patch("core.loop.run_loop", return_value=EXIT_OK) as mock_loop:
        code = main(
            ["--resume", "20261022-100000"],
            model_factory=lambda **kw: FakeModel(),
            desktop_factory=lambda **kw: FakeDesktop(),
        )
        assert code == EXIT_OK
        mock_loop.assert_called_once()
        first_msg = mock_loop.call_args[0][4]
        assert "Original idea" in first_msg


def test_main_account_switch_declined(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("HUSH_CHROME_PROFILES", "Profile 1, Profile 2")
    # Not passing --i-accept-account-switch-terms and mocking confirm input as 'no'
    with patch("builtins.input", return_value="no"):
        code = main(["an", "idea", "--account-switch"])
        assert code == EXIT_ERROR


def test_parse_args_provider() -> None:
    # Default is gemma
    args_default = parse_args(["some", "idea"])
    assert args_default.provider == "gemma"

    # Explicit openai
    args_openai = parse_args(["some", "idea", "--provider", "openai"])
    assert args_openai.provider == "openai"

    # Invalid choice exits
    with pytest.raises(SystemExit):
        parse_args(["some", "idea", "--provider", "unsupported"])


def test_main_provider_routing_default_gemma(tmp_path: Any, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]) -> None:
    fake_runs = str(tmp_path / "runs")
    monkeypatch.setattr("core.cli.RUNS_DIR", fake_runs)
    monkeypatch.setattr("core.constants.RUNS_DIR", fake_runs)
    monkeypatch.setenv("GEMINI_API_KEY", "mock-gemini-key")

    with patch("core.model_client.ModelClient", return_value=FakeModel()) as mock_client_cls, \
         patch("core.loop.run_loop", return_value=EXIT_OK) as mock_loop:
        code = main(
            ["test", "gemma", "flow"],
            desktop_factory=lambda **kw: FakeDesktop(),
        )
        assert code == EXIT_OK
        mock_client_cls.assert_called_once()
        assert mock_client_cls.call_args[0][0] == "gemma-4-26b-a4b-it"
        mock_loop.assert_called_once()
        ctx = mock_loop.call_args[0][0]
        # Inspect audit.jsonl for run_start event
        audit_file = os.path.join(ctx.run_dir, "audit.jsonl")
        assert os.path.exists(audit_file)
        with open(audit_file, "r", encoding="utf-8") as f:
            first_event = f.readline()
            assert '"event": "run_start"' in first_event
            assert '"provider": "gemma"' in first_event
            assert '"model": "gemma-4-26b-a4b-it"' in first_event

    captured = capsys.readouterr()
    assert "PROVIDER: gemma / gemma-4-26b-a4b-it" in captured.out


def test_main_provider_routing_openai(tmp_path: Any, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]) -> None:
    fake_runs = str(tmp_path / "runs")
    monkeypatch.setattr("core.cli.RUNS_DIR", fake_runs)
    monkeypatch.setattr("core.constants.RUNS_DIR", fake_runs)
    monkeypatch.setenv("OPENAI_API_KEY", "mock-openai-key")

    with patch("core.openai_client.OpenAIModelClient", return_value=FakeModel()) as mock_openai_cls, \
         patch("core.loop.run_loop", return_value=EXIT_OK) as mock_loop:
        code = main(
            ["test", "openai", "flow", "--provider", "openai"],
            desktop_factory=lambda **kw: FakeDesktop(),
        )
        assert code == EXIT_OK
        mock_openai_cls.assert_called_once()
        assert mock_openai_cls.call_args[0][0] == "gpt-4o"
        mock_loop.assert_called_once()
        ctx = mock_loop.call_args[0][0]
        audit_file = os.path.join(ctx.run_dir, "audit.jsonl")
        assert os.path.exists(audit_file)
        with open(audit_file, "r", encoding="utf-8") as f:
            first_event = f.readline()
            assert '"event": "run_start"' in first_event
            assert '"provider": "openai"' in first_event
            assert '"model": "gpt-4o"' in first_event

    captured = capsys.readouterr()
    assert "PROVIDER: openai / gpt-4o" in captured.out


def test_main_demo_mode_prints_provider(tmp_path: Any, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]) -> None:
    fake_runs = str(tmp_path / "runs")
    monkeypatch.setattr("core.cli.RUNS_DIR", fake_runs)
    monkeypatch.setattr("core.constants.RUNS_DIR", fake_runs)
    monkeypatch.setenv("GEMINI_API_KEY", "mock-gemini-key")
    monkeypatch.setenv("OPENAI_API_KEY", "mock-openai-key")

    with patch("core.model_client.ModelClient", return_value=FakeModel()), \
         patch("core.loop.run_loop", return_value=EXIT_OK):
        code = main(["test", "demo", "--demo", "--demo-answer", "sqlite"])
        assert code == EXIT_OK
    captured = capsys.readouterr()
    assert "DEMO MODE: simulated desktop, real gemma calls" in captured.out

    with patch("core.openai_client.OpenAIModelClient", return_value=FakeModel()), \
         patch("core.loop.run_loop", return_value=EXIT_OK):
        code = main(["test", "demo", "--demo", "--provider", "openai", "--demo-answer", "sqlite"])
        assert code == EXIT_OK
    captured = capsys.readouterr()
    assert "DEMO MODE: simulated desktop, real openai calls" in captured.out


# --- J-001 Regression Tests ---

def test_main_demo_missing_gemini_api_key_exits_error(monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]) -> None:
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    code = main(["--demo", "--demo-answer", "SQLite", "a modern task board application"])
    assert code == EXIT_ERROR
    captured = capsys.readouterr()
    assert (
        "Error: GEMINI_API_KEY environment variable is required "
        "(even in --demo mode, which simulates the desktop environment while querying the model). "
        "Please set GEMINI_API_KEY and retry."
    ) in captured.out


def test_main_demo_bare_missing_gemini_api_key_exits_error(monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]) -> None:
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    code = main(["--demo"])
    assert code == EXIT_ERROR
    captured = capsys.readouterr()
    assert (
        "Error: GEMINI_API_KEY environment variable is required "
        "(even in --demo mode, which simulates the desktop environment while querying the model). "
        "Please set GEMINI_API_KEY and retry."
    ) in captured.out


def test_main_real_missing_gemini_api_key_exits_error(monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]) -> None:
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    code = main(["build", "something"])
    assert code == EXIT_ERROR
    captured = capsys.readouterr()
    assert (
        "Error: GEMINI_API_KEY environment variable is required "
        "(even in --demo mode, which simulates the desktop environment while querying the model). "
        "Please set GEMINI_API_KEY and retry."
    ) in captured.out


def test_main_openai_missing_api_key_exits_error(monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    code = main(["build", "something", "--provider", "openai"])
    assert code == EXIT_ERROR
    captured = capsys.readouterr()
    assert (
        "Error: OPENAI_API_KEY environment variable is required "
        "(even in --demo mode, which simulates the desktop environment while querying the model). "
        "Please set OPENAI_API_KEY and retry."
    ) in captured.out


# --- A-018 Regression Tests ---

def test_exit_code_constants() -> None:
    import core.constants as constants

    assert EXIT_SUCCESS == 0
    assert EXIT_ERROR == 1
    assert EXIT_FAILSAFE == 2
    assert EXIT_KILL == 3
    assert EXIT_MAX_STEPS == 4
    assert EXIT_HUMAN_TIMEOUT == 5

    assert getattr(constants, "EXIT_SUCCESS") == 0
    assert getattr(constants, "EXIT_HUMAN_TIMEOUT") == 5


def test_main_maps_exit_codes_consistently(tmp_path: Any, monkeypatch: pytest.MonkeyPatch) -> None:
    fake_runs = str(tmp_path / "runs")
    monkeypatch.setattr("core.cli.RUNS_DIR", fake_runs)
    monkeypatch.setattr("core.constants.RUNS_DIR", fake_runs)

    for exit_code in (EXIT_SUCCESS, EXIT_FAILSAFE, EXIT_KILL, EXIT_MAX_STEPS, EXIT_HUMAN_TIMEOUT):
        with patch("core.loop.run_loop", return_value=exit_code):
            code = main(
                ["test", "idea"],
                model_factory=lambda **kw: FakeModel(),
                desktop_factory=lambda **kw: FakeDesktop(),
            )
            assert code == exit_code


# --- Provider and Model Validation Tests ---

def test_main_unknown_provider_cli_exits_error() -> None:
    code = main(["some", "idea", "--provider", "unsupported"])
    assert code == EXIT_ERROR


def test_main_unknown_provider_bypassing_parse_args(tmp_path: Any, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]) -> None:
    fake_runs = str(tmp_path / "runs")
    monkeypatch.setattr("core.cli.RUNS_DIR", fake_runs)
    fake_args = MagicMock(
        demo=False,
        provider="invalid_provider",
        model=None,
        doctor=False,
        doctor_ui=False,
        calibrate=False,
        resume=None,
        idea=["test"],
        log_text=False,
    )
    with patch("core.cli.parse_args", return_value=fake_args):
        code = main(["test"])
        assert code == EXIT_ERROR
        captured = capsys.readouterr()
        assert "Error: Unknown provider 'invalid_provider'" in captured.out
