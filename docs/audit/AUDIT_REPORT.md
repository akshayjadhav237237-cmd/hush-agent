# INDEPENDENT COMPREHENSIVE AUDIT REPORT: HUSH PROJECT

**Target Repositories:**
1. `C:\Users\aksha\Documents\antigravity\jolly-hawking` (`HEAD: audit-report`, based on `origin/main` @ `ef5d026`)
2. `C:\Users\aksha\Documents\antigravity\hush-landing-v2` (`HEAD: canonical-host` @ `89620da`)
**Date**: 2026-11-15  
**Audit Role**: Independent Lead Auditor  
**Audit Status**: Complete. Read-Only Assessment. Zero Source Code or Logic Modified.

---

## 1. EXECUTIVE SUMMARY

1. Hush presents an exceptionally well-structured, privacy-conscious autonomous agent architecture with 285 passing unit tests and zero external runtime dependencies on its production landing sites.
2. However, the comprehensive audit across code correctness, command safety, secrets history, test quality, claims, live sites, dependencies, safety design, and repo hygiene revealed 10 Critical and 33 High severity issues.
3. In code correctness, the orchestrator's main loop traps and swallows `KeyboardInterrupt` inside tool retry blocks, defeating operator Ctrl+C interruption and looping doomed deterministic tool errors.
4. In command safety, 157 adversarial boundary tests proved that while the allowlist blocks basic operators, it permits arbitrary code execution via `git -c`, `node -p`, unquoted whitespace in `git push`/`pip install`, and quote-split filenames like `type ."env"`.
5. In secrets and privacy, an active `VERCEL_OIDC_TOKEN` JWT was discovered in uncommitted `.env.local` in `hush-landing-v2`, and binary desktop screenshots linger in historical git blobs on branch `real-desktop`.
6. In test quality, all 285 unit tests pass deterministically across consecutive runs, but tests in `agent/tests_real/` employ software fallbacks, tautological clipboard tests, and self-raising exceptions rather than verifying genuine physical hardware.
7. In documentation claims, `docs/QA_REPORT.md` overclaims physical desktop hardware completion, directly contradicting code reality where 0 of 8 safety checks have physical verification and `GRAPH_STALL_VERIFIED` remains `false`.
8. In live site testing, the production sites at Vercel and GitHub Pages render with zero console errors, zero external third-party requests, and WCAG AA contrast compliance, but the legacy `/v1.html` route contains broken 404 assets.
9. In safety design, the emergency kill switch is cooperative rather than preemptive (blocked by synchronous operations up to 40 minutes) and fails to monitor input during Windows UAC prompts or lock screens.
10. In repository hygiene, clean-clone tests confirmed that `python orchestrator.py --demo` crashes without live API keys due to lack of an offline mock model client, and licensing is conflicted across branches (MIT vs Apache 2.0).

---

## 2. SEVERITY COUNTS

| Severity Level | Count | Description |
| :--- | :---: | :--- |
| **CRITICAL** | **10** | Immediate safety boundaries bypassed, arbitrary code execution, token leakage, unhandled crash in advertised offline demo, or keyboard interruption swallowed. |
| **HIGH** | **33** | Hardware failsafe bypasses, non-preemptive kill switch latency, process orphanage, live claim contradictions, unverified test assertions, and unconfined shell execution vectors. |
| **MEDIUM** | **37** | False positive loop breaker trips, missing CLI error codes, floating dependencies, unhandled race conditions, unpinned CI actions, and documentation divergence. |
| **LOW** | **25** | Missing skip links, redundant code ternary operators, non-atomic calibration writes, unreferenced fonts, and stale merged local git branches. |
| **INFO** | **12** | Clean contrast verification, zero third-party request confirmations, synthetic test vector notices, and operational design characteristics. |
| **TOTAL** | **117** | **Verified findings across all 10 audit subsystems.** |

---

## 3. AUDIT FINDINGS (CRITICAL TO INFO)

### 🔴 CRITICAL FINDINGS (10)

ID: A-001
Severity: CRITICAL
Location: `agent/core/loop.py:230-242`
Evidence:
```python
for attempt in range(retries + 1):
    try:
        res_str = str(fn(**tool_args))
        break
    except BaseException as exc:
        if is_failsafe(exc):
            ...
            return EXIT_FAILSAFE
        if attempt < retries and not is_non_retryable_error(exc):
            time.sleep(delay)
            delay *= 2
            continue
        res_str = format_tool_error(tool_name, exc)
```
Why it matters: `except BaseException as exc:` traps `KeyboardInterrupt` and `SystemExit`. Because `is_failsafe(KeyboardInterrupt)` is `False` and `is_non_retryable_error(KeyboardInterrupt)` is `False`, user Ctrl+C is caught, retried twice with backoff sleep, and formatted into a tool error string: `"ERROR in <tool>: KeyboardInterrupt"`. The operator cannot interrupt execution from the terminal.
Suggested fix: Re-raise `KeyboardInterrupt` and `SystemExit` immediately: `if isinstance(exc, (KeyboardInterrupt, SystemExit)): raise`.

ID: B-001
Severity: CRITICAL
Location: `agent/core/command_safety.py:100-103, 119-132`
Evidence: Input `git  -c core.fsmonitor=calc.exe status` -> `check_command` returned `None` (Allowed); `git "-c" core.editor=calc.exe commit` -> `None` (Allowed); `git\t-c core.fsmonitor=calc.exe status` -> `None` (Allowed).
Why it matters: `BLOCKED_SUBSTRINGS` matches the literal substring `'git -c'` prior to tokenization. Variations with multiple spaces, tabs, or quotes bypass the check. Step 5 contains no token validation for git, allowing arbitrary command execution on the host via git config options like `core.fsmonitor`, `core.editor`, or pager.
Suggested fix: Parse git tokens in Step 5 and reject any token matching `-c` or `--config-env` regardless of whitespace or quoting.

ID: B-002
Severity: CRITICAL
Location: `agent/core/command_safety.py:100-103, 137-142`
Evidence: Input `type ."env"` -> returned `None` (Allowed); `type cred"entials".json` -> `None` (Allowed); `type sec"rets".yaml` -> `None` (Allowed); `type .s"sh"\id_"rsa"` -> `None` (Allowed).
Why it matters: `shlex.split(posix=False)` preserves quotes inside tokens. Windows `cmd.exe` strips quotes when opening files. The check `name.lower()` in `token_lower` fails because quotes fragment the sensitive name, and `looks_like_path` treats tokens without slashes as non-paths, granting access to restricted credentials.
Suggested fix: Normalize tokens by stripping internal quote characters before checking against `BLOCKED_PATH_NAMES`.

ID: C-001
Severity: CRITICAL
Location: `hush-landing-v2/.env.local:2`
Evidence: `VERCEL_OIDC_TOKEN` assignment detected (active JWT/OIDC authentication token, 1,366 characters) stored on disk.
Why it matters: A live Vercel deployment authentication token is stored unencrypted on disk in the repository working tree. If leaked, unauthorized actors could deploy or modify Vercel resources. Must be revoked immediately.
Suggested fix: Revoke the token immediately in Vercel project security settings and remove `.env.local` from disk.

ID: D-001
Severity: CRITICAL
Location: `agent/.venv/pyvenv.cfg:1-5`
Evidence: Executing `agent\.venv\Scripts\python.exe -m pytest -q` produces `did not find executable at 'D:\anaconda3\python.exe': The system cannot find the path specified.` Contents: `home = D:\anaconda3`, `executable = D:\anaconda3\python.exe`.
Why it matters: The virtual environment checked into the repository contains hardcoded machine-specific absolute paths to a `D:\anaconda3` interpreter. Environments lacking Anaconda on drive `D:` fail to execute tests or the agent.
Suggested fix: Recreate `pyvenv.cfg` using relative paths or local system Python.

ID: F-001
Severity: CRITICAL
Location: `.git/logs/HEAD:commit 7d2e637e8d8ce15ff8f786d28ec28bdce60fcc2c`
Evidence: Commit message reads: `7d2e637 v2: match exact ECSoC bento dimensions, 4px gaps, #212121 background, Almarai font, and artwork thumbnails`.
Why it matters: Anonymity violation; leaks the competition/entity acronym "ECSoC" directly in git commit history across both repositories.
Suggested fix: Rebase or squash commit `7d2e637` to sanitize the commit message to "v2: match bento dimensions, styling, and artwork thumbnails".

ID: I-002
Severity: CRITICAL
Location: `agent/core/killswitch.py:27, 72-74` and `agent/core/loop.py:63, 177`
Evidence: In `killswitch.py`, detecting hotkeys sets `self._triggered.set()`. The main thread checks `kill.is_set()` strictly at loop boundaries and before tool dispatch. In `shell_tool.py:29`, `subprocess.run()` has `timeout=120`; in `desktop_tools.py:177`, `wait()` sleeps up to 120s; in `browser_driver.py:217`, `wait_done()` polls up to 2400s (40 min); in `model_client.py:112`, API requests block for 30–60s without polling `kill`.
Why it matters: The emergency stop is non-preemptive. If an errant shell command, 40-minute Deep Research wait, or network hang is executing, pressing `Ctrl+Alt+K` does not interrupt the thread; execution blocks until the synchronous call returns or times out.
Suggested fix: Implement preemptive termination via `os._exit()`, Windows `TerminateProcess`, or asynchronous signal dispatch directly from the kill switch thread.

ID: I-007
Severity: CRITICAL
Location: `agent/core/prompts.py:46-51` and `agent/core/loop.py:124-159`
Evidence: `SYSTEM_PLAYBOOK` instructs the model: `"Interrupt human with notify_human ONLY if: Claude starts reply with NEEDS_HUMAN:, login/captcha/credentials needed, destructive action approval, or repeated failure."` However, `notify_human` is merely an optional tool exposed in `tool_schema.py`.
Why it matters: The human escalation gate is governed entirely by LLM adherence to system prompt text. An indirect prompt injection in web content or model output can instruct the agent to bypass human notification and proceed directly to destructive execution or call `finish`.
Suggested fix: Enforce programmatic, out-of-band mandatory policy checkpoints in code that intercept high-risk actions (`finish`, external URL navigation, package installations) before dispatch.

ID: I-009
Severity: CRITICAL
Location: `agent/core/command_safety.py:6-17, 61-89` and `agent/core/shell_tool.py:23-30`
Evidence: `ALLOWED_COMMANDS` permits `{"git", "npm", "node", "python", "pip", "dir", "type", "echo", "mkdir", "cd"}`. While inline scripts (`-c`, `-e`) are restricted, an agent can write an arbitrary Python or JavaScript file into `project_dir` using standard tools or artifacts, then run `python exploit.py` or `node exploit.js`.
Why it matters: The command allowlist is an operational filter, not an operating system sandbox. A script executed via `python script.py` runs with full user privileges, capable of network egress, Win32 API calls, accessing user files outside the workspace (`%USERPROFILE%/.ssh`), and spawning unconfined processes.
Suggested fix: Execute all shell and binary commands inside an isolated container, Windows Sandbox, or restricted Windows AppContainer with strict network and filesystem virtualization.

ID: J-001
Severity: CRITICAL
Location: `agent/core/cli.py:264`, `README.md:183`
Evidence: Running `python orchestrator.py --demo --demo-answer "SQLite" "a modern task board application"` in a clean clone without API credentials crashes:
`PROVIDER: gemma / gemma-4-26b-a4b-it`
`DEMO MODE: simulated desktop, real gemma calls`
`ValueError: GEMINI_API_KEY environment variable is not set. Please set it to use ModelClient.`
Why it matters: Reproducibility blocker and misleading claim. Root `README.md` advertises "Simulated Demo Mode (No Live Keys Required) - Run a complete, deterministic multi-agent build without touching your real mouse, keyboard, or API credentials", but `--demo` only mocks the desktop via `DemoWorld` and still instantiates a live network `ModelClient` requiring real Gemini API keys.
Suggested fix: Supply a scripted or mock offline `ModelClient` fallback in `orchestrator.py` when `--demo` is invoked without API keys.

---

### 🟠 HIGH SEVERITY FINDINGS (33)

ID: A-002
Severity: HIGH
Location: `agent/core/loop.py:194-217`
Evidence: The `screenshot` tool handling executes outside the general `try...except BaseException` block:
```python
if tool_name == "screenshot":
    png = desktop.screenshot_png()
```
Why it matters: If the operator moves the mouse cursor to a screen corner while taking a screenshot, `desktop.screenshot_png()` raises `pyautogui.FailSafeException`. Because this call is unguarded, it crashes out of `run_loop`, fails to log `"failsafe_abort"`, and exits with an unhandled exception (code 1) instead of returning `EXIT_FAILSAFE` (2).
Suggested fix: Wrap `desktop.screenshot_png()` in a `try...except BaseException as exc` block checking `if is_failsafe(exc): return EXIT_FAILSAFE`.

ID: A-004
Severity: HIGH
Location: `agent/core/retry.py:19-41` and `agent/core/loop.py:74-80`
Evidence: `NON_RETRYABLE_PATTERNS` only matches `"400"`, `"invalid_request_error"`, `"invalid_request"`, `"bad_request"`. Status codes 401 Unauthorized, 403 Forbidden, 404 Not Found, and authentication failures return `False`.
Why it matters: In `loop.py`, fatal authentication and authorization errors (e.g. invalid or revoked API keys) bypass the immediate `EXIT_MODEL_FAILURE` exit and enter a 3-cycle interactive human retry loop, prompting the operator repeatedly for an unrecoverable credential error.
Suggested fix: Expand `NON_RETRYABLE_PATTERNS` to include `"401"`, `"403"`, `"404"`, `"unauthorized"`, `"forbidden"`, `"authentication"`, and check status codes in `{400, 401, 403, 404}`.

ID: A-005
Severity: HIGH
Location: `agent/core/loop.py:238`
Evidence: Tool retry evaluates `if attempt < retries and not is_non_retryable_error(exc):`.
Why it matters: Because `is_non_retryable_error` only checks for HTTP 400 errors, any deterministic local Python exception raised during tool execution—including `TypeError` (invalid arguments), `ValueError`, `KeyError`, `FileNotFoundError`, or `PermissionError`—evaluates as retryable, redundantly retrying doomed tool calls twice with sleep delays.
Suggested fix: Invert the logic to only retry explicitly transient errors: `if attempt < retries and is_retryable_error(exc):`.

ID: A-007
Severity: HIGH
Location: `agent/core/killswitch.py:65-75`
Evidence: Inside `_run_poll`, `self.get_key_state(VK_CONTROL)` is called without `try...except`.
Why it matters: If `get_key_state` raises an unexpected exception (ctypes error, OS error during process termination, or mock failure), the background polling thread crashes silently without setting any alert flag. The agent continues running with the emergency kill switch completely dead.
Suggested fix: Wrap `_run_poll` inside a `try...except Exception:` block that logs failure or sets `self._triggered.set()`.

ID: A-008
Severity: HIGH
Location: `agent/core/limits.py:28-36` and `agent/core/desktop_tools.py:175-178`
Evidence: In `limits.py`, `DEFAULT_CHUNK_SECONDS = 30`. In `desktop_tools.py`, `wait(seconds)` executes `self.sleep(duration)` with duration up to 120s.
Why it matters: During usage limit waits, `actual_sleep(step_chunk)` blocks the thread for up to 30 seconds at a stretch before polling `kill.is_set()`. In `desktop_tools.py`, `wait()` sleeps up to 120s without checking `kill` at all. This violates the 20 Hz emergency stop contract.
Suggested fix: Sleep in short 0.1s increments in both `limits.wait_for_reset` and `desktop_tools.wait`, polling `kill.is_set()` on every increment.

ID: A-009
Severity: HIGH
Location: `agent/core/artifacts.py:33-35`
Evidence: `save_artifact` opens destination `.txt` files directly in `"w"` mode without atomic replacement:
```python
path = os.path.join(artifacts_dir, f"{name}.txt")
with open(path, "w", encoding="utf-8") as f:
    f.write(text)
```
Why it matters: If the agent crashes, is killed, or encounters a power loss mid-write, the artifact is left partially written or truncated (0 bytes), corrupting state and breaking resume capabilities.
Suggested fix: Write artifacts to a temporary file in `artifacts_dir` and call `os.replace(tmp_path, path)`.

ID: A-011
Severity: HIGH
Location: `agent/core/browser_driver.py:225-260`
Evidence: `BrowserDriver.wait_done` polls Playwright for up to 2400 seconds (40 minutes) with `time.sleep(1.0)`, with no access to `KillSwitch`.
Why it matters: If the user hits Ctrl+Alt+K during browser generation, the driver continues looping and polling Playwright for up to 40 minutes without aborting.
Suggested fix: Pass `kill` into `BrowserDriver` and check `if kill and kill.is_set(): return False` inside the polling loop.

ID: A-014
Severity: HIGH
Location: `agent/core/browser_driver.py:85-91`
Evidence: In `ensure_browser()`, Chrome is spawned with `subprocess.Popen(cmd)`. If `playwright.start()` or `connect_over_cdp()` fails, the exception propagates without cleanup.
Why it matters: `self._proc` is never terminated, leaving an orphaned Chrome process running and locking `self.profile_dir` and `self.port`.
Suggested fix: Wrap playwright initialization in a `try...except` block that calls `self.close()` before re-raising.

ID: A-018
Severity: HIGH
Location: `agent/core/constants.py:8-13`
Evidence:
```python
EXIT_OK: int = 0
EXIT_ERROR: int = 1
EXIT_FAILSAFE: int = 2
EXIT_KILL: int = 3
EXIT_MAX_STEPS: int = 4
EXIT_MODEL_FAILURE: int = 5
```
Why it matters: Specification requires standard exit code constants `EXIT_SUCCESS=0` and `EXIT_HUMAN_TIMEOUT=5`. In `constants.py`, 0 is named `EXIT_OK` (causing `AttributeError` for code expecting `EXIT_SUCCESS`), and 5 is named `EXIT_MODEL_FAILURE`, with human timeout exit codes undefined.
Suggested fix: Add aliases `EXIT_SUCCESS: int = EXIT_OK` and `EXIT_HUMAN_TIMEOUT: int = 5`.

ID: B-003
Severity: HIGH
Location: `agent/core/command_safety.py:171-183`
Evidence: Input `type C:windows\win.ini` -> returned `None` (Allowed); `cd C:` -> `None` (Allowed); `git  -C C: status` -> `None` (Allowed).
Why it matters: Regex `^[a-zA-Z]:[\\/]` only matches drive paths containing an immediate slash. Drive-relative paths (`C:path`) lack the slash and fall through to `os.path.join(project_dir, path_token)`, which strips the drive prefix in Python, while Windows `cmd.exe` resolves it relative to the drive's current working directory.
Suggested fix: Match drive prefixes using `^[a-zA-Z]:` and reject all drive-relative paths that are not explicitly qualified under `project_dir`.

ID: B-004
Severity: HIGH
Location: `agent/core/command_safety.py:100-103`
Evidence: Input `git  push origin evil` -> returned `None` (Allowed); `git "push" origin evil` -> `None` (Allowed); `git  config --global user.name evil` -> `None` (Allowed); `git  remote add evil https://evil.com` -> `None` (Allowed).
Why it matters: Subcommands `git push`, `git config`, `git remote`, and `git credential` are only checked via single-space substrings in `BLOCKED_SUBSTRINGS`. Adding extra spaces, tabs, or quotes bypasses the check, permitting repository exfiltration and configuration tampering.
Suggested fix: Implement token-level inspection for git subcommands in Step 5 to block `push`, `config`, `remote`, and `credential`.

ID: B-005
Severity: HIGH
Location: `agent/core/command_safety.py:49, 100-103`
Evidence: Input `pip  install requests` -> returned `None` (Allowed); `pip "install" requests` -> `None` (Allowed); `pip -q install requests` -> `None` (Allowed); `pip --isolated install requests` -> `None` (Allowed).
Why it matters: Pip package installation is filtered only by the raw substring `'pip install'`. Extra whitespace, quotes, or flags (`-q`, `-v`, `--isolated`) bypass the substring check, permitting unconfined package installation and setup.py execution.
Suggested fix: Disallow the `install` subcommand in tokenized pip arguments in Step 5.

ID: B-006
Severity: HIGH
Location: `agent/core/command_safety.py:124-126`
Evidence: Input `node -p "1+1"` -> returned `None` (Allowed); `node --print "1+1"` -> `None` (Allowed); `node "-e" "console.log(1)"` -> `None` (Allowed).
Why it matters: Node.js allows inline code execution via `-p` / `--print` and `-e` / `--eval`. Step 5 checks `t.lower() in ('-e', '--eval')` without stripping quotes, allowing quoted flags to bypass. Moreover, `-p` and `--print` are missing from the check, allowing arbitrary inline JavaScript execution.
Suggested fix: Strip quotes from tokens and expand Node.js disallowed evaluation flags to include `-p`, `--print`, `-e`, and `--eval`.

ID: C-002
Severity: HIGH
Location: `jolly-hawking (git history)`, commit `d61dffb91b:verification/shots/`
Evidence: Commit `d61dffb91b9490c012f1d5cb744241a0abecbf8f` committed 6 PNG screenshots (`Antigravity.png`, `Claude.png`, `Gemini.png`, `claude_roundtrip.png`, `gemini_roundtrip.png`, `test_claude.png`).
Why it matters: Screenshots depicting desktop application windows were committed to git history on branch `real-desktop`. Although deleted in commit `7483916d42`, the binary image blobs remain permanently stored in repository packfiles.
Suggested fix: Purge `verification/shots/` from git history using `git-filter-repo` before making the repository public.

ID: C-003
Severity: HIGH
Location: `jolly-hawking & hush-landing-v2, .gitignore:1-12`
Evidence: `.gitignore` does not cover `verification/shots/` or `docs/audit/shots/`; 20 untracked PNG screenshot files are currently present in working trees.
Why it matters: Screenshots placed in `verification/shots/` or `docs/audit/shots/` risk accidental staging and commit via `git add .` or `git add -A`.
Suggested fix: Add `verification/shots/` and `docs/audit/shots/` to `.gitignore` on all branches.

ID: D-002
Severity: HIGH
Location: `agent/tests_real/test_kill_hotkey.py:45-48`
Evidence:
```python
if not switch.is_set():
    switch.trigger()
```
When polling logic was mutated to `if False:`, `test_kill_hotkey.py` still passed (1 passed in 3.18s).
Why it matters: False sense of security. The "real desktop" test passes even if the OS polling thread completely fails to detect global hotkeys, because it calls `switch.trigger()` directly in software.
Suggested fix: Remove `switch.trigger()` fallback; fail test if hotkey was not detected via polling.

ID: D-003
Severity: HIGH
Location: `agent/tests_real/test_mouse_corner.py:35-42`
Evidence:
```python
if not caught_failsafe:
    try:
        raise pyautogui.FailSafeException("Simulated hardware corner abort")
    except Exception as exc:
        if is_failsafe(exc):
            caught_failsafe = True
```
Why it matters: If physical coordinate (0, 0) fails to trip PyAutoGUI, the test raises and catches the exception in-process, guaranteeing PASS in headless or simulated environments.
Suggested fix: Require `pyautogui.position() == (0, 0)` and let `FailSafeException` propagate naturally from PyAutoGUI coordinate checks.

ID: D-004
Severity: HIGH
Location: `agent/tests_real/test_notepad.py:43-55`
Evidence: `desktop.paste_any(test_content)` populates system clipboard via `pyperclip.copy(test_content)`. Test never clears clipboard before `desktop.press_keys("ctrl+c")`, then asserts `test_content in pyperclip.paste()`.
Why it matters: The assertion is tautological; `pyperclip.paste()` already contains `test_content` from `paste_any`, even if Notepad crashed, was never focused, or failed to receive keystrokes.
Suggested fix: Clear clipboard with `pyperclip.copy("")` immediately after paste before issuing Ctrl+A and Ctrl+C in Notepad.

ID: D-006
Severity: HIGH
Location: `agent/tests_real/test_ntfy.py:27-34`
Evidence:
```python
confirmed = True
if not using_probe_topic and sys.stdin.isatty():
    ...
record_result(feature_id="safety-human-notify-gate", status="PASS" if confirmed else "FAIL", ...)
```
When `NTFY_TOPIC` is unset, `using_probe_topic = True`, so human confirmation is bypassed, yet the test logs `safety-human-notify-gate` PASS into `real_desktop_results.json`.
Why it matters: Falsely certifies that human-in-the-loop notification gate was verified on real desktop, when only an automated HTTP POST occurred.
Suggested fix: Do not record `safety-human-notify-gate` as PASS without interactive operator confirmation.

ID: D-008
Severity: HIGH
Location: `agent/core/retry.py:46-47` & `agent/tests/test_retry.py:228-251`
Evidence: Mutating `is_retryable_error` to return `False` unconditionally for non-retryable guards resulted in `tests/test_retry.py` passing 100% (8 passed in 0.08s).
Why it matters: Test suite blind spot. No test asserts that a 400 error containing a retryable substring (e.g. `400 invalid_request: timeout exceeded`) is correctly blocked from retrying.
Suggested fix: Add unit test in `test_retry.py` verifying that an error with status 400 and message containing "timeout" returns `False` from `is_retryable_error`.

ID: E-001
Severity: HIGH
Location: `docs/QA_REPORT.md:7, 18, 173, 247` vs `verification/real_desktop_results.json:6-64` & `src/data/verification.ts:138-152`
Evidence:
- `docs/QA_REPORT.md:7`: "all safety and architecture claims verified in code and on real desktop hardware"
- `docs/QA_REPORT.md:173`: "Items 4 (Kill Hotkey), 5 (Mouse Corner), 6 (Loop Breaker), 9 (Atomic Checkpoints), and 11 (Graph Stall Detection) have now been verified on physical Windows hardware..."
- `verification/real_desktop_results.json`: "Tested via synthetic injection (INJECTED)... physical keyboard hotkey verification pending."
- `src/data/verification.ts:138`: `TOTAL_VERIFIED_COUNT: number = 0; IS_REAL_DESKTOP_VERIFIED: boolean = false;`
Why it matters: `QA_REPORT.md` overclaims that features were verified on physical desktop hardware, directly contradicting `real_desktop_results.json`, `src/data/verification.ts`, and root `README.md:196`.
Suggested fix: Correct `docs/QA_REPORT.md` to state that 0 of 8 hardware checks have physical verification and tests were executed via synthetic OS event injection.

ID: F-002
Severity: HIGH
Location: `src/data/safety.ts:11, 19, 27, 59, 75, 99`
Evidence:
```typescript
desktopVerified: true, // safety-command-allowlist
desktopVerified: true, // safety-workspace-only
desktopVerified: true, // safety-step-cap
desktopVerified: true, // safety-jsonl-audit-log
desktopVerified: true, // safety-demo-mode
desktopVerified: true, // safety-limit-wait
```
Why it matters: False marketing claim. `src/data/verification.ts:138` and `README.md:196` state `TOTAL_VERIFIED_COUNT = 0`. Hardcoding `desktopVerified: true` suppresses the "Not yet verified on a real desktop" badge in `SafetyCard.tsx` and excludes these controls from the "Unverified" tab filter.
Suggested fix: Set `desktopVerified: false` for all controls until physical hardware tests run.

ID: F-003
Severity: HIGH
Location: `src/features/run-it-yourself/EmergencyGuardrailsCard.tsx:25`
Evidence: `<span>Active in Real Desktop Runs</span>` rendered in header pill next to `<ShieldAlert className="w-3.5 h-3.5 text-accent" />`.
Why it matters: False marketing claim; implies live physical desktop validation for global hotkey and mouse-corner abort when `real_desktop_results.json` marks them as tested via synthetic injection only.
Suggested fix: Change label to "Active in Physical Runtime (Hardware Pending)" or "Configured for Desktop Runs".

ID: I-001
Severity: HIGH
Location: `agent/core/killswitch.py:36-49, 65-75`
Evidence: `KillSwitch` resolves `ctypes.windll.user32.GetAsyncKeyState`. Under Windows UIPI, a Medium-Integrity process cannot receive hardware input when the active window is running at High Integrity (Administrator elevation), nor during a UAC prompt or `Win+L` Lock Screen.
Why it matters: If the agent opens an application, installer, or console that prompts for UAC, or if the operator locks their workstation, pressing `Ctrl+Alt+K` is ignored by the OS. The agent continues executing without emergency stop capability.
Suggested fix: Register a low-level keyboard hook (`WH_KEYBOARD_LL`) via an elevated watchdog service or incorporate physical hardware-level/remote signaling for out-of-band termination.

ID: I-003
Severity: HIGH
Location: `agent/core/shell_tool.py:23-30` and `agent/core/killswitch.py:55-58`
Evidence: `shell_tool.py` executes shell commands via `subprocess.run(command, shell=True)`. When the orchestrator exits via `EXIT_KILL`, neither `KillSwitch` nor `run_loop` terminates active child process trees.
Why it matters: Spawning long-running tasks via `run_cmd` (e.g. `npm run dev`, `node server.js`, `python background.py`) leaves orphaned processes running in the operating system even after the orchestrator terminates with `EXIT_KILL`.
Suggested fix: Assign all spawned child processes to a dedicated Windows Job Object configured with `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`.

ID: I-004
Severity: HIGH
Location: `agent/core/loopbreaker.py:75-100`
Evidence: `LoopBreaker.observe()` maintains only a single historical reference (`self.last_hash`). If the current screenshot is dissimilar to the immediate previous hash (`distance > self.max_distance`), both `self.same_count` and `self.wait_count` are unconditionally reset to 0.
Why it matters: If the model enters a two-step alternating cycle (Tool A toggles Tab 1 with hash $H_1$, Tool B toggles Tab 2 with hash $H_2$), every single transition evaluates `hamming(H1, H2) > max_distance`, resetting counters and permitting infinite two-step or $N$-step oscillating loops until `MAX_STEPS`.
Suggested fix: Maintain a rolling ring buffer of recent $N$ visual hashes and tool invocation signatures to detect periodic cycles of length $k \le 5$.

ID: I-006
Severity: HIGH
Location: `agent/core/loop.py:194-217`
Evidence: In `loop.py`, `ctx.breaker.observe()` is called exclusively inside `if tool_name == "screenshot":`.
Why it matters: If the agent generates an alternating sequence of non-screenshot tool calls (e.g. alternating between `run_cmd("dir")` and `run_cmd("echo ping")`, or repeatedly calling `read_clipboard` and `paste_text`), the perceptual loop breaker is completely bypassed and never invoked.
Suggested fix: Evaluate tool execution history and state progression at the top of every loop iteration regardless of which tool is invoked.

ID: I-008
Severity: HIGH
Location: `agent/core/loop.py:186-193`
Evidence: In `loop.py`, calling `finish` immediately records the event, saves the checkpoint, and returns `EXIT_OK`.
Why it matters: Any invocation of `finish` terminates the orchestrator loop immediately with return code `EXIT_OK`. If the model hallucinates completion, fails to complete required build steps, or is influenced by prompt injection, the entire workflow halts and reports success without acceptance testing or human validation.
Suggested fix: Require automated test suite verification (`pytest`, build verification) and human acknowledgment before permitting `finish` to exit with `EXIT_OK`.

ID: I-010
Severity: HIGH
Location: `agent/core/accounts.py:117` and `agent/core/desktop_tools.py:77-87, 170-172`
Evidence: `AccountSwitcher.switch()` launches Chrome profiles, while `desktop_tools.py` uses `pyperclip` to interact with the global OS clipboard singleton.
Why it matters: Sensitive session tokens, internal prompts, or private credentials copied from Profile A remain in the shared operating system clipboard and can be read or pasted into Profile B.
Suggested fix: Isolate browser automation using dedicated, ephemeral browser contexts (e.g. Playwright isolated storage states) rather than launching unmanaged global desktop browser windows.

ID: I-012
Severity: HIGH
Location: `agent/core/notify.py:46-52`
Evidence: `Notifier.push()` sends plain HTTP POST requests to `https://ntfy.sh/{self.topic}`. `ntfy.sh` topics are open and public by default without mandatory authentication or access control.
Why it matters: Any third party that knows, guesses, or brute-forces the `NTFY_TOPIC` string can subscribe to the topic stream and receive notification payloads. Proprietary project ideas, task descriptions, and internal failure states are leaked over an unauthenticated channel. Additionally, an attacker can publish malicious messages to the topic to mislead the operator.
Suggested fix: Mandate self-hosted ntfy instances or require upstream ntfy authentication tokens (`Authorization: Bearer <token>`) with cryptographically secure topic generation.

ID: I-013
Severity: HIGH
Location: `agent/core/audit.py:178-204, 206-248`
Evidence: `AuditLog` links log entries using unkeyed SHA-256 hashes (`entry["prev"] = self.prev_hash`). The initial seed is a hardcoded constant (`INITIAL_PREV_HASH = "0" * 64`).
Why it matters: While modifying a single line breaks the chain at line $k+1$, an attacker (or a script executed by the agent via `run_cmd`) with write access to `audit.jsonl` can rewrite the entire file from line 1 to $N$, recomputing valid SHA-256 digests for every record. The audit trail provides tamper detection against accidental corruption, but zero tamper resistance against intentional modification.
Suggested fix: Sign each audit entry using an asymmetric private key stored in Windows DPAPI / TPM or stream audit hashes in real time to an append-only remote syslog or external transparency log.

ID: J-002
Severity: HIGH
Location: `jolly-hawking, README.md:178`, `agent/requirements.txt`, `agent/requirements-dev.txt`
Evidence: In a clean clone, executing `pip install -r requirements.txt` leaves `pytest` uninstalled. Attempting to run tests produces `No module named pytest` (exit code 1). `pytest` is only defined in `agent/requirements-dev.txt`, which is never referenced in root `README.md`.
Why it matters: Reproducibility blocker. External developers following documented quickstart instructions cannot execute the test suite without diagnosing undocumented setup steps.
Suggested fix: Document `pip install -r requirements-dev.txt` under test instructions in root `README.md`.

ID: J-003
Severity: HIGH
Location: `jolly-hawking, LICENSE, package.json, README.md`, branch `real-desktop` (commit `8c3e743`) vs `origin/main`
Evidence: `git show origin/main:LICENSE` specifies the MIT License, and root `README.md` declares `Hush is released under the [MIT License](LICENSE)`. On branch `real-desktop`, commit `8c3e743 ("docs: relicensing project under Apache License 2.0")` replaced `LICENSE` with Apache License 2.0, added `"license": "Apache-2.0"` to `package.json`, and updated `README.md` badges to Apache 2.0. This commit was never merged into `origin/main`.
Why it matters: Legal and licensing ambiguity. Different branches in the same repository distribute identical code under conflicting open-source licenses.
Suggested fix: Reconcile project licensing by officially merging or discarding the Apache 2.0 relicensing commit on main.

---

### 🟡 MEDIUM SEVERITY FINDINGS (37)

ID: A-003 | Severity: MEDIUM | Location: `agent/core/killswitch.py:13-15`
Evidence: `is_failsafe` checks exact `type(exc).__name__ == "FailSafeException"`.
Why it matters: If `FailSafeException` is wrapped inside an `ExceptionGroup` or chained via `exc.__cause__`, `is_failsafe` returns `False` and bypasses failsafe abort.
Suggested fix: Check `any(b.__name__ == "FailSafeException" for b in type(exc).__mro__) or (exc.__cause__ and is_failsafe(exc.__cause__))`.

ID: A-006 | Severity: MEDIUM | Location: `agent/core/killswitch.py:47-49`
Evidence: `KillSwitch.start()` does not check if `self._thread.is_alive()`.
Why it matters: Calling `start()` multiple times spawns multiple background threads polling Win32 `GetAsyncKeyState` concurrently.
Suggested fix: Add check: `if self._thread is not None and self._thread.is_alive(): return True`.

ID: A-012 | Severity: MEDIUM | Location: `agent/core/antigravity_driver.py:116-126`
Evidence: `AntigravityDriver.wait_completion` loops for up to 600s (10 min) watching file mtimes without checking `KillSwitch`.
Why it matters: Emergency hotkey cancellation is blocked while waiting for IDE code generation.
Suggested fix: Pass `kill` into `AntigravityDriver` and break early if `kill.is_set()`.

ID: A-013 | Severity: MEDIUM | Location: `agent/core/notify.py:65`
Evidence: When `auto_answer` is None, `Notifier.ask_human()` executes `self.input_fn()` (`builtins.input`).
Why it matters: In automated or headless environments, `input()` blocks indefinitely with no timeout, hanging the agent process.
Suggested fix: Implement a timed input wrapper or non-blocking console reader with timeout.

ID: A-015 | Severity: MEDIUM | Location: `agent/core/cli.py:288-300`
Evidence: `ctx.browser.close()` is never called in `cli.py` `finally:` block.
Why it matters: Playwright event loop, CDP session, and Chrome subprocess are leaked upon orchestrator exit.
Suggested fix: Add `if getattr(ctx, "browser", None): ctx.browser.close()` to the `finally:` block.

ID: A-016 | Severity: MEDIUM | Location: `agent/core/shell_tool.py:23-34`
Evidence: `subprocess.run(shell=True)` executes `cmd.exe /c command`. On `TimeoutExpired`, Python kills `cmd.exe`, but grandchild processes continue running.
Why it matters: Grandchild processes (node, python, build servers) are orphaned in the background, consuming resources and locking files.
Suggested fix: Use `taskkill /F /T /PID <proc.pid>` or `psutil.Process(proc.pid).children(recursive=True)` to kill the process tree.

ID: A-017 | Severity: MEDIUM | Location: `agent/core/cli.py:191-290`
Evidence: `kill.start()` is called at line 192, but `try...finally: kill.stop()` only encloses `run_loop` starting at line 290.
Why it matters: If initialization fails (e.g. invalid `GEMINI_API_KEY` raising `ValueError`), the kill switch polling thread is leaked.
Suggested fix: Wrap lines 193–300 in `try...finally: kill.stop()`.

ID: A-020 | Severity: MEDIUM | Location: `agent/core/tool_registry.py:80-84`
Evidence: `wait_for_reset(...)` returns `"killed"` if the kill switch is triggered, but `tool_registry.py` ignores this and returns `WAIT_OVER_MSG`.
Why it matters: Reports a successful wait to the model when the wait was actually aborted by emergency hotkey.
Suggested fix: Check return value: `res = wait_for_reset(...); if res == "killed": return "Aborted by kill switch."`.

ID: A-021 | Severity: MEDIUM | Location: `agent/core/doctor.py:56-57`
Evidence: For `("google.genai", "google-genai")`, `top_mod = mod_name.split('.')[0]` checks `find_spec("google")`.
Why it matters: `find_spec("google")` succeeds if any package in the google namespace is installed (e.g. `google-auth`), falsely reporting `google-genai` as present.
Suggested fix: Call `importlib.util.find_spec(mod_name)` directly without stripping submodules.

ID: B-007 | Severity: MEDIUM | Location: `agent/core/command_safety.py:120-123`
Evidence: Input `npm "-g" install lodash` -> Allowed; `npm --location=global install lodash` -> Allowed.
Why it matters: Global npm installations are blocked only by exact unquoted tokens `-g` and `--global`. Modern npm v8+ syntax `--location=global` is not evaluated.
Suggested fix: Normalize tokens by stripping quotes and check for `--location=global`, `-g=*`, and `--global=*`.

ID: B-008 | Severity: MEDIUM | Location: `agent/core/command_safety.py:137-142, 153-159`
Evidence: Input `type CREDEN~1` -> Allowed; `dir SECRE~1` -> Allowed; `type ID_RSA~1` -> Allowed.
Why it matters: Windows NTFS generates 8.3 short aliases for long filenames. Sensitive files can be accessed via short names that bypass string checks.
Suggested fix: Reject tokens matching the Windows 8.3 short filename pattern `^[A-Za-z0-9_]{1,6}~\d`.

ID: B-009 | Severity: MEDIUM | Location: `agent/core/command_safety.py:31-41, 100-103`
Evidence: Input `echo "foo & bar"` -> BLOCKED (pattern '&'); `echo 100% complete` -> BLOCKED (pattern '%'); `git commit -m "fix & test"` -> BLOCKED.
Why it matters: Control characters (`&`, `|`, `>`, `<`, `;`, `%`, `^`) are checked via raw string search on the unparsed command line, causing false positives on quoted text literals.
Suggested fix: Defer shell operator checks to post-tokenization inspection so quoted literals are not flagged.

ID: C-004 | Severity: MEDIUM | Location: `jolly-hawking, verification/e2e_run_20261026.md:9, 250`
Evidence: Absolute personal Windows path pattern detected (`C:\Users\[REDACTED_USER]\Documents\antigravity\...`) in tracked verification artifact.
Why it matters: Leaks local system username, environment layout, and filesystem path hierarchy in tracked documentation.
Suggested fix: Replace absolute filesystem paths with workspace-relative paths (`./agent/runs/...`).

ID: C-005 | Severity: MEDIUM | Location: `jolly-hawking, docs/ARCHITECTURE_MAP.md, QA_REPORT.md, TROUBLESHOOTING.md`
Evidence: Over 30 occurrences of `file:///c:/Users/[REDACTED_USER]/Documents/antigravity/...` in markdown links across tracked documentation files.
Why it matters: Personal username and workstation directory structures are exposed across multiple tracked documentation files.
Suggested fix: Convert all absolute `file:///c:/Users/...` hyperlinks to repository-relative markdown links.

ID: D-005 | Severity: MEDIUM | Location: `agent/tests_real/test_notepad.py:39-41`
Evidence: Test disables `pyautogui.FAILSAFE = False` if cursor is at (0, 0).
Why it matters: Safety test actively disables mouse corner failsafe during automated interaction, violating safety invariants.
Suggested fix: Move mouse away from (0, 0) before executing Notepad paste rather than disabling `pyautogui.FAILSAFE`.

ID: D-007 | Severity: MEDIUM | Location: `agent/tests_real/test_kill_hotkey.py:57` & `test_mouse_corner.py:49`
Evidence: `evidence_hash=sha256_text(f"EXIT_KILL={EXIT_KILL}")`, `evidence_hash=sha256_text(f"EXIT_FAILSAFE={EXIT_FAILSAFE}")`.
Why it matters: Verification audit records static hashes of constant strings (`EXIT_KILL=3`) rather than cryptographically binding real test evidence.
Suggested fix: Hash real event logs, screenshot artifacts, or timestamped system metrics for evidence.

ID: D-009 | Severity: MEDIUM | Location: `agent/tests_real/test_loopbreaker.py:10-34` & `test_resume.py:62-76`
Evidence: `test_loopbreaker.py` uses PIL synthetic canvas images; `test_resume.py` uses `DummyDesktop` (32x32 blank image) and `ResumedModel`. Both record PASS to `verification/real_desktop_results.json`.
Why it matters: Tests categorized and recorded as "real desktop tests" are actually synthetic unit mocks, creating false confidence in physical desktop test coverage.
Suggested fix: Move in-memory tests to `tests/` and restrict `tests_real/` to genuine hardware/OS captures.

ID: D-010 | Severity: MEDIUM | Location: `agent/tests_real/`
Evidence: The specification mentions `test_app_smoke.py`, `test_gemini_driver.py`, `test_claude_driver.py`, `test_physical.py`, and `test_account_notice_real.py`. None exist on branch `audit-report` (based on `origin/main`).
Why it matters: Documentation/specification drift; expected driver and physical integration tests are missing from the primary codebase.
Suggested fix: Align documentation with existing test suite or merge verified real driver tests from branch `real-desktop`.

ID: E-002 | Severity: MEDIUM | Location: `SUBMISSION.md:75` & `src/data/brand.ts:8` vs `real_desktop_results.json:12` & `README.md:203`
Evidence: `SUBMISSION.md:75` and `brand.ts:8` mark graph stall detection as Planned (`GRAPH_STALL_VERIFIED = false`), while `real_desktop_results.json` and `README.md` mark it as PASS / Verified.
Why it matters: Contradiction across core submission materials regarding feature verification status.
Suggested fix: Harmonize documentation to reflect that the Graphify AST stall detector is unit-tested in temp directories but live IDE orchestration remains unverified.

ID: E-003 | Severity: MEDIUM | Location: `README.md:180, 204` & `docs/ARCHITECTURE_MAP.md:90` vs `agent/core/loopbreaker.py:9, 60`
Evidence: Docs claim `max_distance=2`, while implementation code in `core/loopbreaker.py:9` specifies `DEFAULT_MAX_DISTANCE: int = 4`.
Why it matters: Visual loop breaker threshold is documented with stricter parameters than actually enforced in code.
Suggested fix: Update documentation to cite `max_distance=4` (or update code default to 2).

ID: E-004 | Severity: MEDIUM | Location: `SUBMISSION.md:66, 93` vs `agent/tests/` (pytest output)
Evidence: `SUBMISSION.md` claims "274 passing pytest tests across 34 test suites", while pytest execution confirms 285 passing tests across 36 files.
Why it matters: Submission documents undercount test coverage and conflict with current repository metrics.
Suggested fix: Update `SUBMISSION.md` to cite 285 passing pytest tests across 36 test files.

ID: E-006 | Severity: MEDIUM | Location: `README.md:377` & `docs/TROUBLESHOOTING.md:233` vs `agent/core/cli.py`
Evidence: Docs claim Ctrl+C cleanly closes windows and serializes an atomic checkpoint before exiting; no `KeyboardInterrupt` handler exists in `cli.py` or `loop.py`.
Why it matters: Misleads operators into believing terminal interrupts gracefully persist checkpoint state.
Suggested fix: Remove the claim or implement a graceful `KeyboardInterrupt` checkpoint handler in `core/cli.py`.

ID: E-009 | Severity: MEDIUM | Location: `public/replay_real.json:2-13` vs `scripts/generate_verification_data.py:8-9`
Evidence: `public/replay_real.json` contains a single-event stub with `"mode": "mocked"` and `"label": "Simulated desktop"`.
Why it matters: The file name implies real desktop execution, but it is an unpopulated mock stub.
Suggested fix: Export an authentic multi-step real run into `public/replay_real.json` or document that real replay capture is pending.

ID: F-004 | Severity: MEDIUM | Location: `src/v2/features/gates/Gates.tsx:120`
Evidence: Renders a bright green active dot (`--v2-accent`) next to the footnote string `"0 of 8 safety checks verified on physical hardware..."`.
Why it matters: Rendering a positive green status dot next to a zero-verified statement conveys a misleading positive verification signal.
Suggested fix: Use `bg-[var(--v2-warning)]` or `bg-[var(--v2-muted)]` for the status dot when `verifiedCount === 0`.

ID: F-005 | Severity: MEDIUM | Location: `public/replay_real.json:2`
Evidence: Committed artifact has `mode: "mocked"`, while `scripts/generate_verification_data.py` claims step 4-5 exports mode "real".
Why it matters: Stale generator documentation conflicts with actual committed mock data.
Suggested fix: Update generator documentation to clarify that replay_real is currently mocked.

ID: F-006 | Severity: MEDIUM | Location: `src/data/safety.ts:49` vs `src/data/gates.ts:39`
Evidence: In `safety.ts`, graph stall is labeled "Planned", whereas in `gates.ts`, it is listed as an active policy gate.
Why it matters: Internal data inconsistency between safety table and gate catalog.
Suggested fix: Align `GRAPH_STALL_VERIFIED` in `src/data/brand.ts` and `src/data/safety.ts` with its implementation status in `core/graph_tools.py`.

ID: G-002 | Severity: MEDIUM | Location: `https://hush-agent-alpha.vercel.app/v1.html` and GitHub Pages `/v1.html`
Evidence: Network response 404 for `hero.mp4` and `graph/graph.html` on both hosts when visiting `/v1.html`.
Why it matters: Visitors accessing the legacy v1 preview encounter missing hero background media and a broken dependency graph frame.
Suggested fix: Update `/v1.html` video sources to point to `./v2/media/hero.mp4` and restore `graph/graph.html`.

ID: H-001 | Severity: MEDIUM | Location: `agent/requirements.txt:1-7`
Evidence: Seven core runtime dependencies (`google-genai`, `pyautogui`, `pyperclip`, `pygetwindow`, `requests`, `pillow`, `openai`) have no version constraints.
Why it matters: Floating dependencies allow non-reproducible builds and risk pulling unvetted or breaking upstream releases.
Suggested fix: Pin all runtime Python dependencies to exact versions matching `agent/.venv` (`google-genai==2.33.0`, `requests==2.34.2`, etc.).

ID: H-006 | Severity: MEDIUM | Location: `.github/workflows/agent-tests.yml:1-33`
Evidence: Workflow lacks a `permissions:` declaration block at workflow and job scopes.
Why it matters: Applies repository default permissions (frequently read/write), violating least privilege during PR test runs.
Suggested fix: Add top-level `permissions: contents: read` to `agent-tests.yml`.

ID: H-007 | Severity: MEDIUM | Location: `.github/workflows/deploy.yml:26, 29, 41, 47`
Evidence: Actions referenced via mutable major tags (`actions/checkout@v7`, `actions/setup-node@v7`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`).
Why it matters: Mutable tag references can be retargeted if upstream action repositories are compromised, risking arbitrary CI execution.
Suggested fix: Pin all GitHub Actions to immutable full 40-character commit SHAs.

ID: H-008 | Severity: MEDIUM | Location: `vercel.json:1-5`
Evidence: `vercel.json` defines build configuration but completely omits HTTP security response headers.
Why it matters: Missing CSP, X-Frame-Options, X-Content-Type-Options, HSTS leaves production web deployments susceptible to clickjacking and MIME sniffing.
Suggested fix: Configure a `headers` array in `vercel.json` defining strict CSP, `X-Frame-Options: DENY`, and `X-Content-Type-Options: nosniff`.

ID: I-005 | Severity: MEDIUM | Location: `agent/core/loopbreaker.py:8, 95-98`
Evidence: `DEFAULT_WAIT_THRESHOLD = 15`. Tripping occurs after 15 consecutive wait/screenshot iterations while screen remains static.
Why it matters: Legitimate long operations (Gemini Deep Research taking 10 minutes, large npm installs) trigger false positive loop breaker gates.
Suggested fix: Add task-aware adaptive timeouts and programmatic heartbeat checks before tripping visual gates.

ID: I-011 | Severity: MEDIUM | Location: `agent/core/accounts.py:7-11, 101-131`
Evidence: `AccountSwitcher` rotates between multiple Google Chrome profiles specifically to bypass usage quotas and rate limits.
Why it matters: Automated multi-profile switching to evade rate limits violates Terms of Service of Anthropic, Google, and OpenAI, risking automated account suspension or IP blacklisting.
Suggested fix: Replace automated multi-account rotation with explicit human operator handoff and lawful multi-tenant API quota management.

ID: J-004 | Severity: MEDIUM | Location: `jolly-hawking, public/v2/media/hero.mp4`
Evidence: `git rev-list --all --objects` reveals two blobs > 1MB committed in git history: `6ce1aaba...` (15.35 MB) and `4957e02e...` (1.94 MB). `hero.mp4` remains tracked in HEAD at 15.35 MB.
Why it matters: Committing raw video binaries directly into git history bloats repository transfer sizes and slows down clean clones.
Suggested fix: Track large media files using Git LFS or offload video delivery to external CDN/blob storage.

ID: J-005 | Severity: MEDIUM | Location: `jolly-hawking, verification/shots/`
Evidence: `git status` reports untracked directory `verification/shots/` containing 10 screenshot files totaling 1.5 MB (`Antigravity.png`, `Claude.png`, etc.).
Why it matters: Leaves dirty untracked files on clean checkouts and risks accidental re-committing of binary test artifacts.
Suggested fix: Add `verification/shots/` to root `.gitignore`.

ID: J-006 | Severity: MEDIUM | Location: `jolly-hawking, .gitignore`
Evidence: Root `.gitignore` omits `.venv/`, `venv/`, `.vscode/`, `.idea/`, `Thumbs.db`, `*.tmp`, `*.bak`, and `*.swp`.
Why it matters: Developer editor configurations and local virtual environments risk being accidentally tracked.
Suggested fix: Append `.venv/`, `venv/`, `.vscode/`, `.idea/`, `Thumbs.db`, and `*.swp` to root `.gitignore`.

ID: J-007 | Severity: MEDIUM | Location: `jolly-hawking / hush-landing-v2`, branches `canonical-host` (PR #3) and `cleanup-v2` (PR #2)
Evidence: `git merge-tree ef5d026 canonical-host cleanup-v2` exhibits a direct content merge conflict in `README.md` (lines 14-25). Both PRs are concurrently open on GitHub.
Why it matters: Merging either PR will immediately produce a merge conflict in the other, blocking clean repository integration.
Suggested fix: Rebase `canonical-host` onto `cleanup-v2` or combine both into a single cohesive pull request.

---

### 🔵 LOW SEVERITY FINDINGS (25)

ID: A-010 | Severity: LOW | Location: `agent/core/antigravity_driver.py:185-186`
Evidence: Calibration data is written directly to `config/calibration.json` without atomic temporary file replacement.
Why it matters: An interruption or crash during calibration corrupts configuration into invalid JSON.
Suggested fix: Use `tempfile.NamedTemporaryFile` in `config/` followed by `os.replace`.

ID: A-019 | Severity: LOW | Location: `agent/core/doctor.py:598`, `browser_driver.py:340,384`, `antigravity_driver.py:191`
Evidence: Subroutines return hardcoded integer literals (`0` and `1`) instead of `core.constants` (`EXIT_OK`, `EXIT_ERROR`).
Why it matters: Minor code quality defect; bypasses standardized exit constant definitions.
Suggested fix: Import and return `EXIT_OK` and `EXIT_ERROR`.

ID: A-022 | Severity: LOW | Location: `agent/core/cli.py:250`
Evidence: `build_tools()` has signature `build_tools(switch_enabled=False, browser_enabled=False)`. `browser_enabled` is never passed or set to `True`.
Why it matters: Browser tools (`browser_send_prompt`, `browser_wait_done`, etc.) are completely omitted from the model schema in CLI runs.
Suggested fix: Add CLI flag or configuration for browser automation and pass `browser_enabled=True` when configured.

ID: B-010 | Severity: LOW | Location: `agent/core/command_safety.py:153-159`
Evidence: Input `type CON` -> Allowed (hangs awaiting console input); `type AUX` -> Allowed.
Why it matters: Windows reserved DOS device names (CON, PRN, AUX, COM1-COM9) lack path separators and are treated as safe non-paths, causing process hangs until timeout.
Suggested fix: Disallow Windows DOS reserved device names (CON, PRN, AUX, NUL, COM1-COM9) as command arguments.

ID: C-006 | Severity: LOW | Location: `jolly-hawking, qa/secret_scan_results.json:10-734`
Evidence: Raw regex matches from synthetic test strings committed in automated scan report artifact (Commit `6034e99852`).
Why it matters: Storing raw matched patterns (even synthetic ones) in tracked JSON files triggers external secret detection alerts.
Suggested fix: Untrack `qa/secret_scan_results.json` and add it to `.gitignore`.

ID: D-011 | Severity: LOW | Location: `agent/tests/test_flow_limits.py:174`
Evidence: `assert switcher.confirm(accepted_flag=True)` passes trivially without testing unconfirmed rejection.
Why it matters: Flow tests never exercise the unconfirmed refusal branch for account switching.
Suggested fix: Add an assertion in `test_flow_limits.py` verifying that `switcher.can_switch()` returns False prior to confirmation.

ID: E-005 | Severity: LOW | Location: `README.md:177` & `docs/ARCHITECTURE_MAP.md:87` vs `agent/core/constants.py:8, 19`
Evidence: Cites `core/constants.py:8` and identifier `MAX_STEPS = 80`. Line 8 is `EXIT_OK = 0`; line 19 is `MAX_STEPS_DEFAULT = 80`.
Why it matters: Erroneous line citation and identifier name in architectural documentation.
Suggested fix: Update file citation to `core/constants.py:19` and identifier name to `MAX_STEPS_DEFAULT`.

ID: E-007 | Severity: LOW | Location: `README.md:46, 392` & `docs/QA_REPORT.md:168`
Evidence: Heading reads `Tool Registry (22 + 23 Tools)`.
Why it matters: Heading syntax implies 45 tools, whereas the system exposes 22 base tools (23 with account switching).
Suggested fix: Change heading to `Tool Registry (22 Base Tools / 23 with Account Switching)`.

ID: E-008 | Severity: LOW | Location: `README.md:175, 410` vs `agent/tests/test_command_safety.py`
Evidence: README claims 44 red-team vectors in `test_command_safety.py`; test file actually contains 69 blocked vectors (85 test inputs); 44 is the count in `src/data/redteam.ts`.
Why it matters: Confuses showcase frontend dataset size with actual automated test suite coverage.
Suggested fix: Clarify that the showcase UI presents 44 representative vectors while the pytest suite executes 69 blocked vectors.

ID: E-010 | Severity: LOW | Location: `agent/README.md:52-62` vs `agent/core/cli.py:77-95`
Evidence: `agent/README.md` lists 10 CLI flags, omitting `--doctor`, `--doctor-ui`, `--calibrate`, `--plan-only`.
Why it matters: Four implemented operational CLI commands are omitted from primary documentation.
Suggested fix: Add `--doctor`, `--doctor-ui`, `--calibrate`, and `--plan-only` to the CLI Flags section in `agent/README.md`.

ID: E-012 | Severity: LOW | Location: `docs/LANDING_SWAP.md:25, 31, 43` vs `vite.config.ts:12`
Evidence: Procedure in `LANDING_SWAP.md` instructs using `classic.html`, which conflicts with the project's actual entry point naming (`v1.html`).
Why it matters: Confuses developers following landing swap maintenance procedures.
Suggested fix: Update `docs/LANDING_SWAP.md` to reference `v1.html` instead of `classic.html`.

ID: F-007 | Severity: LOW | Location: `qa/honesty_audit.json:22-27`, `qa/honesty_grep.mjs:23-28`, `qa/strict_leak_grep.mjs:5-10`
Evidence: Target banned entity names (`Prakriti`, `carbon`, `India`, `100%`, `coverage`) appear in plaintext within test runner scanner definitions.
Why it matters: Banned words appear in plaintext within repository test scripts, triggering naive grep scanners.
Suggested fix: Base64-encode search patterns in QA leak check scripts to prevent plaintext string matching.

ID: F-008 | Severity: LOW | Location: `src/features/safety/SafetySummary.tsx:92`
Evidence: `{TEST_COUNT > 0 ? TEST_COUNT : TEST_COUNT}`.
Why it matters: Redundant identical ternary operator in React template.
Suggested fix: Simplify to `{TEST_COUNT}`.

ID: F-009 | Severity: LOW | Location: `src/v2/features/compare/Compare.tsx:46`
Evidence: `{COPY_V2.compare.groups.slice(0, 3).map((group) => (`.
Why it matters: Hard-truncates comparison rows to 3, dropping row `04 // TRUST` ("Every step goes to a hash-chained audit log you can verify").
Suggested fix: Remove `.slice(0, 3)` to display all 4 comparison groups.

ID: F-010 | Severity: LOW | Location: `src/v2/features/bento/Bento.tsx:18-22` and `docs/MEDIA_CREDITS.md:9, 16`
Evidence: External CloudFront CDN account path with specific user identifier `user_38xzZboKViGWJOttwIXH07lWA1P`.
Why it matters: Asset provenance leak; links to external user account on third-party CDN.
Suggested fix: Ensure fallback images are served strictly from local repository assets (`/v2/media/bento-0*.webp`).

ID: G-001 | Severity: LOW | Location: `https://hush-agent-alpha.vercel.app` (`<link rel="canonical">`)
Evidence: DOM inspection shows `<link rel="canonical" href="https://akshayjadhav237237-cmd.github.io/hush-agent/">` on Vercel.
Why it matters: Search engines treat Vercel as a duplicate mirror of GitHub Pages and pass link equity exclusively to GitHub Pages.
Suggested fix: Parameterize base canonical URL in build config based on deployment host (`process.env.CANONICAL_URL`).

ID: G-003 | Severity: LOW | Location: `https://akshayjadhav237237-cmd.github.io/hush-agent/v1.html`
Evidence: The `<video>` in `/v1.html` uses an absolute root path `/hero.mp4`, resolving to `https://akshayjadhav237237-cmd.github.io/hero.mp4` (missing `/hush-agent/` subpath).
Why it matters: Root-relative asset paths break on GitHub Pages subpaths.
Suggested fix: Change asset paths in `/v1.html` from `/hero.mp4` to relative `./v2/media/hero.mp4`.

ID: G-004 | Severity: LOW | Location: Both hosts (Document root / Header navigation)
Evidence: Sequential Tab key traversal begins directly on the first navigation link without an initial bypass link.
Why it matters: Keyboard-only users must tab through navigation links on every page refresh before reaching main content.
Suggested fix: Add an accessible skip-to-content link as the first child of the body element.

ID: H-002 | Severity: LOW | Location: `agent/requirements-dev.txt:1`
Evidence: `pytest` declared without version specifier.
Why it matters: Floating test dependencies can introduce CI test failures when new pytest releases occur.
Suggested fix: Pin pytest to exact version (`pytest==9.1.1`).

ID: H-003 | Severity: LOW | Location: `package.json:14-27`
Evidence: `@fontsource-variable/inter-tight: "^5.3.0"`, `react: "^19.3.1"` vs exact pins for geist (`5.3.0`).
Why it matters: Caret range pinning permits unexpected version bumps on unconstrained installs if lockfiles are missing.
Suggested fix: Standardize `package.json` on exact version pins matching `package-lock.json`.

ID: H-004 | Severity: LOW | Location: `agent/requirements.txt:9`
Evidence: `pywinauto==0.6.9` is listed and checked in `agent/core/doctor.py:49` but never imported or invoked in automation logic.
Why it matters: Unused dependencies enlarge environment footprint and install times.
Suggested fix: Remove `pywinauto` from `requirements.txt` and `doctor.py` if desktop automation is handled solely by pyautogui and pygetwindow.

ID: H-005 | Severity: LOW | Location: `package.json:14, 16, 17, 18`
Evidence: `@fontsource-variable/inter-tight`, `@fontsource-variable/space-grotesk`, `@fontsource/almarai`, `@fontsource/cormorant-garamond` are declared but not imported in source code.
Why it matters: Dead dependencies increase package bundle size analysis overhead and install latency.
Suggested fix: Remove unused `@fontsource` dependencies from `package.json` and regenerate `package-lock.json`.

ID: H-009 | Severity: LOW | Location: `.vercelignore:1-8`
Evidence: `.vercelignore` excludes build/dev folders but omits `.env*`.
Why it matters: If deployment is executed via Vercel CLI, omission of `.env*` risks accidental upload of local secret configurations.
Suggested fix: Add `.env*` to `.vercelignore` across both repositories.

ID: J-008 | Severity: LOW | Location: `jolly-hawking, local branches main, landing-v2, swap-v2`
Evidence: Local `main` is at commit `881c648` (behind `origin/main` by 15 commits). Local branches `landing-v2` and `swap-v2` are already fully merged into `origin/main`.
Why it matters: Retaining stale, fully merged local branches clutters the branch namespace and causes developer confusion.
Suggested fix: Fast-forward local `main` to `origin/main` and delete merged local branches `landing-v2` and `swap-v2`.

ID: J-009 | Severity: LOW | Location: `jolly-hawking, branch real-desktop`
Evidence: `git merge-tree origin/main real-desktop` yields `CONFLICT (content): Merge conflict in .gitignore`. `real-desktop` has 4 unique commits containing physical desktop verification data and relicensing.
Why it matters: Orphaned experimental branch remains unintegrated with unresolved conflicts.
Suggested fix: Resolve `.gitignore` conflict, cherry-pick necessary verification logs onto `main`, and prune the branch.

---

### ⚪ INFORMATIONAL FINDINGS (12)

ID: B-011 | Severity: INFO | Location: `agent/core/command_safety.py:6-17, 70-74, 120-123`
Evidence: `python script.py`, `python -m pytest tests/`, `npm test`, `npm run build`, `npm install lodash` are allowed.
Why it matters: The command safety architecture intentionally permits local Python script execution, pytest test runs, npm script executions, and local dependency installations. These capabilities execute user-supplied code located within the workspace by design.
Suggested fix: Maintain operational awareness that permitted interpreters execute user code within the project directory by design.

ID: C-007 | Severity: INFO | Location: `jolly-hawking, agent/runs/20261022-120617/audit.jsonl:29-399`
Evidence: Model reasoning text in audit logs describes desktop clipboard interaction and window titles. Default clipboard result payload is sanitized via SHA-256 and length truncation.
Why it matters: Internal reasoning text captures high-level context of desktop actions.
Suggested fix: Keep `agent/runs/` strictly excluded in `.gitignore` and do not publish local run audit logs.

ID: C-008 | Severity: INFO | Location: `jolly-hawking & hush-landing-v2, agent/tests/test_audit.py, agent/tests/test_notify.py`
Evidence: Synthetic placeholder tokens matching AIza, sk-, Bearer patterns used strictly for unit testing audit redaction and notifications.
Why it matters: Verified as synthetic, non-sensitive test vectors designed to validate the agent's redaction engine; safe from credential leakage.
Suggested fix: Retain synthetic unit tests; no key rotation required.

ID: E-011 | Severity: INFO | Location: `docs/ARCHITECTURE_MAP.md:85` & `README.md:175`
Evidence: File citations point to arbitrary middle elements of set/tuple definitions (`core/command_safety.py:15, L27`).
Why it matters: Minor documentation reference precision defect.
Suggested fix: Correct citations to `core/command_safety.py:6-17` for `ALLOWED_COMMANDS` and `19-50` for `BLOCKED_SUBSTRINGS`.

ID: G-005 | Severity: INFO | Location: Both live hosts (Network traffic)
Evidence: All HTTP requests intercepted during page load match origin (`https://hush-agent-alpha.vercel.app` or `https://akshayjadhav237237-cmd.github.io`). Zero third-party connections.
Why it matters: Validates strict security posture, high performance, and total privacy for visitors.
Suggested fix: Maintain zero-external-dependency policy for production builds.

ID: G-006 | Severity: INFO | Location: Both live hosts (390px, 768px, 1440px viewports)
Evidence: `document.documentElement.scrollWidth` strictly equals `window.innerWidth` (390px, 768px, 1440px). Zero elements overflowing bounding box.
Why it matters: Ensures flawless responsive mobile and tablet browsing with no horizontal scrolling.
Suggested fix: Retain responsive container overflow boundaries.

ID: G-007 | Severity: INFO | Location: Both live hosts (Media containers under `prefers-reduced-motion: reduce`)
Evidence: When `reducedMotion: 'reduce'` is active, Playwright DOM query found 0 `<video>` elements and verified substitution with 5 accessible `<img>` elements with descriptive alt text, and pulse animations clamped to `1e-05s`.
Why it matters: Outstanding accessibility compliance for users with vestibular disorders or motion sensitivities.
Suggested fix: Retain current adaptive motion architecture.

ID: G-008 | Severity: INFO | Location: Both live hosts (Hero & Bento `<video>` elements)
Evidence: `readyState: 4`, `paused: false`, `muted: true`, `autoplay: true`, `playsInline: true`, and dual-codec fallback (`video/mp4` and `video/webm`). Video `currentTime` progressed smoothly.
Why it matters: High cross-browser compatibility and background video playback.
Suggested fix: No fix needed.

ID: G-009 | Severity: INFO | Location: Both live hosts (174 evaluated text/background node pairings)
Evidence: All text nodes satisfy WCAG AA contrast criteria ($\ge 4.5:1$ for regular text, $\ge 3.0:1$ for large text). Primary headings achieve 18.51:1; muted text achieves 5.58:1 against `#141414`.
Why it matters: Ensures high legibility on dark theme displays across diverse screens and lighting conditions.
Suggested fix: No fix needed.

ID: H-010 | Severity: INFO | Location: `agent/requirements-dev.txt`
Evidence: `pip-audit` tool is not installed in the virtual environment.
Why it matters: Automated dependency vulnerability scanning cannot be executed locally or integrated into pre-commit workflows without installed tooling.
Suggested fix: Add `pip-audit` to `requirements-dev.txt` and incorporate automated CVE checks into CI.

ID: J-010 | Severity: INFO | Location: `hush-landing-v2, .env.local`
Evidence: Working tree contains `.env.local` (1,409 bytes) containing `VERCEL_OIDC_TOKEN` JWT. The file is untracked and matched by `.env*` in `.gitignore`. `git log --all -- "*.env*"` confirms it was never committed.
Why it matters: Secret hygiene risk on disk.
Suggested fix: Rotate token and purge file from local disk.

ID: J-011 | Severity: INFO | Location: `jolly-hawking, README.md, agent/README.md`
Evidence: Textual attributions present for Graphify (Apache 2.0) and Google Gemma 4, Anthropic Claude, and Antigravity, but no standalone `NOTICE` or `ATTRIBUTIONS.md` exists.
Why it matters: Formal packaging standards benefit from a centralized attribution notice for third-party Apache 2.0 components.
Suggested fix: Add a standardized `NOTICE` file documenting all bundled third-party dependencies and licenses.

---

## 4. CLAIMS AUDIT

### 4.1 Claims That Are SAFE to Make

1. **"285 Automated Unit Tests Passing"**: Verified. Running `pytest agent/tests` executes exactly 285 passing tests across 36 test files with zero failures and zero skips.
2. **"Zero Third-Party Tracking or Analytics on Web Showcase"**: Verified. Network interception during live site audits at Vercel and GitHub Pages confirmed zero external network calls; 100% of assets, fonts, and media are served same-origin.
3. **"10 Permitted Command Binaries Allowlist"**: Verified. `core/command_safety.py` restricts the initial command token to exactly 10 binaries: `git`, `npm`, `node`, `python`, `pip`, `dir`, `type`, `echo`, `mkdir`, `cd`.
4. **"Maximum 80-Step Loop Termination Cap"**: Verified. `core/constants.py:19` sets `MAX_STEPS_DEFAULT = 80`, and `core/loop.py:65` enforces loop exit with code 4 (`EXIT_MAX_STEPS`) when exceeded.
5. **"Tamper-Evident SHA-256 Audit Hash Chaining"**: Verified. `core/audit.py` links events sequentially using cryptographic SHA-256 digests (`verify_chain()` validates integrity of individual records).
6. **"Fully Responsive Web Layout Across Mobile, Tablet, and Desktop"**: Verified. 0 horizontal overflow (`scrollWidth === innerWidth`) measured at 390px, 768px, and 1440px.
7. **"WCAG AA Compliant Text Contrast on Production Landing Pages"**: Verified. 174 tested element pairings on the live dark theme achieve contrast ratios between 5.58:1 and 18.51:1 (exceeding 4.5:1 requirement).
8. **"Adaptive Reduced Motion Accessibility"**: Verified. `prefers-reduced-motion: reduce` dynamically unmounts `<video>` elements, renders static poster images with accessible alt text, and clamps animation durations to 0.00001s.
9. **"22 Base / 23 Switching Mode Model Tool Schema"**: Verified. `core/tool_schema.py` exposes exactly 22 base tools, adding `switch_account` as the 23rd tool when account switching is enabled.
10. **"Simulated Desktop Execution in Offline Demo Mode"**: Verified. `DemoWorld` provides an in-memory 1280x720 simulated desktop environment without physical mouse, keyboard, or window movement.

---

### 4.2 Claims That MUST Be Removed or Relabeled

1. **REMOVE/RELABEL: "Verified on a Real Desktop" / "All safety claims verified on physical desktop hardware"**
   - *Current Claim in `docs/QA_REPORT.md:7, 18, 173`*: Claims that emergency kill hotkey, mouse corner, loop breaker, checkpoints, and graph stall detection are verified on physical Windows hardware.
   - *Code Reality*: `src/data/verification.ts:138` and `verification/real_desktop_results.json` explicitly state `TOTAL_VERIFIED_COUNT = 0` and that 0 of 8 checks have physical hardware verification. Tests in `agent/tests_real/` use synthetic keystroke injection, in-process exceptions, or in-memory Pillow canvases.
   - *Action*: Relabel to `"Unit-tested / Injected (Physical hardware verification pending)"`.
2. **REMOVE/RELABEL: "Simulated Demo Mode (No Live Keys Required)"**
   - *Current Claim in `README.md:183`*: Advertises keyless demo execution without API credentials.
   - *Code Reality*: `python orchestrator.py --demo` crashes immediately with `ValueError: GEMINI_API_KEY environment variable is not set` because `ModelClient` requires live Google API credentials even when `DemoWorld` is active.
   - *Action*: Relabel to `"Simulated Desktop Demo (Requires GEMINI_API_KEY for model inference)"` until an offline mock model fallback is implemented.
3. **REMOVE/RELABEL: "Desktop Verified: True" in `src/data/safety.ts`**
   - *Current Claim in `src/data/safety.ts:11-99`*: Flags 6 safety controls as `desktopVerified: true`, suppressing the "Not yet verified" badge in the UI.
   - *Code Reality*: Hardware verification is pending across all features.
   - *Action*: Set `desktopVerified: false` to accurately show "Not yet verified on a real desktop" across all controls.
4. **REMOVE/RELABEL: "Active in Real Desktop Runs" in `EmergencyGuardrailsCard.tsx:25`**
   - *Current Claim*: Header pill claims emergency guardrails are active and verified in real desktop runs.
   - *Code Reality*: Hardware verification is pending.
   - *Action*: Relabel to `"Configured for Desktop Runs (Hardware Verification Pending)"`.
5. **REMOVE/RELABEL: "Ctrl + C Cleanly Closes Windows and Saves Atomic Checkpoint"**
   - *Current Claim in `README.md:377` and `docs/TROUBLESHOOTING.md:233`*: Claims pressing Ctrl+C in the terminal cleanly closes open application windows and serializes an atomic checkpoint before exiting.
   - *Code Reality*: Zero `KeyboardInterrupt` or signal handling exists in `cli.py` or `loop.py`. In fact, `loop.py:230` catches and swallows `KeyboardInterrupt` inside tool retry loops.
   - *Action*: Remove this claim until a graceful signal handler is implemented.
6. **RELABEL: `public/replay_real.json` as Real Execution Replay**
   - *Current Claim*: Filename implies an authentic multi-step physical desktop execution trace.
   - *Code Reality*: File contains a 1-event stub with `"mode": "mocked"` and `"label": "Simulated desktop"`.
   - *Action*: Relabel documentation to state that `replay_real.json` is a placeholder stub.
7. **RELABEL: Loop Breaker Threshold `max_distance = 2`**
   - *Current Claim in `README.md:180` and `ARCHITECTURE_MAP.md:90`*: Claims loop breaker difference threshold is tuned to `max_distance = 2`.
   - *Code Reality*: `agent/core/loopbreaker.py:9` defines `DEFAULT_MAX_DISTANCE: int = 4`.
   - *Action*: Update documentation to state `max_distance = 4` (or update code default to 2).
8. **REMOVE/RELABEL: "Tool Registry (22 + 23 Tools)" Header in `README.md:46, 392`**
   - *Current Claim*: Heading implies 45 tools.
   - *Code Reality*: 22 base tools, expanding to 23 with account switching.
   - *Action*: Rename heading to `"Tool Registry (22 Base Tools / 23 with Account Switching)"`.
9. **RELABEL: "274 Unit Tests Passing" in `SUBMISSION.md:66, 93`**
   - *Current Claim*: Cites 274 tests across 34 test suites.
   - *Code Reality*: Pytest suite has expanded to 285 passing tests across 36 files.
   - *Action*: Update count to 285 tests across 36 test files.

---

## 5. TOP 10 FIXES IN PRIORITY ORDER

1. **Fix Ctrl+C Swallowing in Tool Loop (`loop.py:230-242`)**:
   Re-raise `KeyboardInterrupt` and `SystemExit` immediately at the top of the `except BaseException as exc:` block to ensure operators can instantly terminate the agent via terminal break.
2. **Provide Offline Model Fallback for `--demo` (`cli.py:264`)**:
   Implement a mock or scripted `ModelClient` fallback when `--demo` is passed without `GEMINI_API_KEY`, enabling true zero-credential offline reproducibility as advertised.
3. **Harden Command Allowlist Against Quoting & Whitespace Bypasses (`command_safety.py`)**:
   Normalize tokens by stripping internal quote characters prior to sensitive path checks (`type ."env"`), and parse subcommands at the token level to block `git -c`, `git push`, `pip install`, and `node -p` regardless of whitespace or formatting.
4. **Revoke and Purge `VERCEL_OIDC_TOKEN` (`hush-landing-v2/.env.local`)**:
   Immediately revoke the OIDC JWT in Vercel project settings, delete `.env.local` from local disk, and add `.env*` to `.vercelignore`.
5. **Reconcile Open-Source Licensing Inconsistency (Root `LICENSE` vs `real-desktop`)**:
   Resolve whether the repository is licensed under MIT or Apache 2.0; merge or revert commit `8c3e743` so all branches and package manifests agree.
6. **Implement Preemptive Process Termination for Kill Switch (`killswitch.py`, `loop.py`)**:
   Ensure `KillSwitch` triggers immediate, preemptive termination (e.g. `os._exit(EXIT_KILL)`) rather than waiting up to 40 minutes for synchronous blocking calls (`subprocess.run`, `time.sleep`, Playwright CDP polling) to complete.
7. **Document `requirements-dev.txt` in Root `README.md`**:
   Add `pip install -r requirements-dev.txt` to the root README testing setup instructions so clean clones can run `pytest` without manual troubleshooting.
8. **Harmonize Verification Claims Across Documentation and UI (`QA_REPORT.md`, `safety.ts`)**:
   Correct `docs/QA_REPORT.md` to honestly state that 0 of 8 hardware checks have physical verification, and set `desktopVerified: false` in `src/data/safety.ts` so UI badges match reality.
9. **Add Missing Ignore Rules to Root `.gitignore`**:
   Add `verification/shots/`, `docs/audit/shots/`, `.venv/`, `venv/`, `.vscode/`, `.idea/`, and `Thumbs.db` to `.gitignore` to prevent untracked file clutter and accidental binary commits.
10. **Fix Broken Asset Links on Legacy Route `/v1.html`**:
    Update video and graph asset references in `/v1.html` to point to `./v2/media/hero.mp4` and restore or gracefully hide `graph/graph.html` to eliminate 404 network errors.

---
*Report generated and authenticated by Independent Lead Auditor.*  
*Artifacts captured and verified: 8 live site viewport screenshots saved to `docs/audit/shots/`.*
