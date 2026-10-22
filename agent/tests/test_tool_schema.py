"""Tests for core.tool_schema definitions and Google GenAI tool building."""
from __future__ import annotations

import importlib
import sys
import pytest

from core.tool_schema import (
    BASE_TOOL_NAMES,
    SWITCH_TOOL_NAME,
    TOOL_METADATA,
    TOOL_NAMES,
    build_tools,
)


def test_tool_names_switch_disabled() -> None:
    """Verify TOOL_NAMES returns exactly 22 tool names when switch is disabled."""
    names_default = TOOL_NAMES()
    names_explicit = TOOL_NAMES(switch_enabled=False)

    assert len(names_default) == 22
    assert len(names_explicit) == 22
    assert len(BASE_TOOL_NAMES) == 22
    assert names_default == BASE_TOOL_NAMES
    assert names_explicit == BASE_TOOL_NAMES
    assert SWITCH_TOOL_NAME not in names_default

    # Verify mutating returned list does not affect original BASE_TOOL_NAMES
    names_default.append("extra_tool")
    assert len(BASE_TOOL_NAMES) == 22


def test_tool_names_switch_enabled() -> None:
    """Verify TOOL_NAMES returns 23 tool names including switch_account."""
    names = TOOL_NAMES(switch_enabled=True)

    assert len(names) == 23
    assert SWITCH_TOOL_NAME in names
    assert names == list(BASE_TOOL_NAMES) + [SWITCH_TOOL_NAME]
    assert names[-1] == SWITCH_TOOL_NAME


def test_tool_names_unique_and_valid() -> None:
    """Verify all tool names are unique non-empty strings with valid identifiers."""
    for switch_enabled in (False, True):
        names = TOOL_NAMES(switch_enabled=switch_enabled)
        assert len(names) == len(set(names)), "Duplicate tool name detected"
        for name in names:
            assert isinstance(name, str)
            assert len(name) > 0
            assert name.isidentifier(), f"'{name}' is not a valid identifier"


def test_build_tools_returns_tool_object() -> None:
    """Verify build_tools returns a Tool object containing all declarations."""
    pytest.importorskip("google.genai")

    tool_disabled = build_tools(switch_enabled=False)
    assert hasattr(tool_disabled, "function_declarations")
    assert len(tool_disabled.function_declarations) == 22
    names_disabled = [decl.name for decl in tool_disabled.function_declarations]
    assert names_disabled == TOOL_NAMES(switch_enabled=False)

    tool_enabled = build_tools(switch_enabled=True)
    assert hasattr(tool_enabled, "function_declarations")
    assert len(tool_enabled.function_declarations) == 23
    names_enabled = [decl.name for decl in tool_enabled.function_declarations]
    assert names_enabled == TOOL_NAMES(switch_enabled=True)
    assert names_enabled[-1] == SWITCH_TOOL_NAME


def test_parameter_declarations_and_required_fields() -> None:
    """Verify required parameter fields are declared accurately across all tools."""
    pytest.importorskip("google.genai")

    tool = build_tools(switch_enabled=True)
    decls = {decl.name: decl for decl in tool.function_declarations}

    # Verify click requires x and y
    assert "click" in decls
    click_params = decls["click"].parameters
    assert set(click_params.required) == {"x", "y"}
    assert "x" in click_params.properties
    assert "y" in click_params.properties

    # Verify open_app requires name
    assert decls["open_app"].parameters.required == ["name"]

    # Verify open_url requires url
    assert decls["open_url"].parameters.required == ["url"]

    # Verify focus_window requires title_contains
    assert decls["focus_window"].parameters.required == ["title_contains"]

    # Verify paste_text requires text, press_enter is optional
    paste_params = decls["paste_text"].parameters
    assert paste_params.required == ["text"]
    assert "press_enter" in paste_params.properties

    # Verify press_keys requires keys
    assert decls["press_keys"].parameters.required == ["keys"]

    # Verify scroll requires amount
    assert decls["scroll"].parameters.required == ["amount"]

    # Verify wait requires seconds
    assert decls["wait"].parameters.required == ["seconds"]

    # Verify run_cmd requires command
    assert decls["run_cmd"].parameters.required == ["command"]

    # Verify no-param tools have empty required list
    for no_param in ("screenshot", "read_clipboard", "graph_build", "graph_update", "graph_report"):
        assert decls[no_param].parameters.required == []

    # Verify graph tools
    assert decls["graph_query"].parameters.required == ["question"]
    assert decls["graph_explain"].parameters.required == ["symbol"]
    assert set(decls["graph_path"].parameters.required) == {"source", "target"}

    # Verify artifact tools
    assert decls["save_artifact"].parameters.required == ["name"]
    paste_art = decls["paste_artifact"].parameters
    assert paste_art.required == ["name"]
    assert "press_enter" in paste_art.properties

    # Verify limit and notification tools
    assert set(decls["report_limit"].parameters.required) == {"app", "minutes_until_reset"}
    assert decls["notify_human"].parameters.required == ["message"]
    assert decls["finish"].parameters.required == ["summary"]
    assert decls["switch_account"].parameters.required == ["app"]

    # Verify all tools have non-empty description
    for decl in tool.function_declarations:
        assert isinstance(decl.description, str) and len(decl.description) > 0


def test_module_imports_without_google_genai(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify module imports cleanly and TOOL_NAMES works when google.genai is absent."""
    # Mask google.genai and google modules to simulate missing library
    monkeypatch.setitem(sys.modules, "google.genai", None)
    monkeypatch.setitem(sys.modules, "google", None)

    import core.tool_schema

    reloaded = importlib.reload(core.tool_schema)

    # Functions and constants must operate cleanly without google.genai
    assert len(reloaded.TOOL_NAMES(switch_enabled=False)) == 22
    assert len(reloaded.TOOL_NAMES(switch_enabled=True)) == 23
    assert len(reloaded.BASE_TOOL_NAMES) == 22

    # Calling build_tools must fail gracefully with ImportError when genai is absent
    with pytest.raises((ImportError, ModuleNotFoundError, TypeError)):
        reloaded.build_tools()


def test_tool_metadata_completeness() -> None:
    """Verify TOOL_METADATA defines every tool with required fields and descriptions."""
    all_names = TOOL_NAMES(switch_enabled=True)
    assert set(TOOL_METADATA.keys()) == set(all_names)

    for name, meta in TOOL_METADATA.items():
        assert "description" in meta and len(meta["description"]) >= 10
        assert "properties" in meta and isinstance(meta["properties"], dict)
        assert "required" in meta and isinstance(meta["required"], list)
        for req in meta["required"]:
            assert req in meta["properties"], f"Required '{req}' missing from properties of '{name}'"
