"""Unit tests for tool registry construction and dispatching."""
from __future__ import annotations

import os
from typing import Any, Optional
from unittest.mock import MagicMock, patch

import pytest

from core.checkpoint import RunState
from core.tool_registry import (
    LIMIT_NOTED_MSG,
    NO_ARTIFACT_MSG,
    WAIT_OVER_MSG,
    build_registry,
)
from core.types import RunContext


class FakeDesktop:
    """Mock desktop implementing the Desktop protocol."""

    def __init__(self, clipboard: str = "initial clipboard content") -> None:
        self.clipboard = clipboard
        self.pasted: list[tuple[str, bool]] = []

    def funcs(self) -> dict[str, Any]:
        return {
            "open_app": lambda name: f"opened {name}",
            "open_url": lambda url: f"opened {url}",
            "focus_window": lambda title_contains: f"focused {title_contains}",
            "paste_text": lambda text, press_enter=False: f"pasted {text}",
            "press_keys": lambda keys: f"pressed {keys}",
            "click": lambda x, y: f"clicked {x},{y}",
            "scroll": lambda amount: f"scrolled {amount}",
            "read_clipboard": lambda: self.clipboard[:4000],
            "wait": lambda seconds: f"waited {seconds}",
            "screenshot": lambda: "should not be in registry",
            "finish": lambda summary: "should not be in registry",
        }

    def paste_any(self, text: str, press_enter: bool = False) -> str:
        self.pasted.append((text, press_enter))
        return f"pasted {len(text)} chars"

    def clipboard_full(self) -> str:
        return self.clipboard

    def screenshot_png(self) -> bytes:
        return b"\x89PNG\r\n\x1a\nfake"


@pytest.fixture
def run_context(tmp_path: Any) -> RunContext:
    run_dir = str(tmp_path / "run_01")
    os.makedirs(run_dir, exist_ok=True)
    project_dir = str(tmp_path / "project_01")
    os.makedirs(project_dir, exist_ok=True)

    state = RunState(run_id="20261022-120000", idea="Test app")
    audit = MagicMock()
    kill = MagicMock()
    kill.is_set.return_value = False
    breaker = MagicMock()
    notifier = MagicMock()
    notifier.ask_human.side_effect = lambda msg: f"Human says: ok to {msg}"

    return RunContext(
        run_id="20261022-120000",
        run_dir=run_dir,
        project_dir=project_dir,
        mode="real",
        audit=audit,
        kill=kill,
        breaker=breaker,
        notifier=notifier,
        switcher=None,
        state=state,
        max_steps=80,
    )


def test_registry_tool_counts_and_exclusions_no_switcher(run_context: RunContext) -> None:
    desktop = FakeDesktop()
    reg = build_registry(run_context, desktop)

    assert "screenshot" not in reg
    assert "finish" not in reg
    assert "switch_account" not in reg
    # Expected tools:
    # 9 desktop + 1 run_cmd + 6 graph + 1 notify_human + 2 artifact + 1 report_limit = 20
    assert len(reg) == 20
    assert "run_cmd" in reg
    assert "graph_build" in reg
    assert "report_limit" in reg


def test_registry_with_switcher(run_context: RunContext) -> None:
    desktop = FakeDesktop()
    switcher = MagicMock()
    run_context.switcher = switcher

    reg = build_registry(run_context, desktop)
    assert "switch_account" in reg
    assert len(reg) == 21


def test_save_artifact_pulls_full_clipboard(run_context: RunContext) -> None:
    desktop = FakeDesktop(clipboard="Report content that is long...")
    reg = build_registry(run_context, desktop)

    res = reg["save_artifact"](name="research_report")
    assert "Saved research_report" in res

    art_file = os.path.join(run_context.run_dir, "artifacts", "research_report.txt")
    assert os.path.exists(art_file)
    with open(art_file, "r", encoding="utf-8") as f:
        assert f.read() == "Report content that is long..."


def test_paste_artifact_success_and_missing(run_context: RunContext) -> None:
    desktop = FakeDesktop()
    reg = build_registry(run_context, desktop)

    # Missing artifact
    assert reg["paste_artifact"](name="build_prompt_1") == NO_ARTIFACT_MSG

    # Save artifact first
    desktop.clipboard = "Antigravity build prompt"
    reg["save_artifact"](name="build_prompt_1")

    # Now paste it
    res = reg["paste_artifact"](name="build_prompt_1", press_enter=True)
    assert res == f"pasted {len('Antigravity build prompt')} chars"
    assert desktop.pasted[-1] == ("Antigravity build prompt", True)


def test_notify_human_delegates(run_context: RunContext) -> None:
    desktop = FakeDesktop()
    reg = build_registry(run_context, desktop)

    out = reg["notify_human"](message="Please confirm delete")
    assert out == "Human says: ok to Please confirm delete"
    run_context.notifier.ask_human.assert_called_once_with("Please confirm delete")


def test_report_limit_with_switcher_ready(run_context: RunContext) -> None:
    desktop = FakeDesktop()
    switcher = MagicMock()
    switcher.can_switch.return_value = (True, "Ready")
    run_context.switcher = switcher

    reg = build_registry(run_context, desktop)
    res = reg["report_limit"](app="claude", minutes_until_reset=15)
    assert res == LIMIT_NOTED_MSG
    run_context.audit.log.assert_called_with("limit", app="claude", minutes=15)


def test_report_limit_without_switcher_runs_wait(run_context: RunContext) -> None:
    desktop = FakeDesktop()
    reg = build_registry(run_context, desktop)

    with patch("core.limits.wait_for_reset") as mock_wait:
        res = reg["report_limit"](app="claude", minutes_until_reset=10)
        assert res == WAIT_OVER_MSG
        mock_wait.assert_called_once()
        assert run_context.state.limit_waits == 1
        run_context.notifier.push.assert_called()


def test_report_limit_invalid_minutes_calls_ask_human(run_context: RunContext) -> None:
    desktop = FakeDesktop()
    reg = build_registry(run_context, desktop)

    res = reg["report_limit"](app="gemini", minutes_until_reset=0)
    assert "Human says: ok to" in res
    run_context.notifier.ask_human.assert_called()


def test_switch_account_delegates_and_audits(run_context: RunContext) -> None:
    desktop = FakeDesktop()
    switcher = MagicMock()
    switcher.switch.return_value = "Switched to profile 2"
    run_context.switcher = switcher

    reg = build_registry(run_context, desktop)
    res = reg["switch_account"](app="claude")
    assert res == "Switched to profile 2"
    run_context.audit.log.assert_called_with("switch", app="claude")
    assert run_context.state.switches_used == 1
