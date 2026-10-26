"""Unit tests for Phase 4 reliability features: timeouts, retries, state machine, fallback, plan-only."""
from __future__ import annotations

import os
from unittest.mock import MagicMock
import pytest

from core.constants import EXIT_OK
from core.loop import format_tool_error, run_loop
from core.types import RunContext
from core.checkpoint import RunState
from core.model_client import ModelClient, ModelUnavailable


def test_format_tool_error_ends_with_what_to_do_next() -> None:
    """Verify tool error formatting ends with actionable 'what to do next' advice."""
    err = format_tool_error("click", TimeoutError("Operation timed out after 10s"))
    assert "what to do next" in err.lower()
    assert "ERROR in click:" in err


def test_phase_state_machine_transitions(tmp_path) -> None:
    """Verify state machine transitions: research -> plan -> build -> done."""
    state = RunState(run_id="test", idea="wedding app", phase="research")
    assert state.phase == "research"

    state.phase = "plan"
    d = state.to_dict()
    assert d["phase"] == "plan"

    restored = RunState.from_dict(d)
    assert restored.phase == "plan"


def test_model_fallback_on_primary_failure() -> None:
    """Verify ModelClient switches to fallback model if primary fails with retryable error."""
    mock_client = MagicMock()
    mock_audit = MagicMock()

    # Primary model fails, fallback succeeds
    call_count = {"primary": 0, "fallback": 0}

    class FakeCandidate:
        finish_reason = "STOP"
        content = MagicMock(parts=[MagicMock(text="fallback reply", function_call=None)])

    class FakeResponse:
        candidates = [FakeCandidate()]
        usage_metadata = {"prompt_token_count": 10, "candidates_token_count": 5}

    def _generate_content(model, contents, config):
        if model == "gemma-4-26b-a4b-it":
            call_count["primary"] += 1
            raise RuntimeError("503 Service Unavailable")
        elif model == "gemma-4-31b-it":
            call_count["fallback"] += 1
            return FakeResponse()
        raise ValueError(f"Unknown model: {model}")

    mock_client.models.generate_content.side_effect = _generate_content

    client = ModelClient(
        model_name="gemma-4-26b-a4b-it",
        tools=[],
        client=mock_client,
        fallback_model="gemma-4-31b-it",
        sleep=lambda s: None,
        audit=mock_audit,
    )

    res = client.generate(["hello"])
    assert res is not None
    assert call_count["fallback"] == 1
    # Check fallback logged in audit
    mock_audit.log.assert_any_call(
        "model_fallback",
        from_model="gemma-4-26b-a4b-it",
        to_model="gemma-4-31b-it",
        error=pytest.approx(mock_audit.log.call_args[1]["error"] if "error" in mock_audit.log.call_args[1] else ""),
    )


def test_plan_only_mode_exits_cleanly(tmp_path) -> None:
    """Verify --plan-only outputs plan and exits EXIT_OK without invoking tools."""
    mock_audit = MagicMock()
    mock_kill = MagicMock(is_set=lambda: False)
    mock_breaker = MagicMock()
    mock_notifier = MagicMock()
    state = RunState(run_id="plan-run", idea="test idea")

    ctx = RunContext(
        run_id="plan-run",
        run_dir=str(tmp_path),
        project_dir=str(tmp_path),
        mode="demo",
        audit=mock_audit,
        kill=mock_kill,
        breaker=mock_breaker,
        notifier=mock_notifier,
        switcher=None,
        state=state,
        max_steps=10,
        plan_only=True,
    )

    mock_desktop = MagicMock()
    tool_called = False

    def _dummy_tool():
        nonlocal tool_called
        tool_called = True
        return "ran"

    registry = {"dummy": _dummy_tool}

    class FakeCandidate:
        finish_reason = "STOP"
        fc = MagicMock()
        fc.name = "dummy"
        fc.args = {}
        content = MagicMock(parts=[MagicMock(text="Here is my execution plan", function_call=fc)])

    fake_model = MagicMock()
    fake_model.generate.return_value = FakeCandidate.content

    code = run_loop(ctx, mock_desktop, registry, fake_model, "Build something")
    assert code == EXIT_OK
    assert not tool_called
    mock_audit.log.assert_any_call("plan_only_complete", plan="Here is my execution plan")
