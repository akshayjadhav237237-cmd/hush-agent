"""Tool schema definitions and function declarations for Google GenAI."""
from __future__ import annotations

from typing import Any

BASE_TOOL_NAMES: list[str] = [
    "open_app",
    "open_url",
    "focus_window",
    "paste_text",
    "press_keys",
    "click",
    "scroll",
    "screenshot",
    "read_clipboard",
    "wait",
    "run_cmd",
    "graph_build",
    "graph_update",
    "graph_report",
    "graph_query",
    "graph_explain",
    "graph_path",
    "save_artifact",
    "paste_artifact",
    "report_limit",
    "notify_human",
    "finish",
]

BROWSER_TOOL_NAMES: list[str] = [
    "browser_send_prompt",
    "browser_wait_done",
    "browser_get_reply",
    "browser_select_mode",
]

SWITCH_TOOL_NAME: str = "switch_account"

TOOL_METADATA: dict[str, dict[str, Any]] = {
    "open_app": {
        "description": "Open a desktop app through the Start menu.",
        "properties": {"name": {"type": "string"}},
        "required": ["name"],
    },
    "open_url": {
        "description": "Open a URL in the default browser.",
        "properties": {"url": {"type": "string"}},
        "required": ["url"],
    },
    "focus_window": {
        "description": "Bring a window to the front by title substring.",
        "properties": {"title_contains": {"type": "string"}},
        "required": ["title_contains"],
    },
    "paste_text": {
        "description": "Paste text into the focused input via clipboard.",
        "properties": {
            "text": {"type": "string"},
            "press_enter": {"type": "boolean"},
        },
        "required": ["text"],
    },
    "press_keys": {
        "description": "Press hotkey combinations like 'ctrl+l' or 'enter'.",
        "properties": {"keys": {"type": "string"}},
        "required": ["keys"],
    },
    "click": {
        "description": "Click at coordinate position (x, y).",
        "properties": {
            "x": {"type": "integer"},
            "y": {"type": "integer"},
        },
        "required": ["x", "y"],
    },
    "scroll": {
        "description": "Scroll the mouse wheel; negative scrolls down.",
        "properties": {"amount": {"type": "integer"}},
        "required": ["amount"],
    },
    "screenshot": {
        "description": "Capture full screen screenshot and inspect display.",
        "properties": {},
        "required": [],
    },
    "read_clipboard": {
        "description": "Read and return current clipboard text.",
        "properties": {},
        "required": [],
    },
    "wait": {
        "description": "Sleep for N seconds.",
        "properties": {"seconds": {"type": "integer"}},
        "required": ["seconds"],
    },
    "run_cmd": {
        "description": "Execute an allowlisted command in project workspace.",
        "properties": {"command": {"type": "string"}},
        "required": ["command"],
    },
    "graph_build": {
        "description": "Build the Graphify code graph of the project folder.",
        "properties": {},
        "required": [],
    },
    "graph_update": {
        "description": "Refresh the Graphify graph after code changes.",
        "properties": {},
        "required": [],
    },
    "graph_report": {
        "description": "Read the Graphify graph summary report.",
        "properties": {},
        "required": [],
    },
    "graph_query": {
        "description": "Ask the Graphify code graph a question about the code.",
        "properties": {"question": {"type": "string"}},
        "required": ["question"],
    },
    "graph_explain": {
        "description": "Explain one symbol using the Graphify graph.",
        "properties": {"symbol": {"type": "string"}},
        "required": ["symbol"],
    },
    "graph_path": {
        "description": "Find the connection path between two symbols in the graph.",
        "properties": {
            "source": {"type": "string"},
            "target": {"type": "string"},
        },
        "required": ["source", "target"],
    },
    "save_artifact": {
        "description": "Save current clipboard content as a named artifact.",
        "properties": {"name": {"type": "string"}},
        "required": ["name"],
    },
    "paste_artifact": {
        "description": "Paste the content of a named artifact into focused input.",
        "properties": {
            "name": {"type": "string"},
            "press_enter": {"type": "boolean"},
        },
        "required": ["name"],
    },
    "report_limit": {
        "description": "Report rate limit hit for an app and minutes until reset.",
        "properties": {
            "app": {"type": "string"},
            "minutes_until_reset": {"type": "integer"},
        },
        "required": ["app", "minutes_until_reset"],
    },
    "notify_human": {
        "description": "Alert the human and wait for their answer. Use sparingly.",
        "properties": {"message": {"type": "string"}},
        "required": ["message"],
    },
    "finish": {
        "description": "Declare the whole task complete with a short summary.",
        "properties": {"summary": {"type": "string"}},
        "required": ["summary"],
    },
    "switch_account": {
        "description": "Switch to another account for the specified app.",
        "properties": {"app": {"type": "string"}},
        "required": ["app"],
    },
}

BROWSER_TOOL_METADATA: dict[str, dict[str, Any]] = {
    "browser_send_prompt": {
        "description": "Send a prompt to Claude or Gemini via dedicated browser driver.",
        "properties": {
            "app": {"type": "string"},
            "prompt": {"type": "string"},
        },
        "required": ["app", "prompt"],
    },
    "browser_wait_done": {
        "description": "Wait until Claude or Gemini finishes generating response.",
        "properties": {
            "app": {"type": "string"},
            "timeout_seconds": {"type": "integer"},
        },
        "required": ["app"],
    },
    "browser_get_reply": {
        "description": "Extract completed response from browser and save as a named artifact.",
        "properties": {
            "app": {"type": "string"},
            "artifact_name": {"type": "string"},
        },
        "required": ["app", "artifact_name"],
    },
    "browser_select_mode": {
        "description": "Select mode in web interface (e.g. 'Deep Research' in Gemini).",
        "properties": {
            "app": {"type": "string"},
            "mode": {"type": "string"},
        },
        "required": ["app", "mode"],
    },
}


def _get_tool_names(switch_enabled: bool = False, browser_enabled: bool = False) -> list[str]:
    """Return tool names, including switch_account if switch_enabled is True."""
    names = list(BASE_TOOL_NAMES)
    if switch_enabled:
        names.append(SWITCH_TOOL_NAME)
    if browser_enabled:
        names.extend(BROWSER_TOOL_NAMES)
    return names


class _ToolNamesCaller:
    """Callable tool names helper supporting direct iterable access."""

    def __call__(self, switch_enabled: bool = False, browser_enabled: bool = False) -> list[str]:
        """Return list of tool names based on switch_enabled and browser_enabled flags."""
        return _get_tool_names(switch_enabled=switch_enabled, browser_enabled=browser_enabled)

    def __iter__(self):
        """Iterate over base tool names for set/list conversion."""
        return iter(BASE_TOOL_NAMES)

    def __len__(self) -> int:
        """Return count of base tool names."""
        return len(BASE_TOOL_NAMES)

    def __contains__(self, item: object) -> bool:
        """Check if an item is among base tool names."""
        return item in BASE_TOOL_NAMES

    def __repr__(self) -> str:
        return "<function TOOL_NAMES>"


TOOL_NAMES: Any = _ToolNamesCaller()


def build_tools(switch_enabled: bool = False, browser_enabled: bool = False) -> Any:
    """Build GenAI Tool instance containing function declarations."""
    from google.genai import types

    meta = dict(TOOL_METADATA)
    meta.update(BROWSER_TOOL_METADATA)

    names = TOOL_NAMES(switch_enabled=switch_enabled, browser_enabled=browser_enabled)
    declarations = [
        types.FunctionDeclaration(
            name=name,
            description=meta[name]["description"],
            parameters={
                "type": "object",
                "properties": meta[name]["properties"],
                "required": meta[name]["required"],
            },
        )
        for name in names
    ]
    return types.Tool(function_declarations=declarations)
