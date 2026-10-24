"""Unit tests for DemoWorld desktop protocol and scripted flow."""
from __future__ import annotations

from typing import Any

from core.demo.world import (
    BUILD_PROMPT_1,
    BUILD_PROMPT_2,
    DemoWorld,
    NEEDS_HUMAN_PROMPT,
    RESEARCH_PROMPT,
    RESEARCH_REPORT,
    USAGE_LIMIT_NOTICE,
)
from core.types import Desktop


def test_funcs_returns_standard_desktop_tools(tmp_path: Any) -> None:
    """Verify funcs() returns all required tool functions with expected behavior."""
    world = DemoWorld(project_dir=str(tmp_path / "project"), sleep=lambda s: None)
    tools = world.funcs()

    expected_tools = {
        "open_app",
        "open_url",
        "focus_window",
        "paste_text",
        "press_keys",
        "click",
        "scroll",
        "read_clipboard",
        "wait",
    }
    assert expected_tools.issubset(tools.keys())

    # Verify tool execution
    assert "claude" in tools["open_app"]("Claude")
    assert world.current_app == "claude"

    assert "gemini" in tools["open_url"]("https://gemini.google.com")
    assert world.current_app == "gemini"

    assert "antigravity" in tools["focus_window"]("Antigravity IDE")
    assert world.current_app == "antigravity"

    assert tools["scroll"](120) == "Scrolled 120"
    assert "Waited" in tools["wait"](5)


def test_protocol_methods_return_expected_types(tmp_path: Any) -> None:
    """Verify Desktop protocol methods return expected types and signatures."""
    mock_render = lambda app, state: b"mock_png_data"
    world = DemoWorld(
        project_dir=str(tmp_path),
        render=mock_render,
        sleep=lambda s: None,
    )

    # Static type check: world conforms to Desktop protocol
    desktop: Desktop = world

    # Test clipboard_full
    assert desktop.clipboard_full() == ""
    paste_res = desktop.paste_any("Sample clipboard text")
    assert isinstance(paste_res, str)
    assert "Pasted 21 chars" in paste_res
    assert desktop.clipboard_full() == "Sample clipboard text"

    # Test screenshot_png
    png_bytes = desktop.screenshot_png()
    assert isinstance(png_bytes, bytes)
    assert png_bytes == b"mock_png_data"

    # Test funcs
    tools = desktop.funcs()
    assert isinstance(tools, dict)
    assert callable(tools["read_clipboard"])
    assert tools["read_clipboard"]() == "Sample clipboard text"


def test_scripted_flow_advances_states_correctly(tmp_path: Any) -> None:
    """Verify scripted flow advances Claude -> Gemini -> Claude -> Antigravity."""
    world = DemoWorld(project_dir=str(tmp_path / "project"), sleep=lambda s: None)
    tools = world.funcs()

    # Step 1: Open Claude and paste initial prompt -> Claude gives research prompt
    tools["open_url"]("https://claude.ai/new")
    assert world.current_app == "claude"
    tools["paste_text"]("Build a task management application")
    tools["press_keys"]("F2")
    research_prompt = tools["read_clipboard"]()
    assert research_prompt == RESEARCH_PROMPT

    # Step 2: Open Gemini, paste research prompt, wait 2 rounds -> gives research report
    tools["open_url"]("https://gemini.google.com/app")
    assert world.current_app == "gemini"
    tools["paste_text"](research_prompt)
    tools["wait"](60)
    assert not world.gemini_complete
    tools["wait"](60)
    assert world.gemini_complete
    tools["press_keys"]("F2")
    research_report = tools["read_clipboard"]()
    assert research_report == RESEARCH_REPORT

    # Step 3: Return to Claude, paste research report -> gives build prompt 1
    tools["open_url"]("https://claude.ai")
    assert world.current_app == "claude"
    tools["paste_text"](research_report)
    tools["press_keys"]("F2")
    build_prompt_1 = tools["read_clipboard"]()
    assert build_prompt_1 == BUILD_PROMPT_1

    # Step 4: Open Antigravity, paste build prompt 1 -> build round 1 executes
    tools["open_app"]("antigravity")
    assert world.current_app == "antigravity"
    tools["paste_text"](build_prompt_1)
    assert world.build_round == 1


def test_antigravity_invocation_calls_write_files_callback(tmp_path: Any) -> None:
    """Verify Antigravity invocations trigger write_files callback for both rounds."""
    recorded_calls: list[tuple[str, int]] = []
    pdir = str(tmp_path / "demo_app")

    def mock_write(project_dir: str, round_num: int) -> None:
        recorded_calls.append((project_dir, round_num))

    world = DemoWorld(
        project_dir=pdir,
        write_files=mock_write,
        sleep=lambda s: None,
    )
    tools = world.funcs()

    # Trigger Round 1 in Antigravity
    tools["open_app"]("antigravity")
    tools["paste_text"](BUILD_PROMPT_1)
    assert recorded_calls == [(pdir, 1)]
    assert world.build_round == 1

    # Advance through NEEDS_HUMAN to Round 2
    tools["open_url"]("https://claude.ai")
    world.claude_stage = 2  # Simulate having received research report
    tools["paste_text"]("Graph update summary")
    assert world.needs_human_asked is True

    tools["paste_text"]("sqlite")  # Provide human answer
    assert world.human_resolved is True
    assert world.build_round == 2

    # Trigger Round 2 in Antigravity
    tools["open_app"]("antigravity")
    tools["paste_text"](BUILD_PROMPT_2)
    assert recorded_calls == [(pdir, 1), (pdir, 2)]


def test_limit_scenario_triggers_usage_limit_notice(tmp_path: Any) -> None:
    """Verify limit_scenario=True triggers usage limit notice in Antigravity."""
    world = DemoWorld(
        project_dir=str(tmp_path / "limit_app"),
        limit_scenario=True,
        sleep=lambda s: None,
    )
    tools = world.funcs()

    tools["open_app"]("antigravity")
    tools["paste_text"](BUILD_PROMPT_1)

    assert world.limit_triggered is True
    tools["press_keys"]("F2")
    clipboard_text = tools["read_clipboard"]()
    assert clipboard_text == USAGE_LIMIT_NOTICE

    # Verify wait also handles limit notice gracefully without double-trigger
    wait_status = tools["wait"](10)
    assert "Waited" in wait_status


def test_needs_human_flow_pauses_and_unpauses(tmp_path: Any) -> None:
    """Verify NEEDS_HUMAN pauses execution until answer is provided."""
    world = DemoWorld(
        project_dir=str(tmp_path / "human_app"),
        human_answer="PostgreSQL",
        sleep=lambda s: None,
    )
    tools = world.funcs()

    # Move Claude to stage 2
    tools["open_app"]("claude")
    tools["paste_text"]("Initial idea")
    tools["paste_text"]("Research report findings")
    assert world.claude_stage == 2

    # Graph update triggers NEEDS_HUMAN question
    tools["paste_text"]("Graph update report")
    assert world.needs_human_asked is True
    assert world.human_resolved is False

    tools["press_keys"]("F2")
    reply = tools["read_clipboard"]()
    assert reply == NEEDS_HUMAN_PROMPT

    # Human provides answer
    tools["paste_text"]("PostgreSQL")
    assert world.human_resolved is True
    assert world.build_round == 2

    tools["press_keys"]("F2")
    build_prompt_2 = tools["read_clipboard"]()
    assert build_prompt_2 == BUILD_PROMPT_2

    # Complete pipeline
    tools["open_app"]("antigravity")
    tools["paste_text"](build_prompt_2)
    tools["open_app"]("claude")
    tools["paste_text"]("All files successfully built")
    tools["press_keys"]("F2")
    assert tools["read_clipboard"]() == "Done"


def test_click_and_shortcuts() -> None:
    """Verify click hit boxes and shortcut keys."""
    world = DemoWorld(project_dir="/test", sleep=lambda s: None)
    tools = world.funcs()

    tools["open_app"]("claude")
    tools["paste_text"]("Initial idea")

    # Click outside hit box
    assert tools["click"](10, 10) == "Clicked (10, 10)"

    # Click inside copy hit box
    res = tools["click"](500, 500)
    assert "copied reply to clipboard" in res
    assert tools["read_clipboard"]() == RESEARCH_PROMPT

    # Press ctrl+c shortcut
    press_res = tools["press_keys"]("ctrl+c")
    assert "copied reply to clipboard" in press_res
