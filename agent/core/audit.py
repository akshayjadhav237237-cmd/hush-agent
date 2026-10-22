"""Tamper-evident audit logging with secret redaction and hash chaining."""
from __future__ import annotations

import datetime
import hashlib
import json
import os
import re
import time
from typing import Any, Callable

INITIAL_PREV_HASH: str = "0" * 64
DEFAULT_REDACT_LIMIT: int = 200

SECRET_PATTERNS: list[str] = [
    r"AIza[0-9A-Za-z-_]{35}",
    r"sk-[a-zA-Z0-9]{20,}",
    r"ghp_[a-zA-Z0-9]{20,}",
    r"github_pat_[a-zA-Z0-9_]{20,}",
    r"Bearer\s+[a-zA-Z0-9_\-\.]+",
]

EVENTS: frozenset[str] = frozenset({
    "run_start",
    "model_text",
    "tool_call",
    "tool_result",
    "screenshot",
    "gate",
    "limit",
    "switch",
    "checkpoint",
    "retry",
    "kill",
    "failsafe_abort",
    "resumed",
    "finish",
    "max_steps",
    "kill_switch_unavailable",
})

SUPPRESSED_TOOLS: frozenset[str] = frozenset({
    "paste_text",
    "read_clipboard",
    "paste_artifact",
})

TOOL_IDENTIFIER_KEYS: frozenset[str] = frozenset({
    "tool",
    "tool_name",
    "name",
    "action",
    "function",
})


def redact(text: str, limit: int = DEFAULT_REDACT_LIMIT) -> str:
    """Replace matched secret patterns with [REDACTED] and truncate to limit characters."""
    if not isinstance(text, str):
        return text
    result = text
    for pattern in SECRET_PATTERNS:
        result = re.sub(pattern, "[REDACTED]", result)
    if limit is not None and limit >= 0 and len(result) > limit:
        result = result[:limit]
    return result


def _mask_value(val: Any) -> Any:
    """Mask text content with its length and sha256 prefix."""
    if isinstance(val, str):
        return {
            "len": len(val),
            "sha256": hashlib.sha256(val.encode("utf-8")).hexdigest()[:12],
        }
    if isinstance(val, dict):
        return {k: _mask_value(v) for k, v in val.items()}
    if isinstance(val, list):
        return [_mask_value(v) for v in val]
    if isinstance(val, tuple):
        return tuple(_mask_value(v) for v in val)
    return val


def _redact_value(val: Any) -> Any:
    """Recursively redact strings and truncate to limit."""
    if isinstance(val, str):
        return redact(val, limit=DEFAULT_REDACT_LIMIT)
    if isinstance(val, dict):
        return {k: _redact_value(v) for k, v in val.items()}
    if isinstance(val, list):
        return [_redact_value(v) for v in val]
    if isinstance(val, tuple):
        return tuple(_redact_value(v) for v in val)
    return val


def _is_suppressed_tool(name: Any) -> bool:
    """Check if identifier matches one of the text-suppressed tools."""
    return isinstance(name, str) and name in SUPPRESSED_TOOLS


def _sanitize_fields(
    event: str, fields: dict[str, Any], log_text: bool
) -> dict[str, Any]:
    """Sanitize fields according to log_text setting and redaction rules."""
    sanitized: dict[str, Any] = {}

    is_suppressed_context = False
    if not log_text:
        if _is_suppressed_tool(event):
            is_suppressed_context = True
        else:
            for id_key in TOOL_IDENTIFIER_KEYS:
                if _is_suppressed_tool(fields.get(id_key)):
                    is_suppressed_context = True
                    break

    for k, v in fields.items():
        if not log_text:
            if _is_suppressed_tool(k):
                sanitized[k] = _mask_value(v)
                continue
            if (
                is_suppressed_context
                and k not in TOOL_IDENTIFIER_KEYS
                and k not in {"status", "call_id", "tool_call_id"}
            ):
                sanitized[k] = _mask_value(v)
                continue

        sanitized[k] = _redact_value(v)

    return sanitized


class AuditLog:
    """Tamper-evident, hash-chained audit logger."""

    def __init__(
        self,
        run_dir: str,
        run_id: str,
        mode: str,
        log_text: bool = False,
        clock: Callable[[], float] = time.time,
    ) -> None:
        """Initialize or resume an audit log chain."""
        self.run_dir = run_dir
        self.run_id = run_id
        self.mode = mode
        self.log_text = log_text
        self.clock = clock
        self.start_time = clock()
        self.seq = 0
        self.prev_hash = INITIAL_PREV_HASH
        self.path = os.path.join(run_dir, "audit.jsonl")

        os.makedirs(self.run_dir, exist_ok=True)
        if os.path.exists(self.path):
            with open(self.path, "r", encoding="utf-8") as f:
                for raw_line in f:
                    line = raw_line.rstrip("\r\n")
                    if not line:
                        continue
                    try:
                        entry = json.loads(line)
                        if isinstance(entry, dict) and "seq" in entry:
                            self.seq = int(entry["seq"])
                        else:
                            self.seq += 1
                    except Exception:
                        self.seq += 1
                    self.prev_hash = hashlib.sha256(
                        line.encode("utf-8")
                    ).hexdigest()

    def log(self, event: str, **fields: Any) -> dict[str, Any]:
        """Record an audit event, update the hash chain, and flush to disk."""
        self.seq += 1
        ts = datetime.datetime.now(datetime.timezone.utc).isoformat()
        t = round(self.clock() - self.start_time, 3)
        sanitized = _sanitize_fields(event, fields, self.log_text)

        entry: dict[str, Any] = {
            "ts": ts,
            "t": t,
            "run_id": self.run_id,
            "mode": self.mode,
            "seq": self.seq,
            "event": event,
            "fields": sanitized,
            "prev": self.prev_hash,
        }

        line = json.dumps(entry)
        self.prev_hash = hashlib.sha256(line.encode("utf-8")).hexdigest()

        with open(self.path, "a", encoding="utf-8", newline="\n") as f:
            f.write(line + "\n")
            f.flush()

        return entry


def verify_chain(path: str) -> tuple[bool, int, str | None]:
    """Verify sequence ordering, valid JSON, and cryptographic hash chain."""
    if not os.path.exists(path):
        return False, 0, f"File not found: {path}"

    expected_seq = 1
    expected_prev = INITIAL_PREV_HASH
    count = 0

    with open(path, "r", encoding="utf-8") as f:
        for line_num, raw_line in enumerate(f, start=1):
            line = raw_line.rstrip("\r\n")
            if not line:
                return False, line_num, "Empty line encountered"
            try:
                entry = json.loads(line)
            except Exception as err:
                return False, line_num, f"Invalid JSON: {err}"

            if not isinstance(entry, dict):
                return False, line_num, "Line is not a valid JSON object"

            actual_seq = entry.get("seq")
            if actual_seq != expected_seq:
                return (
                    False,
                    line_num,
                    f"Sequence mismatch: expected {expected_seq}, got {actual_seq}",
                )

            actual_prev = entry.get("prev")
            if actual_prev != expected_prev:
                return (
                    False,
                    line_num,
                    f"Hash mismatch at line {line_num}: expected {expected_prev}, got {actual_prev}",
                )

            expected_prev = hashlib.sha256(line.encode("utf-8")).hexdigest()
            expected_seq += 1
            count += 1

    return True, count, None
