"""Main execution loop orchestrating model interactions, tools, and safety gates."""
from __future__ import annotations

import inspect
import time
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
from core.retry import is_non_retryable_error, is_retryable_error
from core.vision import png_part, strip_old_images

if TYPE_CHECKING:
    from core.types import Desktop, RunContext, ToolFunc

CONTINUE_NUDGE: str = "Please continue with a tool call or call finish."

DETERMINISTIC_TOOL_ERRORS = (
    ValueError,
    TypeError,
    KeyError,
    IndexError,
    FileNotFoundError,
    PermissionError,
    AttributeError,
    NotImplementedError,
    ZeroDivisionError,
)


def is_deterministic_tool_error(exc: BaseException) -> bool:
    """Return True if exception is a deterministic local Python error that must never be retried."""
    if isinstance(exc, DETERMINISTIC_TOOL_ERRORS):
        return True
    return is_non_retryable_error(exc)


def format_tool_error(tool_name: str, exc: BaseException) -> str:
    """Format human-readable tool execution error ending with guidance on what to do next."""
    msg = redact(str(exc))
    hint = "What to do next: "
    lower = msg.lower()
    if "timeout" in lower:
        hint += "Retry the action with a longer wait, or check if the target app is responding."
    elif "not found" in lower or "cannot find" in lower or "no such" in lower:
        hint += "Take a screenshot to locate the target or verify the window/element title."
    elif "permission" in lower or "access denied" in lower:
        hint += "Ask the human operator to grant required permissions."
    else:
        hint += "Take a screenshot to inspect current state and try an alternative approach."
    return f"ERROR in {tool_name}: {msg}. {hint}"


def validate_finish(ctx: RunContext, tool_args: dict[str, Any]) -> tuple[bool, str]:
    """Validate status and preconditions before allowing finish tool to exit."""
    summary = str(tool_args.get("summary", "")).strip()
    if not summary:
        return False, "Finish rejected: 'summary' is required and cannot be empty."

    status = tool_args.get("status")
    if status is not None and str(status).lower() not in (
        "success",
        "ok",
        "completed",
        "done",
        "true",
    ):
        return False, f"Finish rejected: invalid status '{status}'. Expected successful completion."

    validator = getattr(ctx, "finish_validator", None)
    if callable(validator):
        res = validator(ctx, tool_args)
        if isinstance(res, tuple):
            valid, reason = res
            if not valid:
                return False, f"Finish rejected: preconditions not met ({reason})."
        elif res is False:
            return False, "Finish rejected: preconditions not met."

    return True, ""


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
    tool_history: list[tuple[str, str]] = []

    for step in range(start_step, ctx.max_steps):
        # 1. Responsive kill switch check before step starts
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
            if is_non_retryable_error(exc):
                notify_fn = registry.get("notify_human", ctx.notifier.ask_human)
                notify_fn(f"Non-retryable model error: {exc}")
                if ctx.audit:
                    ctx.audit.log("model_failure", step=step, error=str(exc))
                return EXIT_MODEL_FAILURE

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

        # Check plan_only dry-run mode
        if getattr(ctx, "plan_only", False):
            print("\n--- PLAN-ONLY DRY RUN ---")
            for t in text_parts:
                print(t)
            if calls:
                print("\nIntended tool calls:")
                for c in calls:
                    print(f"- {getattr(c, 'name', '')}({getattr(c, 'args', {})})")
            print("-------------------------\n")
            if ctx.audit:
                ctx.audit.log("plan_only_complete", plan="\n".join(text_parts))
            return EXIT_OK

        # 5. Dispatch function calls
        response_parts: list[Any] = []
        for call in calls:
            tool_name = getattr(call, "name", "")
            raw_args = getattr(call, "args", {}) or {}
            tool_args = dict(raw_args)

            # Update phase state machine based on tools invoked
            if hasattr(ctx, "state") and ctx.state:
                if tool_name in ("run_cmd", "browser_send_prompt", "paste_text") or (
                    tool_name == "save_artifact"
                    and "build" in str(tool_args.get("name", ""))
                ):
                    ctx.state.phase = "build"
                elif tool_name == "save_artifact" and "plan" in str(
                    tool_args.get("name", "")
                ):
                    ctx.state.phase = "plan"
                elif tool_name in ("save_artifact", "open_url") and "research" in str(
                    tool_args.get("name", "")
                ):
                    ctx.state.phase = "research"

            # Kill switch check before every tool execution
            if ctx.kill.is_set():
                if ctx.audit:
                    ctx.audit.log("kill", step=step, tool=tool_name)
                return EXIT_KILL

            if ctx.audit:
                ctx.audit.log("tool_call", tool=tool_name, args=tool_args)

            # Special tool: finish (with validation of status and preconditions)
            if tool_name == "finish":
                valid, reason = validate_finish(ctx, tool_args)
                if not valid:
                    if ctx.audit:
                        ctx.audit.log("finish_rejected", reason=reason, args=tool_args)
                    response_parts.append(
                        types.Part.from_function_response(
                            name=tool_name,
                            response={"result": f"ERROR: {reason}"},
                        )
                    )
                    previous_tool = tool_name
                    continue

                if hasattr(ctx, "state") and ctx.state:
                    ctx.state.phase = "done"
                summary = str(tool_args.get("summary", "")).strip()
                if ctx.audit:
                    ctx.audit.log("finish", summary=summary)
                ctx.state.step = step + 1
                save_checkpoint(ctx.run_dir, ctx.state)
                return EXIT_OK

            # Special tool: screenshot (wrapped in failsafe and error handling)
            if tool_name == "screenshot":
                try:
                    png = desktop.screenshot_png()
                except BaseException as exc:
                    if isinstance(exc, (KeyboardInterrupt, SystemExit)):
                        raise
                    if is_failsafe(exc):
                        if ctx.audit:
                            ctx.audit.log("failsafe_abort")
                        print(
                            "FailSafe aborted by user moving mouse to corner."
                        )
                        return EXIT_FAILSAFE
                    res_str = format_tool_error(tool_name, exc)
                    if ctx.audit:
                        ctx.audit.log("tool_result", tool=tool_name, result=res_str)
                    response_parts.append(
                        types.Part.from_function_response(
                            name=tool_name,
                            response={"result": res_str},
                        )
                    )
                    previous_tool = tool_name
                    continue

                # Responsive kill switch check immediately after tool execution
                if ctx.kill.is_set():
                    if ctx.audit:
                        ctx.audit.log("kill", step=step)
                    return EXIT_KILL

                tool_history.append(("screenshot", ""))
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
                    tool_history.clear()
                    response_parts.append(
                        types.Part.from_text(
                            text=f"Human note on screen: {reply}"
                        )
                    )

                response_parts.append(png_part(png))
                if ctx.audit:
                    ctx.audit.log("screenshot", dhash=h)

            else:
                # Observe non-screenshot tool execution and detect alternating loops
                tool_hash = (
                    hash(
                        (
                            tool_name,
                            tuple(
                                sorted(
                                    (str(k), str(v)) for k, v in tool_args.items()
                                )
                            ),
                        )
                    )
                    & 0xFFFFFFFFFFFFFFFF
                )
                breaker_reason = ctx.breaker.observe(tool_hash, action_kind(tool_name))
                tool_history.append((tool_name, str(sorted(tool_args.items()))))
                if len(tool_history) > 60:
                    tool_history = tool_history[-60:]

                seq_reason = None
                for period in (1, 2, 3):
                    min_steps = period * (3 if period == 1 else 2)
                    if len(tool_history) >= min_steps:
                        recent = tool_history[-min_steps:]
                        pattern = recent[:period]
                        if recent == pattern * (len(recent) // period):
                            seq_reason = (
                                f"Alternating/repeating non-screenshot tool sequence detected "
                                f"(period {period}: {[p[0] for p in pattern]})."
                            )
                            break

                effective_reason = breaker_reason or seq_reason
                if effective_reason:
                    if ctx.audit:
                        ctx.audit.log(
                            "gate", trigger="loop_breaker", reason=effective_reason
                        )
                    reply = ctx.notifier.ask_human(
                        f"Loop breaker alert: {effective_reason} How should I proceed?"
                    )
                    ctx.breaker.reset()
                    tool_history.clear()
                    response_parts.append(
                        types.Part.from_text(
                            text=f"Human note on screen: {reply}"
                        )
                    )

                # General tool registry dispatch with bounded retries & backoff
                fn = registry.get(tool_name)
                if fn is None:
                    res_str = f"Unknown tool: {tool_name}. What to do next: Check available tools in schema."
                else:
                    # Support tools that accept cooperative cancellation check
                    call_kwargs = dict(tool_args)
                    try:
                        sig = inspect.signature(fn)
                        for param_name in (
                            "cancel_check",
                            "is_cancelled",
                            "kill_check",
                            "kill",
                        ):
                            if param_name in sig.parameters:
                                if param_name == "kill":
                                    call_kwargs[param_name] = ctx.kill
                                else:
                                    call_kwargs[param_name] = ctx.kill.is_set
                                break
                    except (ValueError, TypeError):
                        pass

                    retries = 2
                    delay = 0.1
                    for attempt in range(retries + 1):
                        try:
                            res_str = str(fn(**call_kwargs))
                            break
                        except BaseException as exc:
                            if isinstance(exc, (KeyboardInterrupt, SystemExit)):
                                raise
                            if is_failsafe(exc):
                                if ctx.audit:
                                    ctx.audit.log("failsafe_abort")
                                print(
                                    "FailSafe aborted by user moving mouse to corner."
                                )
                                return EXIT_FAILSAFE
                            if (
                                attempt < retries
                                and not is_deterministic_tool_error(exc)
                                and is_retryable_error(exc)
                            ):
                                time.sleep(delay)
                                delay *= 2
                                continue
                            res_str = format_tool_error(tool_name, exc)
                            break

                # Responsive kill switch check immediately after tool execution
                if ctx.kill.is_set():
                    if ctx.audit:
                        ctx.audit.log("kill", step=step)
                    return EXIT_KILL

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
