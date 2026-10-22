"""Unit tests for the KillSwitch and fail-safe detection."""
import threading
from typing import Any
import pytest

from core.killswitch import (
    HOTKEY_DESCRIPTION,
    VK_CONTROL,
    VK_K,
    VK_MENU,
    KillSwitch,
    is_failsafe,
)


def test_hotkey_description_and_vk_constants() -> None:
    """Verify description text and virtual key constants."""
    assert "Ctrl+Alt+K" in HOTKEY_DESCRIPTION
    assert VK_CONTROL == 0x11
    assert VK_MENU == 0x12
    assert VK_K == 0x4B


def test_is_failsafe_identifies_failsafe_exception() -> None:
    """Verify is_failsafe detects FailSafeException without pyautogui."""

    class FailSafeException(Exception):
        pass

    exc = FailSafeException("PyAutoGUI fail-safe triggered from corner")
    assert is_failsafe(exc) is True


def test_is_failsafe_returns_false_for_other_exceptions() -> None:
    """Verify is_failsafe returns False for non-failsafe exceptions."""
    assert is_failsafe(ValueError("bad value")) is False
    assert is_failsafe(RuntimeError("runtime issue")) is False
    assert is_failsafe(KeyboardInterrupt()) is False
    assert is_failsafe(Exception("generic")) is False


def test_trigger_immediately_sets_is_set() -> None:
    """Verify manual trigger() sets is_set() immediately."""
    ks = KillSwitch(sleep=lambda _: None)
    assert ks.is_set() is False
    ks.trigger()
    assert ks.is_set() is True


def test_polling_thread_detects_hotkey() -> None:
    """Verify simulated Ctrl+Alt+K trips the kill switch via background thread."""
    pressed = {VK_CONTROL: 0x8000, VK_MENU: 0x8000, VK_K: 0x8000}

    def mock_get_key_state(vk: int) -> int:
        return pressed.get(vk, 0)

    ks = KillSwitch(get_key_state=mock_get_key_state, sleep=lambda _: None)
    assert ks.start() is True
    # The thread trips and breaks immediately
    ks.stop()
    assert ks.is_set() is True


def test_partial_hotkeys_do_not_trip() -> None:
    """Verify incomplete hotkey combinations do not trip the kill switch."""
    incomplete_combos = [
        {VK_CONTROL: 0x8000, VK_MENU: 0x8000},  # Ctrl + Alt (no K)
        {VK_MENU: 0x8000, VK_K: 0x8000},        # Alt + K (no Ctrl)
        {VK_CONTROL: 0x8000, VK_K: 0x8000},     # Ctrl + K (no Alt)
        {VK_CONTROL: 0x8000},                    # Only Ctrl
        {},                                      # None
    ]

    for combo in incomplete_combos:
        iteration_event = threading.Event()

        def mock_sleep(_: float) -> None:
            iteration_event.set()

        ks = KillSwitch(get_key_state=lambda vk, c=combo: c.get(vk, 0), sleep=mock_sleep)
        assert ks.start() is True
        iteration_event.wait(timeout=0.2)
        ks.stop()
        assert ks.is_set() is False


def test_start_fails_on_non_windows(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify start() returns False when sys.platform is not win32."""
    monkeypatch.setattr("sys.platform", "linux")
    ks = KillSwitch()
    assert ks.start() is False
    assert ks.is_set() is False


def test_start_fails_on_win32_import_error(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify start() returns False when ctypes or user32 lookup fails."""
    monkeypatch.setattr("sys.platform", "win32")
    import builtins

    real_import = builtins.__import__

    def mock_import(name: str, *args: Any, **kwargs: Any) -> Any:
        if name == "ctypes":
            raise ImportError("ctypes unavailable")
        return real_import(name, *args, **kwargs)

    monkeypatch.setattr(builtins, "__import__", mock_import)
    ks = KillSwitch()
    assert ks.start() is False
    assert ks.is_set() is False


def test_stop_cleanly_shuts_down_polling_thread() -> None:
    """Verify stop() stops the polling thread cleanly without sleeping real time."""
    wake_event = threading.Event()

    def mock_sleep(_: float) -> None:
        wake_event.wait(timeout=0.05)

    ks = KillSwitch(get_key_state=lambda vk: 0, sleep=mock_sleep)
    assert ks.start() is True
    assert ks._thread is not None
    assert ks._thread.is_alive()

    wake_event.set()
    ks.stop()
    assert not ks._thread.is_alive()
    assert ks.is_set() is False


def test_stop_when_never_started() -> None:
    """Verify calling stop() without start() is safe and idempotent."""
    ks = KillSwitch()
    ks.stop()
    assert ks.is_set() is False
