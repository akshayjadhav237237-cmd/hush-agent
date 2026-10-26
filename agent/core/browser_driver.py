"""Browser automation driver for Claude and Gemini via Chrome CDP and Playwright."""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import time
from typing import Any, Callable, Optional

from core.artifacts import save_artifact
from core.audit import redact

DEFAULT_PROFILE_DIR = os.path.expandvars(r"%LOCALAPPDATA%\Hush\chrome-profile")
DEFAULT_PORT = 9222
SELECTORS_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config", "selectors.json")


def load_selectors() -> dict[str, Any]:
    """Load selector definitions from config/selectors.json."""
    if os.path.exists(SELECTORS_PATH):
        try:
            with open(SELECTORS_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def find_chrome_binary() -> Optional[str]:
    """Locate Google Chrome executable on Windows."""
    candidates = [
        shutil.which("chrome"),
        shutil.which("google-chrome"),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
    ]
    for cand in candidates:
        if cand and os.path.exists(cand):
            return cand
    return None


class BrowserDriver:
    """Manages dedicated Chrome process and Playwright CDP automation."""

    def __init__(
        self,
        profile_dir: str = DEFAULT_PROFILE_DIR,
        port: int = DEFAULT_PORT,
        ask_human: Optional[Callable[[str], str]] = None,
        audit: Optional[Any] = None,
    ) -> None:
        self.profile_dir = profile_dir
        self.port = port
        self.ask_human = ask_human
        self.audit = audit
        self._proc: Optional[subprocess.Popen[Any]] = None
        self._playwright: Optional[Any] = None
        self._browser: Optional[Any] = None
        self.selectors = load_selectors()

    def ensure_browser(self) -> Any:
        """Launch dedicated Chrome instance bound to 127.0.0.1 and connect over CDP."""
        if self._browser is not None:
            return self._browser

        chrome_exe = find_chrome_binary()
        if not chrome_exe:
            raise FileNotFoundError("Google Chrome executable not found on system.")

        os.makedirs(self.profile_dir, exist_ok=True)

        # Launch Chrome bound strictly to 127.0.0.1
        cmd = [
            chrome_exe,
            f"--user-data-dir={self.profile_dir}",
            f"--remote-debugging-port={self.port}",
            "--remote-debugging-address=127.0.0.1",
            "--no-first-run",
            "--no-default-browser-check",
            "about:blank",
        ]
        self._proc = subprocess.Popen(cmd)
        time.sleep(1.5)

        from playwright.sync_api import sync_playwright
        self._playwright = sync_playwright().start()
        self._browser = self._playwright.chromium.connect_over_cdp(f"http://127.0.0.1:{self.port}")
        return self._browser

    def close(self) -> None:
        """Close browser CDP connection and terminate dedicated process."""
        if self._browser is not None:
            try:
                self._browser.close()
            except Exception:
                pass
            self._browser = None

        if self._playwright is not None:
            try:
                self._playwright.stop()
            except Exception:
                pass
            self._playwright = None

        if self._proc is not None:
            try:
                self._proc.terminate()
                self._proc.wait(timeout=2)
            except Exception:
                try:
                    self._proc.kill()
                except Exception:
                    pass
            self._proc = None

    def get_or_create_page(self, url: str) -> Any:
        """Find an existing tab matching URL or create a new page."""
        browser = self.ensure_browser()
        context = browser.contexts[0]
        for p in context.pages:
            if url in p.url:
                p.bring_to_front()
                return p
        page = context.new_page()
        page.goto(url)
        return page

    def navigate_app(self, app: str) -> Any:
        """Open app tab (claude or gemini) and ensure logged-in state."""
        app_key = app.lower()
        if app_key not in self.selectors:
            raise ValueError(f"Unknown browser app: {app}. Available: claude, gemini")

        app_cfg = self.selectors[app_key]
        url = app_cfg["url"]
        page = self.get_or_create_page(url)
        page.wait_for_load_state("domcontentloaded", timeout=15000)

        # Check logged-out indicators
        is_logged_out = False
        for sel in app_cfg.get("login_indicators", []):
            try:
                if page.locator(sel).first.is_visible(timeout=1000):
                    is_logged_out = True
                    break
            except Exception:
                pass

        if is_logged_out and self.ask_human:
            prompt = (
                f"Please log in to {app.title()} in the Hush Chrome browser window, "
                "then press Enter to continue..."
            )
            self.ask_human(prompt)
            # Re-check login
            page.reload()
            page.wait_for_load_state("domcontentloaded")

        return page

    def send_prompt(self, app: str, prompt: str) -> str:
        """Send a prompt to the specified app using selector fallbacks."""
        page = self.navigate_app(app)
        app_cfg = self.selectors[app.lower()]

        # Find prompt box
        prompt_box = None
        for sel in app_cfg.get("prompt_box", []):
            loc = page.locator(sel).first
            try:
                if loc.is_visible(timeout=1000):
                    prompt_box = loc
                    break
            except Exception:
                pass

        if not prompt_box:
            raise RuntimeError(f"Could not locate active prompt input for {app}.")

        prompt_box.click()
        prompt_box.fill(prompt)
        time.sleep(0.5)

        # Find send button or press Enter
        send_clicked = False
        for sel in app_cfg.get("send_button", []):
            btn = page.locator(sel).first
            try:
                if btn.is_visible(timeout=1000) and btn.is_enabled(timeout=1000):
                    btn.click()
                    send_clicked = True
                    break
            except Exception:
                pass

        if not send_clicked:
            page.keyboard.press("Enter")

        if self.audit:
            self.audit.log("browser_prompt_sent", app=app, chars=len(prompt))

        return f"Prompt ({len(prompt)} chars) submitted to {app}."

    def wait_done(
        self,
        app: str,
        timeout_seconds: Optional[int] = None,
        stable_seconds: int = 8,
    ) -> bool:
        """Wait until generation completes (stop button gone and text stable for N seconds)."""
        app_key = app.lower()
        app_cfg = self.selectors.get(app_key, {})
        default_timeout = 2400 if "deep" in app_key else 600
        timeout = timeout_seconds or default_timeout

        page = self.navigate_app(app)
        start_time = time.time()
        last_text = ""
        stable_count = 0

        while time.time() - start_time < timeout:
            # 1. Check if stop control is active
            stop_visible = False
            for sel in app_cfg.get("stop_control", []):
                try:
                    if page.locator(sel).first.is_visible(timeout=500):
                        stop_visible = True
                        break
                except Exception:
                    pass

            # 2. Extract current reply text
            current_text = ""
            for sel in app_cfg.get("reply_text", []):
                try:
                    loc = page.locator(sel).last
                    if loc.is_visible(timeout=500):
                        current_text = loc.inner_text()
                        if current_text.strip():
                            break
                except Exception:
                    pass

            if not stop_visible and current_text:
                if current_text == last_text:
                    stable_count += 1
                    if stable_count >= stable_seconds:
                        return True
                else:
                    stable_count = 0
                    last_text = current_text
            else:
                stable_count = 0

            time.sleep(1.0)

        # Timeout reached -> request operator attention
        if self.ask_human:
            reply = self.ask_human(
                f"{app.title()} has been generating for {int(timeout / 60)} minutes. "
                "Has it completed? [y/N]: "
            )
            return reply.strip().lower() in ("y", "yes")
        return False

    def get_reply(self, app: str, run_dir: str, artifact_name: str) -> tuple[str, str]:
        """Extract latest response text, redact sensitive tokens, and store as artifact."""
        page = self.navigate_app(app)
        app_cfg = self.selectors.get(app.lower(), {})

        reply_text = ""
        for sel in app_cfg.get("reply_text", []):
            try:
                loc = page.locator(sel).last
                if loc.is_visible(timeout=1000):
                    reply_text = loc.inner_text()
                    if reply_text.strip():
                        break
            except Exception:
                pass

        if not reply_text:
            raise RuntimeError(f"No reply text found in {app} window.")

        # Redact any credentials that might appear
        cleaned = redact(reply_text)
        art_path = save_artifact(run_dir, artifact_name, cleaned)
        summary = f"Retrieved {len(cleaned)} characters from {app} and saved to artifact '{artifact_name}'."
        return summary, art_path

    def select_mode(self, app: str, mode: str) -> str:
        """Select specialized mode (e.g., Deep Research in Gemini)."""
        page = self.navigate_app(app)
        app_cfg = self.selectors.get(app.lower(), {})

        if app.lower() == "gemini" and "deep" in mode.lower():
            # Trigger Deep Research mode
            for sel in app_cfg.get("mode_selector", []):
                try:
                    loc = page.locator(sel).first
                    if loc.is_visible(timeout=1000):
                        loc.click()
                        time.sleep(0.5)
                        break
                except Exception:
                    pass

            # Check for Deep Research confirmation modal
            for sel in app_cfg.get("deep_research_confirm", []):
                try:
                    btn = page.locator(sel).first
                    if btn.is_visible(timeout=1000):
                        btn.click()
                        time.sleep(0.5)
                        break
                except Exception:
                    pass

            return "Selected Gemini Deep Research mode."
        return f"Mode selection '{mode}' applied for {app}."


def run_doctor_ui() -> int:
    """Test every selector in selectors.json live and report valid vs stale."""
    print("\n" + "=" * 80)
    print(" HUSH BROWSER UI SELECTOR DOCTOR (--doctor-ui)")
    print("=" * 80)

    driver = BrowserDriver()
    selectors = load_selectors()

    try:
        driver.ensure_browser()
    except Exception as exc:
        print(f"[FAIL] Could not launch Chrome or connect via CDP: {exc}")
        return 1

    print(f"Connected to dedicated Chrome on 127.0.0.1:{driver.port}")
    print(f"Profile: {driver.profile_dir}\n")

    total_selectors = 0
    valid_selectors = 0

    try:
        for app, cfg in selectors.items():
            url = cfg.get("url", "")
            print(f"--- Checking {app.upper()} ({url}) ---")
            try:
                page = driver.get_or_create_page(url)
                page.wait_for_load_state("domcontentloaded", timeout=10000)
            except Exception as e:
                print(f"  [WARN] Failed to load {url}: {e}")
                continue

            for category, sel_list in cfg.items():
                if category == "url":
                    continue
                if not isinstance(sel_list, list):
                    continue

                for sel in sel_list:
                    total_selectors += 1
                    try:
                        count = page.locator(sel).count()
                        is_vis = False
                        if count > 0:
                            is_vis = page.locator(sel).first.is_visible(timeout=500)
                        status = "VALID" if is_vis else ("IN_DOM" if count > 0 else "STALE")
                        if is_vis:
                            valid_selectors += 1
                        print(f"  [{status:<6}] {app}.{category:<14} -> {sel}")
                    except Exception as err:
                        print(f"  [ERROR ] {app}.{category:<14} -> {sel} ({err})")

            print()

        print("-" * 80)
        print(f"SELECTOR AUDIT SUMMARY: {valid_selectors}/{total_selectors} active selectors visible")
        print("=" * 80 + "\n")
        return 0
    finally:
        driver.close()

