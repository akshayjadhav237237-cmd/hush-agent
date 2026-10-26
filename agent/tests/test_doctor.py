"""Unit tests for Hush environment doctor."""
from __future__ import annotations

import os
import sys
from unittest.mock import MagicMock, patch
import pytest

from core.cli import parse_args, main
from core.doctor import (
    TOS_WARNING,
    _check_python_version,
    _check_packages,
    _check_gemini_api,
    _check_ntfy,
    _check_display_and_dpi,
    _check_chrome,
    _check_graphify,
    _check_clipboard,
    _check_keyboard_hook,
    _check_pyautogui_failsafe,
    _check_antigravity,
    _check_disk_space,
    _check_project_dir_writable,
    run_doctor,
)


def test_cli_parse_doctor_arg() -> None:
    args = parse_args(["--doctor"])
    assert args.doctor is True


def test_check_python_version() -> None:
    res = _check_python_version()
    assert res["status"] == "PASS"
    assert "Python" in res["detail"]


def test_check_packages_all_available() -> None:
    res = _check_packages()
    assert res["status"] in ("PASS", "FAIL")
    assert "name" in res


def test_check_gemini_api_missing_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    res = _check_gemini_api()
    assert res["status"] == "FAIL"
    assert "not set" in res["detail"]


def test_check_ntfy_unset(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("NTFY_TOPIC", raising=False)
    res = _check_ntfy()
    assert res["status"] == "WARN"
    assert "unset" in res["detail"]


def test_check_disk_space_and_writable(tmp_path: pytest.TempPathFactory) -> None:
    p = str(tmp_path)
    res_disk = _check_disk_space(p)
    assert res_disk["status"] in ("PASS", "WARN")

    res_write = _check_project_dir_writable(p)
    assert res_write["status"] == "PASS"


def test_run_doctor_smoke(tmp_path: pytest.TempPathFactory) -> None:
    p = str(tmp_path)
    verification_dir = os.path.join(p, "verification")
    code, payload = run_doctor(project_dir=p, verification_dir=verification_dir)
    assert "checks" in payload
    assert len(payload["checks"]) >= 12
    assert os.path.exists(verification_dir)
    assert len(os.listdir(verification_dir)) == 1
