"""Tests for service usage limit reset waiting."""
from __future__ import annotations

from typing import Any
import pytest

from core.killswitch import KillSwitch
from core.limits import (
    DEFAULT_CHUNK_SECONDS,
    DEFAULT_MAX_MINUTES,
    wait_for_reset,
)


class DummyKillSwitch:
    """Mock kill switch object tracking checks and state."""

    def __init__(self, triggered: bool = False) -> None:
        self._is_set: bool = triggered
        self.check_count: int = 0

    def is_set(self) -> bool:
        """Return triggered status and increment check counter."""
        self.check_count += 1
        return self._is_set

    def trigger(self) -> None:
        """Trigger the kill switch."""
        self._is_set = True


def test_full_wait_completes_resumed() -> None:
    """Full wait completes normally and returns 'resumed' with fake sleep."""
    notifications: list[str] = []
    sleep_calls: list[float] = []
    kill = DummyKillSwitch()

    result = wait_for_reset(
        minutes=2,
        notify=notifications.append,
        kill=kill,
        sleep=sleep_calls.append,
        chunk_seconds=30,
    )

    assert result == "resumed"
    assert sum(sleep_calls) == 120
    assert sleep_calls == [30, 30, 30, 30]
    assert notifications == [
        "Waiting 2 minutes for service usage limit reset...",
        "Wait complete (2 minutes elapsed). Resuming task.",
    ]


def test_kill_switch_tripped_during_wait_chunks_returns_killed_early() -> None:
    """Kill switch tripped during chunks returns 'killed' without remaining time."""
    notifications: list[str] = []
    sleep_calls: list[float] = []
    kill = DummyKillSwitch()

    def fake_sleep(duration: float) -> None:
        sleep_calls.append(duration)
        if len(sleep_calls) == 2:
            kill.trigger()

    # 5 minutes = 300 seconds (10 chunks of 30s)
    result = wait_for_reset(
        minutes=5,
        notify=notifications.append,
        kill=kill,
        sleep=fake_sleep,
        chunk_seconds=30,
    )

    assert result == "killed"
    assert len(sleep_calls) == 2
    assert sum(sleep_calls) == 60  # Only waited 60s of 300s
    assert notifications == [
        "Waiting 5 minutes for service usage limit reset...",
        "Usage limit wait aborted by kill switch.",
    ]


def test_capping_at_max_minutes_returns_capped() -> None:
    """Capping at max_minutes returns 'capped' when requested minutes exceeds cap."""
    notifications: list[str] = []
    sleep_calls: list[float] = []
    kill = DummyKillSwitch()

    # Requested 10 minutes with cap of 3 minutes
    result = wait_for_reset(
        minutes=10,
        notify=notifications.append,
        kill=kill,
        sleep=sleep_calls.append,
        max_minutes=3,
        chunk_seconds=60,
    )

    assert result == "capped"
    assert sum(sleep_calls) == 3 * 60  # Capped at 3 minutes
    assert notifications == [
        "Waiting 3 minutes for service usage limit reset...",
        "Wait reached maximum time limit cap (3 minutes).",
    ]


def test_notify_invoked_exactly_once_at_start_and_once_at_exit() -> None:
    """Notify is invoked exactly twice: once at start and once at completion/abort."""
    # Case 1: resumed
    notes_resumed: list[str] = []
    kill_normal = DummyKillSwitch()
    wait_for_reset(
        minutes=1,
        notify=notes_resumed.append,
        kill=kill_normal,
        sleep=lambda _: None,
        chunk_seconds=60,
    )
    assert len(notes_resumed) == 2

    # Case 2: killed
    notes_killed: list[str] = []
    kill_tripped = DummyKillSwitch(triggered=True)
    wait_for_reset(
        minutes=1,
        notify=notes_killed.append,
        kill=kill_tripped,
        sleep=lambda _: None,
        chunk_seconds=60,
    )
    assert len(notes_killed) == 2

    # Case 3: capped
    notes_capped: list[str] = []
    wait_for_reset(
        minutes=10,
        notify=notes_capped.append,
        kill=kill_normal,
        sleep=lambda _: None,
        max_minutes=2,
        chunk_seconds=60,
    )
    assert len(notes_capped) == 2


@pytest.mark.parametrize("requested_minutes", [0, -1, -50])
def test_negative_or_zero_minutes_clamped_to_one(requested_minutes: int) -> None:
    """Negative or 0 minutes is clamped to at least 1 minute."""
    notifications: list[str] = []
    sleep_calls: list[float] = []
    kill = DummyKillSwitch()

    result = wait_for_reset(
        minutes=requested_minutes,
        notify=notifications.append,
        kill=kill,
        sleep=sleep_calls.append,
        chunk_seconds=60,
    )

    assert result == "resumed"
    assert sum(sleep_calls) == 60
    assert notifications == [
        "Waiting 1 minutes for service usage limit reset...",
        "Wait complete (1 minutes elapsed). Resuming task.",
    ]


def test_chunking_behavior_increments_and_checks_kill() -> None:
    """Sleeps in increments of chunk_seconds, checking kill state each chunk."""
    notifications: list[str] = []
    sleep_calls: list[float] = []
    kill = DummyKillSwitch()

    result = wait_for_reset(
        minutes=1,  # 60s
        notify=notifications.append,
        kill=kill,
        sleep=sleep_calls.append,
        chunk_seconds=25,
    )

    assert result == "resumed"
    assert sleep_calls == [25, 25, 10]
    # is_set checked before each chunk (3 chunks) and on loop completion
    assert kill.check_count >= 3


def test_killswitch_integration() -> None:
    """Integration with actual KillSwitch instance."""
    notifications: list[str] = []
    sleep_calls: list[float] = []
    real_kill = KillSwitch()
    real_kill.trigger()

    result = wait_for_reset(
        minutes=5,
        notify=notifications.append,
        kill=real_kill,
        sleep=sleep_calls.append,
        chunk_seconds=30,
    )

    assert result == "killed"
    assert len(sleep_calls) == 0
    assert notifications[1] == "Usage limit wait aborted by kill switch."
