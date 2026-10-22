"""Unit tests for checkpoint persistence and run state management."""
from __future__ import annotations

import datetime
import json
import os
import re
import time
from typing import Any

import pytest

from core.checkpoint import (
    RunState,
    latest_run,
    load_checkpoint,
    new_run_id,
    save_checkpoint,
)


def test_new_run_id_format() -> None:
    """Verify new_run_id matches YYYYMMDD-HHMMSS format with default and custom timestamps."""
    rid = new_run_id()
    assert re.match(r"^\d{8}-\d{6}$", rid) is not None

    dt = datetime.datetime(2026, 10, 22, 14, 35, 12, tzinfo=datetime.timezone.utc)
    custom_rid = new_run_id(dt)
    assert custom_rid == "20261022-143512"


def test_save_checkpoint_writes_valid_atomic_json(tmp_path: Any) -> None:
    """Verify save_checkpoint writes valid atomic JSON without leftover temp files."""
    run_dir = str(tmp_path / "run_01")
    state = RunState(run_id="20261022-100000", idea="Test portfolio site", step=1)

    ckpt_path = save_checkpoint(run_dir, state)
    assert os.path.exists(ckpt_path)
    assert os.path.basename(ckpt_path) == "checkpoint.json"

    with open(ckpt_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data["run_id"] == "20261022-100000"
    assert data["idea"] == "Test portfolio site"
    assert data["step"] == 1
    assert data["graph_last_hash"] is None

    # Overwrite with updated state
    state.step = 2
    save_checkpoint(run_dir, state)

    with open(ckpt_path, "r", encoding="utf-8") as f:
        updated_data = json.load(f)
    assert updated_data["step"] == 2

    # Check for temp files in run_dir
    files = os.listdir(run_dir)
    assert files == ["checkpoint.json"]


def test_load_checkpoint_deserializes_complete_state(tmp_path: Any) -> None:
    """Verify load_checkpoint restores all RunState fields accurately."""
    run_dir = str(tmp_path / "run_02")
    original = RunState(
        run_id="20261022-110000",
        idea="E-commerce store",
        step=15,
        graph_last_hash="hash_abc123",
        graph_stalls=2,
        switches_used=1,
        profile_index=3,
        limit_waits=4,
    )

    save_checkpoint(run_dir, original)
    loaded = load_checkpoint(run_dir)

    assert loaded is not None
    assert loaded.run_id == original.run_id
    assert loaded.idea == original.idea
    assert loaded.step == 15
    assert loaded.graph_last_hash == "hash_abc123"
    assert loaded.graph_stalls == 2
    assert loaded.switches_used == 1
    assert loaded.profile_index == 3
    assert loaded.limit_waits == 4
    assert loaded == original


def test_load_checkpoint_corrupt_or_unparseable(tmp_path: Any) -> None:
    """Verify load_checkpoint returns None on corrupt JSON or missing required fields."""
    run_dir = str(tmp_path / "run_corrupt")
    os.makedirs(run_dir, exist_ok=True)
    ckpt_file = os.path.join(run_dir, "checkpoint.json")

    # Corrupt JSON
    with open(ckpt_file, "w", encoding="utf-8") as f:
        f.write("{invalid json syntax,")
    assert load_checkpoint(run_dir) is None

    # Array instead of dictionary
    with open(ckpt_file, "w", encoding="utf-8") as f:
        f.write("[1, 2, 3]")
    assert load_checkpoint(run_dir) is None

    # Missing mandatory fields (e.g. run_id, idea)
    with open(ckpt_file, "w", encoding="utf-8") as f:
        json.dump({"step": 10}, f)
    assert load_checkpoint(run_dir) is None


def test_load_checkpoint_missing(tmp_path: Any) -> None:
    """Verify load_checkpoint returns None when directory or file does not exist."""
    # Empty directory
    empty_dir = str(tmp_path / "empty_dir")
    os.makedirs(empty_dir, exist_ok=True)
    assert load_checkpoint(empty_dir) is None

    # Non-existent directory
    missing_dir = str(tmp_path / "does_not_exist")
    assert load_checkpoint(missing_dir) is None


def test_latest_run_accuracy(tmp_path: Any) -> None:
    """Verify latest_run correctly identifies the most recently updated run directory."""
    runs_dir = str(tmp_path / "runs")

    # Missing and empty runs_dir
    assert latest_run(runs_dir) is None
    os.makedirs(runs_dir, exist_ok=True)
    assert latest_run(runs_dir) is None

    # Only files in runs_dir (not directories)
    with open(os.path.join(runs_dir, "stray_file.txt"), "w") as f:
        f.write("test")
    assert latest_run(runs_dir) is None

    # Create run directories
    run1 = os.path.join(runs_dir, "run_alpha")
    run2 = os.path.join(runs_dir, "run_beta")
    run3 = os.path.join(runs_dir, "run_gamma")

    state1 = RunState(run_id="alpha", idea="Alpha")
    state2 = RunState(run_id="beta", idea="Beta")
    state3 = RunState(run_id="gamma", idea="Gamma")

    save_checkpoint(run1, state1)
    save_checkpoint(run2, state2)
    save_checkpoint(run3, state3)

    # Set explicit mtimes for deterministic testing
    t_base = 1700000000.0
    os.utime(os.path.join(run1, "checkpoint.json"), (t_base + 100, t_base + 100))
    os.utime(os.path.join(run2, "checkpoint.json"), (t_base + 300, t_base + 300))
    os.utime(os.path.join(run3, "checkpoint.json"), (t_base + 200, t_base + 200))

    assert latest_run(runs_dir) == "run_beta"

    # Update run1 checkpoint to be newest
    os.utime(os.path.join(run1, "checkpoint.json"), (t_base + 400, t_base + 400))
    assert latest_run(runs_dir) == "run_alpha"

    # Run without checkpoint.json uses directory mtime
    run_no_ckpt = os.path.join(runs_dir, "run_delta")
    os.makedirs(run_no_ckpt, exist_ok=True)
    os.utime(run_no_ckpt, (t_base + 500, t_base + 500))
    assert latest_run(runs_dir) == "run_delta"
