"""Tests for Chrome profile account switcher."""
from typing import Any
from unittest.mock import MagicMock
import pytest

from core.accounts import (
    AccountSwitcher,
    parse_profiles,
    find_chrome,
    CAUTION_NOTICE,
    CONFIRM_PHRASE,
    MAX_SWITCHES,
    COOLDOWN_SECONDS,
)


class FakeClock:
    """Controllable clock for rate limit and cooldown testing."""

    def __init__(self, start: float = 1000.0) -> None:
        self.current = start

    def __call__(self) -> float:
        return self.current

    def advance(self, seconds: float) -> None:
        self.current += seconds


class FakePopen:
    """Mock process runner recording argv calls without launching processes."""

    def __init__(self) -> None:
        self.calls: list[tuple[list[str], dict[str, Any]]] = []

    def __call__(self, cmd: list[str], **kwargs: Any) -> Any:
        self.calls.append((cmd, kwargs))
        return MagicMock()


@pytest.fixture
def fake_chrome(tmp_path: Any) -> str:
    """Create a temporary dummy chrome executable."""
    chrome_file = tmp_path / "chrome.exe"
    chrome_file.write_text("")
    return str(chrome_file)


def test_parse_profiles(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test parse_profiles parses comma-separated profiles and handles edge cases."""
    assert parse_profiles("Profile 1, Profile 2, Profile 3") == [
        "Profile 1",
        "Profile 2",
        "Profile 3",
    ]
    assert parse_profiles("  Work , , Personal  ,  ") == ["Work", "Personal"]
    assert parse_profiles("") == []
    assert parse_profiles("   ") == []

    # Unset env fallback returns empty list
    monkeypatch.delenv("HUSH_CHROME_PROFILES", raising=False)
    assert parse_profiles(None) == []

    # Environment variable fallback
    monkeypatch.setenv("HUSH_CHROME_PROFILES", "Default, Profile 1")
    assert parse_profiles() == ["Default", "Profile 1"]


def test_confirm_phrase_and_accepted_flag(capsys: pytest.CaptureFixture[str]) -> None:
    """Test confirm() requires exact CONFIRM_PHRASE or accepted_flag."""
    audit = MagicMock()
    switcher = AccountSwitcher(profiles=["P1", "P2"], audit=audit)

    # 1. Reject invalid input
    assert not switcher.confirm(input_fn=lambda: "i understand")
    assert not switcher.confirmed
    audit.log.assert_not_called()

    # 2. Reject arbitrary input
    assert not switcher.confirm(input_fn=lambda: "yes")
    assert not switcher.confirmed

    # 3. Accept exact phrase
    assert switcher.confirm(input_fn=lambda: f"  {CONFIRM_PHRASE}  ")
    assert switcher.confirmed
    audit.log.assert_called_once_with("switch_terms_accepted", accepted_by="input")

    captured = capsys.readouterr()
    assert CAUTION_NOTICE in captured.out

    # 4. Accept via accepted_flag
    audit.reset_mock()
    switcher2 = AccountSwitcher(profiles=["P1", "P2"], audit=audit)
    assert switcher2.confirm(accepted_flag=True)
    assert switcher2.confirmed
    audit.log.assert_called_once_with("switch_terms_accepted", accepted_by="flag")


def test_switch_requires_confirmation(fake_chrome: str) -> None:
    """Test switch() and can_switch() block actions until terms confirmed."""
    switcher = AccountSwitcher(profiles=["P1", "P2"], chrome_path=fake_chrome)
    can_ok, reason = switcher.can_switch()
    assert not can_ok
    assert reason == "Terms not confirmed. Must type 'I UNDERSTAND' to proceed."

    msg = switcher.switch("claude")
    assert msg == "Cannot switch profile: Terms not confirmed. Must type 'I UNDERSTAND' to proceed."


def test_switch_fails_when_fewer_than_two_profiles(fake_chrome: str) -> None:
    """Test switch() fails when fewer than 2 profiles are provided."""
    switcher = AccountSwitcher(profiles=["OnlyOne"], chrome_path=fake_chrome)
    switcher.confirmed = True

    can_ok, reason = switcher.can_switch()
    assert not can_ok
    assert reason == "Account switching requires at least 2 Chrome profiles."

    msg = switcher.switch("claude")
    assert msg == "Cannot switch profile: Account switching requires at least 2 Chrome profiles."


def test_switch_enforces_max_switches(fake_chrome: str) -> None:
    """Test switch() enforces MAX_SWITCHES = 2 and blocks subsequent switches."""
    clock = FakeClock()
    popen = FakePopen()
    switcher = AccountSwitcher(
        profiles=["P1", "P2"],
        chrome_path=fake_chrome,
        popen=popen,
        clock=clock,
    )
    switcher.confirmed = True

    # First switch succeeds
    res1 = switcher.switch("claude")
    assert "Switched claude to profile 'P2'" in res1
    assert switcher.switch_count == 1

    # Advance clock past cooldown
    clock.advance(COOLDOWN_SECONDS + 1.0)

    # Second switch succeeds
    res2 = switcher.switch("claude")
    assert "Switched claude to profile 'P1'" in res2
    assert switcher.switch_count == MAX_SWITCHES

    # Advance clock past cooldown again
    clock.advance(COOLDOWN_SECONDS + 1.0)

    # Third switch must fail
    can_ok, reason = switcher.can_switch()
    assert not can_ok
    assert reason == f"Maximum profile switches reached ({MAX_SWITCHES}). Notify the human."

    res3 = switcher.switch("claude")
    assert res3 == f"Cannot switch profile: Maximum profile switches reached ({MAX_SWITCHES}). Notify the human."
    assert len(popen.calls) == 2


def test_switch_enforces_cooldown(fake_chrome: str) -> None:
    """Test switch() enforces COOLDOWN_SECONDS between switches."""
    clock = FakeClock(1000.0)
    popen = FakePopen()
    switcher = AccountSwitcher(
        profiles=["P1", "P2"],
        chrome_path=fake_chrome,
        popen=popen,
        clock=clock,
    )
    switcher.confirmed = True

    # First switch at t=1000
    res1 = switcher.switch("gemini")
    assert "Switched gemini to profile 'P2'" in res1

    # Attempt second switch at t=1010 (elapsed 10s, remaining 110s)
    clock.advance(10.0)
    can_ok, reason = switcher.can_switch()
    assert not can_ok
    assert reason == "Cooldown active: wait 110 seconds before switching again."

    res2 = switcher.switch("gemini")
    assert res2 == "Cannot switch profile: Cooldown active: wait 110 seconds before switching again."
    assert len(popen.calls) == 1

    # Advance clock to exactly meet cooldown (120s from first switch)
    clock.advance(110.0)
    can_ok, reason = switcher.can_switch()
    assert can_ok
    assert reason == "Ready"

    res3 = switcher.switch("gemini")
    assert "Switched gemini to profile 'P1'" in res3
    assert len(popen.calls) == 2


def test_antigravity_explicitly_rejected() -> None:
    """Test antigravity app names explicitly reject switching."""
    popen = FakePopen()
    switcher = AccountSwitcher(profiles=["P1", "P2"], popen=popen)
    switcher.confirmed = True

    msg1 = switcher.switch("antigravity")
    assert msg1 == "Account switching is not supported for Antigravity; notify the human."

    msg2 = switcher.switch("Antigravity-IDE")
    assert msg2 == "Account switching is not supported for Antigravity; notify the human."

    assert len(popen.calls) == 0


def test_unsupported_app_rejected() -> None:
    """Test unsupported app names return helpful error message."""
    switcher = AccountSwitcher(profiles=["P1", "P2"])
    switcher.confirmed = True
    msg = switcher.switch("chatgpt")
    assert msg == "Account switching unsupported for 'chatgpt'. Supported: claude, gemini."


def test_successful_switch_launches_chrome_argv(fake_chrome: str) -> None:
    """Test successful switch launches Chrome argv with --profile-directory without shell."""
    clock = FakeClock(2000.0)
    popen = FakePopen()
    audit = MagicMock()
    switcher = AccountSwitcher(
        profiles=["Profile 1", "Profile 2"],
        chrome_path=fake_chrome,
        popen=popen,
        clock=clock,
        audit=audit,
    )
    switcher.confirmed = True

    # Switch 1 -> Profile 2 for claude
    res = switcher.switch("Claude")
    expected_msg = (
        "Switched Claude to profile 'Profile 2'. "
        "Take a screenshot to verify. If a login page or error shows, call notify_human."
    )
    assert res == expected_msg
    assert switcher.current_idx == 1
    assert switcher.switch_count == 1
    assert switcher.last_switch_time == 2000.0

    assert len(popen.calls) == 1
    cmd, kwargs = popen.calls[0]
    assert cmd == [fake_chrome, "--profile-directory=Profile 2", "https://claude.ai/new"]
    assert "shell" not in kwargs or kwargs["shell"] is False

    audit.log.assert_called_once_with(
        "account_switched",
        app="claude",
        profile="Profile 2",
        switch_number=1,
    )


def test_find_chrome(tmp_path: Any, monkeypatch: pytest.MonkeyPatch) -> None:
    """Test find_chrome priority order: parameter, env var, standard paths."""
    custom = tmp_path / "custom_chrome.exe"
    custom.write_text("")

    env_custom = tmp_path / "env_chrome.exe"
    env_custom.write_text("")

    # Direct path provided and exists
    assert find_chrome(str(custom)) == str(custom)

    # Fallback to CHROME_PATH when direct path is nonexistent
    monkeypatch.setenv("CHROME_PATH", str(env_custom))
    assert find_chrome(str(tmp_path / "nonexistent.exe")) == str(env_custom)
    assert find_chrome(None) == str(env_custom)

    # When neither exists and standard paths don't exist
    monkeypatch.delenv("CHROME_PATH", raising=False)
    monkeypatch.setattr("os.path.exists", lambda path: False)
    assert find_chrome(None) is None


def test_switch_fails_when_chrome_not_found(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test switch returns error message when Chrome executable is not found."""
    monkeypatch.setattr("core.accounts.find_chrome", lambda path: None)
    switcher = AccountSwitcher(profiles=["P1", "P2"])
    switcher.confirmed = True

    res = switcher.switch("claude")
    assert res == "Chrome executable not found. Configure CHROME_PATH."
