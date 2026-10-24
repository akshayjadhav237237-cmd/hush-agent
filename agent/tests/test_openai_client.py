"""Unit tests for OpenAI client, tool conversion, history conversion, and retries."""
from __future__ import annotations

import base64
from typing import Any
from unittest.mock import MagicMock

import pytest
from google.genai import types

from core.model_client import ModelUnavailable
from core.openai_client import (
    OpenAIModelClient,
    convert_contents_to_openai_messages,
    convert_openai_response_to_genai_content,
    convert_tools_to_openai,
)
from core.tool_schema import build_tools
from core.vision import png_part


def test_tool_conversion() -> None:
    """Verify tool conversion converts GenAI declarations to OpenAI function tools."""
    genai_tools = build_tools(switch_enabled=True)
    openai_tools = convert_tools_to_openai(genai_tools)

    assert len(openai_tools) == 23
    for tool in openai_tools:
        assert tool["type"] == "function"
        fn = tool["function"]
        assert "name" in fn and isinstance(fn["name"], str)
        assert "description" in fn
        assert "parameters" in fn
        assert fn["parameters"].get("type") == "object"
        # Check that types inside properties are lowercase
        for prop in fn["parameters"].get("properties", {}).values():
            assert prop.get("type") in ("string", "boolean", "integer", "number", "object", "array")

    names = [t["function"]["name"] for t in openai_tools]
    assert "open_app" in names
    assert "screenshot" in names
    assert "switch_account" in names


def test_history_conversion_with_image_part() -> None:
    """Verify history conversion transforms PNG parts into image_url data URLs."""
    raw_png = b"\x89PNG\r\n\x1a\nfakeimagebytes"
    contents = [
        types.Content(role="user", parts=[types.Part.from_text(text="Build an app")]),
        types.Content(
            role="model",
            parts=[
                types.Part(
                    function_call=types.FunctionCall(name="screenshot", args={}, id="call_0")
                )
            ],
        ),
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text="Human note on screen"),
                png_part(raw_png),
            ],
        ),
    ]

    messages = convert_contents_to_openai_messages(contents)

    assert len(messages) == 4
    # Message 0: User initial text
    assert messages[0]["role"] == "user"
    assert messages[0]["content"] == "Build an app"

    # Message 1: Assistant tool call
    assert messages[1]["role"] == "assistant"
    assert len(messages[1]["tool_calls"]) == 1
    assert messages[1]["tool_calls"][0]["id"] == "call_0"
    assert messages[1]["tool_calls"][0]["function"]["name"] == "screenshot"

    # Message 2: Tool response satisfying screenshot call
    assert messages[2]["role"] == "tool"
    assert messages[2]["tool_call_id"] == "call_0"

    # Message 3: User message containing text and image_url
    assert messages[3]["role"] == "user"
    content_list = messages[3]["content"]
    assert isinstance(content_list, list)
    assert content_list[0]["type"] == "text"
    assert content_list[0]["text"] == "Human note on screen"
    assert content_list[1]["type"] == "image_url"
    b64_expected = base64.b64encode(raw_png).decode("ascii")
    assert content_list[1]["image_url"]["url"] == f"data:image/png;base64,{b64_expected}"


def test_reply_conversion_with_tool_calls() -> None:
    """Verify OpenAI completion reply converts to GenAI Content with deterministic IDs."""
    mock_resp = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "I will run a command."
    mock_tc = MagicMock()
    mock_tc.id = "original_random_id_123"
    mock_tc.function.name = "run_cmd"
    mock_tc.function.arguments = '{"command": "dir"}'
    mock_choice.message.tool_calls = [mock_tc]
    mock_resp.choices = [mock_choice]

    content = convert_openai_response_to_genai_content(mock_resp)

    assert content is not None
    assert content.role == "model"
    assert len(content.parts) == 2
    assert content.parts[0].text == "I will run a command."
    fc = content.parts[1].function_call
    assert fc.name == "run_cmd"
    assert fc.args == {"command": "dir"}
    assert fc.id == "call_0"


def test_id_pairing_deterministic() -> None:
    """Verify multiple tool calls receive sequential call_<n> IDs and pair with responses."""
    mock_resp = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = None
    mock_tc0 = MagicMock()
    mock_tc0.function.name = "click"
    mock_tc0.function.arguments = '{"x": 100, "y": 200}'
    mock_tc1 = MagicMock()
    mock_tc1.function.name = "press_keys"
    mock_tc1.function.arguments = '{"keys": "enter"}'
    mock_choice.message.tool_calls = [mock_tc0, mock_tc1]
    mock_resp.choices = [mock_choice]

    content = convert_openai_response_to_genai_content(mock_resp)
    assert content.parts[0].function_call.id == "call_0"
    assert content.parts[1].function_call.id == "call_1"

    # Now verify conversion of history pairing these calls with function responses
    contents = [
        content,
        types.Content(
            role="user",
            parts=[
                types.Part.from_function_response(name="click", response={"result": "clicked"}),
                types.Part.from_function_response(name="press_keys", response={"result": "pressed"}),
            ],
        ),
    ]

    messages = convert_contents_to_openai_messages(contents)
    assert len(messages) == 3
    assert messages[0]["role"] == "assistant"
    assert messages[1]["role"] == "tool"
    assert messages[1]["tool_call_id"] == "call_0"
    assert '"clicked"' in messages[1]["content"]
    assert messages[2]["role"] == "tool"
    assert messages[2]["tool_call_id"] == "call_1"
    assert '"pressed"' in messages[2]["content"]


def test_missing_key_error(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify instantiating OpenAIModelClient without OPENAI_API_KEY raises ValueError."""
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    with pytest.raises(ValueError) as exc_info:
        OpenAIModelClient("gpt-4o", tools=None)
    assert "OPENAI_API_KEY environment variable is not set" in str(exc_info.value)


def test_429_retry_backoff() -> None:
    """Verify 429 status code or message triggers retry with backoff and audit logging."""
    mock_client = MagicMock()
    mock_audit = MagicMock()
    sleep_calls: list[float] = []

    mock_resp = MagicMock()
    mock_choice = MagicMock()
    mock_choice.message.content = "Success after retries"
    mock_choice.message.tool_calls = None
    mock_resp.choices = [mock_choice]

    # Fails twice with 429, succeeds on third attempt
    mock_client.chat.completions.create.side_effect = [
        Exception("Error code: 429 - Rate limit reached"),
        Exception("429 Too Many Requests"),
        mock_resp,
    ]

    client = OpenAIModelClient(
        "gpt-4o",
        tools=None,
        client=mock_client,
        sleep=lambda d: sleep_calls.append(d),
        rand=lambda: 0.5,
        audit=mock_audit,
    )

    contents = [types.Content(role="user", parts=[types.Part.from_text(text="Hi")])]
    content = client.generate(contents)

    assert content.parts[0].text == "Success after retries"
    assert len(sleep_calls) == 2
    assert mock_audit.log.call_count == 2
    assert mock_audit.log.call_args_list[0][0][0] == "retry"
    assert mock_audit.log.call_args_list[0][1]["attempt"] == 1
    assert mock_audit.log.call_args_list[1][1]["attempt"] == 2


def test_empty_reply_triggers_retry() -> None:
    """Verify an empty reply triggers retry and succeeds on subsequent valid reply."""
    mock_client = MagicMock()
    mock_audit = MagicMock()
    sleep_calls: list[float] = []

    mock_empty = MagicMock()
    mock_empty.choices = [MagicMock(message=MagicMock(content=None, tool_calls=None))]

    mock_valid = MagicMock()
    mock_valid.choices = [MagicMock(message=MagicMock(content="Valid reply", tool_calls=None))]

    mock_client.chat.completions.create.side_effect = [mock_empty, mock_valid]

    client = OpenAIModelClient(
        "gpt-4o",
        tools=None,
        client=mock_client,
        sleep=lambda d: sleep_calls.append(d),
        rand=lambda: 0.5,
        audit=mock_audit,
    )

    content = client.generate([types.Content(role="user", parts=[types.Part.from_text(text="Hi")])])
    assert content.parts[0].text == "Valid reply"
    assert len(sleep_calls) == 1


def test_model_unavailable_on_retry_exhaustion() -> None:
    """Verify ModelUnavailable is raised when retries are exhausted."""
    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = Exception("429 Resource Exhausted")

    client = OpenAIModelClient(
        "gpt-4o",
        tools=None,
        client=mock_client,
        sleep=lambda d: None,
        rand=lambda: 0.5,
    )

    with pytest.raises(ModelUnavailable) as exc_info:
        client.generate([types.Content(role="user", parts=[types.Part.from_text(text="Hi")])])
    assert "OpenAI generation failed after backoff retries" in str(exc_info.value)
