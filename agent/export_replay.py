"""Export replay JSON from an audit log run."""
from __future__ import annotations

import json
import os
import sys
from typing import Any, Optional

# Ensure agent directory is accessible for absolute imports when run standalone
_AGENT_DIR = os.path.dirname(os.path.abspath(__file__))
if _AGENT_DIR not in sys.path:
    sys.path.insert(0, _AGENT_DIR)

from core.audit import verify_chain, redact


def _format_value(val: Any) -> str:
    """Format an arbitrary value cleanly with redaction."""
    if isinstance(val, dict):
        if "len" in val and "sha256" in val:
            return f"(len: {val['len']}, sha: {val['sha256']})"
        if "len" in val:
            return f"(len: {val['len']})"
        parts = [f"{k}={redact(str(v), limit=60)}" for k, v in val.items()]
        return "{" + ", ".join(parts) + "}"
    if isinstance(val, str):
        return redact(val, limit=120)
    return str(val)


def _build_summary(
    event: str,
    fields: dict[str, Any],
    tool: Optional[str] = None,
    gate: Optional[str] = None,
) -> str:
    """Build a clean human-readable summary containing only redacted fields."""
    if event == "run_start":
        idea = fields.get("idea", "")
        return f"Run started: {redact(str(idea), limit=150)}" if idea else "Run started"

    if event == "gate":
        trigger = gate or fields.get("trigger", "unknown")
        return f"Attention gate triggered: {redact(str(trigger), limit=150)}"

    if event in ("tool_call", "tool_result"):
        t_name = tool or "unknown_tool"
        prefix = "Tool call" if event == "tool_call" else "Tool result"

        if t_name in ("paste_text", "paste_artifact"):
            args = fields.get("args") if isinstance(fields.get("args"), dict) else {}
            text_val = fields.get("text") or fields.get("content") or args.get("text")
            if isinstance(text_val, dict) and "len" in text_val:
                details = f"({text_val['len']} chars)"
            elif isinstance(text_val, str):
                details = f"({len(text_val)} chars)"
            else:
                details = ""
            return f"{prefix}: {t_name} {details}".strip()

        if t_name == "read_clipboard":
            res_val = fields.get("result") or fields.get("clipboard") or fields.get("text")
            if isinstance(res_val, dict) and "len" in res_val:
                details = f"({res_val['len']} chars)"
            elif isinstance(res_val, str):
                details = f"({len(res_val)} chars)"
            else:
                details = ""
            return f"{prefix}: read_clipboard {details}".strip()

        if t_name == "run_cmd":
            args = fields.get("args") if isinstance(fields.get("args"), dict) else {}
            cmd = fields.get("command") or fields.get("cmd") or args.get("command")
            if cmd:
                return f"{prefix}: run_cmd '{redact(str(cmd), limit=100)}'"
            return f"{prefix}: run_cmd"

        if t_name == "open_url":
            args = fields.get("args") if isinstance(fields.get("args"), dict) else {}
            url = fields.get("url") or args.get("url")
            if url:
                return f"{prefix}: open_url '{redact(str(url), limit=100)}'"
            return f"{prefix}: open_url"

        if t_name == "open_app":
            args = fields.get("args") if isinstance(fields.get("args"), dict) else {}
            app = fields.get("name") or fields.get("app") or args.get("name")
            if app:
                return f"{prefix}: open_app '{redact(str(app), limit=100)}'"
            return f"{prefix}: open_app"

        if t_name == "click":
            args = fields.get("args") if isinstance(fields.get("args"), dict) else {}
            x = fields.get("x") if "x" in fields else args.get("x")
            y = fields.get("y") if "y" in fields else args.get("y")
            if x is not None and y is not None:
                return f"{prefix}: click ({x}, {y})"
            return f"{prefix}: click"

        res = fields.get("result") or fields.get("output")
        if res is not None:
            return f"{prefix}: {t_name} -> {_format_value(res)}"
        return f"{prefix}: {t_name}"

    if event == "model_text":
        text = fields.get("text", "")
        return f"Model output: {redact(str(text), limit=150)}"

    if event == "screenshot":
        return "Screenshot captured"

    if event == "checkpoint":
        step = fields.get("step", "")
        return f"Checkpoint saved at step {step}" if step != "" else "Checkpoint saved"

    if event == "limit":
        msg = fields.get("message") or fields.get("reason", "")
        return f"Rate limit encountered: {redact(str(msg), limit=150)}"

    if event == "switch":
        idx = fields.get("profile_index") or fields.get("index", "")
        return f"Switched account profile to {idx}"

    if event == "retry":
        err = fields.get("error", "")
        attempt = fields.get("attempt", "")
        return f"Retry attempt {attempt}: {redact(str(err), limit=150)}"

    if event == "kill":
        src = fields.get("source", "user")
        return f"Run killed by {redact(str(src), limit=50)}"

    if event == "failsafe_abort":
        return "Run aborted by failsafe trigger (mouse to top-left)"

    if event == "resumed":
        idea = fields.get("idea", "")
        return f"Run resumed: {redact(str(idea), limit=150)}" if idea else "Run resumed"

    if event == "finish":
        s = fields.get("summary", "")
        return f"Run finished: {redact(str(s), limit=150)}" if s else "Run finished"

    if event == "max_steps":
        m = fields.get("max_steps", "")
        return f"Maximum steps reached ({m})"

    if event == "kill_switch_unavailable":
        return "Kill switch unavailable"

    # Default fallback
    clean_parts = [
        f"{k}={_format_value(v)}"
        for k, v in fields.items()
        if k not in ("text", "clipboard", "raw", "args")
    ]
    detail = ", ".join(clean_parts[:3])
    base = f"Event {event}"
    if detail:
        base += f": {detail}"
    return redact(base, limit=200)


def export_replay(runs_dir: str, run_id_or_latest: str) -> str:
    """Verify audit log and export a sanitized replay JSON file."""
    if run_id_or_latest == "latest":
        if not os.path.exists(runs_dir) or not os.path.isdir(runs_dir):
            raise FileNotFoundError(f"No runs found in {runs_dir}")
        entries = [
            os.path.join(runs_dir, d)
            for d in os.listdir(runs_dir)
            if os.path.isdir(os.path.join(runs_dir, d))
        ]
        if not entries:
            raise FileNotFoundError(f"No runs found in {runs_dir}")
        run_dir = max(entries, key=os.path.getmtime)
    else:
        run_dir = os.path.join(runs_dir, run_id_or_latest)
        if not os.path.isdir(run_dir):
            raise FileNotFoundError(f"Run directory not found: {run_dir}")

    audit_path = os.path.join(run_dir, "audit.jsonl")
    if not os.path.exists(audit_path):
        raise FileNotFoundError(f"Audit log not found: {audit_path}")

    ok, count, err = verify_chain(audit_path)
    if not ok:
        raise ValueError(f"Audit log verification failed: {err} at line {count}")

    lines: list[dict[str, Any]] = []
    with open(audit_path, "r", encoding="utf-8") as f:
        for raw_line in f:
            stripped = raw_line.strip()
            if stripped:
                lines.append(json.loads(stripped))

    run_id = os.path.basename(run_dir)
    mode = "real"
    if lines:
        run_id = str(lines[0].get("run_id", run_id))
        mode = str(lines[0].get("mode", mode))

    events: list[dict[str, Any]] = []
    for line in lines:
        t = line.get("t", 0.0)
        seq = line.get("seq", 0)
        event = str(line.get("event", ""))
        fields = line.get("fields", {})
        if not isinstance(fields, dict):
            fields = {}

        tool: Optional[str] = None
        if event in ("tool_call", "tool_result"):
            if "tool" in fields and fields["tool"]:
                tool = str(fields["tool"])
            elif "name" in fields and fields["name"]:
                tool = str(fields["name"])

        gate: Optional[str] = None
        if event == "gate" and "trigger" in fields and fields["trigger"]:
            gate = str(fields["trigger"])

        summary = _build_summary(event, fields, tool=tool, gate=gate)

        entry: dict[str, Any] = {
            "t": t,
            "step": seq,
            "event": event,
        }
        if tool is not None:
            entry["tool"] = tool
        if gate is not None:
            entry["gate"] = gate
        entry["summary"] = summary
        events.append(entry)

    replay_payload = {
        "mode": mode,
        "run_id": run_id,
        "events": events,
    }
    replay_path = os.path.join(run_dir, "replay.json")
    with open(replay_path, "w", encoding="utf-8") as f:
        json.dump(replay_payload, f, indent=2)

    return replay_path


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python export_replay.py <run_id|latest>", file=sys.stderr)
        sys.exit(1)

    target_id = sys.argv[1]
    default_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "runs")
    try:
        exported = export_replay(default_dir, target_id)
        print(exported)
        sys.exit(0)
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
