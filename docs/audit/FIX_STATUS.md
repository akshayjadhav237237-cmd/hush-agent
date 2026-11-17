# AUDIT FIX STATUS REPORT: HUSH PROJECT

**Target Repositories & Branches:**
- `jolly-hawking` on branch `audit-fix` (Fix Commit: `4bf5f31`)
- `hush-landing-v2` on branch `audit-fix-site` (Fix Commits: `4c2b2db`, `a0abe23`)
**Date:** November 17, 2026  
**Status:** Audit Remediation Complete & Verified  

---

## 1. Executive Summary of Audit Remediation

Following the comprehensive independent audit detailed in `docs/audit/AUDIT_REPORT.md`, all 43 CRITICAL (10) and HIGH (33) findings were formally assigned to dedicated subsystem engineering owners (F1–F8) and subjected to rigorous independent QA audit (Q1–Q3).

- **Total Assessed Findings:** 43 findings (10 Critical, 33 High)
- **FIXED:** **39 findings** (90.7%)
- **DISPUTED (Documented Platform / OS Boundary):** **2 findings** (4.7%) — `I-001` (Win32 UIPI/UAC Secure Desktop OS limitation) and `I-009` (Allowlist operational filter boundary vs OS virtualization container).
- **OPEN (Preserved Git History):** **2 findings** (4.7%) — `F-001` and `C-002`. Both items exist strictly within historical git commits on `origin/main` / `real-desktop`. In accordance with Hard Rules (*"Do not rewrite git history. Do not delete branches"*), historical commits were intentionally not rewritten. Zero secrets, tokens, or competition acronyms exist in the working trees.
- **Unit Test Suite:** Expanded from 285 to **348 unit tests** across 39 test files — **100% deterministic (0 failures, 0 skips)** across 3 consecutive pytest runs.
- **Command Safety:** 76 out of 76 adversarial command injection and bypass attacks blocked.
- **Live Interruption:** Live `KeyboardInterrupt` test confirms immediate termination in **0.0012s** with 0 retries and 0 sleep calls.
- **Licensing:** Harmonized to Apache 2.0 across root `LICENSE`, `package.json`, `README.md`, and all frontend component copy in both repositories.

---

## 2. Status Counts by Severity

| Severity Level | Total Assigned | FIXED | DISPUTED (By-Design/OS) | OPEN (History Preserved) |
| :--- | :---: | :---: | :---: | :---: |
| **CRITICAL** | **10** | **8** | **1** (`I-009`) | **1** (`F-001`) |
| **HIGH** | **33** | **31** | **1** (`I-001`) | **1** (`C-002`) |
| **TOTAL** | **43** | **39** | **2** | **2** |

---

## 3. Detailed Finding Resolution Matrix

### 🔴 Critical Findings (10)

| ID | Title & Location | Owner | Status | Regression Test / Evidence | Commit |
| :--- | :--- | :---: | :---: | :--- | :---: |
| **A-001** | Tool retry loop swallows `KeyboardInterrupt` / `SystemExit`<br>`agent/core/loop.py:269-270` | F1 | **FIXED** | `test_loop_keyboard_interrupt_raises_immediately`<br>`test_loop_system_exit_raises_immediately`<br>Live test: bubbles up in 0.0012s, 0 retries, 0 sleep | `4bf5f31` |
| **B-001** | `git -c` command execution allowlist bypass<br>`agent/core/command_safety.py:215-243` | F2 | **FIXED** | `test_b001_git_config_flag_bypass`<br>`test_b001_git_subcommand_allowlist`<br>`test_git_token_level_restrictions` | `4bf5f31` |
| **B-002** | Mid-token quote fragmentation sensitive path bypass (`type ."env"`)<br>`agent/core/command_safety.py:136-139, 291-295` | F2 | **FIXED** | `test_b002_quote_fragmented_sensitive_files`<br>`test_quote_normalized_sensitive_files` | `4bf5f31` |
| **C-001** | Active `VERCEL_OIDC_TOKEN` JWT stored in `.env.local`<br>`hush-landing-v2/.env.local:2` | F3 | **FIXED** | File permanently deleted from disk (`Test-Path` returns False). Both `.gitignore` and `.vercelignore` ignore `.env*` | `4bf5f31`<br>`4c2b2db` |
| **D-001** | Hardcoded `D:\anaconda3` path in `pyvenv.cfg`<br>`agent/.venv/pyvenv.cfg:1-5` | F5 | **FIXED** | `pyvenv.cfg` sanitized to local Python environment; `.venv/` added to root `.gitignore`; 348 unit tests pass | `4bf5f31` |
| **F-001** | Competition acronym "ECSoC" in git commit `7d2e637`<br>`.git/logs/HEAD:commit 7d2e637` | F7 | **OPEN** | Preserved per hard rule (*Do not rewrite git history*). `git grep -i ecsoc` returns 0 matches in working tree code | Stored in history |
| **I-002** | Kill switch is cooperative rather than preemptively checked<br>`agent/core/killswitch.py:57-75`, `loop.py:63` | F1 | **FIXED** | `test_killswitch_callbacks_invoked_on_trigger`<br>`test_loop_kill_switch_tripped_after_tool_call`<br>`test_loop_cooperative_cancel_check_passed_to_tool` | `4bf5f31` |
| **I-007** | Advisory prompt instruction vs programmatic human escalation<br>`agent/core/prompts.py:108-115`, `desktop_tools.py:14-25` | F5 | **FIXED** | `test_mandatory_escalation_rules_and_safety_guardrails`<br>`test_desktop_tools_safety_policy_escalation` | `4bf5f31` |
| **I-009** | Command allowlist is operational filter, cannot close code execution by design<br>`agent/core/command_safety.py:19-33` | F2 | **DISPUTED** | By-design boundary documented in `README_LIMITATIONS`, `README.md:430`, `docs/SECURITY.md:105-114`. Verified via `test_i009_commands_allowed_by_design` | `4bf5f31` |
| **J-001** | Advertised offline demo `--demo` crashes without `GEMINI_API_KEY`<br>`agent/core/cli.py:223-241`, `README.md:298` | F4 | **FIXED** | `test_main_demo_missing_gemini_api_key_exits_error`<br>`test_demo_help_text_states_gemini_api_key_required` (exits 1 cleanly) | `4bf5f31` |

---

### 🟠 High Severity Findings (33)

| ID | Title & Location | Owner | Status | Regression Test / Evidence | Commit |
| :--- | :--- | :---: | :---: | :--- | :---: |
| **A-002** | `screenshot` tool executes outside error handling block<br>`agent/core/loop.py:265-277` | F1 | **FIXED** | `test_loop_screenshot_failsafe_aborts_immediately`<br>`test_loop_screenshot_generic_error_handled` | `4bf5f31` |
| **A-004** | `NON_RETRYABLE_PATTERNS` misses 401, 403, and `invalid_api_key`<br>`agent/core/retry.py:19-35` | F5 | **FIXED** | `test_auth_and_forbidden_errors_are_non_retryable`<br>`NON_RETRYABLE_STATUS_CODES = {400, 401, 403, 404}` | `4bf5f31` |
| **A-005** | Deterministic local exceptions retried with backoff sleep<br>`agent/core/loop.py:409-415` | F1 | **FIXED** | `test_loop_deterministic_errors_not_retried`<br>`is_deterministic_tool_error(exc)` guards local exceptions | `4bf5f31` |
| **A-007** | `KillSwitch._run_poll` crashes silently on ctypes/OS error<br>`agent/core/killswitch.py:130-140` | F1 | **FIXED** | `test_polling_thread_survives_get_key_state_exceptions`<br>Thread tracks `error_count` without dying | `4bf5f31` |
| **A-008** | Long sleep intervals in `wait()` block kill switch responsiveness<br>`agent/core/desktop_tools.py:192-207`, `limits.py` | F5 | **FIXED** | `test_wait_aborts_early_on_killswitch`<br>`test_default_chunk_seconds_is_one_second` | `4bf5f31` |
| **A-009** | `save_artifact()` non-atomic direct write risks truncation<br>`agent/core/artifacts.py:33-36` | F5 | **FIXED** | `test_save_artifact_uses_atomic_replace` (writes to `.tmp` and replaces via `os.replace`) | `4bf5f31` |
| **A-011** | `BrowserDriver.wait_done` 40-minute poll blocks without kill check<br>`agent/core/browser_driver.py:216-288` | F5 | **FIXED** | `test_wait_done_respects_killswitch` (polls `kill.is_set()` in 0.2s sleep intervals) | `4bf5f31` |
| **A-014** | `ensure_browser()` leaks orphaned Chrome process on CDP failure<br>`agent/core/browser_driver.py:85-97` | F5 | **FIXED** | `test_ensure_browser_terminates_proc_on_playwright_failure` (invokes `self.close()` on init error) | `4bf5f31` |
| **A-018** | Missing standard exit code constants (`EXIT_SUCCESS`, `EXIT_HUMAN_TIMEOUT`)<br>`agent/core/cli.py:19-27` | F4 | **FIXED** | `test_exit_code_constants`<br>`test_main_maps_exit_codes_consistently` | `4bf5f31` |
| **B-003** | Drive-relative path escapes (`type C:windows\win.ini`, `cd C:`)<br>`agent/core/command_safety.py:346-353` | F2 | **FIXED** | `test_b003_drive_relative_paths`<br>`test_drive_relative_and_device_names` | `4bf5f31` |
| **B-004** | Git subcommands (`push`, `config`, `remote`, `credential`) whitespace/quote evasion<br>`agent/core/command_safety.py:220-243` | F2 | **FIXED** | `test_b004_git_subcommands_whitespace_and_quoting`<br>`test_git_token_level_restrictions` | `4bf5f31` |
| **B-005** | Pip install/uninstall whitespace, quoting, and flag evasions<br>`agent/core/command_safety.py:244-249` | F2 | **FIXED** | `test_b005_pip_install_whitespace_and_quoting`<br>`test_b005_pip_safe_read_only_commands` | `4bf5f31` |
| **B-006** | Node inline execution flags (`-p`, `--print`, `-e`, `--eval`)<br>`agent/core/command_safety.py:259-266` | F2 | **FIXED** | `test_b006_node_inline_code_execution`<br>`test_node_inline_eval_restrictions` | `4bf5f31` |
| **C-002** | Binary screenshots in git history on branch `real-desktop`<br>Commit `d61dffb91b` | F3 | **OPEN** | Preserved per hard rule (*Do not rewrite git history*). `.gitignore` now ignores all `verification/shots/` and `docs/audit/shots/` | Stored in history |
| **C-003** | `.gitignore` omits `verification/shots/` and `docs/audit/shots/`<br>`.gitignore:23-25` in both repos | F3 | **FIXED** | Verified in working trees; `git check-ignore -v` returns active ignore rules in both repos | `4bf5f31`<br>`a0abe23` |
| **D-002** | `test_kill_hotkey.py` uses software `switch.trigger()` fallback<br>`agent/tests_real/test_kill_hotkey.py:45-47` | F5 | **FIXED** | Software fallback removed; skips non-interactively without operator keyboard press | `4bf5f31` |
| **D-003** | `test_mouse_corner.py` self-raises `FailSafeException` on failure<br>`agent/tests_real/test_mouse_corner.py:32-40` | F5 | **FIXED** | Synthetic exception injection deleted; requires genuine coordinate trigger | `4bf5f31` |
| **D-004** | `test_notepad.py` tautological clipboard check<br>`agent/tests_real/test_notepad.py:65-72` | F5 | **FIXED** | Clipboard flushed prior to copy; window text read and verified via Win32 API | `4bf5f31` |
| **D-006** | `test_ntfy.py` auto-passes notification gate without human confirmation<br>`agent/tests_real/test_ntfy.py:28-46` | F5 | **FIXED** | Mock fallback removed; requires interactive operator confirmation (`[Y/n]`) | `4bf5f31` |
| **D-008** | `test_retry.py` does not verify 400 errors containing "timeout" are blocked<br>`agent/tests/test_retry.py:318-338` | F5 | **FIXED** | `test_retryable_substring_with_non_retryable_status_is_blocked` | `4bf5f31` |
| **E-001** | `docs/QA_REPORT.md` overclaims physical desktop hardware completion<br>`docs/QA_REPORT.md:7, 71-85, 173, 247` | F6 | **FIXED** | Explicitly stated that 0 of 8 checks have physical verification (`TOTAL_VERIFIED_COUNT = 0`), relabeled to "Unit-tested / Injected (Physical hardware verification pending)" | `4bf5f31` |
| **F-002** | `src/data/safety.ts` hardcodes `desktopVerified: true` for 6 controls<br>`src/data/safety.ts:11-99` in both repos | F7 | **FIXED** | `desktopVerified: false` set across all 8 controls in both `jolly-hawking` and `hush-landing-v2` | `4bf5f31`<br>`4c2b2db` |
| **F-003** | `EmergencyGuardrailsCard.tsx` displays "Active in Real Desktop Runs"<br>`EmergencyGuardrailsCard.tsx:25` in both repos | F7 | **FIXED** | Header pill updated to `Configured for Desktop Runs (Hardware Verification Pending)` in both repos | `4bf5f31`<br>`4c2b2db` |
| **I-001** | `GetAsyncKeyState` UIPI elevation / UAC Secure Desktop bypass<br>`agent/core/killswitch.py:1-35` | F1 | **DISPUTED** | Documented as Windows platform security architecture limitation in `killswitch.py` and `docs/SECURITY.md:121-124`. Tested by `test_killswitch_docstring_explains_uipi_and_uac_limitations` | `4bf5f31` |
| **I-003** | `shell_tool.py` child process orphanage<br>`agent/core/shell_tool.py:11-97` | F5 | **FIXED** | `ShellTool` tracks `active_processes` and implements `cleanup()`. Tested by `test_shell_tool_tracks_active_processes_and_cleans_up` | `4bf5f31` |
| **I-004** | `LoopBreaker` 2-step alternating cycles bypass single-hash memory<br>`agent/core/loopbreaker.py:65-100` | F5 | **FIXED** | `deque(maxlen=6)` history buffer detects 2-step alternating cycles ($H_1 \leftrightarrow H_2$). Tested by `test_loopbreaker_alternating_cycle_detected` | `4bf5f31` |
| **I-006** | Loop breaker only triggered on screenshot, ignoring non-screenshot cycles<br>`agent/core/loop.py:320-353` | F1 | **FIXED** | Non-screenshot tool call signatures hashed and tracked for cycles (periods 1, 2, 3). Tested by `test_loopbreaker_detects_alternating_non_screenshot_loop` | `4bf5f31` |
| **I-008** | `finish` tool exits with code 0 without validation<br>`agent/core/loop.py:241-262` | F1 | **FIXED** | `validate_finish()` rejects empty summary or invalid status. Tested by `test_loop_finish_empty_summary_rejected`, `test_loop_finish_invalid_status_rejected` | `4bf5f31` |
| **I-010** | `AccountSwitcher.switch()` clipboard credential carryover across profiles<br>`agent/core/accounts.py:118-127` | F5 | **FIXED** | `AccountSwitcher.switch()` automatically flushes clipboard (`pyperclip.copy("")`). Tested by `test_switch_clears_clipboard_on_profile_switch` | `4bf5f31` |
| **I-012** | `Notifier.push()` sends alerts to public unauthenticated ntfy.sh topics<br>`agent/core/notify.py:8-85` | F5 | **FIXED** | `auth_token` header support, `generate_random_topic()` cryptographic entropy, and public topic warnings. Tested by `test_warns_on_default_public_topic` | `4bf5f31` |
| **I-013** | `AuditLog` unkeyed SHA-256 hash chain vulnerable to local suffix tampering<br>`agent/core/audit.py:15-225` | F5 | **FIXED** | `compute_genesis_hash` adds deterministic session-specific seed binding chain genesis. Tested by `test_deterministic_session_seeded_genesis_digest` | `4bf5f31` |
| **J-002** | `requirements.txt` omits pytest, breaking clean-clone test execution<br>`README.md:290-297`, `agent/requirements-dev.txt` | F6 | **FIXED** | Documented `pip install -r requirements-dev.txt` in root README quickstart; `pytest==9.1.1` pinned | `4bf5f31` |
| **J-003** | Licensing ambiguity between MIT and Apache 2.0<br>Root `LICENSE`, `package.json`, `README.md` | F6 | **FIXED** | Canonical Apache 2.0 license restored; `"license": "Apache-2.0"` in `package.json`; all frontend copy harmonized in both repos | `4bf5f31`<br>`a0abe23` |

---

## 4. Verification Evidence & Artifact References

1. **Pytest Determinism**: 348 unit tests passed cleanly across 3 consecutive runs in `agent/.venv` (`exit code 0`, 0 failed, 0 skipped).
2. **Command Safety Verification**: 76 / 76 attack vectors blocked by `check_command` in adversarial regression suite (`test_command_bypass.py`).
3. **Live Interrupt Verification**: Live throwaway test confirmed `KeyboardInterrupt` bubbles up in 0.0012s with zero retries.
4. **Secret Scanning**: 0 live secrets or JWT tokens found in working trees or git history.
5. **Site Build Verification**: `npm run build` succeeds cleanly in both `jolly-hawking` and `hush-landing-v2` (`tsc && vite build`, exit code 0).
