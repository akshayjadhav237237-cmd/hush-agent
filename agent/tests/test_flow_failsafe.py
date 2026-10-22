"""Integration test flow for failsafe mouse-corner abort and loop breaker trips."""
from __future__ import annotations

import io
import os
from typing import Any
from unittest.mock import MagicMock

from PIL import Image
from google.genai import types

from core.checkpoint import RunState
from core.constants import EXIT_FAILSAFE, EXIT_OK
from core.loop import run_loop
from core.loopbreaker import LoopBreaker
from core.types import RunContext


class FailSafeException(Exception):
    """Simulated PyAutoGUI FailSafeException."""
    pass


class ScriptedModel:
    """Scripted fake model for flow testing."""

    def __init__(self, turns: list[Any]) -> None:
        self.turns = list(turns)
        self.received_messages: list[list[Any]] = []

    def generate(self, contents: list[Any]) -> Any:
        self.received_messages.append(list(contents))
        if not self.turns:
            raise RuntimeError("No more scripted turns")
        turn = self.turns.pop(0)
        if isinstance(turn, Exception):
            raise turn
        return turn


class StaticScreenDesktop:
    """Desktop that returns an identical synthetic image on every screenshot."""

    def __init__(self, color: tuple[int, int, int] = (100, 150, 200)) -> None:
        buf = io.BytesIO()
        Image.new("RGB", (32, 32), color=color).save(buf, format="PNG")
        self._png_bytes = buf.getvalue()
        self.clipboard = "clipboard content"

    def funcs(self) -> dict[str, Any]:
        return {}

    def paste_any(self, text: str, press_enter: bool = False) -> str:
        return "pasted"

    def clipboard_full(self) -> str:
        return self.clipboard

    def screenshot_png(self) -> bytes:
        return self._png_bytes


def test_failsafe_aborts_with_exit_code_2_and_never_shown_to_model(tmp_path: Any) -> None:
    """FailSafeException exits with code 2, audits 'failsafe_abort', and is never shown to model."""
    run_dir = str(tmp_path / "run_failsafe")
    os.makedirs(run_dir, exist_ok=True)
    state = RunState(run_id="20261022-01", idea="Failsafe test")

    audit = MagicMock()
    kill = MagicMock()
    kill.is_set.return_value = False
    breaker = LoopBreaker()
    notifier = MagicMock()

    ctx = RunContext(
        run_id="20261022-01",
        run_dir=run_dir,
        project_dir=str(tmp_path),
        mode="real",
        audit=audit,
        kill=kill,
        breaker=breaker,
        notifier=notifier,
        switcher=None,
        state=state,
        max_steps=10,
    )

    desktop = StaticScreenDesktop()

    def _exploding_click(x, y):
        raise FailSafeException("PyAutoGUI mouse corner abort triggered!")

    registry = {"click": _exploding_click}

    turns = [
        types.Content(
            role="model",
            parts=[types.Part.from_function_call(name="click", args={"x": 0, "y": 0})],
        )
    ]
    model = ScriptedModel(turns)

    exit_code = run_loop(ctx, desktop, registry, model, "Start idea")

    assert exit_code == EXIT_FAILSAFE
    audit.log.assert_any_call("failsafe_abort")

    # Verify model never received an error or next turn containing FailSafeException
    for contents in model.received_messages:
        for content in contents:
            for part in getattr(content, "parts", []):
                text = getattr(part, "text", "") or ""
                assert "FailSafeException" not in text
                assert "mouse corner" not in text.lower()


def test_loop_breaker_trips_after_3_act_tools_and_notifies_once(tmp_path: Any) -> None:
    """Loop breaker trips after 3 identical screenshots following 'act' actions and notifies once."""
    run_dir = str(tmp_path / "run_breaker_act")
    os.makedirs(run_dir, exist_ok=True)
    state = RunState(run_id="20261022-02", idea="Breaker act test")

    audit = MagicMock()
    kill = MagicMock()
    kill.is_set.return_value = False
    breaker = LoopBreaker(same_threshold=3, wait_threshold=15)
    notifier = MagicMock()
    notifier.ask_human.return_value = "Keep going"

    ctx = RunContext(
        run_id="20261022-02",
        run_dir=run_dir,
        project_dir=str(tmp_path),
        mode="real",
        audit=audit,
        kill=kill,
        breaker=breaker,
        notifier=notifier,
        switcher=None,
        state=state,
        max_steps=10,
    )

    desktop = StaticScreenDesktop()
    registry = {"click": lambda x, y: f"clicked {x},{y}"}

    # Baseline screenshot establishes initial hash, followed by 3 act actions
    turns = [
        types.Content(role="model", parts=[
            types.Part.from_function_call(name="screenshot", args={}),
        ]),
        types.Content(role="model", parts=[
            types.Part.from_function_call(name="click", args={"x": 10, "y": 10}),
            types.Part.from_function_call(name="screenshot", args={}),
        ]),
        types.Content(role="model", parts=[
            types.Part.from_function_call(name="click", args={"x": 10, "y": 10}),
            types.Part.from_function_call(name="screenshot", args={}),
        ]),
        types.Content(role="model", parts=[
            types.Part.from_function_call(name="click", args={"x": 10, "y": 10}),
            types.Part.from_function_call(name="screenshot", args={}),
        ]),
        types.Content(role="model", parts=[
            types.Part.from_function_call(name="finish", args={"summary": "done"}),
        ]),
    ]
    model = ScriptedModel(turns)

    exit_code = run_loop(ctx, desktop, registry, model, "Start idea")
    assert exit_code == EXIT_OK

    # Loop breaker should have tripped on the 3rd act action on the same static screen
    notifier.ask_human.assert_called_once()
    assert "Loop breaker alert" in notifier.ask_human.call_args[0][0]
    audit.log.assert_any_call("gate", trigger="loop_breaker", reason=unittest_mock_any())


def test_loop_breaker_wait_actions_do_not_trip_until_15(tmp_path: Any) -> None:
    """Loop breaker does not trip after 3 waits, but trips when wait reaches threshold (15)."""
    breaker = LoopBreaker(same_threshold=3, wait_threshold=15)
    image_hash = 1234567890123456789

    # First observation establishes baseline
    assert breaker.observe(image_hash, "wait") is None

    # Consecutive 3 waits on same screen -> must NOT trip
    for _ in range(3):
        res = breaker.observe(image_hash, "wait")
        assert res is None

    # Wait up to 14 total waits after baseline (11 more waits)
    for _ in range(11):
        res = breaker.observe(image_hash, "wait")
        assert res is None

    # 15th wait on static screen after baseline -> trips!
    res15 = breaker.observe(image_hash, "wait")
    assert res15 is not None
    assert "15 consecutive wait intervals" in res15


def unittest_mock_any():
    from unittest.mock import ANY
    return ANY
