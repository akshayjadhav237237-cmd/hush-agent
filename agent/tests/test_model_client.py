"""Unit tests for ModelClient with exponential backoff and error handling."""
from __future__ import annotations

from typing import Any
from unittest.mock import MagicMock

import pytest

from core.model_client import ModelClient, ModelUnavailable


def make_mock_response(text: str = "ok", finish_reason: str = "STOP") -> Any:
    """Create a mock GenAI response object for testing."""
    part = MagicMock()
    part.text = text
    content = MagicMock()
    content.parts = [part]
    candidate = MagicMock()
    candidate.finish_reason = finish_reason
    candidate.content = content
    resp = MagicMock()
    resp.candidates = [candidate]
    return resp


def test_init_raises_without_api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify initialization raises ValueError if GEMINI_API_KEY is not set and client is None."""
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    with pytest.raises(ValueError, match="GEMINI_API_KEY environment variable is not set"):
        ModelClient(model_name="gemini-2.5-flash", tools=[])


def test_make_config_disables_automatic_function_calling() -> None:
    """Verify make_config disables automatic function calling and preserves tool list."""
    fake_client = MagicMock()
    tool_fn = lambda x: x
    mc = ModelClient(model_name="gemini-2.5-flash", tools=[tool_fn], client=fake_client)

    cfg = mc.make_config()
    assert cfg.automatic_function_calling.disable is True
    assert cfg.tools == [tool_fn]

    # Verify single tool is wrapped into list
    mc_single = ModelClient(model_name="gemini-2.5-flash", tools=tool_fn, client=fake_client)
    cfg_single = mc_single.make_config()
    assert cfg_single.automatic_function_calling.disable is True
    assert cfg_single.tools == [tool_fn]


def test_successful_call_returns_content_without_retries() -> None:
    """Verify successful call returns candidate content without retries."""
    resp = make_mock_response("Hello from Gemini")
    fake_client = MagicMock()
    fake_client.models.generate_content.return_value = resp

    sleep_mock = MagicMock()
    audit_mock = MagicMock()
    mc = ModelClient(
        model_name="gemini-2.5-flash",
        tools=[],
        client=fake_client,
        sleep=sleep_mock,
        audit=audit_mock,
    )

    contents = ["prompt"]
    result = mc.generate(contents)
    assert result == resp.candidates[0].content
    fake_client.models.generate_content.assert_called_once()
    sleep_mock.assert_not_called()
    audit_mock.log.assert_not_called()


def test_transient_errors_trigger_backoff_and_audit_log() -> None:
    """Verify transient 429/503 errors trigger backoff retries and log retry events to audit."""
    resp = make_mock_response("Recovered after error")
    fake_client = MagicMock()
    fake_client.models.generate_content.side_effect = [
        RuntimeError("429 Resource Exhausted: rate limit reached"),
        RuntimeError("503 Service Unavailable"),
        resp,
    ]

    sleep_mock = MagicMock()
    audit_mock = MagicMock()
    mc = ModelClient(
        model_name="gemini-2.5-flash",
        tools=[],
        client=fake_client,
        sleep=sleep_mock,
        rand=lambda: 0.5,
        audit=audit_mock,
    )

    result = mc.generate(["test"])
    assert result == resp.candidates[0].content
    assert fake_client.models.generate_content.call_count == 3
    assert sleep_mock.call_count == 2
    assert audit_mock.log.call_count == 2

    first_call = audit_mock.log.call_args_list[0]
    assert first_call[0] == ("retry",)
    assert first_call[1]["attempt"] == 1
    assert "429" in first_call[1]["error"]
    assert isinstance(first_call[1]["delay"], float)

    second_call = audit_mock.log.call_args_list[1]
    assert second_call[0] == ("retry",)
    assert second_call[1]["attempt"] == 2
    assert "503" in second_call[1]["error"]


def test_exhaustion_of_retries_raises_model_unavailable() -> None:
    """Verify exhaustion of all retries raises ModelUnavailable."""
    fake_client = MagicMock()
    fake_client.models.generate_content.side_effect = RuntimeError("503 Service Unavailable")

    sleep_mock = MagicMock()
    audit_mock = MagicMock()
    mc = ModelClient(
        model_name="gemini-2.5-flash",
        tools=[],
        client=fake_client,
        sleep=sleep_mock,
        rand=lambda: 0.0,
        audit=audit_mock,
    )

    with pytest.raises(ModelUnavailable) as exc_info:
        mc.generate(["test"])

    assert "Model generation failed after backoff retries" in str(exc_info.value)
    assert "503" in str(exc_info.value)
    assert fake_client.models.generate_content.call_count == 6
    assert sleep_mock.call_count == 5
    assert audit_mock.log.call_count == 5


def test_empty_or_blocked_content_raises_and_retries() -> None:
    """Verify empty or blocked content triggers retries and raises ModelUnavailable."""
    blocked_resp = make_mock_response("blocked content", finish_reason="SAFETY")
    fake_client = MagicMock()
    fake_client.models.generate_content.return_value = blocked_resp

    sleep_mock = MagicMock()
    audit_mock = MagicMock()
    mc = ModelClient(
        model_name="gemini-2.5-flash",
        tools=[],
        client=fake_client,
        sleep=sleep_mock,
        rand=lambda: 0.0,
        audit=audit_mock,
    )

    with pytest.raises(ModelUnavailable) as exc_info:
        mc.generate(["test"])

    assert "empty response" in str(exc_info.value)
    assert fake_client.models.generate_content.call_count == 6
    assert sleep_mock.call_count == 5
    assert audit_mock.log.call_count == 5


def test_empty_response_recovers_on_retry() -> None:
    """Verify empty response recovers if a subsequent attempt returns content."""
    empty_resp = MagicMock()
    empty_resp.candidates = []
    valid_resp = make_mock_response("recovered text")

    fake_client = MagicMock()
    fake_client.models.generate_content.side_effect = [empty_resp, valid_resp]

    sleep_mock = MagicMock()
    audit_mock = MagicMock()
    mc = ModelClient(
        model_name="gemini-2.5-flash",
        tools=[],
        client=fake_client,
        sleep=sleep_mock,
        rand=lambda: 0.0,
        audit=audit_mock,
    )

    result = mc.generate(["test"])
    assert result == valid_resp.candidates[0].content
    assert fake_client.models.generate_content.call_count == 2
    assert sleep_mock.call_count == 1
    assert audit_mock.log.call_count == 1
    assert "empty response" in audit_mock.log.call_args[1]["error"]


def test_lazy_import_no_module_level_genai() -> None:
    """Verify core.model_client does not import google.genai at module level."""
    import core.model_client as mc_mod

    assert "genai" not in mc_mod.__dict__
