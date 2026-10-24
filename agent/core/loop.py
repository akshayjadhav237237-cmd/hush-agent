"""Main execution loop orchestrating model interactions, tools, and safety gates."""
from __future__ import annotations

from typing import TYPE_CHECKING, Any

from core.audit import redact
from core.checkpoint import save_checkpoint
from core.constants import (
    EXIT_FAILSAFE,
    EXIT_KILL,
    EXIT_MAX_STEPS,
    EXIT_MODEL_FAILURE,
    EXIT_OK,
    KEEP_SCREENSHOTS,
)
from core.killswitch import is_failsafe
from core.loopbreaker import action_kind, dhash
from core.model_client import ModelUnavailable
from core.vision import png_part, strip_old_images

if TYPE_CHECKING:
    from core.types import Desktop, RunContext, ToolFunc

CONTINUE_NUDGE: str = "Please continue with a tool call or call finish."


def run_loop(
    ctx: RunContext,
    desktop: Desktop,
    registry: dict[str, ToolFunc],
    model: Any,
    first_message: str,
    start_step: int = 0,
) -> int:
    """Execute the orchestrator loop, managing steps, safety, and dispatching."""
    from google.genai import types

    contents: list[Any] = [
        types.Content(role="user", parts=[types.Part.from_text(text=first_message)])
    ]
    previous_tool: str = ""

    for step in range(start_step, ctx.max_steps):
        # 1. Kill switch check before step starts
        if ctx.kill.is_set():
            if ctx.audit:
                ctx.audit.log("kill", step=step)
            return EXIT_KILL

        # 2. Model generation with ModelUnavailable escalation
        content = None
        try:
            content = model.generate(contents)
        except ModelUnavailable as exc:
            save_checkpoint(ctx.run_dir, ctx.state)
            recovered = False
            for _ in range(3):
                ctx.notifier.ask_human(
                    f"Model generation failed: {exc}. Press Enter to retry or advise."
                )
                try:
                    content = model.generate(contents)
                    recovered = True
                    break
                except ModelUnavailable:
                    continue

            if not recovered or content is None:
                if ctx.audit:
                    ctx.audit.log("model_failure", step=step, error=str(exc))
                return EXIT_MODEL_FAILURE

        contents.append(content)

        # 3. Audit text parts emitted by model with usage fields
        usage = getattr(model, "last_usage", None)
        text_parts = [
            p.text for p in getattr(content, "parts", []) if getattr(p, "text", None)
        ]
        if text_parts:
            for idx, text in enumerate(text_parts):
                log_kwargs: dict[str, Any] = {"text": text}
                if idx == 0 and usage:
                    if "prompt_tokens" in usage:
                        log_kwargs["prompt_tokens"] = usage["prompt_tokens"]
                    if "completion_tokens" in usage:
                        log_kwargs["completion_tokens"] = usage["completion_tokens"]
                if ctx.audit:
                    ctx.audit.log("model_text", **log_kwargs)
        elif usage and ctx.audit:
            log_kwargs = {"text": ""}
            if "prompt_tokens" in usage:
                log_kwargs["prompt_tokens"] = usage["prompt_tokens"]
            if "completion_tokens" in usage:
                log_kwargs["completion_tokens"] = usage["completion_tokens"]
            ctx.audit.log("model_text", **log_kwargs)

        # 4. Extract function calls
        calls = [
            p.function_call
            for p in getattr(content, "parts", [])
            if getattr(p, "function_call", None) is not None
        ]

        if not calls:
            contents.append(
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=CONTINUE_NUDGE)],
                )
            )
            ctx.state.step = step + 1
            save_checkpoint(ctx.run_dir, ctx.state)
            if ctx.audit:
                ctx.audit.log("checkpoint", step=ctx.state.step)
            strip_old_images(contents, keep=KEEP_SCREENSHOTS)
            continue

        # 5. Dispatch function calls
        response_parts: list[Any] = []
        for call in calls:
            tool_name = getattr(call, "name", "")
            raw_args = getattr(call, "args", {}) or {}
            tool_args = dict(raw_args)

            # Kill switch check before every tool execution
            if ctx.kill.is_set():
                if ctx.audit:
                    ctx.audit.log("kill", step=step, tool=tool_name)
                return EXIT_KILL

            if ctx.audit:
                ctx.audit.log("tool_call", tool=tool_name, args=tool_args)

            # Special tool: finish
            if tool_name == "finish":
                summary = str(tool_args.get("summary", ""))
                if ctx.audit:
                    ctx.audit.log("finish", summary=summary)
                ctx.state.step = step + 1
                save_checkpoint(ctx.run_dir, ctx.state)
                return EXIT_OK

            # Special tool: screenshot
            if tool_name == "screenshot":
                png = desktop.screenshot_png()
                h = dhash(png)
                reason = ctx.breaker.observe(h, action_kind(previous_tool))
                if reason:
                    if ctx.audit:
                        ctx.audit.log(
                            "gate", trigger="loop_breaker", reason=reason
                        )
                    reply = ctx.notifier.ask_human(
                        f"Loop breaker alert: {reason} How should I proceed?"
                    )
                    ctx.breaker.reset()
                    response_parts.append(
                        types.Part.from_text(
                            text=f"Human note on screen: {reply}"
                        )
                    )

                response_parts.append(png_part(png))
                if ctx.audit:
                    ctx.audit.log("screenshot", dhash=h)

            else:
                # General tool registry dispatch
                fn = registry.get(tool_name)
                if fn is None:
                    res_str = f"Unknown tool: {tool_name}"
                else:
                    try:
                        res_str = str(fn(**tool_args))
                    except BaseException as exc:
                        if is_failsafe(exc):
                            if ctx.audit:
                                ctx.audit.log("failsafe_abort")
                            print(
                                "FailSafe aborted by user moving mouse to corner."
                            )
                            return EXIT_FAILSAFE
                        res_str = f"ERROR: {redact(str(exc))}"

                if ctx.audit:
                    ctx.audit.log(
                        "tool_result", tool=tool_name, result=res_str
                    )
                response_parts.append(
                    types.Part.from_function_response(
                        name=tool_name,
                        response={"result": res_str},
                    )
                )

            previous_tool = tool_name

        contents.append(types.Content(role="user", parts=response_parts))

        # 6. Step post-processing
        ctx.state.step = step + 1
        save_checkpoint(ctx.run_dir, ctx.state)
        if ctx.audit:
            ctx.audit.log("checkpoint", step=ctx.state.step)
        strip_old_images(contents, keep=KEEP_SCREENSHOTS)

    # 7. Max steps exhausted
    if ctx.audit:
        ctx.audit.log("max_steps", step=ctx.max_steps)
    return EXIT_MAX_STEPS
