"""Tool registry constructing function dispatcher for Hush orchestrator."""
from __future__ import annotations

from typing import TYPE_CHECKING, Callable, Optional

from core.artifacts import load_artifact, save_artifact
from core.graph_tools import GraphTools
from core.shell_tool import make_run_cmd

if TYPE_CHECKING:
    from core.types import Desktop, RunContext, ToolFunc

NO_ARTIFACT_MSG: str = "No such artifact"
LIMIT_NOTED_MSG: str = "Limit noted. Call switch_account"
WAIT_OVER_MSG: str = "Wait over. Take a screenshot and retry."


def build_registry(ctx: RunContext, desktop: Desktop) -> dict[str, ToolFunc]:
    """Build and return mapping of tool names to callable execution functions."""
    registry: dict[str, ToolFunc] = {}

    # 1. Desktop tools from Desktop protocol
    registry.update(desktop.funcs())

    # Ensure loop-handled tools are excluded even if Desktop exposes them
    registry.pop("screenshot", None)
    registry.pop("finish", None)

    # 2. Shell tool confined to project_dir
    registry["run_cmd"] = make_run_cmd(ctx.project_dir)

    # 3. Graph tools (Graphify)
    graph = GraphTools(
        project_dir=ctx.project_dir,
        notifier=ctx.notifier,
        audit=ctx.audit,
        state=ctx.state,
    )
    registry.update(graph.funcs())

    # 4. Human notification
    def _notify_human(message: str) -> str:
        return ctx.notifier.ask_human(message)

    registry["notify_human"] = _notify_human

    # 5. Artifact persistence and transfer
    def _save_artifact(name: str) -> str:
        content = desktop.clipboard_full()
        return save_artifact(ctx.run_dir, name, content)

    def _paste_artifact(name: str, press_enter: bool = False) -> str:
        text = load_artifact(ctx.run_dir, name)
        if text is None:
            return NO_ARTIFACT_MSG
        return desktop.paste_any(text, press_enter=press_enter)

    registry["save_artifact"] = _save_artifact
    registry["paste_artifact"] = _paste_artifact

    # 6. Service limit handling
    def _report_limit(app: str, minutes_until_reset: Optional[int] = None) -> str:
        mins = int(minutes_until_reset) if minutes_until_reset is not None else 0
        if ctx.audit:
            ctx.audit.log("limit", app=app, minutes=mins)

        if ctx.switcher is not None:
            can_switch, _ = ctx.switcher.can_switch()
            if can_switch:
                return LIMIT_NOTED_MSG

        if mins <= 0:
            return ctx.notifier.ask_human(
                f"Usage limit reached for {app}. How long should I wait?"
            )

        from core.limits import wait_for_reset

        ctx.notifier.push(f"Limit reached for {app}. Waiting {mins} minutes...")
        wait_for_reset(mins, notify=ctx.notifier.push, kill=ctx.kill)
        if ctx.state:
            ctx.state.limit_waits += 1
        return WAIT_OVER_MSG

    registry["report_limit"] = _report_limit

    # 7. Account switching (only registered if switcher exists)
    if ctx.switcher is not None:

        def _switch_account(app: str) -> str:
            if ctx.audit:
                ctx.audit.log("switch", app=app)
            res = ctx.switcher.switch(app)
            if ctx.state:
                ctx.state.switches_used += 1
            return res

        registry["switch_account"] = _switch_account

    return registry
