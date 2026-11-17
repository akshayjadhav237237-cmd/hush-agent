"""Unit tests for main execution loop, failsafe handling, and model dispatch."""
from __future__ import annotations

import io
import os
from typing import Any
from unittest.mock import MagicMock

from PIL import Image
import pytest
from google.genai import types

from core.checkpoint import RunState
from core.constants import (
    EXIT_FAILSAFE,
    EXIT_KILL,
    EXIT_MAX_STEPS,
    EXIT_MODEL_FAILURE,
    EXIT_OK,
)
from core.loop import CONTINUE_NUDGE, run_loop
from core.model_client import ModelUnavailable
from core.types import RunContext


class FailSafeException(Exception):
    """Simulated pyautogui FailSafeException."""
    pass


class ScriptedModel:
    """Scripted fake model returning pre-defined content turns."""

    def __init__(self, turns: list[Any]) -> None:
        self.turns = list(turns)
        self.call_count = 0
        self.history: list[list[Any]] = []

    def generate(self, contents: list[Any]) -> Any:
        self.history.append(list(contents))
        if not self.turns:
            raise RuntimeError("ScriptedModel has no more turns")
        turn = self.turns.pop(0)
        if isinstance(turn, Exception):
            raise turn
        self.call_count += 1
        return turn


class FakeDesktop:
    """Mock desktop for loop tests."""

    def __init__(self) -> None:
        self.screenshot_count = 0

    def funcs(self) -> dict[str, Any]:
        return {}

    def paste_any(self, text: str, press_enter: bool = False) -> str:
        return f"pasted {len(text)}"

    def clipboard_full(self) -> str:
        return "fake clipboard"

    def screenshot_png(self) -> bytes:
        self.screenshot_count += 1
        buf = io.BytesIO()
        img = Image.new("RGB", (16, 16), color=(50, 100, 150))
        img.save(buf, format="PNG")
        return buf.getvalue()


@pytest.fixture
def loop_context(tmp_path: Any) -> RunContext:
    run_dir = str(tmp_path / "run_loop")
    os.makedirs(run_dir, exist_ok=True)
    project_dir = str(tmp_path / "project_loop")
    os.makedirs(project_dir, exist_ok=True)

    state = RunState(run_id="20261022-130000", idea="Test loop")
    audit = MagicMock()
    kill = MagicMock()
    kill.is_set.return_value = False
    breaker = MagicMock()
    breaker.observe.return_value = None
    notifier = MagicMock()
    notifier.ask_human.return_value = "Proceed"

    return RunContext(
        run_id="20261022-130000",
        run_dir=run_dir,
        project_dir=project_dir,
        mode="real",
        audit=audit,
        kill=kill,
        breaker=breaker,
        notifier=notifier,
        switcher=None,
        state=state,
        max_steps=5,
    )


def _make_tool_call_content(name: str, args: dict[str, Any]) -> types.Content:
    return types.Content(
        role="model",
        parts=[
            types.Part.from_function_call(name=name, args=args),
        ],
    )


def test_loop_reaches_finish_exit_ok(loop_context: RunContext) -> None:
    desktop = FakeDesktop()
    registry = {"click": lambda x, y: f"clicked {x},{y}"}

    turns = [
        _make_tool_call_content("click", {"x": 10, "y": 20}),
        _make_tool_call_content("finish", {"summary": "Done building app"}),
    ]
    model = ScriptedModel(turns)

    code = run_loop(loop_context, desktop, registry, model, "Start idea")
    assert code == EXIT_OK
    loop_context.audit.log.assert_any_call("finish", summary="Done building app")


def test_loop_kill_switch_tripped(loop_context: RunContext) -> None:
    desktop = FakeDesktop()
    registry = {}
    loop_context.kill.is_set.return_value = True

    model = ScriptedModel([])
    code = run_loop(loop_context, desktop, registry, model, "Start idea")
    assert code == EXIT_KILL
    loop_context.audit.log.assert_called_with("kill", step=0)


def test_loop_failsafe_aborts_immediately(loop_context: RunContext) -> None:
    desktop = FakeDesktop()

    def _exploding_click(x, y):
        raise FailSafeException("Mouse in corner")

    registry = {"click": _exploding_click}
    turns = [_make_tool_call_content("click", {"x": 0, "y": 0})]
    model = ScriptedModel(turns)

    code = run_loop(loop_context, desktop, registry, model, "Start idea")
    assert code == EXIT_FAILSAFE
    loop_context.audit.log.assert_any_call("failsafe_abort")


def test_loop_normal_tool_error_redacted_and_continues(loop_context: RunContext) -> None:
    desktop = FakeDesktop()

    valid_secret = "AIzaSy" + ("A" * 33)

    def _failing_cmd(cmd):
        raise ValueError(f"Secret key {valid_secret} failed")

    registry = {"run_cmd": _failing_cmd}
    turns = [
        _make_tool_call_content("run_cmd", {"cmd": "test"}),
        _make_tool_call_content("finish", {"summary": "all done"}),
    ]
    model = ScriptedModel(turns)

    code = run_loop(loop_context, desktop, registry, model, "Start idea")
    assert code == EXIT_OK
    for call in loop_context.audit.log.call_args_list:
        if call[0][0] == "tool_result":
            res = call[1]["result"]
            assert valid_secret not in res
            assert "[REDACTED]" in res


def test_loop_breaker_tripped_alerts_human(loop_context: RunContext) -> None:
    desktop = FakeDesktop()
    loop_context.breaker.observe.return_value = "Screen static across 3 interactive actions"
    registry = {}

    turns = [
        _make_tool_call_content("screenshot", {}),
        _make_tool_call_content("finish", {"summary": "ok"}),
    ]
    model = ScriptedModel(turns)

    code = run_loop(loop_context, desktop, registry, model, "Start idea")
    assert code == EXIT_OK
    loop_context.audit.log.assert_any_call(
        "gate", trigger="loop_breaker", reason="Screen static across 3 interactive actions"
    )
    loop_context.notifier.ask_human.assert_called_once()
    loop_context.breaker.reset.assert_called_once()


def test_loop_empty_tool_calls_receives_nudge(loop_context: RunContext) -> None:
    desktop = FakeDesktop()
    registry = {}

    empty_content = types.Content(
        role="model",
        parts=[types.Part.from_text(text="I am pondering the code architecture.")],
    )
    finish_content = _make_tool_call_content("finish", {"summary": "done"})

    model = ScriptedModel([empty_content, finish_content])
    code = run_loop(loop_context, desktop, registry, model, "Start idea")
    assert code == EXIT_OK

    second_call_contents = model.history[1]
    last_user_turn = second_call_contents[-1]
    assert last_user_turn.parts[0].text == CONTINUE_NUDGE


def test_loop_max_steps_exhausted(loop_context: RunContext) -> None:
    desktop = FakeDesktop()
    registry = {"wait": lambda seconds: "waited"}
    loop_context.max_steps = 2

    turns = [
        _make_tool_call_content("wait", {"seconds": 1}),
        _make_tool_call_content("wait", {"seconds": 1}),
    ]
    model = ScriptedModel(turns)

    code = run_loop(loop_context, desktop, registry, model, "Start idea")
    assert code == EXIT_MAX_STEPS
    loop_context.audit.log.assert_any_call("max_steps", step=2)


def test_loop_model_unavailable_escalates_and_fails(loop_context: RunContext) -> None:
    desktop = FakeDesktop()
    registry = {}

    model = ScriptedModel([
        ModelUnavailable("Quota exhausted"),
        ModelUnavailable("Quota exhausted"),
        ModelUnavailable("Quota exhausted"),
        ModelUnavailable("Quota exhausted"),
    ])

    code = run_loop(loop_context, desktop, registry, model, "Start idea")
    assert code == EXIT_MODEL_FAILURE
    assert loop_context.notifier.ask_human.call_count == 3
    loop_context.audit.log.assert_any_call("model_failure", step=0, error="Quota exhausted")


def test_loop_non_retryable_model_error_notifies_once_and_exits(loop_context: RunContext) -> None:
    desktop = FakeDesktop()
    registry = {}

    err = ModelUnavailable("OpenAI error 400: invalid_request_error: tool_call_id mismatch")
    model = ScriptedModel([err])

    code = run_loop(loop_context, desktop, registry, model, "Start idea")
    assert code == EXIT_MODEL_FAILURE
    assert loop_context.notifier.ask_human.call_count == 1
    loop_context.audit.log.assert_any_call("model_failure", step=0, error=str(err))


def test_loop_keyboard_interrupt_raises_immediately(loop_context: RunContext) -> None:
    """A-001: Tool raising KeyboardInterrupt terminates loop immediately without retry."""
    desktop = FakeDesktop()
    call_count = 0

    def _interrupted_tool():
        nonlocal call_count
        call_count += 1
        raise KeyboardInterrupt("User pressed Ctrl+C")

    registry = {"interrupt_me": _interrupted_tool}
    turns = [
        _make_tool_call_content("interrupt_me", {}),
    ]
    model = ScriptedModel(turns)

    with pytest.raises(KeyboardInterrupt):
        run_loop(loop_context, desktop, registry, model, "Start idea")

    assert call_count == 1


def test_loop_system_exit_raises_immediately(loop_context: RunContext) -> None:
    """A-001: Tool raising SystemExit terminates loop immediately without retry."""
    desktop = FakeDesktop()
    call_count = 0

    def _exit_tool():
        nonlocal call_count
        call_count += 1
        raise SystemExit(1)

    registry = {"exit_me": _exit_tool}
    turns = [
        _make_tool_call_content("exit_me", {}),
    ]
    model = ScriptedModel(turns)

    with pytest.raises(SystemExit):
        run_loop(loop_context, desktop, registry, model, "Start idea")

    assert call_count == 1


def test_loop_screenshot_failsafe_aborts_immediately(loop_context: RunContext) -> None:
    """A-002: FailSafeException raised during screenshot returns EXIT_FAILSAFE properly."""
    desktop = FakeDesktop()

    def _exploding_screenshot():
        raise FailSafeException("Mouse in corner during screenshot")

    desktop.screenshot_png = _exploding_screenshot
    registry = {}
    turns = [_make_tool_call_content("screenshot", {})]
    model = ScriptedModel(turns)

    code = run_loop(loop_context, desktop, registry, model, "Start idea")
    assert code == EXIT_FAILSAFE
    loop_context.audit.log.assert_any_call("failsafe_abort")


def test_loop_screenshot_generic_error_handled(loop_context: RunContext) -> None:
    """A-002: Non-failsafe exception during screenshot is formatted as tool error."""
    desktop = FakeDesktop()

    def _failing_screenshot():
        raise RuntimeError("DirectShow capture error")

    desktop.screenshot_png = _failing_screenshot
    registry = {}
    turns = [
        _make_tool_call_content("screenshot", {}),
        _make_tool_call_content("finish", {"summary": "Done after shot error"}),
    ]
    model = ScriptedModel(turns)

    code = run_loop(loop_context, desktop, registry, model, "Start idea")
    assert code == EXIT_OK
    for call in loop_context.audit.log.call_args_list:
        if call[0][0] == "tool_result":
            assert call[1]["tool"] == "screenshot"
            assert "DirectShow capture error" in call[1]["result"]


def test_loop_deterministic_errors_not_retried(loop_context: RunContext) -> None:
    """A-005: Local deterministic Python errors are not retried with sleep."""
    desktop = FakeDesktop()

    for exc_type, exc_inst in [
        (ValueError, ValueError("invalid syntax")),
        (TypeError, TypeError("missing required argument")),
        (FileNotFoundError, FileNotFoundError("config.json not found")),
    ]:
        call_count = 0

        def _deterministic_failure(c=exc_inst):
            nonlocal call_count
            call_count += 1
            raise c

        registry = {"deterministic_tool": _deterministic_failure}
        turns = [
            _make_tool_call_content("deterministic_tool", {}),
            _make_tool_call_content("finish", {"summary": "done"}),
        ]
        model = ScriptedModel(turns)

        code = run_loop(loop_context, desktop, registry, model, "Start idea")
        assert code == EXIT_OK
        assert call_count == 1, f"Expected {exc_type.__name__} to be called once without retrying"


def test_loop_transient_error_is_retried(loop_context: RunContext) -> None:
    """A-005: Transient retryable errors (e.g. 503, 429, timeout) are retried."""
    desktop = FakeDesktop()
    call_count = 0

    def _transient_failure():
        nonlocal call_count
        call_count += 1
        if call_count < 3:
            raise RuntimeError("HTTP 503 Service Unavailable")
        return "success after retries"

    registry = {"transient_tool": _transient_failure}
    turns = [
        _make_tool_call_content("transient_tool", {}),
        _make_tool_call_content("finish", {"summary": "done"}),
    ]
    model = ScriptedModel(turns)

    code = run_loop(loop_context, desktop, registry, model, "Start idea")
    assert code == EXIT_OK
    assert call_count == 3


def test_loop_kill_switch_tripped_after_tool_call(loop_context: RunContext) -> None:
    """I-002: Kill switch tripped during tool execution exits loop immediately after call."""
    desktop = FakeDesktop()

    def _trip_kill_during_call():
        loop_context.kill.is_set.return_value = True
        return "finished long work"

    registry = {"work": _trip_kill_during_call, "after_work": lambda: "should not run"}
    turns = [
        types.Content(
            role="model",
            parts=[
                types.Part.from_function_call(name="work", args={}),
                types.Part.from_function_call(name="after_work", args={}),
            ],
        )
    ]
    model = ScriptedModel(turns)

    code = run_loop(loop_context, desktop, registry, model, "Start idea")
    assert code == EXIT_KILL
    loop_context.audit.log.assert_any_call("kill", step=0)


def test_loop_cooperative_cancel_check_passed_to_tool(loop_context: RunContext) -> None:
    """I-002: Loop injects cancel_check callable into tools that declare it."""
    desktop = FakeDesktop()
    received_cancel_check = None

    def _cancellable_tool(query: str, cancel_check=None):
        nonlocal received_cancel_check
        received_cancel_check = cancel_check
        return f"result for {query}"

    registry = {"cancellable": _cancellable_tool}
    turns = [
        _make_tool_call_content("cancellable", {"query": "test query"}),
        _make_tool_call_content("finish", {"summary": "done"}),
    ]
    model = ScriptedModel(turns)

    code = run_loop(loop_context, desktop, registry, model, "Start idea")
    assert code == EXIT_OK
    assert callable(received_cancel_check)
    assert received_cancel_check() is False


def test_loopbreaker_observes_non_screenshot_tool(loop_context: RunContext) -> None:
    """I-006: Loop breaker observes non-screenshot tools and alerts when static/looping."""
    desktop = FakeDesktop()
    loop_context.breaker.observe.return_value = "Screen remained static across 3 interactive actions."
    registry = {"click": lambda x, y: "clicked"}

    turns = [
        _make_tool_call_content("click", {"x": 50, "y": 100}),
        _make_tool_call_content("finish", {"summary": "all done"}),
    ]
    model = ScriptedModel(turns)

    code = run_loop(loop_context, desktop, registry, model, "Start idea")
    assert code == EXIT_OK
    loop_context.audit.log.assert_any_call(
        "gate", trigger="loop_breaker", reason="Screen remained static across 3 interactive actions."
    )
    loop_context.notifier.ask_human.assert_called_once()
    loop_context.breaker.reset.assert_called_once()


def test_loopbreaker_detects_alternating_non_screenshot_loop(loop_context: RunContext) -> None:
    """I-006: Loop breaker detects alternating non-screenshot sequence cycles."""
    desktop = FakeDesktop()
    loop_context.breaker.observe.return_value = None
    registry = {
        "tool_a": lambda: "a",
        "tool_b": lambda: "b",
    }

    # Alternating cycle of period 2: [A, B, A, B]
    turns = [
        _make_tool_call_content("tool_a", {}),
        _make_tool_call_content("tool_b", {}),
        _make_tool_call_content("tool_a", {}),
        _make_tool_call_content("tool_b", {}),
        _make_tool_call_content("finish", {"summary": "done after alert"}),
    ]
    model = ScriptedModel(turns)

    code = run_loop(loop_context, desktop, registry, model, "Start idea")
    assert code == EXIT_OK
    gate_calls = [
        c for c in loop_context.audit.log.call_args_list
        if c[0][0] == "gate" and c[1].get("trigger") == "loop_breaker"
    ]
    assert len(gate_calls) >= 1
    assert "Alternating/repeating non-screenshot tool sequence detected" in gate_calls[0][1]["reason"]
    loop_context.notifier.ask_human.assert_called_once()


def test_loop_finish_empty_summary_rejected(loop_context: RunContext) -> None:
    """I-008: finish tool with empty summary is rejected, loop continues."""
    desktop = FakeDesktop()
    registry = {}

    turns = [
        _make_tool_call_content("finish", {"summary": ""}),
        _make_tool_call_content("finish", {"summary": "Valid summary provided"}),
    ]
    model = ScriptedModel(turns)

    code = run_loop(loop_context, desktop, registry, model, "Start idea")
    assert code == EXIT_OK
    loop_context.audit.log.assert_any_call(
        "finish_rejected",
        reason="Finish rejected: 'summary' is required and cannot be empty.",
        args={"summary": ""},
    )


def test_loop_finish_invalid_status_rejected(loop_context: RunContext) -> None:
    """I-008: finish tool with invalid failure status is rejected."""
    desktop = FakeDesktop()
    registry = {}

    turns = [
        _make_tool_call_content("finish", {"summary": "App done", "status": "failed"}),
        _make_tool_call_content("finish", {"summary": "App fixed and tested", "status": "success"}),
    ]
    model = ScriptedModel(turns)

    code = run_loop(loop_context, desktop, registry, model, "Start idea")
    assert code == EXIT_OK
    loop_context.audit.log.assert_any_call(
        "finish_rejected",
        reason="Finish rejected: invalid status 'failed'. Expected successful completion.",
        args={"summary": "App done", "status": "failed"},
    )


def test_loop_finish_precondition_validator_hook(loop_context: RunContext) -> None:
    """I-008: finish tool respects finish_validator precondition hook on context."""
    desktop = FakeDesktop()
    registry = {}

    validation_state = {"tests_passed": False}

    def _test_validator(ctx, args):
        if not validation_state["tests_passed"]:
            return False, "Automated test suite must pass before finish"
        return True, ""

    setattr(loop_context, "finish_validator", _test_validator)

    def _fix_and_finish_turn(contents):
        # Once rejected feedback is seen in contents, mark tests passed and finish
        validation_state["tests_passed"] = True
        return _make_tool_call_content("finish", {"summary": "Finished after tests pass"})

    turns = [
        _make_tool_call_content("finish", {"summary": "Attempting early finish"}),
        _make_tool_call_content("finish", {"summary": "Finished after tests pass"}),
    ]

    class DynamicScriptedModel(ScriptedModel):
        def generate(self, contents):
            # When the rejection is returned in step 1, validate tests passed
            if len(self.history) == 1:
                validation_state["tests_passed"] = True
            return super().generate(contents)

    model = DynamicScriptedModel(turns)

    # In step 0, finish is rejected because tests have not passed.
    # In step 1, tests pass and finish succeeds with EXIT_OK.
    code = run_loop(loop_context, desktop, registry, model, "Start idea")
    assert code == EXIT_OK
    loop_context.audit.log.assert_any_call(
        "finish_rejected",
        reason="Finish rejected: preconditions not met (Automated test suite must pass before finish).",
        args={"summary": "Attempting early finish"},
    )
    loop_context.audit.log.assert_any_call("finish", summary="Finished after tests pass")


