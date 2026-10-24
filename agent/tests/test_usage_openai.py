"""Unit tests for OpenAI model client usage tracking."""
from __future__ import annotations

from typing import Any
from unittest.mock import MagicMock

import pytest
from google.genai import types

from core.openai_client import OpenAIModelClient, extract_usage


def make_mock_openai_response(
    content: str = "ok",
    usage: Any = None,
    *,
    include_usage: bool = True,
) -> Any:
    """Create a mock OpenAI ChatCompletion response for testing."""
    choice = MagicMock()
    choice.message.content = content
    choice.message.tool_calls = None
    resp = MagicMock()
    resp.choices = [choice]
    if include_usage:
        resp.usage = usage
    else:
        del resp.usage
    return resp


def test_init_last_usage_is_none() -> None:
    """Verify client.last_usage is initialized to None."""
    client = OpenAIModelClient(
        "gpt-4o",
        tools=None,
        client=MagicMock(),
        sleep=MagicMock(),
    )
    assert client.last_usage is None


def test_full_usage_present_object() -> None:
    """Verify client.last_usage == {'prompt_tokens': 12, 'completion_tokens': 34} with mock object."""
    usage_obj = MagicMock()
    usage_obj.prompt_tokens = 12
    usage_obj.completion_tokens = 34
    resp = make_mock_openai_response("hello world", usage_obj)

    fake_client = MagicMock()
    fake_client.chat.completions.create.return_value = resp
    sleep_mock = MagicMock()

    client = OpenAIModelClient(
        "gpt-4o",
        tools=None,
        client=fake_client,
        sleep=sleep_mock,
    )

    contents = [types.Content(role="user", parts=[types.Part.from_text(text="hi")])]
    content = client.generate(contents)
    assert content.parts[0].text == "hello world"
    assert client.last_usage == {"prompt_tokens": 12, "completion_tokens": 34}
    sleep_mock.assert_not_called()


def test_full_usage_present_dict() -> None:
    """Verify client.last_usage == {'prompt_tokens': 12, 'completion_tokens': 34} with dict."""
    resp = make_mock_openai_response("reply", {"prompt_tokens": 12, "completion_tokens": 34})

    fake_client = MagicMock()
    fake_client.chat.completions.create.return_value = resp
    sleep_mock = MagicMock()

    client = OpenAIModelClient(
        "gpt-4o",
        tools=None,
        client=fake_client,
        sleep=sleep_mock,
    )

    contents = [types.Content(role="user", parts=[types.Part.from_text(text="hi")])]
    client.generate(contents)
    assert client.last_usage == {"prompt_tokens": 12, "completion_tokens": 34}
    sleep_mock.assert_not_called()


def test_usage_none() -> None:
    """Verify client.last_usage is None when usage is None."""
    resp = make_mock_openai_response("reply", usage=None)

    fake_client = MagicMock()
    fake_client.chat.completions.create.return_value = resp
    sleep_mock = MagicMock()

    client = OpenAIModelClient(
        "gpt-4o",
        tools=None,
        client=fake_client,
        sleep=sleep_mock,
    )

    contents = [types.Content(role="user", parts=[types.Part.from_text(text="hi")])]
    client.generate(contents)
    assert client.last_usage is None
    sleep_mock.assert_not_called()


def test_usage_absent() -> None:
    """Verify client.last_usage is None when usage is absent."""
    resp = make_mock_openai_response("reply", include_usage=False)

    fake_client = MagicMock()
    fake_client.chat.completions.create.return_value = resp
    sleep_mock = MagicMock()

    client = OpenAIModelClient(
        "gpt-4o",
        tools=None,
        client=fake_client,
        sleep=sleep_mock,
    )

    contents = [types.Content(role="user", parts=[types.Part.from_text(text="hi")])]
    client.generate(contents)
    assert client.last_usage is None
    sleep_mock.assert_not_called()


def test_usage_partial_prompt_only_dict() -> None:
    """Verify client.last_usage == {'prompt_tokens': 50} when only prompt_tokens in dict."""
    resp = make_mock_openai_response("reply", {"prompt_tokens": 50})

    fake_client = MagicMock()
    fake_client.chat.completions.create.return_value = resp
    sleep_mock = MagicMock()

    client = OpenAIModelClient(
        "gpt-4o",
        tools=None,
        client=fake_client,
        sleep=sleep_mock,
    )

    contents = [types.Content(role="user", parts=[types.Part.from_text(text="hi")])]
    client.generate(contents)
    assert client.last_usage == {"prompt_tokens": 50}
    sleep_mock.assert_not_called()


def test_usage_partial_prompt_only_object() -> None:
    """Verify client.last_usage == {'prompt_tokens': 50} when only prompt_tokens in object."""
    usage_obj = MagicMock(spec=["prompt_tokens"])
    usage_obj.prompt_tokens = 50
    resp = make_mock_openai_response("reply", usage_obj)

    fake_client = MagicMock()
    fake_client.chat.completions.create.return_value = resp
    sleep_mock = MagicMock()

    client = OpenAIModelClient(
        "gpt-4o",
        tools=None,
        client=fake_client,
        sleep=sleep_mock,
    )

    contents = [types.Content(role="user", parts=[types.Part.from_text(text="hi")])]
    client.generate(contents)
    assert client.last_usage == {"prompt_tokens": 50}
    sleep_mock.assert_not_called()


def test_usage_partial_completion_only_dict() -> None:
    """Verify client.last_usage == {'completion_tokens': 34} when only completion_tokens in dict."""
    resp = make_mock_openai_response("reply", {"completion_tokens": 34})

    fake_client = MagicMock()
    fake_client.chat.completions.create.return_value = resp
    sleep_mock = MagicMock()

    client = OpenAIModelClient(
        "gpt-4o",
        tools=None,
        client=fake_client,
        sleep=sleep_mock,
    )

    contents = [types.Content(role="user", parts=[types.Part.from_text(text="hi")])]
    client.generate(contents)
    assert client.last_usage == {"completion_tokens": 34}
    sleep_mock.assert_not_called()


def test_usage_resets_on_subsequent_call_without_usage() -> None:
    """Verify client.last_usage is overwritten or reset on subsequent calls."""
    resp1 = make_mock_openai_response("first", {"prompt_tokens": 12, "completion_tokens": 34})
    resp2 = make_mock_openai_response("second", usage=None)

    fake_client = MagicMock()
    fake_client.chat.completions.create.side_effect = [resp1, resp2]
    sleep_mock = MagicMock()

    client = OpenAIModelClient(
        "gpt-4o",
        tools=None,
        client=fake_client,
        sleep=sleep_mock,
    )

    contents = [types.Content(role="user", parts=[types.Part.from_text(text="hi")])]
    client.generate(contents)
    assert client.last_usage == {"prompt_tokens": 12, "completion_tokens": 34}

    client.generate(contents)
    assert client.last_usage is None
    sleep_mock.assert_not_called()


def test_malformed_usage_never_crashes() -> None:
    """Verify client does not crash when usage is malformed or invalid."""
    malformed_payloads = [
        "not a dict or obj",
        12345,
        [],
        {"prompt_tokens": "invalid"},
        {"prompt_tokens": True},
        {"prompt_tokens": [1, 2]},
    ]
    for malformed in malformed_payloads:
        resp = make_mock_openai_response("reply", malformed)
        fake_client = MagicMock()
        fake_client.chat.completions.create.return_value = resp
        sleep_mock = MagicMock()

        client = OpenAIModelClient(
            "gpt-4o",
            tools=None,
            client=fake_client,
            sleep=sleep_mock,
        )

        contents = [types.Content(role="user", parts=[types.Part.from_text(text="hi")])]
        content = client.generate(contents)
        assert content.parts[0].text == "reply"
        assert client.last_usage is None
        sleep_mock.assert_not_called()


def test_zero_token_counts_handled_properly() -> None:
    """Verify client.last_usage handles zero token counts correctly."""
    resp = make_mock_openai_response("reply", {"prompt_tokens": 0, "completion_tokens": 0})

    fake_client = MagicMock()
    fake_client.chat.completions.create.return_value = resp
    sleep_mock = MagicMock()

    client = OpenAIModelClient(
        "gpt-4o",
        tools=None,
        client=fake_client,
        sleep=sleep_mock,
    )

    contents = [types.Content(role="user", parts=[types.Part.from_text(text="hi")])]
    client.generate(contents)
    assert client.last_usage == {"prompt_tokens": 0, "completion_tokens": 0}
    sleep_mock.assert_not_called()


def test_usage_with_retries_no_real_sleep() -> None:
    """Verify usage is recorded after retries and no real sleep is performed."""
    resp = make_mock_openai_response("retry success", {"prompt_tokens": 12, "completion_tokens": 34})

    fake_client = MagicMock()
    fake_client.chat.completions.create.side_effect = [
        Exception("Error code: 429 - Rate limit reached"),
        resp,
    ]
    sleep_calls: list[float] = []

    client = OpenAIModelClient(
        "gpt-4o",
        tools=None,
        client=fake_client,
        sleep=lambda d: sleep_calls.append(d),
        rand=lambda: 0.5,
    )

    contents = [types.Content(role="user", parts=[types.Part.from_text(text="hi")])]
    content = client.generate(contents)
    assert content.parts[0].text == "retry success"
    assert client.last_usage == {"prompt_tokens": 12, "completion_tokens": 34}
    assert len(sleep_calls) == 1


def test_extract_usage_helper_direct() -> None:
    """Verify extract_usage directly with various inputs."""
    assert extract_usage(None) is None
    assert extract_usage({}) is None
    assert extract_usage({"usage": None}) is None

    class CustomResp:
        usage = {"prompt_tokens": 5, "completion_tokens": 8}

    assert extract_usage(CustomResp()) == {"prompt_tokens": 5, "completion_tokens": 8}
