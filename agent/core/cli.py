"""Command line interface and entrypoint orchestration for Hush."""
from __future__ import annotations

import argparse
import os
from typing import Any, Callable, Optional

from core.constants import (
    DEFAULT_MODEL,
    EXIT_ERROR,
    MAX_STEPS_DEFAULT,
    OPENAI_MODEL,
    PROVIDERS,
    RUNS_DIR,
    resolve_project_dir,
)


def parse_args(argv: Optional[list[str]] = None) -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        prog="orchestrator.py",
        description="Hush: autonomous Windows desktop orchestrator built with Gemma 4.",
    )
    parser.add_argument(
        "idea",
        nargs="*",
        help="Description of the project/app to build autonomously.",
    )
    parser.add_argument(
        "--resume",
        nargs="?",
        const="latest",
        default=None,
        metavar="RUN_ID",
        help="Resume an interrupted run (defaults to latest run if no ID specified).",
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="Run against a simulated mock desktop without moving real mouse/keyboard.",
    )
    parser.add_argument(
        "--demo-limit",
        action="store_true",
        help="Trigger a simulated usage limit during demo mode.",
    )
    parser.add_argument(
        "--demo-answer",
        type=str,
        default=None,
        metavar="TEXT",
        help="Pre-configured human answer for NEEDS_HUMAN prompt in demo mode.",
    )
    parser.add_argument(
        "--account-switch",
        action="store_true",
        help="Enable switching between Chrome profiles upon reaching usage limits.",
    )
    parser.add_argument(
        "--i-accept-account-switch-terms",
        action="store_true",
        help="Acknowledge caution terms and risks for automated Chrome account switching.",
    )
    parser.add_argument(
        "--log-text",
        action="store_true",
        help="Include raw paste/clipboard text in audit logs instead of hash/length.",
    )
    parser.add_argument(
        "--provider",
        choices=PROVIDERS,
        default="gemma",
        help="Model provider to use for orchestration (default: gemma).",
    )
    parser.add_argument(
        "--max-steps",
        type=int,
        default=MAX_STEPS_DEFAULT,
        metavar="N",
        help=f"Maximum orchestrator loop steps before exiting (default: {MAX_STEPS_DEFAULT}).",
    )
    return parser.parse_args(argv)


def main(
    argv: Optional[list[str]] = None,
    *,
    model_factory: Optional[Callable[..., Any]] = None,
    desktop_factory: Optional[Callable[..., Any]] = None,
) -> int:
    """Execute Hush orchestrator with parsed CLI arguments and dependency factories."""
    args = parse_args(argv)

    mode = "demo" if args.demo else "real"
    provider = args.provider
    model_name = OPENAI_MODEL if provider == "openai" else DEFAULT_MODEL
    print(f"PROVIDER: {provider} / {model_name}")

    if args.resume:
        from core.artifacts import build_resume_message, list_artifacts
        from core.audit import AuditLog
        from core.checkpoint import latest_run, load_checkpoint
        from core.prompts import SYSTEM_PLAYBOOK

        target = args.resume
        run_id = latest_run(RUNS_DIR) if target == "latest" else target
        if not run_id:
            print("Error: No saved run found to resume.")
            return EXIT_ERROR

        run_dir = os.path.join(RUNS_DIR, run_id)
        state = load_checkpoint(run_dir)
        if not state:
            print(f"Error: Checkpoint missing for run {run_id}")
            return EXIT_ERROR

        arts = list_artifacts(run_dir)
        first_message = (
            f"{SYSTEM_PLAYBOOK}\n\n"
            f"{build_resume_message(state.idea, arts, state)}"
        )
        audit = AuditLog(
            run_dir, run_id, mode=mode, log_text=args.log_text
        )
        audit.log("resumed", run_id=run_id, step=state.step)
    else:
        idea_text = " ".join(args.idea).strip()
        if not idea_text:
            print("Error: Please provide a project idea or use --resume.")
            return EXIT_ERROR

        from core.audit import AuditLog
        from core.checkpoint import RunState, new_run_id, save_checkpoint
        from core.prompts import build_first_message

        run_id = new_run_id()
        run_dir = os.path.join(RUNS_DIR, run_id)
        os.makedirs(run_dir, exist_ok=True)
        state = RunState(run_id=run_id, idea=idea_text)
        save_checkpoint(run_dir, state)

        first_message = build_first_message(idea_text, demo=args.demo)
        audit = AuditLog(
            run_dir, run_id, mode=mode, log_text=args.log_text
        )
        audit.log("run_start", idea=idea_text, mode=mode, provider=provider, model=model_name)

    project_dir = resolve_project_dir(mode, run_dir)

    # Kill Switch
    from core.killswitch import KillSwitch

    kill = KillSwitch()
    if not kill.start():
        audit.log("kill_switch_unavailable")

    # Loop Breaker
    from core.loopbreaker import LoopBreaker

    breaker = LoopBreaker()

    # Notifier
    from core.notify import Notifier

    auto_answer = args.demo_answer if args.demo else None
    notifier = Notifier(
        topic=os.getenv("NTFY_TOPIC"),
        auto_answer=auto_answer,
        audit=audit,
    )

    # Account Switcher
    switcher = None
    if args.account_switch:
        from core.accounts import AccountSwitcher, parse_profiles

        profiles = parse_profiles(os.getenv("HUSH_CHROME_PROFILES"))
        switcher = AccountSwitcher(profiles, audit=audit)
        confirmed = switcher.confirm(
            accepted_flag=args.i_accept_account_switch_terms
        )
        if not confirmed:
            print("Account switching terms declined.")
            kill.stop()
            return EXIT_ERROR
        can_sw, reason = switcher.can_switch()
        if not can_sw:
            print(f"Account switching unavailable: {reason}")
            kill.stop()
            return EXIT_ERROR

    # Desktop
    if desktop_factory:
        desktop = desktop_factory(project_dir=project_dir)
    elif args.demo:
        print("DEMO MODE: simulated desktop, real Gemma calls")
        from core.demo.world import DemoWorld

        desktop = DemoWorld(
            project_dir=project_dir,
            limit_scenario=args.demo_limit,
            human_answer=args.demo_answer,
        )
    else:
        from core.desktop_tools import DesktopTools

        desktop = DesktopTools()

    # Tools Schema & Model
    from core.tool_schema import build_tools

    tools = build_tools(switch_enabled=(switcher is not None))

    if model_factory:
        try:
            model = model_factory(provider=provider, model=model_name, tools=tools, audit=audit)
        except TypeError:
            model = model_factory(tools=tools, audit=audit)
    elif provider == "openai":
        from core.openai_client import OpenAIModelClient

        model = OpenAIModelClient(model_name, tools, audit=audit)
    else:
        from core.model_client import ModelClient

        model = ModelClient(model_name, tools, audit=audit)

    # Context & Registry
    from core.tool_registry import build_registry
    from core.types import RunContext

    ctx = RunContext(
        run_id=run_id,
        run_dir=run_dir,
        project_dir=project_dir,
        mode=mode,
        audit=audit,
        kill=kill,
        breaker=breaker,
        notifier=notifier,
        switcher=switcher,
        state=state,
        max_steps=args.max_steps,
        log_text=args.log_text,
    )
    registry = build_registry(ctx, desktop)

    # Run loop
    from core.loop import run_loop

    try:
        return run_loop(
            ctx,
            desktop,
            registry,
            model,
            first_message,
            start_step=state.step,
        )
    finally:
        kill.stop()
