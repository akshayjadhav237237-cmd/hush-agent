"""Unit tests for converting Google GenAI history into strictly ordered OpenAI messages."""
from __future__ import annotations

import base64
import json
from typing import Any
import pytest
from google.genai import types

from core.openai_client import (
    convert_contents_to_openai_messages,
    validate_openai_messages,
)
from core.vision import png_part, strip_old_images


def check_messages(messages: list[dict[str, Any]]) -> None:
    """Helper verifying that every assistant tool_calls message is followed by its tool messages."""
    validate_openai_messages(messages)
    for i, msg in enumerate(messages):
        if msg.get("role") == "assistant" and msg.get("tool_calls"):
            expected = [tc["id"] for tc in msg["tool_calls"]]
            actual = [messages[i + 1 + j].get("tool_call_id") for j in range(len(expected))]
            assert actual == expected, f"Tool call ID mismatch at index {i}: expected {expected}, got {actual}"
            for j in range(len(expected)):
                t_msg = messages[i + 1 + j]
                assert t_msg.get("role") == "tool"
                assert isinstance(t_msg.get("content"), str)


def test_one_call_and_response() -> None:
    """Verify single function call followed by matching tool response."""
    contents = [
        types.Content(role="user", parts=[types.Part.from_text(text="Please click the button")]),
        types.Content(
            role="model",
            parts=[types.Part(function_call=types.FunctionCall(name="click", args={"x": 50, "y": 100}, id="call_0"))],
        ),
        types.Content(
            role="user",
            parts=[types.Part.from_function_response(name="click", response={"result": "clicked at (50, 100)"})],
        ),
    ]
    msgs = convert_contents_to_openai_messages(contents)
    check_messages(msgs)

    assert len(msgs) == 3
    assert msgs[0]["role"] == "user"
    assert msgs[1]["role"] == "assistant"
    assert msgs[1]["tool_calls"][0]["id"] == "call_0"
    assert msgs[2]["role"] == "tool"
    assert msgs[2]["tool_call_id"] == "call_0"
    assert "clicked at" in msgs[2]["content"]


def test_two_parallel_calls_and_responses() -> None:
    """Verify multiple parallel tool calls are each followed by tool responses in identical order."""
    contents = [
        types.Content(role="user", parts=[types.Part.from_text(text="Type and press enter")]),
        types.Content(
            role="model",
            parts=[
                types.Part(function_call=types.FunctionCall(name="type_text", args={"text": "hello"}, id="call_0")),
                types.Part(function_call=types.FunctionCall(name="press_keys", args={"keys": "enter"}, id="call_1")),
            ],
        ),
        types.Content(
            role="user",
            parts=[
                types.Part.from_function_response(name="type_text", response={"result": "typed"}),
                types.Part.from_function_response(name="press_keys", response={"result": "pressed"}),
            ],
        ),
    ]
    msgs = convert_contents_to_openai_messages(contents)
    check_messages(msgs)

    assert len(msgs) == 4
    assert msgs[1]["role"] == "assistant"
    assert len(msgs[1]["tool_calls"]) == 2
    assert msgs[2]["role"] == "tool"
    assert msgs[2]["tool_call_id"] == "call_0"
    assert msgs[3]["role"] == "tool"
    assert msgs[3]["tool_call_id"] == "call_1"


def test_response_plus_screenshot_in_one_content() -> None:
    """Verify tool messages carry text only, and shared screenshot moves to subsequent user message."""
    fake_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
    contents = [
        types.Content(role="user", parts=[types.Part.from_text(text="Open app and view")]),
        types.Content(
            role="model",
            parts=[types.Part(function_call=types.FunctionCall(name="open_app", args={"app": "claude"}, id="call_0"))],
        ),
        types.Content(
            role="user",
            parts=[
                types.Part.from_function_response(name="open_app", response={"result": "Opened claude"}),
                png_part(fake_png),
            ],
        ),
    ]
    msgs = convert_contents_to_openai_messages(contents)
    check_messages(msgs)

    assert len(msgs) == 4
    assert msgs[1]["role"] == "assistant"
    assert msgs[2]["role"] == "tool"
    assert msgs[2]["tool_call_id"] == "call_0"
    assert isinstance(msgs[2]["content"], str)
    assert "Opened claude" in msgs[2]["content"]

    # Image is placed in separate user message AFTER tool message
    assert msgs[3]["role"] == "user"
    assert isinstance(msgs[3]["content"], list)
    assert msgs[3]["content"][0]["type"] == "image_url"
    assert "data:image/png;base64," in msgs[3]["content"][0]["image_url"]["url"]


def test_call_without_response() -> None:
    """Verify an unanswered function_call gets a synthetic 'No result' tool message."""
    contents = [
        types.Content(role="user", parts=[types.Part.from_text(text="Take screenshot")]),
        types.Content(
            role="model",
            parts=[types.Part(function_call=types.FunctionCall(name="screenshot", args={}, id="call_0"))],
        ),
    ]
    msgs = convert_contents_to_openai_messages(contents)
    check_messages(msgs)

    assert len(msgs) == 3
    assert msgs[1]["role"] == "assistant"
    assert msgs[2]["role"] == "tool"
    assert msgs[2]["tool_call_id"] == "call_0"
    assert msgs[2]["content"] == "No result"


def test_response_without_call() -> None:
    """Verify orphan function_response without preceding call is dropped without inventing IDs."""
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text="Standalone input"),
                types.Part.from_function_response(name="orphan_tool", response={"result": "ignored"}),
            ],
        )
    ]
    msgs = convert_contents_to_openai_messages(contents)
    check_messages(msgs)

    assert len(msgs) == 1
    assert msgs[0]["role"] == "user"
    assert msgs[0]["content"] == "Standalone input"


def test_three_step_conversation() -> None:
    """Verify multi-step back-and-forth preserves strict ordering and IDs across turns."""
    contents = [
        types.Content(role="user", parts=[types.Part.from_text(text="Start task")]),
        types.Content(
            role="model",
            parts=[types.Part(function_call=types.FunctionCall(name="open_app", args={"app": "claude"}, id="call_0"))],
        ),
        types.Content(
            role="user",
            parts=[types.Part.from_function_response(name="open_app", response={"result": "ok"})],
        ),
        types.Content(
            role="model",
            parts=[types.Part(function_call=types.FunctionCall(name="wait", args={"seconds": 5}, id="call_1"))],
        ),
        types.Content(
            role="user",
            parts=[types.Part.from_function_response(name="wait", response={"result": "waited"})],
        ),
        types.Content(role="model", parts=[types.Part.from_text(text="Finished task.")]),
    ]
    msgs = convert_contents_to_openai_messages(contents)
    check_messages(msgs)

    assert len(msgs) == 6
    roles = [m["role"] for m in msgs]
    assert roles == ["user", "assistant", "tool", "assistant", "tool", "assistant"]
    assert msgs[2]["tool_call_id"] == "call_0"
    assert msgs[4]["tool_call_id"] == "call_1"


def test_after_strip_old_images() -> None:
    """Verify history after strip_old_images converts cleanly and satisfies validator."""
    img1 = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR1"
    img2 = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR2"
    img3 = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR3"

    contents = [
        types.Content(role="user", parts=[types.Part.from_text(text="Step 1"), png_part(img1)]),
        types.Content(role="model", parts=[types.Part.from_text(text="Acknowledge 1")]),
        types.Content(role="user", parts=[types.Part.from_text(text="Step 2"), png_part(img2)]),
        types.Content(role="model", parts=[types.Part.from_text(text="Acknowledge 2")]),
        types.Content(role="user", parts=[types.Part.from_text(text="Step 3"), png_part(img3)]),
    ]

    strip_old_images(contents, keep=2)
    # img1 should be stripped
    assert contents[0].parts[1].text == "[old screenshot removed]"

    msgs = convert_contents_to_openai_messages(contents)
    check_messages(msgs)
    assert len(msgs) == 5
    assert "[old screenshot removed]" in msgs[0]["content"]
    assert isinstance(msgs[2]["content"], list)
    assert isinstance(msgs[4]["content"], list)


def test_validation_checker_failures() -> None:
    """Verify validate_openai_messages rejects malformed message sequences with exact index."""
    # 1. Assistant tool_call missing response
    bad_missing = [
        {"role": "user", "content": "hi"},
        {"role": "assistant", "tool_calls": [{"id": "call_0", "function": {"name": "c"}}]},
    ]
    with pytest.raises(ValueError, match="Message index 1: assistant with tool_calls missing tool response"):
        validate_openai_messages(bad_missing)

    # 2. Intervening user message between tool_calls and tool message
    bad_intervening = [
        {"role": "assistant", "tool_calls": [{"id": "call_0", "function": {"name": "c"}}]},
        {"role": "user", "content": "intervening message"},
        {"role": "tool", "tool_call_id": "call_0", "content": "result"},
    ]
    with pytest.raises(ValueError, match="Message index 1: expected role 'tool' after assistant tool_calls"):
        validate_openai_messages(bad_intervening)

    # 3. Tool message with mismatched ID
    bad_id = [
        {"role": "assistant", "tool_calls": [{"id": "call_0", "function": {"name": "c"}}]},
        {"role": "tool", "tool_call_id": "call_WRONG", "content": "result"},
    ]
    with pytest.raises(ValueError, match="Message index 1: expected tool_call_id 'call_0', got 'call_WRONG'"):
        validate_openai_messages(bad_id)

    # 4. Orphan tool message without assistant tool_calls
    orphan = [{"role": "tool", "tool_call_id": "call_0", "content": "result"}]
    with pytest.raises(ValueError, match="Message index 0: unexpected tool message without preceding assistant tool_calls"):
        validate_openai_messages(orphan)
