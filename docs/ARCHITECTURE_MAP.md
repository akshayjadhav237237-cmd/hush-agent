# Hush Architecture Map

This document provides a comprehensive map of the Hush orchestrator codebase: modules, tools exposed to Google Gemma 4, and where each safety gate is implemented.

---

## 1. Module Inventory

```
agent/
├── orchestrator.py           # Top-level CLI entry point
├── compare_runs.py           # Evaluates token spend, run times, and tool statistics across runs
├── export_replay.py          # Validates SHA-256 audit logs and exports replay.json
├── core/
│   ├── __init__.py           # Core package exports
│   ├── constants.py          # Constants, exit codes, binary allowlist, model configurations
│   ├── types.py              # Data classes, RunState, RunContext, Protocol interfaces
│   ├── cli.py                # Command-line argument parser and run environment bootstrap
│   ├── loop.py               # Main orchestrator loop, vision ingestion, tool invocation
│   ├── model_client.py       # Google GenAI Gemma 4 API client with retry backoff & token tracking
│   ├── openai_client.py      # OpenAI GPT-4o fallback provider client with message validation
│   ├── retry.py              # Exponential backoff with jitter and non-retryable error detection
│   ├── prompts.py            # System prompts for Gemma 4 (rules, capabilities, tool instructions)
│   ├── tool_schema.py        # GenAI Tool and FunctionDeclaration schemas (22/23 tools)
│   ├── tool_registry.py      # Dispatches model function calls to python implementations
│   ├── desktop_tools.py      # Real desktop implementation (PyAutoGUI, PyGetWindow, pyperclip)
│   ├── shell_tool.py         # Subprocess runner confined to project_dir with allowlist checks
│   ├── command_safety.py     # Command parsing, binary allowlisting, filesystem path validation
│   ├── killswitch.py         # Windows GetAsyncKeyState 20 Hz Ctrl+Alt+K hook & mouse failsafe
│   ├── loopbreaker.py        # Perceptual difference hashing (dhash) screen loop detection
│   ├── notify.py             # Human escalation gate via interactive console and ntfy.sh push
│   ├── audit.py              # SHA-256 hash-chained JSONL audit logger and secret scrubber
│   ├── checkpoint.py         # Atomic run state persistence and recovery (--resume)
│   ├── limits.py             # Interruptible countdown loop for API rate limits and quotas
│   ├── accounts.py           # Multi-profile Chrome browser switcher (bounded to 2 switches)
│   ├── artifacts.py          # Disk-based clipboard artifact storage preventing token truncation
│   ├── graph_tools.py        # Graphify CLI wrappers (AST building, query, and stall detection)
│   ├── vision.py             # Screenshot resizing (1280px width) and PNG base64 encoding
│   └── demo/                 # Deterministic offline execution mode
│       ├── world.py          # Simulated desktop environment implementing Desktop protocol
│       ├── screens.py        # Synthetic 1280x720 PNG screen renderer
│       └── project_files.py  # Mock project directory and file mutations
```

---

## 2. Tools Exposed to Gemma 4

Gemma 4 (`gemma-4-26b-a4b-it`) interacts strictly through function calling. The orchestrator declares 22 base tools (23 when Chrome account switching is enabled).

| Tool Name | Parameters | Purpose | Handled By |
| :--- | :--- | :--- | :--- |
| **`open_app`** | `name: string` | Open desktop app via Start menu search | `core/desktop_tools.py:open_app` |
| **`open_url`** | `url: string` | Open URL in default browser | `core/desktop_tools.py:open_url` |
| **`focus_window`**| `title_contains: string` | Bring window to front by title substring | `core/desktop_tools.py:focus_window` |
| **`paste_text`** | `text: string, press_enter: bool` | Paste text into focused window via clipboard | `core/desktop_tools.py:paste_text` |
| **`press_keys`** | `keys: string` | Press hotkey chord or key combination | `core/desktop_tools.py:press_keys` |
| **`click`** | `x: int, y: int` | Click desktop coordinates (scaled from 1280px) | `core/desktop_tools.py:click` |
| **`scroll`** | `amount: int` | Scroll mouse wheel (negative = down) | `core/desktop_tools.py:scroll` |
| **`screenshot`** | *(none)* | Explicitly capture display state | Handled directly by `core/loop.py` |
| **`read_clipboard`**| *(none)* | Read text from system clipboard | `core/desktop_tools.py:read_clipboard` |
| **`wait`** | `seconds: int` | Pause execution for N seconds | `core/desktop_tools.py:wait` |
| **`run_cmd`** | `command: string` | Execute allowlisted shell command in `project_dir` | `core/shell_tool.py:make_run_cmd` |
| **`graph_build`** | *(none)* | Extract AST and build Graphify knowledge graph | `core/graph_tools.py:graph_build` |
| **`graph_update`**| *(none)* | Refresh graph and check for code stalls | `core/graph_tools.py:graph_update` |
| **`graph_report`**| *(none)* | Read `GRAPH_REPORT.md` (up to 6,000 chars) | `core/graph_tools.py:graph_report` |
| **`graph_query`** | `question: string` | Query graph topology in natural language | `core/graph_tools.py:graph_query` |
| **`graph_explain`**| `symbol: string` | Explain symbol structure and dependencies | `core/graph_tools.py:graph_explain` |
| **`graph_path`** | `source: string, target: string` | Find shortest dependency path between symbols | `core/graph_tools.py:graph_path` |
| **`save_artifact`**| `name: string` | Save clipboard content to disk artifact | `core/artifacts.py:save_artifact` |
| **`paste_artifact`**| `name: string, press_enter: bool` | Load artifact from disk and paste to window | `core/artifacts.py:load_artifact` |
| **`report_limit`**| `app: string, minutes_until_reset: int` | Report provider quota exhaustion or cooldown | `core/tool_registry.py:_report_limit` |
| **`notify_human`**| `message: string` | Halt loop and request operator guidance | `core/notify.py:ask_human` |
| **`finish`** | `summary: string` | Complete execution with summary report | Handled directly by `core/loop.py` |
| **`switch_account`**| `app: string` | Rotate Chrome profile (optional opt-in tool) | `core/accounts.py:switch` |

---

## 3. Safety Gate Architecture (13 Gates)

Every safety boundary is implemented at specific code locations with deterministic enforcement:

| Gate # | Safety Gate | Enforcing File & Location | Enforcement Mechanism |
| :---: | :--- | :--- | :--- |
| **1** | **Command Allowlist** | [`core/command_safety.py:15`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/command_safety.py#L15), [`L27`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/command_safety.py#L27) | `ALLOWED_COMMANDS = {"git", "npm", "node", "python", "pip", "dir", "type", "echo", "mkdir", "cd"}`. Strict denial of operators (`&&`, `;`, `\|`, `>`, `<`). |
| **2** | **Filesystem Confinement** | [`core/command_safety.py:81-115`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/command_safety.py#L81-L115) | Resolves paths via `os.path.realpath` and checks against `os.path.commonpath([project_dir, target])`. Traversal (`..`), drive escapes, and UNC shares (`\\`) blocked. |
| **3** | **Hard Step Ceiling** | [`core/constants.py:8`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/constants.py#L8), [`core/loop.py:126`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/loop.py#L126) | `MAX_STEPS = 80`. If `step_count > MAX_STEPS`, execution cleanly logs `max_steps` to audit and exits with code 4 (`EXIT_MAX_STEPS`). |
| **4** | **Global Kill Hotkey** | [`core/killswitch.py:49-114`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/killswitch.py#L49-L114) | Daemon thread polls Windows `GetAsyncKeyState` for `Ctrl + Alt + K` at 20 Hz. Sets `kill.is_set()` and terminates process with exit code 3 (`EXIT_KILL`). |
| **5** | **Mouse-Corner Failsafe** | [`core/desktop_tools.py:27`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/desktop_tools.py#L27), [`core/loop.py:271`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/loop.py#L271) | `pyautogui.FAILSAFE = True`. Moving physical pointer to `(0, 0)` raises `FailSafeException`. Intercepted by `is_failsafe()`, logs `failsafe_abort`, exits with code 2 (`EXIT_FAILSAFE`). |
| **6** | **Perceptual Loop Breaker** | [`core/loopbreaker.py:34-110`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/loopbreaker.py#L34-L110) | Computes 64-bit difference hash (`dhash`) on screenshots. Trips if visual difference `<= 2` across 3 consecutive interactive actions or 15 wait actions. |
| **7** | **Cryptographic Audit Log** | [`core/audit.py:44-90`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/audit.py#L44-L90), [`L206-248`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/audit.py#L206-L248) | Appends JSONL events with SHA-256 hash pointer linking to the previous entry (`prev`). Verified via `verify_chain()`. |
| **8** | **Automated Secret Redaction** | [`core/audit.py:20-35`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/audit.py#L20-L35), [`core/notify.py:16-24`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/notify.py#L16-L24) | Redacts patterns matching `AIza...`, `sk-...`, `ghp_...`, `github_pat_...`, and HTTP `Bearer` tokens from all logs and notifications. |
| **9** | **Atomic Checkpoints & Resume** | [`core/checkpoint.py:42-95`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/checkpoint.py#L42-L95) | Writes checkpoint state atomically to `.tmp` file before renaming to `checkpoint.json`. Resumes state with `python orchestrator.py --resume [ID|latest]`. |
| **10** | **Simulated Demo World** | [`core/demo/world.py`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/demo/world.py) | Fully offline mock execution engine producing synthetic screenshots and deterministic tool evaluations without live hardware or API keys. |
| **11** | **Graph Stall Detection** | [`core/graph_tools.py:73-90`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/graph_tools.py#L73-L90) | Checks SHA-256 digest of `GRAPH_REPORT.md` across consecutive build cycles. If identical across 2 rounds, invokes `notify_human` to break code generation loop. |
| **12** | **Service Limit Cooldown** | [`core/limits.py:27-58`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/limits.py#L27-L58) | Halts model turn and counts down specified minutes, polling the killswitch every 30 seconds to allow operator abortion. |
| **13** | **Multi-Profile Account Switch** | [`core/accounts.py:25-95`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/accounts.py#L25-L95) | Enforces hard constraints on browser profile rotation: max 2 switches per run, 120-second cooldown timer, mandatory consent token, and strict prohibition on Antigravity. |
