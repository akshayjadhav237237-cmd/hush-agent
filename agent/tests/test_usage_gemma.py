"""Unit tests for Gemma/GenAI model client usage tracking."""
from __future__ import annotations

from typing import Any
from unittest.mock import MagicMock

import pytest

from core.model_client import ModelClient, extract_usage


def make_mock_response(text: str = "ok", usage_meta: Any = None, *, include_usage_attr: bool = True) -> Any:
    """Create a mock GenAI response object for testing."""
    part = MagicMock()
    part.text = text
    content = MagicMock()
    content.parts = [part]
    candidate = MagicMock()
    candidate.finish_reason = "STOP"
    candidate.content = content
    resp = MagicMock()
    resp.candidates = [candidate]
    if include_usage_attr:
        resp.usage_metadata = usage_meta
    else:
        del resp.usage_metadata
    return resp


def test_init_last_usage_is_none() -> None:
    """Verify client.last_usage is initialized to None."""
    client = ModelClient(
        model_name="gemini-2.5-flash",
        tools=[],
        client=MagicMock(),
        sleep=MagicMock(),
    )
    assert client.last_usage is None


def test_full_usage_metadata_object() -> None:
    """Verify client.last_usage == {'prompt_tokens': 10, 'completion_tokens': 20} with mock object."""
    usage_meta = MagicMock()
    usage_meta.prompt_token_count = 10
    usage_meta.candidates_token_count = 20
    resp = make_mock_response("response text", usage_meta)

    fake_client = MagicMock()
    fake_client.models.generate_content.return_value = resp
    sleep_mock = MagicMock()

    client = ModelClient(
        model_name="gemini-2.5-flash",
        tools=[],
        client=fake_client,
        sleep=sleep_mock,
    )

    result = client.generate(["hello"])
    assert result == resp.candidates[0].content
    assert client.last_usage == {"prompt_tokens": 10, "completion_tokens": 20}
    sleep_mock.assert_not_called()


def test_full_usage_metadata_dict() -> None:
    """Verify client.last_usage == {'prompt_tokens': 10, 'completion_tokens': 20} with dict."""
    resp = make_mock_response("response text", {"prompt_token_count": 10, "candidates_token_count": 20})

    fake_client = MagicMock()
    fake_client.models.generate_content.return_value = resp
    sleep_mock = MagicMock()

    client = ModelClient(
        model_name="gemini-2.5-flash",
        tools=[],
        client=fake_client,
        sleep=sleep_mock,
    )

    client.generate(["hello"])
    assert client.last_usage == {"prompt_tokens": 10, "completion_tokens": 20}
    sleep_mock.assert_not_called()


def test_usage_metadata_none() -> None:
    """Verify client.last_usage is None when usage_metadata is None."""
    resp = make_mock_response("response text", usage_meta=None)

    fake_client = MagicMock()
    fake_client.models.generate_content.return_value = resp
    sleep_mock = MagicMock()

    client = ModelClient(
        model_name="gemini-2.5-flash",
        tools=[],
        client=fake_client,
        sleep=sleep_mock,
    )

    client.generate(["hello"])
    assert client.last_usage is None
    sleep_mock.assert_not_called()


def test_usage_metadata_absent() -> None:
    """Verify client.last_usage is None when usage_metadata is absent."""
    resp = make_mock_response("response text", include_usage_attr=False)

    fake_client = MagicMock()
    fake_client.models.generate_content.return_value = resp
    sleep_mock = MagicMock()

    client = ModelClient(
        model_name="gemini-2.5-flash",
        tools=[],
        client=fake_client,
        sleep=sleep_mock,
    )

    client.generate(["hello"])
    assert client.last_usage is None
    sleep_mock.assert_not_called()


def test_usage_metadata_resets_on_subsequent_call() -> None:
    """Verify client.last_usage is overwritten or reset on subsequent calls."""
    usage_meta = MagicMock()
    usage_meta.prompt_token_count = 10
    usage_meta.candidates_token_count = 20
    resp1 = make_mock_response("first", usage_meta)
    resp2 = make_mock_response("second", usage_meta=None)

    fake_client = MagicMock()
    fake_client.models.generate_content.side_effect = [resp1, resp2]
    sleep_mock = MagicMock()

    client = ModelClient(
        model_name="gemini-2.5-flash",
        tools=[],
        client=fake_client,
        sleep=sleep_mock,
    )

    client.generate(["call 1"])
    assert client.last_usage == {"prompt_tokens": 10, "completion_tokens": 20}

    client.generate(["call 2"])
    assert client.last_usage is None
    sleep_mock.assert_not_called()


def test_usage_metadata_partial_prompt_only() -> None:
    """Verify client.last_usage == {'prompt_tokens': 15} when only prompt_token_count is present."""
    usage_meta = MagicMock(spec=["prompt_token_count"])
    usage_meta.prompt_token_count = 15
    resp = make_mock_response("response text", usage_meta)

    fake_client = MagicMock()
    fake_client.models.generate_content.return_value = resp
    sleep_mock = MagicMock()

    client = ModelClient(
        model_name="gemini-2.5-flash",
        tools=[],
        client=fake_client,
        sleep=sleep_mock,
    )

    client.generate(["hello"])
    assert client.last_usage == {"prompt_tokens": 15}
    sleep_mock.assert_not_called()


def test_usage_metadata_partial_prompt_only_dict() -> None:
    """Verify client.last_usage == {'prompt_tokens': 15} when only prompt_token_count is in dict."""
    resp = make_mock_response("response text", {"prompt_token_count": 15})

    fake_client = MagicMock()
    fake_client.models.generate_content.return_value = resp
    sleep_mock = MagicMock()

    client = ModelClient(
        model_name="gemini-2.5-flash",
        tools=[],
        client=fake_client,
        sleep=sleep_mock,
    )

    client.generate(["hello"])
    assert client.last_usage == {"prompt_tokens": 15}
    sleep_mock.assert_not_called()


def test_usage_metadata_partial_completion_only() -> None:
    """Verify client.last_usage == {'completion_tokens': 25} when only candidates_token_count is present."""
    usage_meta = MagicMock(spec=["candidates_token_count"])
    usage_meta.candidates_token_count = 25
    resp = make_mock_response("response text", usage_meta)

    fake_client = MagicMock()
    fake_client.models.generate_content.return_value = resp
    sleep_mock = MagicMock()

    client = ModelClient(
        model_name="gemini-2.5-flash",
        tools=[],
        client=fake_client,
        sleep=sleep_mock,
    )

    client.generate(["hello"])
    assert client.last_usage == {"completion_tokens": 25}
    sleep_mock.assert_not_called()


def test_malformed_usage_metadata_does_not_crash() -> None:
    """Verify client does not crash when usage_metadata is malformed or invalid."""
    for malformed in ["not a dict", 12345, [], {"prompt_token_count": "invalid"}]:
        resp = make_mock_response("response text", malformed)
        fake_client = MagicMock()
        fake_client.models.generate_content.return_value = resp
        sleep_mock = MagicMock()

        client = ModelClient(
            model_name="gemini-2.5-flash",
            tools=[],
            client=fake_client,
            sleep=sleep_mock,
        )

        client.generate(["hello"])
        assert client.last_usage is None
        sleep_mock.assert_not_called()


def test_extract_usage_helper_direct() -> None:
    """Verify extract_usage directly with various inputs."""
    assert extract_usage(None) is None
    assert extract_usage({}) is None
    assert extract_usage({"usage_metadata": None}) is None

    class CustomResp:
        usage_metadata = {"prompt_token_count": 5, "candidates_token_count": 8}

    assert extract_usage(CustomResp()) == {"prompt_tokens": 5, "completion_tokens": 8}
