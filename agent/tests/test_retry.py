"""Unit tests for retry logic, backoff calculation, and content extraction."""
from enum import Enum
from typing import Any
import pytest

from core.retry import (
    RETRYABLE_PATTERNS,
    extract_content,
    is_retryable_error,
    with_backoff,
)


class MockFinishReason(Enum):
    """Mock finish reason enum matching GenAI types."""

    STOP = 1
    SAFETY = 2
    RECITATION = 3
    BLOCKLIST = 4


class DummyPart:
    """Mock GenAI part."""

    def __init__(self, text: str = "generated text") -> None:
        self.text = text


class DummyContent:
    """Mock GenAI content container."""

    def __init__(self, parts: list[Any] | None = None) -> None:
        self.parts = parts if parts is not None else [DummyPart()]


class DummyCandidate:
    """Mock GenAI candidate."""

    def __init__(
        self,
        content: Any | None = None,
        finish_reason: Any = "STOP",
    ) -> None:
        self.content = content
        self.finish_reason = finish_reason


class DummyResponse:
    """Mock GenAI top-level response."""

    def __init__(self, candidates: list[Any] | None = None) -> None:
        self.candidates = candidates


def test_first_attempt_success_no_sleep_or_retries() -> None:
    """Verify fn succeeding on first attempt returns immediately without sleep."""
    sleeps: list[float] = []
    retries_recorded: list[tuple[int, Exception, float]] = []

    def fn() -> str:
        return "first try success"

    result = with_backoff(
        fn,
        retries=3,
        sleep=sleeps.append,
        rand=lambda: 0.5,
        on_retry=lambda a, e, d: retries_recorded.append((a, e, d)),
    )

    assert result == "first try success"
    assert sleeps == []
    assert retries_recorded == []


def test_retryable_errors_retry_up_to_limit_and_succeed() -> None:
    """Verify retryable errors retry up to limit with backoff delays before success."""
    sleeps: list[float] = []
    on_retry_log: list[tuple[int, str, float]] = []
    call_count = 0

    errors_sequence = [
        Exception("Error 429: rate limit"),
        Exception("HTTP 503 backend failure"),
        Exception("Gateway timeout while waiting"),
        Exception("Model returned empty response"),
    ]

    def flaky_fn() -> str:
        nonlocal call_count
        if call_count < len(errors_sequence):
            err = errors_sequence[call_count]
            call_count += 1
            raise err
        call_count += 1
        return "eventual success"

    result = with_backoff(
        flaky_fn,
        retries=5,
        base=2.0,
        cap=30.0,
        sleep=sleeps.append,
        rand=lambda: 0.5,
        on_retry=lambda a, e, d: on_retry_log.append((a, str(e), d)),
    )

    assert result == "eventual success"
    assert call_count == 5
    assert len(sleeps) == 4
    assert len(on_retry_log) == 4
    # Attempt indices passed to on_retry are 1, 2, 3, 4
    assert [entry[0] for entry in on_retry_log] == [1, 2, 3, 4]


def test_non_retryable_error_raises_immediately() -> None:
    """Verify non-retryable error raises immediately on attempt 0."""
    sleeps: list[float] = []
    calls = 0

    def fail_fn() -> None:
        nonlocal calls
        calls += 1
        raise ValueError("invalid args")

    with pytest.raises(ValueError, match="invalid args"):
        with_backoff(fail_fn, retries=5, sleep=sleeps.append)

    assert calls == 1
    assert sleeps == []


def test_exhaustion_of_retries_reraises_original_exception() -> None:
    """Verify exhaustion of retries re-raises the original exception."""
    sleeps: list[float] = []
    on_retry_attempts: list[int] = []
    calls = 0
    orig_error = RuntimeError("RESOURCE_EXHAUSTED: project quota exceeded")

    def always_fail() -> None:
        nonlocal calls
        calls += 1
        raise orig_error

    with pytest.raises(RuntimeError) as exc_info:
        with_backoff(
            always_fail,
            retries=3,
            sleep=sleeps.append,
            rand=lambda: 0.5,
            on_retry=lambda a, e, d: on_retry_attempts.append(a),
        )

    assert exc_info.value is orig_error
    assert calls == 4  # 1 initial attempt + 3 retries
    assert len(sleeps) == 3
    assert on_retry_attempts == [1, 2, 3]


def test_backoff_delay_exponential_growth_jitter_and_cap() -> None:
    """Verify delay follows exponential growth + jitter formula and is capped at cap."""
    sleeps: list[float] = []

    def failing_fn() -> None:
        raise Exception("500 internal server error")

    # With rand=0.5, multiplier is (0.8 + 0.4 * 0.5) = 1.0
    # base=2.0, cap=10.0:
    # attempt 0 -> min(10, 2^1) * 1.0 = 2.0
    # attempt 1 -> min(10, 2^2) * 1.0 = 4.0
    # attempt 2 -> min(10, 2^3) * 1.0 = 8.0
    # attempt 3 -> min(10, 2^4) * 1.0 = 10.0 (capped)
    # attempt 4 -> min(10, 2^5) * 1.0 = 10.0 (capped)
    with pytest.raises(Exception):
        with_backoff(
            failing_fn,
            retries=5,
            base=2.0,
            cap=10.0,
            sleep=sleeps.append,
            rand=lambda: 0.5,
        )

    assert sleeps == [2.0, 4.0, 8.0, 10.0, 10.0]

    # Verify jitter bounds on attempt 0 (base^1 = 2.0, cap=10.0):
    # min jitter: rand=0.0 -> 2.0 * 0.8 = 1.6
    sleeps_min: list[float] = []
    with pytest.raises(Exception):
        with_backoff(
            failing_fn,
            retries=1,
            base=2.0,
            cap=10.0,
            sleep=sleeps_min.append,
            rand=lambda: 0.0,
        )
    assert sleeps_min[0] == pytest.approx(1.6)

    # max jitter: rand=1.0 -> 2.0 * 1.2 = 2.4
    sleeps_max: list[float] = []
    with pytest.raises(Exception):
        with_backoff(
            failing_fn,
            retries=1,
            base=2.0,
            cap=10.0,
            sleep=sleeps_max.append,
            rand=lambda: 1.0,
        )
    assert sleeps_max[0] == pytest.approx(2.4)


def test_is_retryable_error_all_patterns() -> None:
    """Verify is_retryable_error detects all specified patterns case-insensitively."""
    for pattern in RETRYABLE_PATTERNS:
        assert is_retryable_error(Exception(f"Prefix {pattern.lower()} suffix"))
        assert is_retryable_error(Exception(f"Prefix {pattern.upper()} suffix"))

    assert is_retryable_error(Exception("429 Too Many Requests")) is True
    assert is_retryable_error(Exception("RESOURCE_EXHAUSTED: quota")) is True
    assert is_retryable_error(Exception("Server error 500 occurred")) is True
    assert is_retryable_error(Exception("503 Service Unavailable")) is True
    assert is_retryable_error(Exception("UNAVAILABLE endpoint")) is True
    assert is_retryable_error(Exception("Connection timeout")) is True
    assert is_retryable_error(Exception("Got empty response")) is True

    # Non-retryables
    assert is_retryable_error(ValueError("invalid arguments")) is False
    assert is_retryable_error(KeyError("missing_key")) is False
    assert is_retryable_error(RuntimeError("fatal permission denied")) is False


def test_extract_content_normal_and_edge_cases() -> None:
    """Verify extract_content handles normal, empty, blocked, and missing parts."""
    # 1. Normal response
    valid_content = DummyContent([DummyPart("hello")])
    valid_resp = DummyResponse([DummyCandidate(content=valid_content, finish_reason="STOP")])
    assert extract_content(valid_resp) is valid_content

    # 2. None and missing candidates
    assert extract_content(None) is None
    assert extract_content("not a response") is None
    assert extract_content(DummyResponse(candidates=None)) is None
    assert extract_content(DummyResponse(candidates=[])) is None

    # 3. Blocked / safety finish reasons (string)
    for blocked_reason in ("SAFETY", "RECITATION", "BLOCKLIST"):
        cand = DummyCandidate(content=valid_content, finish_reason=blocked_reason)
        assert extract_content(DummyResponse([cand])) is None

    # 4. Blocked / safety finish reasons (Enum)
    for enum_reason in (
        MockFinishReason.SAFETY,
        MockFinishReason.RECITATION,
        MockFinishReason.BLOCKLIST,
    ):
        cand = DummyCandidate(content=valid_content, finish_reason=enum_reason)
        assert extract_content(DummyResponse([cand])) is None

    # 5. Missing content
    cand_no_content = DummyCandidate(content=None, finish_reason="STOP")
    assert extract_content(DummyResponse([cand_no_content])) is None

    # 6. Missing or empty parts
    cand_empty_parts = DummyCandidate(content=DummyContent(parts=[]), finish_reason="STOP")
    assert extract_content(DummyResponse([cand_empty_parts])) is None

    class ContentWithoutParts:
        pass

    cand_no_parts_attr = DummyCandidate(content=ContentWithoutParts(), finish_reason="STOP")
    assert extract_content(DummyResponse([cand_no_parts_attr])) is None
