"""Offline end-to-end test driving run_loop with OpenAIModelClient and DemoWorld."""
from __future__ import annotations

import json
import os
from typing import Any
from unittest.mock import MagicMock

from core.audit import AuditLog, verify_chain
from core.checkpoint import RunState, save_checkpoint
from core.demo.world import DemoWorld
from core.loop import run_loop
from core.loopbreaker import LoopBreaker
from core.notify import Notifier
from core.openai_client import OpenAIModelClient, validate_openai_messages
from core.tool_registry import build_registry
from core.tool_schema import build_tools
from core.types import RunContext


class ScriptedOpenAIClient:
    """Fake OpenAI client validating request message ordering and returning scripted tool calls."""

    def __init__(self) -> None:
        self.chat = self
        self.completions = self
        self.step = 0
        self.recorded_requests: list[dict[str, Any]] = []

    def create(self, **kwargs: Any) -> Any:
        messages = kwargs.get("messages", [])
        self.recorded_requests.append(kwargs)

        # Validate that every assistant tool_calls message is followed by its tool messages
        validate_openai_messages(messages)

        class Msg:
            def __init__(self, content: Any = None, tool_calls: Any = None) -> None:
                self.content = content
                self.tool_calls = tool_calls

        class Choice:
            def __init__(self, msg: Any) -> None:
                self.message = msg

        class Resp:
            def __init__(self, choices: list[Any]) -> None:
                self.choices = choices
                self.usage = {"prompt_tokens": 150, "completion_tokens": 30}

        self.step += 1
        if self.step == 1:
            # 1. Tool call to screenshot
            tc = {
                "id": "call_0",
                "type": "function",
                "function": {"name": "screenshot", "arguments": "{}"},
            }
            return Resp([Choice(Msg(tool_calls=[tc]))])
        elif self.step == 2:
            # 2. Tool call to open_app
            tc = {
                "id": "call_0",
                "type": "function",
                "function": {"name": "open_app", "arguments": json.dumps({"app": "claude"})},
            }
            return Resp([Choice(Msg(tool_calls=[tc]))])
        else:
            # 3. Tool call to finish
            tc = {
                "id": "call_0",
                "type": "function",
                "function": {"name": "finish", "arguments": json.dumps({"summary": "Offline app built successfully."})},
            }
            return Resp([Choice(Msg(tool_calls=[tc]))])


def test_openai_offline_e2e_run_loop(tmp_path: Any) -> None:
    """Drive run_loop with OpenAIModelClient, DemoWorld, and fake client with full verification."""
    run_dir = str(tmp_path / "runs" / "e2e_openai_run")
    project_dir = str(tmp_path / "project")
    os.makedirs(run_dir, exist_ok=True)
    os.makedirs(project_dir, exist_ok=True)

    state = RunState(run_id="e2e_openai_run", idea="build offline test app")
    save_checkpoint(run_dir, state)

    audit = AuditLog(run_dir, "e2e_openai_run", mode="demo")
    audit.log("run_start", idea="build offline test app", mode="demo", provider="openai", model="gpt-4o")

    world = DemoWorld(project_dir=project_dir, sleep=lambda s: None)
    tools = build_tools(switch_enabled=False)

    fake_openai = ScriptedOpenAIClient()
    model = OpenAIModelClient(
        "gpt-4o",
        tools=tools,
        client=fake_openai,
        sleep=lambda s: None,
        rand=lambda: 0.5,
        audit=audit,
    )

    kill = MagicMock()
    kill.is_set.return_value = False
    breaker = LoopBreaker()
    notifier = Notifier(audit=audit)

    ctx = RunContext(
        run_id="e2e_openai_run",
        run_dir=run_dir,
        project_dir=project_dir,
        mode="demo",
        audit=audit,
        kill=kill,
        breaker=breaker,
        notifier=notifier,
        switcher=None,
        state=state,
        max_steps=10,
    )
    registry = build_registry(ctx, world)

    # Execute loop
    exit_code = run_loop(
        ctx,
        world,
        registry,
        model,
        first_message="build offline test app",
    )

    # 1. Assert exit code 0
    assert exit_code == 0, f"Expected EXIT_OK (0), got {exit_code}"

    # 2. Assert fake client received 3 requests and validated all without ValueError
    assert fake_openai.step == 3
    assert len(fake_openai.recorded_requests) == 3

    # 3. Assert checkpoint.json exists and state stepped
    checkpoint_file = os.path.join(run_dir, "checkpoint.json")
    assert os.path.exists(checkpoint_file)
    with open(checkpoint_file, "r", encoding="utf-8") as f:
        ckpt_data = json.load(f)
    assert ckpt_data["step"] >= 3

    # 4. Assert cryptographic audit log chain verifies completely
    audit_file = os.path.join(run_dir, "audit.jsonl")
    assert os.path.exists(audit_file)
    ok, count, err = verify_chain(audit_file)
    assert ok is True
    assert count > 0
    assert err is None
