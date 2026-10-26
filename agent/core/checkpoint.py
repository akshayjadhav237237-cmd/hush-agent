"""Run state checkpointing and persistence utilities."""
from __future__ import annotations

from dataclasses import asdict, dataclass
import datetime
import json
import os
import tempfile
from typing import Any, Optional


@dataclass
class RunState:
    """State tracking for an agent execution run."""

    run_id: str
    idea: str
    step: int = 0
    graph_last_hash: Optional[str] = None
    graph_stalls: int = 0
    switches_used: int = 0
    profile_index: int = 0
    limit_waits: int = 0
    phase: str = "research"

    def to_dict(self) -> dict[str, Any]:
        """Serialize RunState to a dictionary."""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> RunState:
        """Deserialize RunState from a dictionary."""
        return cls(
            run_id=data["run_id"],
            idea=data["idea"],
            step=data.get("step", 0),
            graph_last_hash=data.get("graph_last_hash"),
            graph_stalls=data.get("graph_stalls", 0),
            switches_used=data.get("switches_used", 0),
            profile_index=data.get("profile_index", 0),
            limit_waits=data.get("limit_waits", 0),
            phase=data.get("phase", "research"),
        )


def new_run_id(now: Optional[datetime.datetime] = None) -> str:
    """Generate a run ID formatted as YYYYMMDD-HHMMSS."""
    dt = now or datetime.datetime.now(datetime.timezone.utc)
    return dt.strftime("%Y%m%d-%H%M%S")


def save_checkpoint(run_dir: str, state: RunState) -> str:
    """Atomically save RunState to checkpoint.json in run_dir.

    Writes to a temporary file in run_dir, then replaces checkpoint.json.
    Returns the path to checkpoint.json.
    """
    os.makedirs(run_dir, exist_ok=True)
    target_path = os.path.join(run_dir, "checkpoint.json")

    fd, tmp_path = tempfile.mkstemp(
        dir=run_dir, prefix="checkpoint_", suffix=".tmp", text=True
    )
    try:
        with open(fd, "w", encoding="utf-8") as f:
            json.dump(state.to_dict(), f, indent=2)
        os.replace(tmp_path, target_path)
    except Exception:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass
        raise

    return target_path


def load_checkpoint(run_dir: str) -> Optional[RunState]:
    """Read checkpoint.json from run_dir.

    Returns None if missing, corrupt, or invalid.
    """
    checkpoint_path = os.path.join(run_dir, "checkpoint.json")
    if not os.path.isfile(checkpoint_path):
        return None

    try:
        with open(checkpoint_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            return None
        return RunState.from_dict(data)
    except Exception:
        return None


def latest_run(runs_dir: str) -> Optional[str]:
    """Scan subdirectories of runs_dir to find the most recently updated run.

    Uses checkpoint.json modification time if present, falling back to directory
    modification time. Returns the directory name or None if missing or empty.
    """
    if not os.path.isdir(runs_dir):
        return None

    candidates: list[tuple[float, str]] = []
    try:
        entries = os.listdir(runs_dir)
    except OSError:
        return None

    for entry in entries:
        sub_path = os.path.join(runs_dir, entry)
        if not os.path.isdir(sub_path):
            continue
        ckpt_path = os.path.join(sub_path, "checkpoint.json")
        try:
            if os.path.isfile(ckpt_path):
                mtime = os.path.getmtime(ckpt_path)
            else:
                mtime = os.path.getmtime(sub_path)
            candidates.append((mtime, entry))
        except OSError:
            continue

    if not candidates:
        return None

    candidates.sort(key=lambda x: (x[0], x[1]), reverse=True)
    return candidates[0][1]
