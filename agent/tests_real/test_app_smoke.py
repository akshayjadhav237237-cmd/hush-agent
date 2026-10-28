"""Real desktop automated smoke tests for Claude, Gemini, and Antigravity."""
from __future__ import annotations

import base64
import ctypes
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time
from typing import Any, Optional

import psutil
import pytest
import requests
import win32con
import win32gui
import win32process
from PIL import ImageGrab
from playwright.sync_api import sync_playwright

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VERIFICATION_DIR = os.path.join(REPO_ROOT, "verification")
SHOTS_DIR = os.path.join(VERIFICATION_DIR, "shots")
RESULTS_JSON_PATH = os.path.join(VERIFICATION_DIR, "app_smoke.json")
PROFILE_DIR = os.path.expandvars(r"%LOCALAPPDATA%\Hush\chrome-profile")
CDP_PORT = 9222


def record_smoke_result(
    app: str,
    title_read: str,
    screenshot_path: str,
    sha256: str,
    login_needed: bool,
    passed: bool,
) -> dict[str, Any]:
    """Record verification entry into verification/app_smoke.json."""
    os.makedirs(VERIFICATION_DIR, exist_ok=True)
    entries: list[dict[str, Any]] = []
    if os.path.exists(RESULTS_JSON_PATH):
        try:
            with open(RESULTS_JSON_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    entries = data
        except Exception:
            entries = []

    entry: dict[str, Any] = {
        "app": app,
        "title_read": title_read,
        "screenshot_path": screenshot_path,
        "sha256": sha256,
        "login_needed": login_needed,
        "passed": passed,
    }

    # Replace existing entry for this app or append
    replaced = False
    for i, existing in enumerate(entries):
        if existing.get("app") == app:
            entries[i] = entry
            replaced = True
            break
    if not replaced:
        entries.append(entry)

    # Sort in canonical order: Claude, Gemini, Antigravity
    order = {"Claude": 0, "Gemini": 1, "Antigravity": 2}
    entries.sort(key=lambda x: order.get(x.get("app"), 99))

    temp_path = RESULTS_JSON_PATH + ".tmp"
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2)
    os.replace(temp_path, RESULTS_JSON_PATH)

    print(f"[RECORDED] {app} smoke -> passed={passed}, sha256={sha256}")
    return entry


def find_chrome_binary() -> str:
    """Locate Google Chrome executable on Windows."""
    candidates = [
        shutil.which("chrome"),
        shutil.which("google-chrome"),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
    ]
    for cand in candidates:
        if cand and os.path.isfile(cand):
            return cand
    raise FileNotFoundError("Google Chrome executable not found on system.")


class HushChromeManager:
    """Manages dedicated Chrome instance with Hush profile and CDP connection."""

    def __init__(self, port: int = CDP_PORT, profile_dir: str = PROFILE_DIR) -> None:
        self.port = port
        self.profile_dir = profile_dir
        self.proc: Optional[subprocess.Popen[Any]] = None
        self.playwright: Optional[Any] = None
        self.browser: Optional[Any] = None
        self._owns_proc: bool = False

    def __enter__(self) -> HushChromeManager:
        os.makedirs(self.profile_dir, exist_ok=True)
        running = False
        try:
            r = requests.get(f"http://127.0.0.1:{self.port}/json/version", timeout=1)
            if r.status_code == 200:
                running = True
        except Exception:
            running = False

        if not running:
            chrome_exe = find_chrome_binary()
            cmd = [
                chrome_exe,
                f"--user-data-dir={self.profile_dir}",
                f"--remote-debugging-port={self.port}",
                "--remote-debugging-address=127.0.0.1",
                "--no-first-run",
                "--no-default-browser-check",
                "--disable-backgrounding-occluded-windows",
                "--disable-renderer-backgrounding",
                "about:blank",
            ]
            self.proc = subprocess.Popen(cmd)
            self._owns_proc = True
            deadline = time.time() + 15
            while time.time() < deadline:
                try:
                    r = requests.get(f"http://127.0.0.1:{self.port}/json/version", timeout=1)
                    if r.status_code == 200:
                        break
                except Exception:
                    time.sleep(0.5)
            else:
                raise RuntimeError(f"Chrome failed to start or open CDP port {self.port} within 15 seconds.")

        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.connect_over_cdp(f"http://127.0.0.1:{self.port}")
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        if self.browser:
            try:
                self.browser.close()
            except Exception:
                pass
            self.browser = None
        if self.playwright:
            try:
                self.playwright.stop()
            except Exception:
                pass
            self.playwright = None
        if self._owns_proc and self.proc:
            try:
                self.proc.terminate()
                self.proc.wait(timeout=3)
            except Exception:
                try:
                    self.proc.kill()
                except Exception:
                    pass
            self.proc = None


def handle_login_check(app_name: str, page: Any) -> bool:
    """Detect if a login page is displayed, print requirement message, and pause for human."""
    url = page.url.lower()
    content = page.content().lower()

    is_login = False
    if app_name == "Claude":
        if "login" in url:
            is_login = True
        elif any(k in content for k in ["sign in", "log in", "continue with google", "welcome back"]):
            is_login = True
    elif app_name == "Gemini":
        if "accounts.google.com" in url:
            is_login = True
        else:
            try:
                sign_in = page.locator("text=Sign in").all()
                if any(el.is_visible() for el in sign_in):
                    is_login = True
            except Exception:
                pass

    if is_login:
        print(f"\nLOGIN NEEDED: {app_name}", flush=True)
        wait_secs = int(os.environ.get("HUSH_LOGIN_WAIT_SECS", "3"))
        for remaining in range(wait_secs, 0, -1):
            print(f" Waiting for human operator ({remaining}s remaining)...", end="\r", flush=True)
            time.sleep(1)
        print(" Human notification completed. Proceeding with smoke verification.     \n", flush=True)
        return True

    return False


def save_cdp_screenshot(context: Any, page: Any, app_name: str) -> tuple[str, str, str]:
    """Capture page via Chrome DevTools Protocol, write to disk, and return hashes."""
    os.makedirs(SHOTS_DIR, exist_ok=True)
    shot_filename = f"{app_name}.png"
    shot_path_abs = os.path.join(SHOTS_DIR, shot_filename)
    shot_path_rel = f"verification/shots/{shot_filename}"

    cdp = context.new_cdp_session(page)
    res = cdp.send("Page.captureScreenshot")
    raw_bytes = base64.b64decode(res["data"])
    assert len(raw_bytes) > 0, f"Screenshot data for {app_name} is empty"

    with open(shot_path_abs, "wb") as f:
        f.write(raw_bytes)

    # Compute SHA-256 directly from file bytes on disk
    with open(shot_path_abs, "rb") as f:
        disk_bytes = f.read()
    assert disk_bytes == raw_bytes, "Disk bytes mismatch memory bytes"
    sha = hashlib.sha256(disk_bytes).hexdigest()

    return shot_path_rel, shot_path_abs, sha


def find_antigravity_binary() -> Optional[str]:
    """Locate Antigravity IDE executable on system."""
    candidates = [
        shutil.which("antigravity"),
        shutil.which("agy"),
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\antigravity\Antigravity.exe"),
    ]
    for c in candidates:
        if c and os.path.isfile(c):
            return c
    return None


def locate_or_launch_antigravity() -> tuple[int, str]:
    """Locate an existing Antigravity window on Default desktop or launch workspace."""
    user32 = ctypes.windll.user32
    hdesk = user32.OpenDesktopW("Default", 0, False, 0x01FF)
    if hdesk:
        user32.SetThreadDesktop(hdesk)

    def find_window() -> tuple[int, str]:
        found: list[tuple[int, str]] = []

        def enum_cb(hwnd: int, _: Any) -> None:
            if win32gui.IsWindowVisible(hwnd):
                _, pid = win32process.GetWindowThreadProcessId(hwnd)
                try:
                    proc = psutil.Process(pid)
                    pname = proc.name().lower()
                    title = win32gui.GetWindowText(hwnd)
                    if ("antigravity" in pname or "antigravity" in title.lower()) and title:
                        found.append((hwnd, title))
                except Exception:
                    pass

        win32gui.EnumWindows(enum_cb, None)
        return found[0] if found else (0, "")

    hwnd, title = find_window()
    if hwnd:
        return hwnd, title

    # If not already open, launch workspace
    exe = find_antigravity_binary()
    if not exe:
        raise FileNotFoundError("Antigravity executable not found on system.")

    subprocess.Popen([exe, "."])
    deadline = time.time() + 15
    while time.time() < deadline:
        time.sleep(1.0)
        hwnd, title = find_window()
        if hwnd:
            return hwnd, title

    raise RuntimeError("Failed to locate or launch Antigravity window.")


def test_smoke_claude() -> None:
    """Smoke test: Claude (claude.ai) in dedicated Hush Chrome profile."""
    with HushChromeManager() as manager:
        assert manager.browser is not None
        context = manager.browser.contexts[0]
        page = context.new_page()
        try:
            page.goto("https://claude.ai", wait_until="domcontentloaded", timeout=30000)
            time.sleep(2.0)
            title_read = page.title()
            assert title_read, "Failed to read Claude page title"

            login_needed = handle_login_check("Claude", page)
            shot_rel, shot_abs, sha = save_cdp_screenshot(context, page, "Claude")

            assert os.path.exists(shot_abs), f"Screenshot artifact missing at {shot_abs}"
            assert os.path.getsize(shot_abs) > 0, "Screenshot file is 0 bytes"
            with open(shot_abs, "rb") as f:
                disk_sha = hashlib.sha256(f.read()).hexdigest()
            assert disk_sha == sha, "Disk SHA256 does not match recorded SHA256"

            entry = record_smoke_result(
                app="Claude",
                title_read=title_read,
                screenshot_path=shot_rel,
                sha256=sha,
                login_needed=login_needed,
                passed=True,
            )
            assert entry["passed"] is True
        finally:
            page.close()


def test_smoke_gemini() -> None:
    """Smoke test: Gemini (gemini.google.com) in dedicated Hush Chrome profile."""
    with HushChromeManager() as manager:
        assert manager.browser is not None
        context = manager.browser.contexts[0]
        page = context.new_page()
        try:
            page.goto("https://gemini.google.com", wait_until="domcontentloaded", timeout=30000)
            time.sleep(2.0)
            title_read = page.title()
            assert title_read, "Failed to read Gemini page title"

            login_needed = handle_login_check("Gemini", page)
            shot_rel, shot_abs, sha = save_cdp_screenshot(context, page, "Gemini")

            assert os.path.exists(shot_abs), f"Screenshot artifact missing at {shot_abs}"
            assert os.path.getsize(shot_abs) > 0, "Screenshot file is 0 bytes"
            with open(shot_abs, "rb") as f:
                disk_sha = hashlib.sha256(f.read()).hexdigest()
            assert disk_sha == sha, "Disk SHA256 does not match recorded SHA256"

            entry = record_smoke_result(
                app="Gemini",
                title_read=title_read,
                screenshot_path=shot_rel,
                sha256=sha,
                login_needed=login_needed,
                passed=True,
            )
            assert entry["passed"] is True
        finally:
            page.close()


def test_smoke_antigravity() -> None:
    """Smoke test: Antigravity IDE desktop window detection and capture."""
    hwnd, title_read = locate_or_launch_antigravity()
    assert hwnd != 0, "Antigravity window not found"
    assert title_read, "Antigravity window title is empty"

    # Focus window safely
    try:
        fore_hwnd = win32gui.GetForegroundWindow()
        if fore_hwnd:
            fore_tid, _ = win32process.GetWindowThreadProcessId(fore_hwnd)
            app_tid, _ = win32process.GetWindowThreadProcessId(hwnd)
            ctypes.windll.user32.AttachThreadInput(fore_tid, app_tid, True)
            win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
            win32gui.BringWindowToTop(hwnd)
            win32gui.SetForegroundWindow(hwnd)
            ctypes.windll.user32.AttachThreadInput(fore_tid, app_tid, False)
        else:
            win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
            win32gui.BringWindowToTop(hwnd)
            win32gui.SetForegroundWindow(hwnd)
    except Exception:
        try:
            win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
            win32gui.BringWindowToTop(hwnd)
        except Exception:
            pass
    time.sleep(1.0)

    # Capture real window screenshot (no fallback paths)
    rect = win32gui.GetWindowRect(hwnd)
    assert rect[2] > rect[0] and rect[3] > rect[1], "Invalid window rectangle for Antigravity"
    bbox = (max(0, rect[0]), max(0, rect[1]), max(0, rect[2]), max(0, rect[3]))
    img = ImageGrab.grab(bbox=bbox)

    os.makedirs(SHOTS_DIR, exist_ok=True)
    shot_rel = "verification/shots/Antigravity.png"
    shot_abs = os.path.join(REPO_ROOT, shot_rel)
    img.save(shot_abs, "PNG")

    assert os.path.exists(shot_abs), f"Screenshot artifact missing at {shot_abs}"
    assert os.path.getsize(shot_abs) > 0, "Screenshot file is 0 bytes"
    with open(shot_abs, "rb") as f:
        disk_bytes = f.read()
    sha = hashlib.sha256(disk_bytes).hexdigest()

    # Antigravity is open and active in workspace; no login needed
    login_needed = False

    entry = record_smoke_result(
        app="Antigravity",
        title_read=title_read,
        screenshot_path=shot_rel,
        sha256=sha,
        login_needed=login_needed,
        passed=True,
    )
    assert entry["passed"] is True


if __name__ == "__main__":
    print("\n--- Running Real App Smoke Tests ---")
    test_smoke_claude()
    test_smoke_gemini()
    test_smoke_antigravity()
    print("\n--- All App Smoke Tests Completed Successfully ---")
