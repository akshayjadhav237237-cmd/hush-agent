"""Chrome profile account switcher with safety constraints and rate limits."""
import os
import subprocess
import time
from typing import Any, Callable, Optional

CAUTION_NOTICE: str = (
    "Switching between accounts to work around usage limits may violate the terms of "
    "the services involved and could get those accounts restricted. Use only your own "
    "accounts. Hush never stores or types passwords."
)
CONFIRM_PHRASE: str = "I UNDERSTAND"
MAX_SWITCHES: int = 2
COOLDOWN_SECONDS: float = 120.0


def parse_profiles(env_value: Optional[str] = None) -> list[str]:
    """Parse comma-separated profile names, ignoring empty values."""
    if env_value is None:
        env_value = os.getenv("HUSH_CHROME_PROFILES")
    if not env_value:
        return []
    return [p.strip() for p in env_value.split(",") if p.strip()]


def find_chrome(chrome_path: Optional[str] = None) -> Optional[str]:
    """Locate the Chrome executable on the system."""
    if chrome_path and os.path.exists(chrome_path):
        return chrome_path
    env_chrome = os.getenv("CHROME_PATH")
    if env_chrome and os.path.exists(env_chrome):
        return env_chrome
    candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expanduser(r"~\AppData\Local\Google\Chrome\Application\chrome.exe"),
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return None


class AccountSwitcher:
    """Manages switching between Chrome profiles with rate limits and terms confirmation."""

    def __init__(
        self,
        profiles: list[str],
        chrome_path: Optional[str] = None,
        popen: Optional[Callable[..., Any]] = None,
        clock: Callable[[], float] = time.monotonic,
        audit: Optional[Any] = None,
    ) -> None:
        self.profiles: list[str] = list(profiles)
        self.chrome_path: Optional[str] = chrome_path
        self.popen: Callable[..., Any] = popen or subprocess.Popen
        self.clock: Callable[[], float] = clock
        self.audit: Optional[Any] = audit
        self.current_idx: int = 0
        self.switch_count: int = 0
        self.last_switch_time: float = 0.0
        self.confirmed: bool = False

    def confirm(
        self,
        input_fn: Optional[Callable[[], str]] = None,
        accepted_flag: bool = False,
    ) -> bool:
        """Confirm user understanding of account switching terms."""
        print(CAUTION_NOTICE)
        if accepted_flag:
            self.confirmed = True
            if self.audit:
                self.audit.log("switch_terms_accepted", accepted_by="flag")
            return True
        actual_input = input_fn if input_fn is not None else input
        print(f"Type '{CONFIRM_PHRASE}' to enable account switching: ")
        ans = actual_input().strip()
        if ans == CONFIRM_PHRASE:
            self.confirmed = True
            if self.audit:
                self.audit.log("switch_terms_accepted", accepted_by="input")
            return True
        return False

    def can_switch(self) -> tuple[bool, str]:
        """Check whether switching profiles is currently allowed."""
        if not self.confirmed:
            return False, "Terms not confirmed. Must type 'I UNDERSTAND' to proceed."
        if len(self.profiles) < 2:
            return False, "Account switching requires at least 2 Chrome profiles."
        if self.switch_count >= MAX_SWITCHES:
            return False, f"Maximum profile switches reached ({MAX_SWITCHES}). Notify the human."
        elapsed = self.clock() - self.last_switch_time
        if elapsed < COOLDOWN_SECONDS and self.switch_count > 0:
            rem = int(COOLDOWN_SECONDS - elapsed)
            return False, f"Cooldown active: wait {rem} seconds before switching again."
        return True, "Ready"

    def switch(self, app: str) -> str:
        """Switch to the next Chrome profile for the given application."""
        app_low = app.lower()
        if "antigravity" in app_low:
            return "Account switching is not supported for Antigravity; notify the human."
        if app_low not in ("claude", "gemini"):
            return f"Account switching unsupported for '{app}'. Supported: claude, gemini."
        ok, reason = self.can_switch()
        if not ok:
            return f"Cannot switch profile: {reason}"
        next_idx = (self.current_idx + 1) % len(self.profiles)
        next_profile = self.profiles[next_idx]
        url = "https://claude.ai/new" if app_low == "claude" else "https://gemini.google.com/app"
        exe = find_chrome(self.chrome_path)
        if not exe:
            return "Chrome executable not found. Configure CHROME_PATH."
        self.popen([exe, f"--profile-directory={next_profile}", url])
        self.current_idx = next_idx
        self.switch_count += 1
        self.last_switch_time = self.clock()
        if self.audit:
            self.audit.log(
                "account_switched",
                app=app_low,
                profile=next_profile,
                switch_number=self.switch_count,
            )
        return (
            f"Switched {app} to profile '{next_profile}'. "
            "Take a screenshot to verify. If a login page or error shows, call notify_human."
        )
