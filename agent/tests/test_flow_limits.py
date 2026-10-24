"""Integration test flow for service usage limit waiting, account switching, and kill during wait."""
from __future__ import annotations

import io
import os
from typing import Any
from unittest.mock import MagicMock, patch

from PIL import Image
import pytest
from google.genai import types

from core.accounts import AccountSwitcher
from core.checkpoint import RunState
from core.constants import EXIT_KILL, EXIT_OK
from core.loop import run_loop
from core.loopbreaker import LoopBreaker
from core.tool_registry import build_registry
from core.types import RunContext


class ScriptedModel:
    """Scripted fake model for limits flow tests."""

    def __init__(self, turns: list[Any]) -> None:
        self.turns = list(turns)

    def generate(self, contents: list[Any]) -> Any:
        if not self.turns:
            raise RuntimeError("Out of turns")
        return self.turns.pop(0)


class FakeDesktop:
    """Mock desktop."""

    def __init__(self) -> None:
        buf = io.BytesIO()
        Image.new("RGB", (16, 16), color=(20, 40, 60)).save(buf, format="PNG")
        self._png = buf.getvalue()

    def funcs(self) -> dict[str, Any]:
        return {}

    def paste_any(self, text: str, press_enter: bool = False) -> str:
        return "pasted"

    def clipboard_full(self) -> str:
        return ""

    def screenshot_png(self) -> bytes:
        return self._png


def test_report_limit_waits_via_injected_clock_and_resumes(tmp_path: Any) -> None:
    """report_limit waits via simulated sleep without real blocking, increments counter, and resumes."""
    run_dir = str(tmp_path / "run_limit_wait")
    os.makedirs(run_dir, exist_ok=True)
    state = RunState(run_id="20261022-lim1", idea="Limit wait test")

    audit = MagicMock()
    kill = MagicMock()
    kill.is_set.return_value = False
    breaker = LoopBreaker()
    notifier = MagicMock()

    ctx = RunContext(
        run_id="20261022-lim1",
        run_dir=run_dir,
        project_dir=str(tmp_path),
        mode="real",
        audit=audit,
        kill=kill,
        breaker=breaker,
        notifier=notifier,
        switcher=None,
        state=state,
        max_steps=5,
    )

    desktop = FakeDesktop()
    registry = build_registry(ctx, desktop)

    sleep_calls: list[float] = []

    with patch("core.limits.time.sleep", side_effect=lambda s: sleep_calls.append(s)):
        turns = [
            types.Content(role="model", parts=[
                types.Part.from_function_call(name="report_limit", args={"app": "claude", "minutes_until_reset": 2}),
            ]),
            types.Content(role="model", parts=[
                types.Part.from_function_call(name="finish", args={"summary": "resumed and done"}),
            ]),
        ]
        model = ScriptedModel(turns)

        exit_code = run_loop(ctx, desktop, registry, model, "Start idea")
        assert exit_code == EXIT_OK
        assert ctx.state.limit_waits == 1
        assert sum(sleep_calls) == 120.0  # 2 minutes = 120 seconds
        notifier.push.assert_called()


def test_report_limit_with_switching_routes_to_switch_account(tmp_path: Any) -> None:
    """With switching enabled, report_limit returns guidance to call switch_account."""
    run_dir = str(tmp_path / "run_switch_route")
    os.makedirs(run_dir, exist_ok=True)
    state = RunState(run_id="20261022-lim2", idea="Switch route test")

    audit = MagicMock()
    kill = MagicMock()
    kill.is_set.return_value = False
    breaker = LoopBreaker()
    notifier = MagicMock()

    switcher = MagicMock()
    switcher.can_switch.return_value = (True, "Ready")
    switcher.switch.return_value = "Switched to Profile 2"

    ctx = RunContext(
        run_id="20261022-lim2",
        run_dir=run_dir,
        project_dir=str(tmp_path),
        mode="real",
        audit=audit,
        kill=kill,
        breaker=breaker,
        notifier=notifier,
        switcher=switcher,
        state=state,
        max_steps=5,
    )

    desktop = FakeDesktop()
    registry = build_registry(ctx, desktop)

    turns = [
        types.Content(role="model", parts=[
            types.Part.from_function_call(name="report_limit", args={"app": "claude", "minutes_until_reset": 15}),
        ]),
        types.Content(role="model", parts=[
            types.Part.from_function_call(name="switch_account", args={"app": "claude"}),
        ]),
        types.Content(role="model", parts=[
            types.Part.from_function_call(name="finish", args={"summary": "all done"}),
        ]),
    ]
    model = ScriptedModel(turns)

    exit_code = run_loop(ctx, desktop, registry, model, "Start idea")
    assert exit_code == EXIT_OK

    switcher.switch.assert_called_once_with("claude")
    assert ctx.state.switches_used == 1
    audit.log.assert_any_call("switch", app="claude")


def test_max_switches_and_cooldown_rules_enforced_end_to_end(tmp_path: Any) -> None:
    """The MAX_SWITCHES (2) and cooldown rules hold end-to-end through switcher tool."""
    fake_time = 1000.0

    def mock_clock() -> float:
        return fake_time

    profiles = ["Profile 1", "Profile 2", "Profile 3"]
    fake_chrome = tmp_path / "chrome.exe"
    fake_chrome.write_text("")
    switcher = AccountSwitcher(
        profiles=profiles,
        chrome_path=str(fake_chrome),
        popen=lambda *args, **kw: None,
        clock=mock_clock,
    )
    assert switcher.confirm(accepted_flag=True)

    # First switch succeeds
    res1 = switcher.switch("claude")
    assert "Switched claude to profile 'Profile 2'" in res1

    # Immediate second switch fails because cooldown (120s) is active
    res2 = switcher.switch("claude")
    assert "Cooldown active" in res2

    # Advance fake time by 125 seconds
    fake_time += 125.0

    # Second switch succeeds
    res3 = switcher.switch("claude")
    assert "Switched claude to profile 'Profile 3'" in res3

    # Advance time past cooldown
    fake_time += 130.0

    # Third switch fails because MAX_SWITCHES (2) reached
    res4 = switcher.switch("claude")
    assert "Maximum profile switches reached (2)" in res4


def test_kill_during_wait_aborts_and_returns_exit_kill(tmp_path: Any) -> None:
    """Kill switch triggered during a limit wait chunk immediately aborts and returns EXIT_KILL (3)."""
    run_dir = str(tmp_path / "run_kill_wait")
    os.makedirs(run_dir, exist_ok=True)
    state = RunState(run_id="20261022-killwait", idea="Kill wait test")

    audit = MagicMock()
    kill = MagicMock()
    # Initially False, then tripped during wait chunk
    kill.is_set.side_effect = [False, False, True, True, True]

    breaker = LoopBreaker()
    notifier = MagicMock()

    ctx = RunContext(
        run_id="20261022-killwait",
        run_dir=run_dir,
        project_dir=str(tmp_path),
        mode="real",
        audit=audit,
        kill=kill,
        breaker=breaker,
        notifier=notifier,
        switcher=None,
        state=state,
        max_steps=5,
    )

    desktop = FakeDesktop()
    registry = build_registry(ctx, desktop)

    with patch("core.limits.time.sleep", side_effect=lambda s: None):
        turns = [
            types.Content(role="model", parts=[
                types.Part.from_function_call(name="report_limit", args={"app": "claude", "minutes_until_reset": 5}),
            ]),
        ]
        model = ScriptedModel(turns)

        exit_code = run_loop(ctx, desktop, registry, model, "Start idea")
        assert exit_code == EXIT_KILL
        audit.log.assert_any_call("kill", step=unittest_mock_any())


def unittest_mock_any():
    from unittest.mock import ANY
    return ANY
