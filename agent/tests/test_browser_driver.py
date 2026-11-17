"""Unit tests for BrowserDriver lifecycle and wait_done polling."""
from unittest.mock import MagicMock, patch
import subprocess
import pytest

from core.browser_driver import BrowserDriver


def test_ensure_browser_terminates_proc_on_playwright_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify Chrome process is terminated if playwright initialization fails (A-014)."""
    driver = BrowserDriver()
    mock_proc = MagicMock()
    monkeypatch.setattr(subprocess, "Popen", lambda *args, **kwargs: mock_proc)
    monkeypatch.setattr("core.browser_driver.find_chrome_binary", lambda: "mock_chrome.exe")
    monkeypatch.setattr("time.sleep", lambda _: None)

    with patch.dict("sys.modules", {"playwright.sync_api": None}):
        with pytest.raises(Exception):
            driver.ensure_browser()

    mock_proc.terminate.assert_called_once()
    assert driver._proc is None


def test_wait_done_respects_killswitch(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify wait_done polling checks kill event and aborts promptly (A-011)."""
    class MockKill:
        def __init__(self) -> None:
            self.checks = 0
        def is_set(self) -> bool:
            self.checks += 1
            return self.checks >= 2

    kill = MockKill()
    driver = BrowserDriver(kill=kill)
    mock_page = MagicMock()
    driver.navigate_app = MagicMock(return_value=mock_page)
    driver.selectors = {"claude": {"stop_control": [], "reply_text": []}}
    monkeypatch.setattr("time.sleep", lambda _: None)

    res = driver.wait_done("claude", timeout_seconds=100)
    assert res is False
    assert kill.checks >= 2
