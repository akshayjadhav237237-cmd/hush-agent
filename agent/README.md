# Hush Desktop Agent

Modular autonomous desktop orchestration agent built with Google Gemma 4.

## Overview

Hush orchestrates multi-agent desktop workflows by using Google Gemma 4 (via native function calling and visual screenshot inspection) to drive Claude (architect & prompt-writer), Gemini Deep Research (researcher), and Antigravity (IDE coding agent). Hush progresses autonomously and silently whenever possible, escalating to the operator only when progress cannot continue without human intervention (login, captcha, payment, ambiguous requirement, destructive action approval, or repeated failure).

Hush features a modular core architecture with cryptographically chained audit logging, atomic checkpointing and resume, simulated demo mode, an asynchronous global kill switch, an image-hashing loop breaker, automatic backoff and limit waiting, optional multi-profile account switching, and side-by-side run comparison.

## Module Map

### Orchestrator & CLI Tools (`agent/`)

- `orchestrator.py`: Main entry point for launching, resuming, or running simulated demo orchestration workflows.
- `compare_runs.py`: Tamper-evident side-by-side run comparison tool verifying audit chains and analyzing steps, retries, gates, kills, tokens, wall time, and costs.
- `export_replay.py`: Audit replay exporter converting completed or interrupted runs into redacted JSON replay logs.

### Core Architecture (`agent/core/`)

- `core/accounts.py`: Chrome profile account switching with cooldowns, confirmation gates, and usage limits.
- `core/artifacts.py`: Local run artifact storage and resume prompt generation for long-text transfer.
- `core/audit.py`: Cryptographically chained JSONL audit log with SHA-256 integrity and secret redaction.
- `core/checkpoint.py`: Atomic run state serialization, checkpointing, and run discovery.
- `core/cli.py`: Command-line argument parsing and end-to-end execution bootstrap.
- `core/command_safety.py`: Binary allowlist, operator blocks, and filesystem confinement guardrails for shell execution.
- `core/constants.py`: Standard paths, model defaults, screen resolutions, and process exit codes.
- `core/demo/project_files.py`: Deterministic file and code generator for mock demo workflows.
- `core/demo/screens.py`: Synthetic 1280x720 PNG screen renderer for mock applications.
- `core/demo/world.py`: In-memory state machine implementing the `Desktop` protocol for demo evaluation.
- `core/desktop_tools.py`: Real Windows desktop automation driver using PyAutoGUI, PyGetWindow, and Pyperclip.
- `core/graph_tools.py`: Knowledge graph extraction, update, inspection, and stall detection via Graphify.
- `core/killswitch.py`: Global hotkey kill switch (`Ctrl+Alt+K`) polled at 20 Hz and PyAutoGUI failsafe detector.
- `core/limits.py`: Usage limit pause and countdown manager with periodic kill switch checks.
- `core/loop.py`: Main model-tool execution loop, failure escalations, and safety gate dispatching.
- `core/loopbreaker.py`: Perceptual difference hashing (`dhash`) to break repetitive action or wait loops.
- `core/model_client.py`: Google GenAI Client wrapper with exponential backoff, usage tracking, and error classification.
- `core/notify.py`: Human escalation handler supporting console prompts and optional ntfy.sh push alerts.
- `core/openai_client.py`: OpenAI ChatCompletion client wrapper supporting tool translation, backoff retries, usage tracking, and GenAI format compatibility.
- `core/prompts.py`: System prompt, playbook, bootstrap templates, and resume message builders.
- `core/retry.py`: Exponential backoff with jitter and GenAI response candidate extraction.
- `core/shell_tool.py`: Subprocess command runner bounded by timeout, output truncation, and safety checks.
- `core/tool_registry.py`: Factory aggregating desktop, shell, graph, artifact, and limit tools into a unified registry.
- `core/tool_schema.py`: GenAI tool definitions and function declaration schemas (22 or 23 tools).
- `core/types.py`: Protocol definitions (`Desktop`), callback signatures, and execution `RunContext`.
- `core/vision.py`: Screenshot image part encoding and historical image pruning to manage model context.

## CLI Flags

Usage: `python orchestrator.py [OPTIONS] [idea ...]`

- `idea`: Positional arguments describing the project or application to build autonomously.
- `--resume [RUN_ID]`: Resume an interrupted run. If no `RUN_ID` is provided, automatically selects the most recent run (`latest`).
- `--demo`: Run in simulated demo mode against mock applications without moving the real mouse or opening browser windows.
- `--demo-limit`: Trigger a simulated service usage limit scenario during demo execution.
- `--demo-answer TEXT`: Pre-configured answer to supply automatically when `notify_human` or `NEEDS_HUMAN` triggers during demo mode.
- `--account-switch`: Enable automated switching between Chrome profiles upon hitting service limits.
- `--i-accept-account-switch-terms`: Acknowledge caution terms and risks for automated Chrome account switching non-interactively.
- `--log-text`: Record raw clipboard and artifact payloads in audit logs instead of hashing and recording lengths.
- `--provider {gemma,openai}`: Model provider to use for orchestration (default: `gemma`). Selects between `gemma` (Google GenAI SDK, requires `GEMINI_API_KEY`) and `openai` (OpenAI Chat Completions API with function calling, requires `OPENAI_API_KEY`). Both providers support automatic exponential backoff retries, error recovery, and token usage tracking.
- `--max-steps N`: Hard cap on the maximum number of orchestrator loop turns (default: `80`).
- `-h`, `--help`: Show CLI options and descriptions. Works cleanly without `GEMINI_API_KEY` or `OPENAI_API_KEY` set.

## Registered Tools

The tool schema defines **22 tools** by default, or **23 tools** when `--account-switch` is active:

1. `open_app(name: string)`: Open a desktop application via the Windows Start menu.
2. `open_url(url: string)`: Open a URL in the default browser.
3. `focus_window(title_contains: string)`: Bring a window matching title substring to the foreground.
4. `paste_text(text: string, press_enter: boolean)`: Paste text into the focused element via clipboard.
5. `press_keys(keys: string)`: Send hotkey chords or key sequences (e.g., `ctrl+l`, `f2`).
6. `click(x: integer, y: integer)`: Click at screenshot coordinate space (automatically scaled to desktop resolution).
7. `scroll(amount: integer)`: Scroll mouse wheel vertically.
8. `screenshot()`: Capture a full-screen screenshot and attach it to model context.
9. `read_clipboard()`: Read current system clipboard text (truncated to 4,000 characters).
10. `wait(seconds: integer)`: Pause execution (maximum 120 seconds).
11. `run_cmd(command: string)`: Execute an allowlisted shell command confined to the project directory.
12. `graph_build()`: Extract and generate initial Graphify knowledge graph and report.
13. `graph_update()`: Refresh Graphify graph after code changes and inspect for stalled build progress.
14. `graph_report()`: Read the latest `GRAPH_REPORT.md` summary (up to 6,000 characters).
15. `graph_query(question: string)`: Query the Graphify knowledge graph.
16. `graph_explain(symbol: string)`: Explain a symbol using the Graphify graph.
17. `graph_path(source: string, target: string)`: Trace connection paths between symbols in the code graph.
18. `save_artifact(name: string)`: Save full clipboard content as a persistent artifact file.
19. `paste_artifact(name: string, press_enter: boolean)`: Load artifact file and paste directly into focused window without size limits.
20. `report_limit(app: string, minutes_until_reset: integer)`: Report service limit; pauses execution or routes to account switching.
21. `notify_human(message: string)`: Escalate question to the operator and wait for response.
22. `finish(summary: string)`: Conclude orchestrator execution with a completion summary.
23. `switch_account(app: string)`: Switch Chrome profile for Claude or Gemini (active only when account switching is configured).

## Constants Quoted from Code

- **Default Model**: `os.getenv("GEMMA_MODEL", "gemma-4-26b-a4b-it")`
- **OpenAI Model**: `os.getenv("OPENAI_MODEL", "gpt-4o")`
- **Supported Providers**: `PROVIDERS = ("gemma", "openai")`
- **Default Max Steps**: `MAX_STEPS_DEFAULT = 80`
- **Screenshot Width**: `SHOT_WIDTH = 1280`
- **Context Screenshot Retention**: `KEEP_SCREENSHOTS = 2`
- **Exit Codes**:
  - `EXIT_OK = 0`: Run finished successfully via `finish` tool.
  - `EXIT_ERROR = 1`: Invalid arguments, missing files, or runtime initialization failure.
  - `EXIT_FAILSAFE = 2`: Hardware mouse-corner abort triggered (`pyautogui.FailSafeException`).
  - `EXIT_KILL = 3`: Emergency abort via kill switch (`Ctrl+Alt+K` or signal).
  - `EXIT_MAX_STEPS = 4`: Step limit reached without task completion.
  - `EXIT_MODEL_FAILURE = 5`: Repeated unrecoverable model generation failures.
- **Emergency Abort Hotkey**: `HOTKEY_DESCRIPTION = "Ctrl+Alt+K (polled at 20 Hz globally)"`
- **Command Allowlist**: `ALLOWED_COMMANDS = {"git", "npm", "node", "python", "pip", "dir", "type", "echo", "mkdir", "cd"}`
- **Blocked Substrings**: `("rm -rf", "rmdir /s", "del /s", "format ", "shutdown", "reg delete", "diskpart", "powershell -enc", "curl ", "wget ", "invoke-webrequest", "&&", "||", "|", ">", "<", ";", "&", "%", "^", "`", "$(", "\n", "\r", "git push", "git remote", "git config", "git credential", "git -c", "pip install")`
- **Blocked Sensitive File Names**: `BLOCKED_PATH_NAMES = {".env", ".ssh", "id_rsa", "credentials", "secrets"}`
- **Account Switcher Constraints**: `MAX_SWITCHES = 2`, `COOLDOWN_SECONDS = 120.0`

## Safety Features and Verification Status

- **Hardware Corner Failsafe**: Moving mouse to top-left corner raises `pyautogui.FailSafeException`. Intercepted cleanly by orchestrator, logged as `failsafe_abort`, and exits with code 2 without showing exception text to model. *(Implemented, tested via synthetic injection; physical hardware verification pending)*
- **Emergency Kill Switch**: Asynchronous thread polling `Ctrl+Alt+K` at 20 Hz via Windows `GetAsyncKeyState`. Intercepts loop before and during tool calls and exits with code 3. *(Implemented, tested via synthetic injection; physical hardware verification pending)*
- **Filesystem Path Confinement**: `run_cmd` resolves all path arguments against `project_dir` using `os.path.realpath` and `os.path.commonpath`. Blocks `..` traversal, drive escapes, and UNC network paths (`\\`). *(Implemented and unit-tested; not yet verified on a real desktop)*
- **Command Operator Deny-List**: Rejects command separators (`&&`, `||`, `;`, `&`), redirection (`>`, `<`), string interpolation (`$()`, backticks, `%`), and dangerous administrative tools (`powershell -enc`, `curl`, `wget`). *(Implemented and unit-tested; not yet verified on a real desktop)*
- **Loop Breaker**: Difference hash (`dhash`) compares consecutive screen captures. Trips alert if screen remains identical across 3 consecutive interactive actions (`act`) or 15 wait intervals (`wait`). *(Implemented and unit-tested; not yet verified on a real desktop)*
- **Cryptographic Audit Trail**: Each event in `audit.jsonl` is linked to the previous line via SHA-256 hash chaining (`prev` field). Validated with `verify_chain()`. *(Implemented and unit-tested)*
- **Secret Redaction**: Redacts patterns for Google API keys (`AIza...`), Anthropic/OpenAI keys (`sk-...`), GitHub tokens (`ghp_...`, `github_pat_...`), and HTTP Authorization headers (`Bearer ...`) from all audit logs and error messages. *(Implemented and unit-tested)*
- **Artifact Pipeline**: Tools `save_artifact` and `paste_artifact` transfer long text (reports, prompts) directly between disk and clipboard, preventing large text injection errors into model call arguments. *(Implemented and unit-tested)*
- **Token Usage Auditing**: Records `prompt_tokens` and `completion_tokens` directly within `model_text` audit records for each interaction step. *(Implemented and unit-tested)*

## Account Switching

Automated Chrome account switching allows alternating profiles when Claude or Gemini hit rate limits. *(Implemented and unit-tested; not yet verified on a real desktop)*

### Caution Notice

> "Switching between accounts to work around usage limits may violate the terms of the services involved and could get those accounts restricted. Use only your own accounts. Hush never stores or types passwords."

### Setup

1. Configure profiles in environment:
   ```cmd
   set HUSH_CHROME_PROFILES="Profile 1, Profile 2"
   ```
2. Enable with explicit consent:
   ```bash
   python orchestrator.py --account-switch --i-accept-account-switch-terms "my project idea"
   ```
   Or run with interactive terminal prompt (must enter `I UNDERSTAND` to proceed).

## Model Providers

Hush supports two model execution providers:
- **Gemma (Default)**: Driven via Google GenAI SDK (`DEFAULT_MODEL = os.getenv("GEMMA_MODEL", "gemma-4-26b-a4b-it")`). Requires `GEMINI_API_KEY`. Captures token usage metadata from API responses. *(Implemented and unit-tested; not yet verified on a real desktop)*
- **OpenAI**: Driven via OpenAI Chat Completions API (`OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")`). Requires `OPENAI_API_KEY`. Automatically translates Google GenAI tool declarations and message history into OpenAI function calling format, with deterministic tool call ID pairing and 90-second request timeouts. Captures token usage metadata from API responses. *(Implemented and unit-tested; not yet verified on a real desktop)*

## Token Usage Tracking

Both model clients capture token consumption metrics on every generation call:

- **Client Tracking (`last_usage`)**:
  - `ModelClient` (Gemma): Extracts usage metadata (`prompt_token_count` and `candidates_token_count`) from Google GenAI SDK responses via `extract_usage()`, populating `model.last_usage = {"prompt_tokens": int, "completion_tokens": int}`.
  - `OpenAIModelClient` (OpenAI): Extracts usage metrics (`prompt_tokens` and `completion_tokens`) directly from `ChatCompletion.usage` after successful generation, setting `model.last_usage`.
- **Audit Logging**:
  - In `core/loop.py`, `model_text` events recorded in `audit.jsonl` include `prompt_tokens` and `completion_tokens` from `model.last_usage` for each turn.
  - When the model returns function calls without text content, a `model_text` record with empty text is still logged to ensure token counts are never dropped from the tamper-evident audit trail.
- **Verification Status**: *(Implemented and unit-tested)*

## Demo Mode

Run a complete simulated build workflow using mock applications and pre-scripted state transitions: *(Implemented and unit-tested)*

```bash
# Using Gemma (default)
set GEMINI_API_KEY=your-api-key
python orchestrator.py --demo --demo-answer "SQLite" "a todo app"

# Using OpenAI provider
set OPENAI_API_KEY=your-api-key
python orchestrator.py --demo --provider openai --demo-answer "SQLite" "a todo app"
```

Demo mode renders synthetic 1280x720 PNG screens in-memory, writes real Python code into the run folder (`project/`), exercises human escalation, and requires zero mouse movements or real window focus.

## Exporting Replays

Convert any completed or interrupted run into a redacted, shareable JSON replay: *(Implemented and unit-tested)*

```bash
python export_replay.py latest
# Or specify run ID:
python export_replay.py 20261022-120000
```

Validates the audit chain integrity and outputs `replay.json` containing step summaries, timings, and tool calls with all clipboard text redacted.

## Comparing Runs

Hush includes a comparison utility (`compare_runs.py`) to analyze and contrast performance, safety, and cost metrics across multiple agent executions using their audit logs: *(Implemented and unit-tested)*

### Usage

```bash
python compare_runs.py <run_id_a> <run_id_b> [--price-in X --price-out Y]
```

- `<run_id_a>`: First run ID (located in `runs/`) or direct path to an `audit.jsonl` file.
- `<run_id_b>`: Second run ID (located in `runs/`) or direct path to an `audit.jsonl` file.
- `--price-in X`: Optional token pricing for input tokens in USD per 1M tokens (e.g. `2.50`).
- `--price-out Y`: Optional token pricing for output tokens in USD per 1M tokens (e.g. `10.00`).

### Features

- **Cryptographic Verification**: Calls `verify_chain()` on both run audit logs prior to analysis. If either log has been altered, corrupted, or has broken SHA-256 parent links, comparison refuses to proceed and reports a validation failure.
- **Side-by-Side Metric Comparison**: Parses sanitized audit events and generates an aligned tabular view comparing:
  - `provider`: Model provider (`gemma` vs `openai`).
  - `model`: Specific model checkpoint or identifier.
  - `steps`: Total orchestrator loop steps executed.
  - `retries`: Number of backoff retries triggered during model requests.
  - `gate count`: Number of safety or human intervention gates encountered (e.g., loop breaker, human questions).
  - `kill count`: Emergency kill switch triggers detected.
  - `prompt_tokens`: Cumulative prompt tokens consumed.
  - `completion_tokens`: Cumulative completion tokens generated.
  - `wall_time`: Total run duration in seconds (computed from first to last audit timestamp).
  - `cost`: Total estimated run cost (calculated when `--price-in` and `--price-out` are provided).

### Example Output

```text
Metric            | Run A (20261022-120000) | Run B (20261022-120617)
------------------+-------------------------+------------------------
provider          | gemma                   | openai
model             | gemma-4-26b-a4b-it      | gpt-4o
steps             | 4                       | 4
retries           | 0                       | 0
gate count        | 0                       | 0
kill count        | 0                       | 0
prompt_tokens     | 1250                    | 1420
completion_tokens | 380                     | 410
wall_time         | 12.4s                   | 9.8s
cost              | $0.0069                 | $0.0077
```

## Continuous Integration (CI)

Hush includes automated CI testing configured in `.github/workflows/agent-tests.yml`: *(Implemented and unit-tested)*

- **Triggers**: Executes on `push` and `pull_request` targeting the `main` branch when changes are made to files in `agent/**` or `.github/workflows/agent-tests.yml`.
- **Environment**: Matrix job running on `ubuntu-latest` with Python 3.12 (`actions/setup-python@v5`).
- **Hermetic & Offline**: Installs dependencies from `agent/requirements.txt` and `agent/requirements-dev.txt` and executes `pytest -q` directly from the `agent` working directory.
- **No Secrets Required**: The test suite runs entirely offline against mock desktops, simulated world states, and synthetic API responses without requiring external network connectivity or API credentials (`GEMINI_API_KEY`, `OPENAI_API_KEY`).

## Known Limitations

- **Guardrail Scope**: The command allowlist is an operational guardrail, not an OS sandbox. Binaries like `python` and `npm` execute arbitrary code within the project directory.
- **Gemma Click Grounding**: Visual coordinate accuracy for desktop clicks is experimental and unverified on physical hardware.
- **Antigravity Account Switching**: Unsupported. Account switching applies only to browser-based Claude and Gemini; Antigravity limits require manual human resolution.
- **Limit Detection**: Usage limit banners and cooldown times are recognized visually by the model from screenshots; the orchestrator handles countdown pauses and resume execution in code.
- **Push Notification Privacy**: `ntfy.sh` topics are public by design; choose obscure, high-entropy topic names if using mobile push alerts.

## Attribution

Graphify is a separate open-source project by [Graphify Labs](https://graphify.com), used under its Apache 2.0 license ([GitHub](https://github.com/Graphify-Labs/graphify)).
