"""End-to-end integration test flow for demo mode, human-in-the-loop, and replay export."""
from __future__ import annotations

import json
import os
from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from google.genai import types

from core.audit import verify_chain
from core.checkpoint import RunState
from core.cli import main
from core.constants import EXIT_OK
from core.demo.world import DemoWorld
from core.loop import run_loop
from core.loopbreaker import LoopBreaker
from core.tool_registry import build_registry
from core.types import RunContext
from export_replay import export_replay


class DemoScriptedModel:
    """Scripted model walking through the entire demo build workflow."""

    def __init__(self) -> None:
        self.step = 0

    def generate(self, contents: list[Any]) -> Any:
        self.step += 1
        # Step 1: Open Claude and paste bootstrap
        if self.step == 1:
            return types.Content(role="model", parts=[
                types.Part.from_function_call(name="open_url", args={"url": "https://claude.ai/new"}),
                types.Part.from_function_call(name="paste_text", args={"text": "Bootstrap prompt", "press_enter": True}),
            ])
        # Step 2: Copy research prompt from Claude, save artifact
        elif self.step == 2:
            return types.Content(role="model", parts=[
                types.Part.from_function_call(name="press_keys", args={"keys": "F2"}),
                types.Part.from_function_call(name="save_artifact", args={"name": "research_prompt"}),
            ])
        # Step 3: Open Gemini Deep Research, paste research prompt
        elif self.step == 3:
            return types.Content(role="model", parts=[
                types.Part.from_function_call(name="open_url", args={"url": "https://gemini.google.com/app"}),
                types.Part.from_function_call(name="paste_artifact", args={"name": "research_prompt", "press_enter": True}),
            ])
        # Step 4: Wait for research report
        elif self.step == 4:
            return types.Content(role="model", parts=[
                types.Part.from_function_call(name="wait", args={"seconds": 1}),
            ])
        # Step 5: Wait again (Gemini finishes after 2 waits in DemoWorld)
        elif self.step == 5:
            return types.Content(role="model", parts=[
                types.Part.from_function_call(name="wait", args={"seconds": 1}),
            ])
        # Step 6: Copy research report, save artifact
        elif self.step == 6:
            return types.Content(role="model", parts=[
                types.Part.from_function_call(name="press_keys", args={"keys": "F2"}),
                types.Part.from_function_call(name="save_artifact", args={"name": "research_report"}),
            ])
        # Step 7: Return to Claude, paste report, ask for build prompt 1
        elif self.step == 7:
            return types.Content(role="model", parts=[
                types.Part.from_function_call(name="open_url", args={"url": "https://claude.ai/new"}),
                types.Part.from_function_call(name="paste_artifact", args={"name": "research_report", "press_enter": True}),
            ])
        # Step 8: Copy build prompt 1, save artifact
        elif self.step == 8:
            return types.Content(role="model", parts=[
                types.Part.from_function_call(name="press_keys", args={"keys": "F2"}),
                types.Part.from_function_call(name="save_artifact", args={"name": "build_prompt_1"}),
            ])
        # Step 9: Open Antigravity, paste build prompt 1
        elif self.step == 9:
            return types.Content(role="model", parts=[
                types.Part.from_function_call(name="open_app", args={"name": "Antigravity"}),
                types.Part.from_function_call(name="paste_artifact", args={"name": "build_prompt_1", "press_enter": True}),
            ])
        # Step 10: Usage limit notice handled via report_limit
        elif self.step == 10:
            return types.Content(role="model", parts=[
                types.Part.from_function_call(name="report_limit", args={"app": "antigravity", "minutes_until_reset": 1}),
            ])
        # Step 11: Build graph
        elif self.step == 11:
            return types.Content(role="model", parts=[
                types.Part.from_function_call(name="graph_build", args={}),
            ])
        # Step 12: Return to Claude with graph update; Claude replies with NEEDS_HUMAN
        elif self.step == 12:
            return types.Content(role="model", parts=[
                types.Part.from_function_call(name="open_url", args={"url": "https://claude.ai/new"}),
                types.Part.from_function_call(name="paste_text", args={"text": "Graph update summary", "press_enter": True}),
            ])
        # Step 13: Read Claude reply starting with NEEDS_HUMAN, alert human
        elif self.step == 13:
            return types.Content(role="model", parts=[
                types.Part.from_function_call(name="press_keys", args={"keys": "F2"}),
                types.Part.from_function_call(name="notify_human", args={"message": "Claude needs human: storage choice"}),
            ])
        # Step 14: Paste human answer into Claude
        elif self.step == 14:
            return types.Content(role="model", parts=[
                types.Part.from_function_call(name="paste_text", args={"text": "Human choice: SQLite", "press_enter": True}),
            ])
        # Step 15: Copy build prompt 2, save artifact
        elif self.step == 15:
            return types.Content(role="model", parts=[
                types.Part.from_function_call(name="press_keys", args={"keys": "F2"}),
                types.Part.from_function_call(name="save_artifact", args={"name": "build_prompt_2"}),
            ])
        # Step 16: Open Antigravity and paste build prompt 2
        elif self.step == 16:
            return types.Content(role="model", parts=[
                types.Part.from_function_call(name="open_app", args={"name": "Antigravity"}),
                types.Part.from_function_call(name="paste_artifact", args={"name": "build_prompt_2", "press_enter": True}),
            ])
        # Step 17: Finish task
        else:
            return types.Content(role="model", parts=[
                types.Part.from_function_call(name="finish", args={"summary": "Demo project built successfully with SQLite"}),
            ])


def test_full_demo_flow_end_to_end(tmp_path: Any, monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify full demo flow reaches finish, verifies audit chain, and exports clean replay."""
    fake_runs = str(tmp_path / "runs")
    monkeypatch.setattr("core.cli.RUNS_DIR", fake_runs)
    monkeypatch.setattr("core.constants.RUNS_DIR", fake_runs)

    scripted_model = DemoScriptedModel()

    def _fake_graph_run(cmd, **kwargs):
        cwd = kwargs.get("cwd", str(tmp_path))
        report_dir = os.path.join(cwd, "graphify-out")
        os.makedirs(report_dir, exist_ok=True)
        with open(os.path.join(report_dir, "GRAPH_REPORT.md"), "w", encoding="utf-8") as f:
            f.write("# Graph Report\nNodes: 10\nEdges: 15")
        return MagicMock(stdout="Graph extracted", stderr="", returncode=0)

    with patch("core.limits.time.sleep", return_value=None), \
         patch("core.demo.world.time.sleep", return_value=None), \
         patch("core.graph_tools.subprocess.run", side_effect=_fake_graph_run):
        code = main(
            [
                "Build a photo portfolio",
                "--demo",
                "--demo-limit",
                "--demo-answer",
                "SQLite",
                "--max-steps",
                "30",
            ],
            model_factory=lambda **kw: scripted_model,
        )

    assert code == EXIT_OK

    # Find the run directory created
    runs = os.listdir(fake_runs)
    assert len(runs) == 1
    run_dir = os.path.join(fake_runs, runs[0])

    # Check project files were actually generated in demo project dir
    demo_proj = os.path.join(run_dir, "project")
    assert os.path.exists(os.path.join(demo_proj, "app.py"))
    assert os.path.exists(os.path.join(demo_proj, "storage.py"))

    # Verify audit chain integrity
    audit_file = os.path.join(run_dir, "audit.jsonl")
    assert os.path.exists(audit_file)
    ok, count, err = verify_chain(audit_file)
    assert ok is True
    assert count > 10
    assert err is None

    # Export replay and verify
    replay_path = export_replay(fake_runs, runs[0])
    assert os.path.exists(replay_path)

    with open(replay_path, "r", encoding="utf-8") as f:
        replay_data = json.load(f)

    assert replay_data["mode"] == "demo"
    assert replay_data["run_id"] == runs[0]
    assert len(replay_data["events"]) > 0

    # Verify raw clipboard or raw large payload was not leaked in replay
    replay_text = json.dumps(replay_data)
    assert "Comprehensive research findings" not in replay_text
