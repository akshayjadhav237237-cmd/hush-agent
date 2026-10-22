"""Integration test flow for checkpoint saving, resume from artifacts, and state restoration."""
from __future__ import annotations

import io
import json
import os
from typing import Any
from unittest.mock import MagicMock, patch

from PIL import Image
import pytest
from google.genai import types

from core.artifacts import save_artifact
from core.checkpoint import RunState, load_checkpoint, save_checkpoint
from core.cli import main
from core.constants import EXIT_OK
from core.loop import run_loop
from core.loopbreaker import LoopBreaker
from core.types import RunContext


class ScriptedModel:
    """Scripted model for resume flow tests."""

    def __init__(self, turns: list[Any]) -> None:
        self.turns = list(turns)
        self.history: list[list[Any]] = []

    def generate(self, contents: list[Any]) -> Any:
        self.history.append(list(contents))
        if not self.turns:
            raise RuntimeError("Out of scripted turns")
        return self.turns.pop(0)


class FakeDesktop:
    """Mock desktop for resume tests."""

    def __init__(self) -> None:
        buf = io.BytesIO()
        Image.new("RGB", (16, 16), color=(30, 60, 90)).save(buf, format="PNG")
        self._png = buf.getvalue()
        self.clipboard = "sample content"

    def funcs(self) -> dict[str, Any]:
        return {}

    def paste_any(self, text: str, press_enter: bool = False) -> str:
        return f"pasted {len(text)}"

    def clipboard_full(self) -> str:
        return self.clipboard

    def screenshot_png(self) -> bytes:
        return self._png


def test_checkpoint_exists_after_every_step(tmp_path: Any) -> None:
    """Verify a valid atomic checkpoint.json is updated after each step in run_loop."""
    run_dir = str(tmp_path / "run_steps")
    os.makedirs(run_dir, exist_ok=True)
    ckpt_file = os.path.join(run_dir, "checkpoint.json")

    state = RunState(run_id="20261022-steps", idea="Track steps", step=0)
    audit = MagicMock()
    kill = MagicMock()
    kill.is_set.return_value = False
    breaker = LoopBreaker()
    notifier = MagicMock()

    ctx = RunContext(
        run_id="20261022-steps",
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
    registry = {"echo": lambda text: f"echo: {text}"}

    turns = [
        types.Content(role="model", parts=[
            types.Part.from_function_call(name="echo", args={"text": "round 1"}),
        ]),
        types.Content(role="model", parts=[
            types.Part.from_function_call(name="echo", args={"text": "round 2"}),
        ]),
        types.Content(role="model", parts=[
            types.Part.from_function_call(name="finish", args={"summary": "all done"}),
        ]),
    ]
    model = ScriptedModel(turns)

    exit_code = run_loop(ctx, desktop, registry, model, "Start idea")
    assert exit_code == EXIT_OK

    assert os.path.exists(ckpt_file)
    final_state = load_checkpoint(run_dir)
    assert final_state is not None
    # Finished at step 3
    assert final_state.step == 3
    assert final_state.idea == "Track steps"


def test_resume_from_artifacts_does_not_redo_finished_stages(tmp_path: Any, monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify --resume continues from existing saved artifacts without restarting finished stages."""
    fake_runs = str(tmp_path / "runs")
    monkeypatch.setattr("core.cli.RUNS_DIR", fake_runs)
    monkeypatch.setattr("core.constants.RUNS_DIR", fake_runs)

    run_id = "20261022-saved"
    run_dir = os.path.join(fake_runs, run_id)
    os.makedirs(run_dir, exist_ok=True)

    # Save initial artifacts as if research was complete
    save_artifact(run_dir, "research_prompt", "Research prompt text")
    save_artifact(run_dir, "research_report", "Comprehensive research findings on React architecture")

    # Save state with step=2
    state = RunState(
        run_id=run_id,
        idea="Build a task management dashboard",
        step=2,
        graph_last_hash="abc123sha",
        graph_stalls=1,
        switches_used=1,
        limit_waits=1,
    )
    save_checkpoint(run_dir, state)

    # Now invoke main with --resume
    with patch("core.loop.run_loop", return_value=EXIT_OK) as mock_loop:
        code = main(
            ["--resume", run_id],
            model_factory=lambda **kw: MagicMock(),
            desktop_factory=lambda **kw: FakeDesktop(),
        )
        assert code == EXIT_OK
        mock_loop.assert_called_once()

        passed_ctx = mock_loop.call_args[0][0]
        first_msg = mock_loop.call_args[0][4]
        start_step = mock_loop.call_args[1].get("start_step") or mock_loop.call_args[0][5]

        # Start step matches the saved checkpoint
        assert start_step == 2

        # First message explicitly references existing artifacts and directives
        assert "research_prompt" in first_msg
        assert "research_report" in first_msg
        assert "Finished stages MUST NOT be redone" in first_msg
        assert "Use paste_artifact instead of re-typing long text" in first_msg
        assert "Build a task management dashboard" in first_msg


def test_resumed_graph_state_and_switch_counters_restored(tmp_path: Any, monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify resumed graph state (hash, stalls) and counters (switches, limits) are restored."""
    fake_runs = str(tmp_path / "runs")
    monkeypatch.setattr("core.cli.RUNS_DIR", fake_runs)
    monkeypatch.setattr("core.constants.RUNS_DIR", fake_runs)

    run_id = "20261022-counters"
    run_dir = os.path.join(fake_runs, run_id)
    os.makedirs(run_dir, exist_ok=True)

    saved_state = RunState(
        run_id=run_id,
        idea="E-commerce store",
        step=5,
        graph_last_hash="sha256_mock_hash",
        graph_stalls=2,
        switches_used=2,
        limit_waits=3,
    )
    save_checkpoint(run_dir, saved_state)

    with patch("core.loop.run_loop", return_value=EXIT_OK) as mock_loop:
        main(
            ["--resume", run_id],
            model_factory=lambda **kw: MagicMock(),
            desktop_factory=lambda **kw: FakeDesktop(),
        )
        passed_ctx = mock_loop.call_args[0][0]
        assert passed_ctx.state.graph_last_hash == "sha256_mock_hash"
        assert passed_ctx.state.graph_stalls == 2
        assert passed_ctx.state.switches_used == 2
        assert passed_ctx.state.limit_waits == 3
