"""Compare two agent runs by analyzing their tamper-evident audit logs."""
from __future__ import annotations

import argparse
from dataclasses import dataclass
import json
import os
import sys
from typing import Optional

_AGENT_DIR = os.path.dirname(os.path.abspath(__file__))
if _AGENT_DIR not in sys.path:
    sys.path.insert(0, _AGENT_DIR)

from core.audit import verify_chain


@dataclass
class RunMetrics:
    """Sanitized performance and usage metrics extracted from an audit log."""

    run_id: str
    provider: str = "gemma"
    model: str = "unknown"
    steps: int = 0
    retries: int = 0
    gate_count: int = 0
    kill_count: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    wall_time: float = 0.0


def locate_audit_log(target: str, runs_dir: Optional[str] = None) -> Optional[str]:
    """Locate an audit log file from a direct path or run ID in RUNS_DIR."""
    if runs_dir is None:
        from core.constants import RUNS_DIR

        runs_dir = RUNS_DIR

    if os.path.isfile(target):
        return os.path.abspath(target)
    if os.path.isdir(target):
        cand = os.path.join(target, "audit.jsonl")
        if os.path.isfile(cand):
            return os.path.abspath(cand)

    cand_dir = os.path.join(runs_dir, target)
    if os.path.isdir(cand_dir):
        cand_file = os.path.join(cand_dir, "audit.jsonl")
        if os.path.isfile(cand_file):
            return os.path.abspath(cand_file)

    cand_file = os.path.join(runs_dir, target)
    if os.path.isfile(cand_file):
        return os.path.abspath(cand_file)
    return None


def parse_audit_log(audit_path: str, fallback_run_id: str = "") -> RunMetrics:
    """Parse sanitized audit events into aggregated comparison metrics."""
    provider, model = "gemma", "unknown"
    run_id = ""
    steps_seen: set[int] = set()
    max_step = retries = gate_count = kill_count = prompt_tokens = completion_tokens = 0
    timestamps: list[float] = []

    with open(audit_path, "r", encoding="utf-8") as f:
        for raw_line in f:
            line = raw_line.strip()
            if not line:
                continue
            entry = json.loads(line)
            if not isinstance(entry, dict):
                continue
            if not run_id and entry.get("run_id"):
                run_id = str(entry["run_id"])
            if isinstance(entry.get("t"), (int, float)):
                timestamps.append(float(entry["t"]))

            event = str(entry.get("event", ""))
            fields = entry.get("fields") if isinstance(entry.get("fields"), dict) else {}

            if event == "run_start":
                if fields.get("provider"):
                    provider = str(fields["provider"])
                if fields.get("model"):
                    model = str(fields["model"])

            step_val = fields.get("step") if "step" in fields else entry.get("step")
            if step_val is not None:
                try:
                    s_int = int(step_val)
                    steps_seen.add(s_int)
                    if s_int > max_step:
                        max_step = s_int
                except (ValueError, TypeError):
                    pass

            if event == "retry":
                retries += 1
            elif event == "gate":
                gate_count += 1
            elif event == "kill":
                kill_count += 1
            elif event == "model_text":
                pt, ct = fields.get("prompt_tokens"), fields.get("completion_tokens")
                if pt is not None:
                    try:
                        prompt_tokens += int(pt)
                    except (ValueError, TypeError):
                        pass
                if ct is not None:
                    try:
                        completion_tokens += int(ct)
                    except (ValueError, TypeError):
                        pass

    wall_time = max(0.0, timestamps[-1] - timestamps[0]) if len(timestamps) >= 2 else 0.0
    steps = max(len(steps_seen), max_step)

    return RunMetrics(
        run_id=run_id or fallback_run_id,
        provider=provider,
        model=model,
        steps=steps,
        retries=retries,
        gate_count=gate_count,
        kill_count=kill_count,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        wall_time=wall_time,
    )


def _get_run_label(arg_id: str, metric_run_id: str) -> str:
    """Determine a concise display label for a run column header."""
    if metric_run_id and not os.path.isabs(metric_run_id):
        return metric_run_id
    target = metric_run_id or arg_id
    if os.path.exists(target) or os.path.sep in target or "/" in target:
        base = os.path.basename(target.rstrip("/\\"))
        if base == "audit.jsonl":
            base = os.path.basename(os.path.dirname(target.rstrip("/\\")))
        if base:
            return base
    return target


def format_table(
    run_a: RunMetrics,
    run_b: RunMetrics,
    label_a: str,
    label_b: str,
    price_in: Optional[float] = None,
    price_out: Optional[float] = None,
) -> str:
    """Format comparison metrics as a clean aligned text table."""
    rows: list[tuple[str, str, str]] = [
        ("provider", run_a.provider, run_b.provider),
        ("model", run_a.model, run_b.model),
        ("steps", str(run_a.steps), str(run_b.steps)),
        ("retries", str(run_a.retries), str(run_b.retries)),
        ("gate count", str(run_a.gate_count), str(run_b.gate_count)),
        ("kill count", str(run_a.kill_count), str(run_b.kill_count)),
        ("prompt_tokens", str(run_a.prompt_tokens), str(run_b.prompt_tokens)),
        ("completion_tokens", str(run_a.completion_tokens), str(run_b.completion_tokens)),
        ("wall_time", f"{run_a.wall_time:.1f}s", f"{run_b.wall_time:.1f}s"),
    ]

    if price_in is not None and price_out is not None:
        cost_a = (run_a.prompt_tokens * price_in / 1_000_000.0) + (
            run_a.completion_tokens * price_out / 1_000_000.0
        )
        cost_b = (run_b.prompt_tokens * price_in / 1_000_000.0) + (
            run_b.completion_tokens * price_out / 1_000_000.0
        )
        rows.append(("cost", f"${cost_a:.4f}", f"${cost_b:.4f}"))

    col1_hdr = "Metric"
    col2_hdr = f"Run A ({label_a})"
    col3_hdr = f"Run B ({label_b})"

    w1 = max(len(col1_hdr), max(len(r[0]) for r in rows))
    w2 = max(len(col2_hdr), max(len(r[1]) for r in rows))
    w3 = max(len(col3_hdr), max(len(r[2]) for r in rows))

    lines: list[str] = [
        f"{col1_hdr:<{w1}} | {col2_hdr:<{w2}} | {col3_hdr:<{w3}}".rstrip(),
        f"{'-' * w1}-+-{'-' * w2}-+-{'-' * w3}",
    ]
    for metric, val_a, val_b in rows:
        lines.append(f"{metric:<{w1}} | {val_a:<{w2}} | {val_b:<{w3}}".rstrip())

    return "\n".join(lines)


def compare_runs(
    run_id_a: str,
    run_id_b: str,
    price_in: Optional[float] = None,
    price_out: Optional[float] = None,
    runs_dir: Optional[str] = None,
) -> str:
    """Verify integrity and compare metrics between two runs."""
    path_a = locate_audit_log(run_id_a, runs_dir=runs_dir)
    if path_a is None:
        raise FileNotFoundError(f"Audit log not found for '{run_id_a}'")

    path_b = locate_audit_log(run_id_b, runs_dir=runs_dir)
    if path_b is None:
        raise FileNotFoundError(f"Audit log not found for '{run_id_b}'")

    ok_a, count_a, err_a = verify_chain(path_a)
    if not ok_a:
        raise ValueError(
            f"Audit log verification failed for '{run_id_a}': {err_a} at line {count_a}"
        )

    ok_b, count_b, err_b = verify_chain(path_b)
    if not ok_b:
        raise ValueError(
            f"Audit log verification failed for '{run_id_b}': {err_b} at line {count_b}"
        )

    metrics_a = parse_audit_log(path_a, fallback_run_id=run_id_a)
    metrics_b = parse_audit_log(path_b, fallback_run_id=run_id_b)

    label_a = _get_run_label(run_id_a, metrics_a.run_id)
    label_b = _get_run_label(run_id_b, metrics_b.run_id)

    return format_table(
        metrics_a,
        metrics_b,
        label_a=label_a,
        label_b=label_b,
        price_in=price_in,
        price_out=price_out,
    )


def main(argv: Optional[list[str]] = None) -> int:
    """CLI entry point for comparing two agent runs."""
    if argv is None:
        argv = sys.argv[1:]

    parser = argparse.ArgumentParser(
        description="Compare two agent runs by analyzing their audit logs."
    )
    parser.add_argument("run_id_a", help="First run ID or path to audit log")
    parser.add_argument("run_id_b", help="Second run ID or path to audit log")
    parser.add_argument(
        "--price-in",
        type=float,
        default=None,
        help="Price per 1M input tokens",
    )
    parser.add_argument(
        "--price-out",
        type=float,
        default=None,
        help="Price per 1M output tokens",
    )

    try:
        args = parser.parse_args(argv)
    except SystemExit as exc:
        return exc.code if isinstance(exc.code, int) else 1

    try:
        table = compare_runs(
            args.run_id_a,
            args.run_id_b,
            price_in=args.price_in,
            price_out=args.price_out,
        )
        print(table)
        return 0
    except (FileNotFoundError, ValueError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
