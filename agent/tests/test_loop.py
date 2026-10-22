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
