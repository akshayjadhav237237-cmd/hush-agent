"""Unit tests for system prompts and prompt builders."""
from __future__ import annotations

import re
import pytest

from core.prompts import (
    CLAUDE_BOOTSTRAP,
    DEMO_NOTE,
    PROMPT_TOOLS,
    SYSTEM_PLAYBOOK,
    build_first_message,
)


def test_build_first_message_formats_user_idea_without_unescaped_braces() -> None:
    """Verify build_first_message formats user idea and leaves no unescaped format placeholders."""
    idea = "A portfolio website for a wedding photographer"
    msg = build_first_message(idea)

    # User idea is formatted properly into both bootstrap and starting instructions
    assert f"The user wants to build: {idea}." in msg
    assert f"User idea: {idea}\nStart now. Take a screenshot first." in msg

    # Unescaped {idea} placeholder is replaced
    assert "{idea}" not in msg

    # Ensure no stray format tokens like {foo} remain in the message
    stray_braces = re.findall(r"\{[a-zA-Z0-9_]+\}", msg)
    assert not stray_braces, f"Found stray format braces in prompt: {stray_braces}"


def test_demo_flag_toggles_demo_note() -> None:
    """Verify demo=True includes DEMO_NOTE, while demo=False excludes it."""
    idea = "A retro arcade emulator"

    # Default is demo=False
    msg_default = build_first_message(idea)
    assert DEMO_NOTE not in msg_default

    # Explicit demo=False
    msg_false = build_first_message(idea, demo=False)
    assert DEMO_NOTE not in msg_false

    # Explicit demo=True
    msg_true = build_first_message(idea, demo=True)
    assert DEMO_NOTE in msg_true
    assert msg_true.startswith(DEMO_NOTE)
    assert "[F1]" in msg_true and "[F2]" in msg_true


def test_prompt_instructs_save_and_paste_artifact_rather_than_retyping() -> None:
    """Verify prompt explicitly instructs using save_artifact and paste_artifact rather than re-typing long text."""
    idea = "Task management tool"
    msg = build_first_message(idea)

    assert "rather than re-typing long text" in msg
    assert "save_artifact" in msg
    assert "paste_artifact" in msg

    # Check artifact names referenced in playbook steps
    assert 'save_artifact("research_prompt")' in msg
    assert 'paste_artifact("research_prompt")' in msg
    assert 'save_artifact("research_report")' in msg
    assert 'paste_artifact("research_report")' in msg
    assert 'save_artifact("build_prompt_1")' in msg
    assert 'paste_artifact("build_prompt_1")' in msg


def test_prompt_includes_needs_human_report_limit_and_finish() -> None:
    """Verify prompt includes NEEDS_HUMAN rule, notify_human, report_limit, and finish."""
    idea = "E-commerce checkout flow"
    msg = build_first_message(idea)

    assert "NEEDS_HUMAN:" in msg
    assert "notify_human" in msg
    assert "report_limit" in msg
    assert "service usage or limit messages" in msg
    assert "finish" in msg


def test_prompt_includes_graphify_tools_and_commands() -> None:
    """Verify prompt includes Graphify build, update, inspection tools and max 3 rounds."""
    idea = "Analytics dashboard"
    msg = build_first_message(idea)

    graph_tools = [
        "graph_build",
        "graph_update",
        "graph_report",
        "graph_query",
        "graph_explain",
        "graph_path",
    ]
    for tool in graph_tools:
        assert tool in msg, f"Expected tool '{tool}' in prompt"

    assert "call graph_build first time" in msg
    assert "graph_update after later rounds" in msg
    assert "Maximum 3 build rounds" in msg


def test_referenced_tool_names_match_tool_schema() -> None:
    """Verify all tool names referenced in prompts exist in core.tool_schema.TOOL_NAMES if available."""
    try:
        from core.tool_schema import TOOL_NAMES
    except (ImportError, AttributeError):
        pytest.skip("core.tool_schema.TOOL_NAMES not yet present")

    schema_set = set(TOOL_NAMES)
    missing = PROMPT_TOOLS - schema_set
    assert not missing, f"Prompt tools missing from core.tool_schema.TOOL_NAMES: {missing}"


def test_claude_bootstrap_architect_role_and_constraints() -> None:
    """Verify CLAUDE_BOOTSTRAP defines architect role, Antigravity builder, and negative constraints."""
    assert "architect and prompt-writer" in CLAUDE_BOOTSTRAP
    assert "Antigravity" in CLAUDE_BOOTSTRAP
    assert "You do NOT write or run code yourself" in CLAUDE_BOOTSTRAP
    assert "State what NOT to do" in CLAUDE_BOOTSTRAP
    assert "no placeholder code" in CLAUDE_BOOTSTRAP
    assert "{idea}" in CLAUDE_BOOTSTRAP

    formatted = CLAUDE_BOOTSTRAP.format(idea="My Cool App")
    assert "The user wants to build: My Cool App." in formatted
    assert "{idea}" not in formatted


def test_starting_instructions_structure() -> None:
    """Verify starting instructions format and sequence in build_first_message."""
    idea = "Data visualization toolkit"
    msg = build_first_message(idea)

    expected_suffix = f"User idea: {idea}\nStart now. Take a screenshot first."
    assert msg.endswith(expected_suffix)
