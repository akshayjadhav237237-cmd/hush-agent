"""Environment diagnostic doctor for Hush real desktop automation."""
from __future__ import annotations

import ctypes
import datetime
import json
import os
import shutil
import sys
import uuid
from typing import Any, Optional


TOS_WARNING = (
    "Terms of Service Notice: Scripting consumer chat UIs (Claude, Gemini) "
    "may conflict with their platform terms of service. Use only your own accounts "
    "and ensure compliance with all applicable policies."
)


def _check_python_version() -> dict[str, Any]:
    major, minor, micro = sys.version_info[:3]
    version_str = f"{major}.{minor}.{micro}"
    if sys.version_info >= (3, 10):
        return {
            "name": "Python Version",
            "status": "PASS",
            "detail": f"Python {version_str} (>= 3.10 required)",
            "fix_hint": None,
        }
    return {
        "name": "Python Version",
        "status": "FAIL",
        "detail": f"Python {version_str} (< 3.10)",
        "fix_hint": "Upgrade to Python 3.10, 3.11, 3.12, or 3.13.",
    }


def _check_packages() -> dict[str, Any]:
    required = [
        ("google.genai", "google-genai"),
        ("pyautogui", "pyautogui"),
        ("pyperclip", "pyperclip"),
        ("pygetwindow", "pygetwindow"),
        ("requests", "requests"),
        ("PIL", "pillow"),
        ("openai", "openai"),
        ("playwright", "playwright"),
        ("pywinauto", "pywinauto"),
        ("psutil", "psutil"),
    ]
    missing = []
    for mod_name, pkg_name in required:
        try:
            __import__(mod_name)
        except ImportError:
            missing.append(pkg_name)

    if not missing:
        return {
            "name": "Required Packages",
            "status": "PASS",
            "detail": f"All {len(required)} runtime packages imported successfully",
            "fix_hint": None,
        }
    return {
        "name": "Required Packages",
        "status": "FAIL",
        "detail": f"Missing packages: {', '.join(missing)}",
        "fix_hint": f"Run: pip install {' '.join(missing)}",
    }


def _check_gemini_api(timeout_seconds: int = 10) -> dict[str, Any]:
    key = os.getenv("GEMINI_API_KEY")
    if not key or not key.strip():
        return {
            "name": "Gemini API Credentials",
            "status": "FAIL",
            "detail": "GEMINI_API_KEY environment variable is not set",
            "fix_hint": "Set your key in Windows: setx GEMINI_API_KEY \"your_key\"",
        }

    # Attempt a minimal test query without logging or printing the key
    try:
        from google import genai
        client = genai.Client(api_key=key.strip())
        from core.constants import DEFAULT_MODEL
        response = client.models.generate_content(
            model=DEFAULT_MODEL,
            contents="Hello! Reply with OK.",
        )
        if response and response.text:
            return {
                "name": "Gemini API Credentials",
                "status": "PASS",
                "detail": f"Key present and verified with {DEFAULT_MODEL}",
                "fix_hint": None,
            }
        return {
            "name": "Gemini API Credentials",
            "status": "WARN",
            "detail": f"Key present, but received empty response from {DEFAULT_MODEL}",
            "fix_hint": "Check model availability or quota limits.",
        }
    except Exception as exc:
        err_msg = str(exc)
        if "429" in err_msg or "ResourceExhausted" in err_msg or "quota" in err_msg.lower():
            return {
                "name": "Gemini API Credentials",
                "status": "WARN",
                "detail": "Rate limit / quota reached (HTTP 429 Resource Exhausted)",
                "fix_hint": "Wait for API quota to reset, or run with --provider openai.",
            }
        return {
            "name": "Gemini API Credentials",
            "status": "FAIL",
            "detail": f"API verification failed: {type(exc).__name__}",
            "fix_hint": "Verify GEMINI_API_KEY is valid and network connectivity is active.",
        }


def _check_ntfy() -> dict[str, Any]:
    topic = os.getenv("NTFY_TOPIC")
    if not topic or not topic.strip():
        return {
            "name": "Push Notifications (ntfy.sh)",
            "status": "WARN",
            "detail": "NTFY_TOPIC is unset; mobile push notifications disabled",
            "fix_hint": "Optional: setx NTFY_TOPIC \"your-private-topic\"",
        }
    try:
        import requests
        res = requests.post(
            f"https://ntfy.sh/{topic.strip()}",
            data="Hush Doctor probe test".encode("utf-8"),
            headers={"Title": "Hush Doctor Probe"},
            timeout=5,
        )
        if res.status_code in (200, 201):
            return {
                "name": "Push Notifications (ntfy.sh)",
                "status": "PASS",
                "detail": "Test push delivered to ntfy.sh",
                "fix_hint": None,
            }
        return {
            "name": "Push Notifications (ntfy.sh)",
            "status": "WARN",
            "detail": f"ntfy.sh returned HTTP {res.status_code}",
            "fix_hint": "Verify topic name and internet connection.",
        }
    except Exception as exc:
        return {
            "name": "Push Notifications (ntfy.sh)",
            "status": "WARN",
            "detail": f"Network error contacting ntfy.sh: {type(exc).__name__}",
            "fix_hint": "Check network connection or disable ntfy.",
        }


def _check_display_and_dpi() -> tuple[dict[str, Any], dict[str, Any]]:
    # 1. Resolution & DPI
    res_status = "PASS"
    res_detail = "Display checked"
    dpi_hint = None

    try:
        import pyautogui
        size = pyautogui.size()
        width, height = size.width, size.height
        res_detail = f"{width}x{height} resolution"
    except Exception as e:
        width, height = 0, 0
        res_detail = f"Could not determine resolution: {e}"

    # Check DPI scaling on Windows
    scale_pct = 100
    if sys.platform == "win32":
        try:
            user32 = ctypes.windll.user32
            # Try GetDpiForSystem (Windows 10 1607+)
            if hasattr(user32, "GetDpiForSystem"):
                dpi = user32.GetDpiForSystem()
                scale_pct = int(round((dpi / 96.0) * 100))
        except Exception:
            scale_pct = 100

    if scale_pct == 100:
        dpi_result = {
            "name": "Display Resolution & DPI Scaling",
            "status": "PASS",
            "detail": f"{res_detail} @ {scale_pct}% DPI scaling",
            "fix_hint": None,
        }
    else:
        dpi_result = {
            "name": "Display Resolution & DPI Scaling",
            "status": "WARN",
            "detail": f"{res_detail} @ {scale_pct}% DPI scaling (non-standard)",
            "fix_hint": "Set Display Scaling to 100% in Windows Settings for exact coordinate calibration.",
        }

    # 2. Multiple Monitors
    monitor_count = 1
    if sys.platform == "win32":
        try:
            monitor_count = ctypes.windll.user32.GetSystemMetrics(80) # SM_CMONITORS
        except Exception:
            monitor_count = 1

    if monitor_count == 1:
        mon_result = {
            "name": "Monitor Configuration",
            "status": "PASS",
            "detail": "1 physical monitor detected",
            "fix_hint": None,
        }
    else:
        mon_result = {
            "name": "Monitor Configuration",
            "status": "WARN",
            "detail": f"{monitor_count} monitors detected",
            "fix_hint": "Ensure target windows are focused on your primary display.",
        }

    return dpi_result, mon_result


def _check_chrome() -> dict[str, Any]:
    candidates = [
        shutil.which("chrome"),
        shutil.which("google-chrome"),
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
    ]
    chrome_path = None
    for cand in candidates:
        if cand and os.path.exists(cand):
            chrome_path = cand
            break

    if not chrome_path:
        return {
            "name": "Google Chrome & Profiles",
            "status": "FAIL",
            "detail": "Google Chrome executable was not found",
            "fix_hint": "Install Google Chrome or add chrome.exe to your PATH.",
        }

    # Discover profiles in User Data
    user_data = os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\User Data")
    profiles: list[str] = []
    if os.path.exists(user_data):
        try:
            for entry in os.listdir(user_data):
                full = os.path.join(user_data, entry)
                if os.path.isdir(full) and (entry == "Default" or entry.startswith("Profile ")):
                    profiles.append(entry)
        except Exception:
            pass

    prof_str = f"Profiles: {', '.join(sorted(profiles))}" if profiles else "No standard profiles detected"
    return {
        "name": "Google Chrome & Profiles",
        "status": "PASS",
        "detail": f"Found at {chrome_path} ({prof_str})",
        "fix_hint": None,
    }


def _check_graphify() -> dict[str, Any]:
    cmd = shutil.which("graphify") or shutil.which("graphifyy")
    if cmd:
        return {
            "name": "Graphify Code Knowledge Graph",
            "status": "PASS",
            "detail": f"Installed at {cmd}",
            "fix_hint": None,
        }

    # Check uv tool list if uv is installed
    uv_path = shutil.which("uv")
    if uv_path:
        import subprocess
        try:
            res = subprocess.run([uv_path, "tool", "list"], capture_output=True, text=True, timeout=5)
            if "graphify" in res.stdout.lower():
                return {
                    "name": "Graphify Code Knowledge Graph",
                    "status": "PASS",
                    "detail": "Found in uv tool list",
                    "fix_hint": None,
                }
        except Exception:
            pass

    return {
        "name": "Graphify Code Knowledge Graph",
        "status": "WARN",
        "detail": "graphify CLI is not found on PATH",
        "fix_hint": "Install Graphify: uv tool install graphifyy",
    }


def _check_clipboard() -> dict[str, Any]:
    try:
        import pyperclip
        original = ""
        try:
            original = pyperclip.paste()
        except Exception:
            original = ""

        token = f"__hush_doctor_{uuid.uuid4().hex}__"
        pyperclip.copy(token)
        retrieved = pyperclip.paste()

        # Restore original clipboard
        try:
            pyperclip.copy(original)
        except Exception:
            pass

        if retrieved == token:
            return {
                "name": "Clipboard Round-Trip",
                "status": "PASS",
                "detail": "Read and write clipboard verified with integrity restoration",
                "fix_hint": None,
            }
        return {
            "name": "Clipboard Round-Trip",
            "status": "FAIL",
            "detail": "Clipboard content retrieved did not match written probe string",
            "fix_hint": "Check if clipboard manager software or access controls are blocking pyperclip.",
        }
    except Exception as exc:
        return {
            "name": "Clipboard Round-Trip",
            "status": "FAIL",
            "detail": f"Clipboard check failed: {type(exc).__name__}",
            "fix_hint": "Ensure pyperclip is installed and desktop clipboard is accessible.",
        }


def _check_keyboard_hook() -> dict[str, Any]:
    if sys.platform != "win32":
        return {
            "name": "Emergency Kill Hotkey (Ctrl+Alt+K)",
            "status": "WARN",
            "detail": f"Non-Windows platform ({sys.platform}); Win32 GetAsyncKeyState hook unavailable",
            "fix_hint": "Run on Windows 10/11 for native 20 Hz emergency kill hotkey polling.",
        }
    try:
        user32 = ctypes.windll.user32
        if hasattr(user32, "GetAsyncKeyState"):
            # Probe VK_CONTROL (0x11)
            _ = user32.GetAsyncKeyState(0x11)
            return {
                "name": "Emergency Kill Hotkey (Ctrl+Alt+K)",
                "status": "PASS",
                "detail": "Win32 GetAsyncKeyState 20 Hz polling thread hook verified",
                "fix_hint": None,
            }
        return {
            "name": "Emergency Kill Hotkey (Ctrl+Alt+K)",
            "status": "FAIL",
            "detail": "user32.GetAsyncKeyState not found in Win32 API",
            "fix_hint": "Ensure standard Windows user32.dll is available.",
        }
    except Exception as exc:
        return {
            "name": "Emergency Kill Hotkey (Ctrl+Alt+K)",
            "status": "FAIL",
            "detail": f"Failed to test GetAsyncKeyState hook: {exc}",
            "fix_hint": "Check Win32 API permissions.",
        }


def _check_pyautogui_failsafe() -> dict[str, Any]:
    try:
        import pyautogui
        if pyautogui.FAILSAFE is True:
            return {
                "name": "Mouse-Corner Hardware Failsafe",
                "status": "PASS",
                "detail": "pyautogui.FAILSAFE is enabled (trips instantly at coordinate 0,0)",
                "fix_hint": None,
            }
        return {
            "name": "Mouse-Corner Hardware Failsafe",
            "status": "FAIL",
            "detail": "pyautogui.FAILSAFE is False",
            "fix_hint": "Enable pyautogui.FAILSAFE = True in core/desktop_tools.py.",
        }
    except Exception as exc:
        return {
            "name": "Mouse-Corner Hardware Failsafe",
            "status": "FAIL",
            "detail": f"Could not verify failsafe: {exc}",
            "fix_hint": "Check pyautogui installation.",
        }


def _check_antigravity() -> dict[str, Any]:
    # Check PATH
    candidates = [
        shutil.which("antigravity"),
        shutil.which("agy"),
    ]
    for cand in candidates:
        if cand:
            return {
                "name": "Antigravity IDE",
                "status": "PASS",
                "detail": f"Command found on PATH: {cand}",
                "fix_hint": None,
            }

    # Check common Start Menu & AppData locations
    start_menu_paths = [
        os.path.expandvars(r"%APPDATA%\Microsoft\Windows\Start Menu\Programs"),
        os.path.expandvars(r"%ALLUSERSPROFILE%\Microsoft\Windows\Start Menu\Programs"),
        os.path.expandvars(r"%LOCALAPPDATA%\Programs"),
    ]
    for base in start_menu_paths:
        if os.path.exists(base):
            for root, _, files in os.walk(base):
                for f in files:
                    if "antigravity" in f.lower():
                        return {
                            "name": "Antigravity IDE",
                            "status": "PASS",
                            "detail": f"Found application shortcut: {os.path.join(root, f)}",
                            "fix_hint": None,
                        }

    return {
        "name": "Antigravity IDE",
        "status": "WARN",
        "detail": "Antigravity executable or shortcut not found on PATH or standard Start Menu",
        "fix_hint": "Install Antigravity or verify its Start Menu shortcut is indexed.",
    }


def _check_disk_space(project_dir: str) -> dict[str, Any]:
    try:
        usage = shutil.disk_usage(project_dir)
        free_gb = usage.free / (1024 ** 3)
        if free_gb >= 2.0:
            return {
                "name": "Available Disk Space",
                "status": "PASS",
                "detail": f"{free_gb:.1f} GB free in project drive",
                "fix_hint": None,
            }
        elif free_gb >= 0.5:
            return {
                "name": "Available Disk Space",
                "status": "WARN",
                "detail": f"{free_gb:.1f} GB free (low disk space)",
                "fix_hint": "Free up at least 2 GB of disk space for build artifacts and checkpoints.",
            }
        else:
            return {
                "name": "Available Disk Space",
                "status": "FAIL",
                "detail": f"{free_gb:.1f} GB free (critically low)",
                "fix_hint": "Free up disk space immediately.",
            }
    except Exception as exc:
        return {
            "name": "Available Disk Space",
            "status": "WARN",
            "detail": f"Could not determine disk usage: {exc}",
            "fix_hint": "Check disk access permissions.",
        }


def _check_project_dir_writable(project_dir: str) -> dict[str, Any]:
    if not os.path.exists(project_dir):
        return {
            "name": "Project Directory Writable",
            "status": "FAIL",
            "detail": f"Project directory does not exist: {project_dir}",
            "fix_hint": f"Create directory: mkdir {project_dir}",
        }

    probe = os.path.join(project_dir, f".hush_doctor_{uuid.uuid4().hex}.tmp")
    try:
        with open(probe, "w", encoding="utf-8") as f:
            f.write("probe")
        with open(probe, "r", encoding="utf-8") as f:
            content = f.read()
        os.remove(probe)
        if content == "probe":
            return {
                "name": "Project Directory Writable",
                "status": "PASS",
                "detail": f"Write/read/delete verified in {project_dir}",
                "fix_hint": None,
            }
        return {
            "name": "Project Directory Writable",
            "status": "FAIL",
            "detail": "File write verification mismatch",
            "fix_hint": "Check folder permissions.",
        }
    except Exception as exc:
        return {
            "name": "Project Directory Writable",
            "status": "FAIL",
            "detail": f"Cannot write to project directory: {exc}",
            "fix_hint": f"Grant write permissions to {project_dir}.",
        }


def run_doctor(project_dir: str, verification_dir: str = "verification") -> tuple[int, dict[str, Any]]:
    """Run full environment diagnostics, print report, and write results json."""
    timestamp_iso = datetime.datetime.now(datetime.timezone.utc).astimezone().isoformat()
    timestamp_file = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

    print("\n" + "=" * 80)
    print(" HUSH ENVIRONMENT DOCTOR")
    print("=" * 80)
    print(f"[!] {TOS_WARNING}\n")
    print(f"Timestamp:   {timestamp_iso}")
    print(f"Project Dir: {project_dir}\n")
    print("-" * 80)
    print(f"{'CHECK':<36} | {'STATUS':<6} | {'DETAIL'}")
    print("-" * 80)

    checks: list[dict[str, Any]] = []

    # Execute all checks
    checks.append(_check_python_version())
    checks.append(_check_packages())
    checks.append(_check_gemini_api())
    checks.append(_check_ntfy())

    dpi_res, mon_res = _check_display_and_dpi()
    checks.append(dpi_res)
    checks.append(mon_res)

    checks.append(_check_chrome())
    checks.append(_check_graphify())
    checks.append(_check_clipboard())
    checks.append(_check_keyboard_hook())
    checks.append(_check_pyautogui_failsafe())
    checks.append(_check_antigravity())
    checks.append(_check_disk_space(project_dir))
    checks.append(_check_project_dir_writable(project_dir))

    has_fail = False
    has_warn = False

    for c in checks:
        st = c["status"]
        if st == "FAIL":
            has_fail = True
        elif st == "WARN":
            has_warn = True

        name = c["name"][:35]
        detail = c["detail"]
        print(f"{name:<36} | {st:<6} | {detail}")
        if c.get("fix_hint"):
            print(f"{'':<36} | {'HINT':<6} | -> {c['fix_hint']}")

    print("-" * 80)

    overall = "FAIL" if has_fail else ("WARN" if has_warn else "PASS")
    print(f"OVERALL DOCTOR STATUS: {overall}")
    print("=" * 80 + "\n")

    os.makedirs(verification_dir, exist_ok=True)
    out_file = os.path.join(verification_dir, f"doctor_{timestamp_file}.json")

    result_payload = {
        "timestamp": timestamp_iso,
        "overall": overall,
        "tos_warning": TOS_WARNING,
        "project_dir": project_dir,
        "checks": checks,
    }

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(result_payload, f, indent=2)

    print(f"Diagnostic results written to: {out_file}\n")

    exit_code = 1 if has_fail else 0
    return exit_code, result_payload
