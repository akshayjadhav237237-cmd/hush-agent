"""Scripted DemoWorld environment implementing the Desktop protocol."""
from __future__ import annotations

import time
from typing import Callable, Optional

from core.types import ToolFunc

RESEARCH_PROMPT = "Research modern React architecture, component libraries, and UX patterns for this project."
RESEARCH_REPORT = (
    "Research Report:\n"
    "- Architecture: React + Vite + Tailwind CSS\n"
    "- State: Zustand store\n"
    "- UI Components: Lucide icons, accessible dialogs\n"
    "- Backend: SQLite persistence"
)
BUILD_PROMPT_1 = "Build Round 1: Create application skeleton, configurations, and core layout."
USAGE_LIMIT_NOTICE = "Usage limit reached. Resets in 2 minutes."
NEEDS_HUMAN_PROMPT = "NEEDS_HUMAN: which storage backend should be used?"
BUILD_PROMPT_2 = "Build Round 2: Implement storage backend with SQLite and connect state."
DONE_MESSAGE = "Done"


class DemoWorld:
    """State machine for scripted demo flow adhering to Desktop protocol."""

    def __init__(
        self,
        project_dir: str,
        limit_scenario: bool = False,
        human_answer: Optional[str] = None,
        render: Optional[Callable] = None,
        write_files: Optional[Callable] = None,
        sleep: Callable[[float], None] = time.sleep,
    ) -> None:
        """Initialize state machine for scripted demo flow."""
        self.project_dir = project_dir
        self.limit_scenario = limit_scenario
        self.human_answer = human_answer
        self.sleep = sleep

        if render is None:
            try:
                from core.demo.screens import render_screen
                render = render_screen
            except ImportError:
                render = lambda app, state: b""
        if write_files is None:
            try:
                from core.demo.project_files import write_round
                write_files = write_round
            except ImportError:
                write_files = lambda pdir, r: None

        self.render = render
        self.write_files = write_files

        # Internal state
        self.current_app = "desktop"
        self.clipboard = ""
        self.step_counter = 0
        self.wait_count = 0
        self.limit_triggered = False
        self.build_round = 0
        self.needs_human_asked = False
        self.human_resolved = False

        # Flow tracking
        self.claude_stage = 0
        self.claude_reply = ""
        self.gemini_researching = False
        self.gemini_complete = False
        self.gemini_reply = ""
        self.antigravity_reply = ""
        self.current_reply = ""

    def clipboard_full(self) -> str:
        """Return the complete unfiltered clipboard content."""
        return self.clipboard

    def paste_any(self, text: str, press_enter: bool = False) -> str:
        """Paste any string, updating internal state machine."""
        self.clipboard = text
        self.step_counter += 1

        if self.needs_human_asked and not self.human_resolved:
            self.human_resolved = True
            self.build_round = 2
            self.claude_stage = 4
            self.claude_reply = BUILD_PROMPT_2
            self.current_reply = BUILD_PROMPT_2
            return f"Pasted {len(text)} chars"

        if self.current_app == "claude":
            if self.claude_stage == 0:
                self.claude_stage = 1
                self.claude_reply = RESEARCH_PROMPT
            elif self.claude_stage == 1:
                self.claude_stage = 2
                self.claude_reply = BUILD_PROMPT_1
            elif self.claude_stage == 2:
                self.claude_stage = 3
                self.needs_human_asked = True
                self.claude_reply = NEEDS_HUMAN_PROMPT
            elif self.claude_stage == 4:
                self.claude_stage = 5
                self.claude_reply = DONE_MESSAGE
            self.current_reply = self.claude_reply

        elif self.current_app == "gemini":
            self.gemini_researching = True
            self.wait_count = 0
            self.gemini_complete = False
            self.gemini_reply = "Research in progress..."
            self.current_reply = self.gemini_reply

        elif self.current_app == "antigravity":
            if self.build_round < 2 and not self.human_resolved:
                self.build_round = 1
                if self.write_files:
                    self.write_files(self.project_dir, 1)
                if self.limit_scenario and not self.limit_triggered:
                    self.limit_triggered = True
                    self.antigravity_reply = USAGE_LIMIT_NOTICE
                else:
                    self.antigravity_reply = "Build round 1 completed."
            else:
                self.build_round = 2
                if self.write_files:
                    self.write_files(self.project_dir, 2)
                self.antigravity_reply = "Build round 2 completed."
            self.current_reply = self.antigravity_reply

        return f"Pasted {len(text)} chars"

    def screenshot_png(self) -> bytes:
        """Construct state dict and render current screen as PNG bytes."""
        lines: list[str] = []
        if self.current_app == "desktop":
            lines = ["Desktop", "Ready"]
        elif self.current_app == "claude":
            lines = [f"Claude AI (Stage {self.claude_stage})"]
            lines.append(f"Reply: {self.claude_reply}" if self.claude_reply else "Ready for prompt")
        elif self.current_app == "gemini":
            lines = ["Gemini Deep Research"]
            if self.gemini_complete:
                lines.extend(["Research Complete", self.gemini_reply])
            elif self.gemini_researching:
                lines.append(f"Research in progress... ({self.wait_count}/2)")
            else:
                lines.append("Ready")
        elif self.current_app == "antigravity":
            lines = ["Antigravity IDE"]
            if self.limit_scenario and self.limit_triggered:
                lines.append(USAGE_LIMIT_NOTICE)
            elif self.build_round > 0:
                lines.append(f"Build Round {self.build_round} Complete")
            else:
                lines.append("Ready")
        else:
            lines = [f"App: {self.current_app}"]

        state = {
            "app": self.current_app,
            "lines": lines,
            "build_round": self.build_round,
            "clipboard": self.clipboard,
            "limit_triggered": self.limit_triggered,
            "needs_human_asked": self.needs_human_asked,
            "human_resolved": self.human_resolved,
            "wait_count": self.wait_count,
            "step_counter": self.step_counter,
        }
        rendered = self.render(self.current_app, state)
        return rendered if isinstance(rendered, bytes) else b""

    def funcs(self) -> dict[str, ToolFunc]:
        """Return registered tool functions dictionary."""
        return {
            "open_app": self.open_app,
            "open_url": self.open_url,
            "focus_window": self.focus_window,
            "paste_text": self.paste_text,
            "press_keys": self.press_keys,
            "click": self.click,
            "scroll": self.scroll,
            "read_clipboard": self.read_clipboard,
            "wait": self.wait,
        }

    def open_app(self, name: str) -> str:
        """Switch focused application by name."""
        self.current_app = name.lower()
        return f"Opened {self.current_app}"

    def open_url(self, url: str) -> str:
        """Open URL in browser, setting active app."""
        low = url.lower()
        if "claude" in low:
            self.current_app = "claude"
        elif "gemini" in low:
            self.current_app = "gemini"
        return f"Opened {url} ({self.current_app})"

    def focus_window(self, title_contains: str) -> str:
        """Focus window by title substring."""
        low = title_contains.lower()
        if "claude" in low:
            self.current_app = "claude"
        elif "gemini" in low:
            self.current_app = "gemini"
        elif "antigravity" in low:
            self.current_app = "antigravity"
        else:
            self.current_app = low
        return f"Focused window: {title_contains} ({self.current_app})"

    def paste_text(self, text: str, press_enter: bool = False) -> str:
        """Paste text via paste_any."""
        return self.paste_any(text, press_enter=press_enter)

    def press_keys(self, keys: str) -> str:
        """Handle keyboard shortcut emulation."""
        low = keys.strip().lower()
        if "f2" in low or "ctrl+c" in low or "copy" in low:
            self.clipboard = self._get_current_reply()
            return f"Pressed {keys}: copied reply to clipboard"
        return f"Pressed {keys}"

    def click(self, x: int, y: int) -> str:
        """Emulate mouse click, triggering buttons in hit boxes."""
        if (400 <= x <= 700 and 400 <= y <= 700) or (100 <= x <= 300 and 100 <= y <= 200):
            self.clipboard = self._get_current_reply()
            return f"Clicked ({x}, {y}): copied reply to clipboard"
        return f"Clicked ({x}, {y})"

    def scroll(self, amount: int) -> str:
        """Emulate mouse scroll."""
        return f"Scrolled {amount}"

    def read_clipboard(self) -> str:
        """Return the current clipboard contents up to 4000 characters."""
        return self.clipboard[:4000]

    def wait(self, seconds: int) -> str:
        """Pause execution and advance time-dependent demo states."""
        self.sleep(min(seconds, 1))

        if self.current_app == "gemini":
            self.gemini_researching = True
            self.wait_count += 1
            if self.wait_count >= 2:
                self.gemini_complete = True
                self.gemini_reply = RESEARCH_REPORT
                self.current_reply = RESEARCH_REPORT
                return f"Waited {seconds}s: research complete"
            return f"Waited {seconds}s: research in progress"

        if (
            self.limit_scenario
            and self.current_app == "antigravity"
            and (self.build_round == 1 or self.build_round == 0)
        ):
            if not self.limit_triggered:
                self.limit_triggered = True
                self.antigravity_reply = USAGE_LIMIT_NOTICE
                self.current_reply = USAGE_LIMIT_NOTICE
                return f"Waited {seconds}s: {USAGE_LIMIT_NOTICE}"

        return f"Waited {seconds}s"

    def _get_current_reply(self) -> str:
        """Retrieve current reply based on active application."""
        if self.current_app == "claude":
            return self.claude_reply or self.current_reply
        if self.current_app == "gemini":
            return self.gemini_reply or self.current_reply
        if self.current_app == "antigravity":
            return self.antigravity_reply or self.current_reply
        return self.current_reply
