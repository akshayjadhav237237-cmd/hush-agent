# Hush Troubleshooting & Real-Desktop Diagnostics Guide

This document covers operational edge cases, hardware-level diagnostic failures, and resolutions encountered when deploying Hush on physical Windows desktops and headless automation environments.

---

## 🛠️ Diagnostics & Diagnostic Tools First

Before diagnosing manual issues, run Hush's automated health checks:

### 1. Environment & Capability Diagnostics (`--doctor`)
Validates OS prerequisites, credentials, display scaling, hooks, and local tools:
```powershell
python orchestrator.py --doctor
```
This inspects 14 system checkpoints:
- **Python Version**: Confirms Python $\ge$ 3.10.
- **Required Packages**: Verifies 10 core libraries (`google-genai`, `pyautogui`, `pyperclip`, `pygetwindow`, `requests`, `pillow`, `openai`, `playwright`, `pywinauto`, `psutil`).
- **Gemini API Credentials**: Checks `GEMINI_API_KEY` validity and live response from Gemma 4 (`gemma-4-26b-a4b-it`).
- **Push Notifications (ntfy.sh)**: Tests connectivity to configured `NTFY_TOPIC`.
- **Display Resolution & DPI Scaling**: Detects active screen resolution and warns if DPI scaling is not 100%.
- **Monitor Configuration**: Identifies multi-monitor setups that may cause coordinate offsets.
- **Google Chrome & Profiles**: Locates `chrome.exe` and enumerates user data profiles.
- **Graphify Code Knowledge Graph**: Checks `graphify` CLI availability on PATH or via `uv tool list`.
- **Clipboard Round-Trip**: Performs atomic write, read, and restore verification using `pyperclip`.
- **Emergency Kill Hotkey (Ctrl+Alt+K)**: Validates Win32 `GetAsyncKeyState` 20 Hz background polling.
- **Mouse-Corner Hardware Failsafe**: Verifies `pyautogui.FAILSAFE = True` at coordinate `(0, 0)`.
- **Antigravity IDE**: Checks PATH and Windows Start Menu shortcuts for `Antigravity.lnk`.
- **Available Disk Space**: Checks for at least 2 GB of free drive space.
- **Project Directory Writable**: Verifies write/read/delete file permissions in workspace.

Diagnostic results are printed to the console and serialized to `verification/doctor_<timestamp>.json`.

### 2. Browser Selector Live Diagnostic (`--doctor-ui`)
Audits live DOM selectors for Claude and Gemini over Chrome DevTools Protocol (CDP):
```powershell
python orchestrator.py --doctor-ui
```
Reports every selector from `config/selectors.json` as `VALID` (element visible), `IN_DOM` (rendered but hidden), or `STALE` (not found).

### 3. Screen Coordinate Calibration (`--calibrate`)
Calibrates mouse coordinates for physical Antigravity IDE UI elements:
```powershell
python orchestrator.py --calibrate
```
Interactively guides positioning over the chat prompt input and editor pane, saving exact screen coordinates to `config/calibration.json`.

---

## 🔍 Specific Desktop Edge Cases & Resolutions

### 1. PyAutoGUI Failsafe Trips at `(0, 0)` in Background / Headless Sessions

#### The Issue
Hush enables hardware failsafes by default (`pyautogui.FAILSAFE = True` in [`core/desktop_tools.py`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/desktop_tools.py)). When the mouse cursor reaches the extreme top-left corner `(0, 0)`, PyAutoGUI immediately raises `pyautogui.FailSafeException`, which Hush catches via `is_failsafe()` to abort execution with exit code `2` (`EXIT_FAILSAFE`).

In background automation, remote desktop (RDP) sessions, virtual machines, or right after screen unlocking, Windows frequently parks or initializes the mouse pointer at coordinate `(0, 0)`. When Hush attempts to paste text, click, or switch windows, PyAutoGUI evaluates the cursor coordinate, sees `(0, 0)`, and immediately trips an accidental failsafe abort.

#### Root Cause
Windows virtual displays and uninitialized pointer sessions set `GetCursorPos()` to `(0, 0)` until physical pointer input occurs.

#### Resolution & Best Practices
1. **Interactive Desktops**: Ensure the physical display is unlocked and move the mouse away from the top-left corner (e.g., to screen center) before starting the agent.
2. **Headless / Background Workflows**: If running automated tests or headless sessions, check cursor coordinates before executing mouse-dependent actions. For programmatic operations where cursor parking at `(0, 0)` is detected:
   ```python
   pos = pyautogui.position()
   was_failsafe = pyautogui.FAILSAFE
   if pos == (0, 0):
       # Temporarily bypass failsafe for this specific action to prevent false abort
       pyautogui.FAILSAFE = False
   try:
       desktop.paste_any(payload)
   finally:
       pyautogui.FAILSAFE = was_failsafe
   ```
3. **Emergency Verification**: To verify that the failsafe handler properly intercepts real corner slams and routes to exit code 2, run `pytest agent/tests_real/test_mouse_corner.py -s`.

---

### 2. Windows 11 Notepad Modern App Package (MSIX) Process Lifecycle

#### The Issue
In Windows 11, Notepad is no longer the legacy Win32 binary (`C:\Windows\System32\notepad.exe`). It is packaged as a Modern MSIX / UWP WindowsApp (`Microsoft.WindowsNotepad_8wekyb3d8bbwe`).

This introduces distinct lifecycle quirks:
- **Stub Process Execution**: Spawning `subprocess.Popen(["notepad.exe"])` launches a lightweight app execution alias stub. The stub immediately launches the UWP container process and exits, leaving the original `Popen` handle disconnected from the active application process.
- **Process Termination Failure**: Calling `proc.terminate()` on the initial `Popen` object fails to close the active Notepad window.
- **Session State & Tab Restore**: Windows 11 Notepad defaults to restoring open tabs and unsaved drafts from previous sessions. Automating text entry into a restored tab can corrupt existing user notes or append to prior buffers.

#### Resolution
1. **Process Discovery via `psutil`**: Instead of relying on the spawned `Popen` PID, scan active processes by name to locate the running container instance:
   ```python
   import psutil
   notepad_pids = [
       p.pid for p in psutil.process_iter(["name", "pid"])
       if p.info["name"] and "notepad" in p.info["name"].lower()
   ]
   ```
2. **Window Targeting via Title**: Use PyGetWindow to target and activate the window title rather than relying on process handles:
   ```python
   desktop.focus_window("Notepad")
   ```
3. **Buffer Isolation**: Always clear or select existing text (`ctrl+a`) before writing new verification strings. Clean up instances cleanly by terminating all discovered Notepad PIDs:
   ```python
   for pid in notepad_pids:
       try:
           psutil.Process(pid).terminate()
       except Exception:
           pass
   ```
4. **Disable Automatic Tab Restore**: In Windows 11 Notepad, click the gear icon (Settings) -> **When Notepad starts** -> Select **Open a new window** instead of *Open content from the previous session*.

---

### 3. Dedicated Chrome CDP Connection & Profile Configuration

#### The Issue
Hush automates web interfaces (Claude and Gemini) through Chrome DevTools Protocol (CDP) using Playwright. Running CDP against your main day-to-day Chrome instance causes lock contention on user data files (`SingletonLock`), can corrupt browser profiles, and creates security risks if debugging ports are exposed to external networks.

#### Required Launch Flags
To start Chrome in dedicated CDP automation mode, launch it with the following exact parameters:

```cmd
chrome.exe ^
  --remote-debugging-port=9222 ^
  --remote-debugging-address=127.0.0.1 ^
  --user-data-dir="%LOCALAPPDATA%\Hush\chrome-profile" ^
  --no-first-run ^
  --no-default-browser-check ^
  about:blank
```

#### Why Each Flag is Mandatory:
- `--remote-debugging-port=9222`: Opens the CDP WebSocket server on port 9222 for Playwright connection (`chromium.connect_over_cdp("http://127.0.0.1:9222")`).
- `--remote-debugging-address=127.0.0.1`: **Critical security boundary**. Strictly binds the debugging interface to loopback localhost, preventing DNS rebinding attacks and external network access.
- `--user-data-dir=%LOCALAPPDATA%\Hush\chrome-profile`: Creates a dedicated, isolated browser profile directory. Keeps your personal browsing data completely untouched and prevents profile locking conflicts.
- `--no-first-run` & `--no-default-browser-check`: Suppresses Chrome setup prompts, account sync dialogs, and default browser banners that block automation.

#### First-Run Authentication Procedure:
1. Run the command above once in Command Prompt or PowerShell.
2. In the opened Chrome window, navigate to [claude.ai](https://claude.ai) and [gemini.google.com](https://gemini.google.com).
3. Log in with your credentials, completing any 2FA or CAPTCHA verification.
4. Close the browser. Your authentication cookies and sessions are safely stored in `%LOCALAPPDATA%\Hush\chrome-profile` for future autonomous runs.

---

### 4. Windows Console Encoding Issues (`UnicodeEncodeError`)

#### The Issue
Default Windows consoles (classic `cmd.exe` or PowerShell using non-UTF-8 code pages like CP437 or CP1252) cannot display Unicode emojis (e.g. 🤫, 🛑, 🧠, 🎯, 📑) or extended international characters. Printing these characters directly causes:
```
UnicodeEncodeError: 'charmap' codec can't encode character '\U0001f92b' in position ...
```
or renders corrupted replacement glyphs (`???` / mojibake).

#### Resolution
1. **Configure Terminal to UTF-8**:
   In PowerShell or Command Prompt, switch the active console code page to UTF-8 before running scripts:
   ```powershell
   chcp 65001
   $env:PYTHONUTF8 = "1"
   $env:PYTHONIOENCODING = "utf-8"
   ```
2. **Use Windows Terminal**:
   Run Hush inside **Windows Terminal** (`wt.exe`) rather than the legacy Windows Console Host (`conhost.exe`). Windows Terminal includes full native support for UTF-8 and modern emojis.
3. **Code Safeguards**:
   In custom scripts or integrations, reconfigure standard streams to replace unencodable characters safely:
   ```python
   import sys
   if sys.platform == "win32":
       sys.stdout.reconfigure(encoding="utf-8", errors="replace")
       sys.stderr.reconfigure(encoding="utf-8", errors="replace")
   ```

---

### 5. What to Do on Login / CAPTCHA Walls (Human Escalation Protocol)

#### The Issue
When interacting with web applications, Cloudflare Turnstile challenges, Google reCAPTCHAs, device verification prompts, or expired session dialogs can appear without warning. Attempting to programmatically bypass, solve, or click through CAPTCHAs violates service agreements and will lead to IP rate limiting or account suspension.

#### The Hush Resolution Pattern: Escalate & Wait
Hush is designed around the principle of **silence until escalation**. When a login wall or bot challenge appears:

```
[Agent Execution Loop]
         │
         ▼
Detect Logged-Out or Bot Challenge Indicator
         │
         ▼
Call ask_human / notify_human Tool
         │
         ▼
Pause Agent Loop & Send Mobile Push (ntfy.sh)
         │
         ▼
Operator Solves Challenge in Browser & Hits Enter
         │
         ▼
Reload Page, Verify Active Session, & Resume Silently
```

1. **Automatic Detection**: [`core/browser_driver.py`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/browser_driver.py) continuously monitors `config/selectors.json` for known `login_indicators`.
2. **Execution Halt**: Rather than retrying or guessing coordinates, the driver halts turn progression and calls `ask_human`:
   ```
   "Please log in to Claude in the Hush Chrome browser window, then press Enter to continue..."
   ```
3. **Multi-Channel Alert**: Hush prints the prompt to the active console and sends an immediate push notification to your phone via `ntfy.sh` (if `NTFY_TOPIC` is configured).
4. **Clean Resume**: The operator brings the dedicated Chrome window into focus, completes the login/CAPTCHA manually, and presses Enter in the console. Hush reloads the page (`page.reload()`), verifies that prompt inputs are available, and resumes execution seamlessly.

---

## 🖥️ Display Scaling, DPI, and Multi-Monitor Offsets

1. **DPI Scaling Warnings**:
   - PyAutoGUI maps coordinates to physical pixels, while some Windows applications scale based on virtual coordinate points.
   - For 100% deterministic coordinate accuracy, set Windows display scaling to **100%** (**Windows Settings** -> **Display** -> **Scale** -> **100%**).
   - If using 125% or 150% scaling, run `python orchestrator.py --calibrate` to adjust click targets.

2. **Multi-Monitor Setup**:
   - Secondary monitors placed to the left or above the primary monitor introduce negative coordinates (`x < 0` or `y < 0`).
   - PyAutoGUI failsafe checks can trigger unexpectedly if the mouse enters negative coordinate spaces.
   - Always run the target IDE and browser on the **primary display** (`SM_CXSCREEN` / `SM_CYSCREEN`).

---

## 🛑 Emergency Stops & Clean Termination

If the agent needs to be stopped immediately at any point:
- **Global Hotkey (Exit Code 3)**: Press **`Ctrl + Alt + K`**. A 20 Hz background hook detects this chord across any active application and terminates the orchestrator immediately.
- **Mouse Corner Slam (Exit Code 2)**: Slam the physical mouse pointer to the extreme top-left corner `(0, 0)` of your primary display.
- **Console Interrupt (Exit Code 1)**: Press **`Ctrl + C`** in the terminal to save an atomic checkpoint (`checkpoint.json`) and gracefully exit. You can resume later with `python orchestrator.py --resume latest`.
