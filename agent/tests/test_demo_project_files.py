"""Tests for core.demo.project_files module."""
from __future__ import annotations

import importlib
import os
import py_compile
import subprocess
import sys
from pathlib import Path

import pytest
from core.demo.project_files import safe_path, write_round


def test_write_round_1_files(tmp_path: Path) -> None:
    """Verify round 1 writes expected files."""
    written = write_round(str(tmp_path), 1)
    expected = ["README.md", "app.py", "models.py", "utils.py"]
    assert written == expected
    for rel_path in expected:
        file_path = tmp_path / rel_path
        assert file_path.exists()
        assert file_path.stat().st_size > 0
    readme_text = (tmp_path / "README.md").read_text(encoding="utf-8")
    assert "Demo Project" in readme_text


def test_python_files_compile(tmp_path: Path) -> None:
    """Verify all written python files compile cleanly."""
    write_round(str(tmp_path), 1)
    for py_name in ["app.py", "models.py", "utils.py"]:
        py_compile.compile(str(tmp_path / py_name), doraise=True)

    write_round(str(tmp_path), 2)
    for py_name in ["storage.py", "test_app.py", "app.py"]:
        py_compile.compile(str(tmp_path / py_name), doraise=True)


def test_modules_import_and_call(tmp_path: Path) -> None:
    """Verify generated modules can import each other and execute."""
    write_round(str(tmp_path), 1)
    path_str = str(tmp_path)
    sys.path.insert(0, path_str)
    try:
        import app
        import models
        import utils

        importlib.reload(models)
        importlib.reload(utils)
        importlib.reload(app)

        result = app.run_app()
        assert isinstance(result, dict)
        assert result["status"] == "ok"
        assert result["valid"] is True
        assert result["count"] == 2

        # Round 2 update
        write_round(str(tmp_path), 2)
        import storage

        importlib.reload(storage)
        importlib.reload(app)

        store = storage.Storage()
        res2 = app.run_app(store)
        assert isinstance(res2, dict)
        assert res2["status"] == "ok"
        assert res2["stored_count"] >= 2
        store.close()
    finally:
        if path_str in sys.path:
            sys.path.remove(path_str)
        for name in ["app", "models", "utils", "storage", "test_app"]:
            sys.modules.pop(name, None)


def test_write_round_2_additions(tmp_path: Path) -> None:
    """Verify round 2 adds storage.py, test_app.py and updates app.py."""
    write_round(str(tmp_path), 1)
    assert not (tmp_path / "storage.py").exists()
    assert not (tmp_path / "test_app.py").exists()

    written = write_round(str(tmp_path), 2)
    assert written == ["storage.py", "test_app.py", "app.py"]
    assert (tmp_path / "storage.py").exists()
    assert (tmp_path / "test_app.py").exists()
    assert (tmp_path / "app.py").exists()

    app_text = (tmp_path / "app.py").read_text(encoding="utf-8")
    assert "storage" in app_text

    proc = subprocess.run(
        [sys.executable, "-m", "pytest", str(tmp_path / "test_app.py"), "-q"],
        capture_output=True,
        text=True,
        cwd=str(tmp_path),
    )
    assert proc.returncode == 0


def test_idempotent_execution(tmp_path: Path) -> None:
    """Verify repeated execution does not crash or corrupt files."""
    first = write_round(str(tmp_path), 1)
    app_v1 = (tmp_path / "app.py").read_text(encoding="utf-8")

    second = write_round(str(tmp_path), 1)
    assert first == second
    assert (tmp_path / "app.py").read_text(encoding="utf-8") == app_v1

    round2_first = write_round(str(tmp_path), 2)
    app_v2 = (tmp_path / "app.py").read_text(encoding="utf-8")

    round2_second = write_round(str(tmp_path), 2)
    assert round2_first == round2_second
    assert (tmp_path / "app.py").read_text(encoding="utf-8") == app_v2

    py_compile.compile(str(tmp_path / "app.py"), doraise=True)


def test_no_path_escapes(tmp_path: Path) -> None:
    """Verify writes remain inside project_dir and path escapes raise errors."""
    write_round(str(tmp_path), 1)
    write_round(str(tmp_path), 2)

    abs_base = os.path.abspath(str(tmp_path))
    for root, _, files in os.walk(str(tmp_path)):
        for f in files:
            target = os.path.abspath(os.path.join(root, f))
            assert os.path.commonpath([abs_base, target]) == abs_base

    with pytest.raises(ValueError):
        safe_path(str(tmp_path), "../escaped.txt")

    with pytest.raises(ValueError):
        safe_path(str(tmp_path), "nested/../../outside.txt")


def test_other_round_returns_empty(tmp_path: Path) -> None:
    """Verify unsupported round numbers return empty list."""
    assert write_round(str(tmp_path), 0) == []
    assert write_round(str(tmp_path), 3) == []
    assert write_round(str(tmp_path), -1) == []
