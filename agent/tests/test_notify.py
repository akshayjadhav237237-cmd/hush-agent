"""Unit tests for the Notifier class and human intervention gating."""
from __future__ import annotations

from typing import Any
import pytest

from core.notify import Notifier


class DummyAudit:
    """Mock audit log recorder for test verification."""

    def __init__(self) -> None:
        self.events: list[tuple[str, dict[str, Any]]] = []

    def log(self, event: str, **fields: Any) -> dict[str, Any]:
        """Record event and fields."""
        self.events.append((event, fields))
        return {"event": event, "fields": fields}


def test_push_with_no_topic_returns_false() -> None:
    """Verify push returns False and makes no network call when topic is missing."""
    calls: list[dict[str, Any]] = []
    notifier = Notifier(topic=None, post=lambda *a, **kw: calls.append({"a": a, "kw": kw}))
    assert notifier.push("Notification content") is False
    assert len(calls) == 0

    notifier_empty = Notifier(topic="", post=lambda *a, **kw: calls.append({"a": a, "kw": kw}))
    assert notifier_empty.push("Notification content") is False
    assert len(calls) == 0


def test_push_calls_injected_post_with_redacted_bytes_and_timeout() -> None:
    """Verify push invokes post with UTF-8 bytes, correct endpoint, headers, and timeout."""
    calls: list[dict[str, Any]] = []

    def mock_post(url: str, data: bytes, headers: dict[str, str], timeout: int) -> None:
        calls.append({"url": url, "data": data, "headers": headers, "timeout": timeout})

    notifier = Notifier(topic="urgent-alerts", post=mock_post)
    success = notifier.push("Task completed successfully")

    assert success is True
    assert len(calls) == 1
    assert calls[0]["url"] == "https://ntfy.sh/urgent-alerts"
    assert calls[0]["data"] == b"Task completed successfully"
    assert calls[0]["headers"] == {"Title": "Agent needs you"}
    assert calls[0]["timeout"] == 10


def test_push_handles_network_exceptions_silently() -> None:
    """Verify push catches any exception during HTTP request and returns False."""
    def failing_post(*args: Any, **kwargs: Any) -> None:
        raise RuntimeError("Connection dropped")

    notifier = Notifier(topic="error-channel", post=failing_post)
    result = notifier.push("Critical alert")
    assert result is False


def test_ask_human_pushes_logs_gate_and_reads_input() -> None:
    """Verify ask_human triggers push, logs gate event to audit, and reads input."""
    pushed: list[bytes] = []

    def mock_post(url: str, data: bytes, headers: dict[str, str], timeout: int) -> None:
        pushed.append(data)

    audit = DummyAudit()
    input_queue = ["continue execution"]

    def mock_input() -> str:
        return input_queue.pop(0)

    notifier = Notifier(
        topic="approvals",
        post=mock_post,
        input_fn=mock_input,
        audit=audit,
    )

    answer = notifier.ask_human("Approve database reset?")

    assert answer == "Human replied: continue execution"
    assert len(pushed) == 1
    assert pushed[0] == b"Approve database reset?"
    assert len(audit.events) == 1
    event_name, fields = audit.events[0]
    assert event_name == "gate"
    assert fields["trigger"] == "human_notification"
    assert fields["reason"] == "Approve database reset?"


def test_auto_answer_returns_canned_response_without_reading_input() -> None:
    """Verify auto_answer bypasses input_fn entirely."""
    def uncalled_input() -> str:
        raise AssertionError("input_fn must not be called when auto_answer is set")

    notifier = Notifier(
        topic="bypass-test",
        post=lambda *a, **kw: None,
        input_fn=uncalled_input,
        auto_answer="proceed immediately",
    )

    response = notifier.ask_human("Requesting permission")
    assert response == "Human replied: proceed immediately"


def test_push_redacts_api_keys_and_secrets() -> None:
    """Verify sensitive tokens and keys are redacted in the pushed payload."""
    delivered: list[str] = []

    def mock_post(url: str, data: bytes, headers: dict[str, str], timeout: int) -> None:
        delivered.append(data.decode("utf-8"))

    notifier = Notifier(topic="audit-gate", post=mock_post)
    secret_msg = "Google key AIzaSyA12345678901234567890123456789012 and sk-abc123456789012345678901"

    notifier.push(secret_msg)

    assert len(delivered) == 1
    assert "AIza" not in delivered[0]
    assert "sk-" not in delivered[0]
    assert "[REDACTED]" in delivered[0]


def test_push_truncates_payload_to_200_chars() -> None:
    """Verify push caps output at 200 characters limit."""
    delivered: list[str] = []

    def mock_post(url: str, data: bytes, headers: dict[str, str], timeout: int) -> None:
        delivered.append(data.decode("utf-8"))

    notifier = Notifier(topic="long-channel", post=mock_post)
    notifier.push("X" * 350)

    assert len(delivered) == 1
    assert len(delivered[0]) == 200


def test_ask_human_without_audit_object() -> None:
    """Verify ask_human behaves correctly when audit is None."""
    notifier = Notifier(
        topic="no-audit",
        post=lambda *a, **kw: None,
        input_fn=lambda: "manual OK",
        audit=None,
    )
    reply = notifier.ask_human("Prompt message")
    assert reply == "Human replied: manual OK"


def test_lazy_import_requests_when_post_is_none(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify push imports requests lazily only when post is None."""
    import sys
    import core.notify as notify_module

    assert "requests" not in dir(notify_module)

    calls: list[str] = []

    class FakeRequests:
        @staticmethod
        def post(url: str, data: bytes, headers: dict[str, str], timeout: int) -> None:
            calls.append(url)

    monkeypatch.setitem(sys.modules, "requests", FakeRequests)
    notifier = Notifier(topic="lazy-test", post=None)
    assert notifier.push("hello") is True
    assert calls == ["https://ntfy.sh/lazy-test"]

