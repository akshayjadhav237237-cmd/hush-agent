# Hush Desktop Agent

Desktop orchestration loop for Windows.

## Overview

Hush orchestrates multi-agent desktop workflows using Google Gemma 4 through the Gemini API. The orchestrator coordinates Claude for architecture, Gemini Deep Research for investigation, and Antigravity for code generation. Safe operations run without user interruption. The system halts and requests human judgment only when blockers or policy gates require intervention.

The script is a hackathon starter skeleton designed for Windows desktop environments.

## Platform

- Windows only. The script uses Windows desktop APIs through `pyautogui` and `pygetwindow`.

## Prerequisites

- Python 3.10 or higher.
- Dependencies listed in `requirements.txt`:
  - `google-genai`
  - `pyautogui`
  - `pyperclip`
  - `pygetwindow`
  - `requests`
  - `pillow`
- Graphify CLI for codebase graph memory:
  ```bash
  uv tool install graphifyy
  ```

## Setup

1. Create and activate a Python virtual environment:

```bash
python -m venv venv
venv\Scripts\activate
```

2. Install Python dependencies:

```bash
pip install -r requirements.txt
```

3. Install Graphify via `uv`:

```bash
uv tool install graphifyy
```

## Configuration

Set environment variables before running the orchestrator:

- `GEMINI_API_KEY` (required): Gemini API key for Gemma 4 model inference.
- `GEMMA_MODEL` (optional): Gemma model identifier. Defaults to `gemma-4-26b-a4b-it`.
- `NTFY_TOPIC` (optional): Topic name for mobile push notifications via `https://ntfy.sh/{NTFY_TOPIC}`.
- `PROJECT_DIR` (optional): Target project directory for code generation and Graphify extraction. Defaults to `./workspace/project`.

Example configuration in Command Prompt:

```cmd
set GEMINI_API_KEY=your-api-key-here
set GEMMA_MODEL=gemma-4-26b-a4b-it
set NTFY_TOPIC=your-ntfy-topic
set PROJECT_DIR=C:\path\to\workspace\project
```

Example configuration in PowerShell:

```powershell
$env:GEMINI_API_KEY="your-api-key-here"
$env:GEMMA_MODEL="gemma-4-26b-a4b-it"
$env:NTFY_TOPIC="your-ntfy-topic"
$env:PROJECT_DIR="C:\path\to\workspace\project"
```

Do not store credentials in source files.

## Usage

Run the orchestrator with an initial idea or task prompt:

```bash
python orchestrator.py "a portfolio website for a wedding photographer"
```

## Tools

The orchestrator registers 19 native tools with the Gemma model:

| Tool | Parameters | Description |
| --- | --- | --- |
| `open_app` | `name` (string) | Opens a desktop application via the Windows Start menu. |
| `open_url` | `url` (string) | Opens a target URL in the default browser. |
| `focus_window` | `title_contains` (string) | Brings a window matching the title substring to the foreground. |
| `paste_text` | `text` (string), `press_enter` (boolean) | Pastes text into the active field using the clipboard. |
| `press_keys` | `keys` (string) | Simulates hotkeys or key sequences (for example, `ctrl+v` or `enter`). |
| `click` | `x` (integer), `y` (integer) | Clicks at specified coordinates in screenshot pixel space. |
| `scroll` | `amount` (integer) | Scrolls the mouse wheel vertically. |
| `screenshot` | none | Captures a full-screen screenshot and attaches it to the model context. |
| `read_clipboard` | none | Returns the current text content from the system clipboard. |
| `wait` | `seconds` (integer) | Pauses execution for a specified duration (maximum 120 seconds). |
| `run_cmd` | `command` (string) | Executes an allowlisted shell command in `WORKDIR`. |
| `graph_build` | none | Extracts and builds the initial Graphify code graph for the project. |
| `graph_update` | none | Updates the Graphify graph and checks for stalled progress. |
| `graph_report` | none | Reads the generated `GRAPH_REPORT.md` summary. |
| `graph_query` | `question` (string) | Queries the Graphify code graph with a question. |
| `graph_explain` | `symbol` (string) | Explains a specific code symbol using the knowledge graph. |
| `graph_path` | `source` (string), `target` (string) | Traces the dependency path between two code symbols. |
| `notify_human` | `message` (string) | Escalates to the operator for input and pauses the loop. |
| `finish` | `summary` (string) | Terminates the loop with a completion summary. |

## Graphify Integration

Hush integrates Graphify for structured codebase memory. Graphify converts the generated project into an AST knowledge graph using local tree-sitter parsers. Parsing runs entirely on the local machine; no code is uploaded to external servers during graph extraction.

### Invocation Commands

The orchestrator invokes Graphify as a subprocess inside `PROJECT_DIR` without a shell:

- Initial graph build (`graph_build`):
  1. `graphify extract . --code-only`
  2. `graphify cluster-only . --no-label`
  3. `graphify export html`
- Iterative refresh (`graph_update`):
  1. `graphify update .`
  2. `graphify export html`
- Graph querying (`graph_query`, `graph_explain`, `graph_path`):
  - `graphify query "<question>"`
  - `graphify explain "<symbol>"`
  - `graphify path "<source>" "<target>"`

### Generated Artifacts

Graphify stores outputs in the `graphify-out/` directory within `PROJECT_DIR`:

- `graphify-out/graph.html`: Interactive visual graph representation.
- `graphify-out/GRAPH_REPORT.md`: Markdown summary of clusters, symbols, and dependencies.

### Stalled Build Detection

`graph_update` implements an automated progress gate using SHA-256 hashing. After updating the graph, it computes the hash of `graphify-out/GRAPH_REPORT.md`. If the hash remains identical across two consecutive rounds, the orchestrator triggers `notify_human` to alert the operator that code generation may have stalled.

## Safety and Guardrails

The orchestrator incorporates layered controls to limit unintended behavior:

- **Command Allowlist**: `run_cmd` permits only approved binaries: `git`, `npm`, `node`, `python`, `pip`, `dir`, `type`, `echo`, `mkdir`, and `cd`.
- **Blocked Substrings**: Commands containing any of the following substrings are rejected: `rm -rf`, `rmdir /s`, `del /s`, `format `, `shutdown`, `reg delete`, `diskpart`, `powershell -enc`, `curl `, `wget `, `invoke-webrequest`, `&&`, `||`, `|`, `>`, `<`, `;`.
- **Guardrail Scope Notice**: The command allowlist functions as an operational guardrail, not a secure operating system sandbox. Permitted runtimes such as `python` and `npm` can execute arbitrary code within their execution context.
- **Step Cap**: `MAX_STEPS = 80` enforces a hard limit on total model turns per run.
- **Hardware Fail-Safe**: `pyautogui.FAILSAFE = True`. Moving the mouse cursor to the top-left screen corner `(0, 0)` immediately raises a `pyautogui.FailSafeException` and aborts execution.
- **Human Escalation Gate**: `notify_human` prints the alert to the terminal, sends an HTTP push notification to `https://ntfy.sh/{NTFY_TOPIC}` if configured, and blocks execution until input is entered in the console.

## Known Limitations

- **Untested Starter**: The script is an experimental skeleton. Coordinates, sleep intervals, and window titles require machine-specific tuning.
- **Windows Only**: Relies on Windows desktop APIs and process management.
- **Cloud Screenshot Transmission**: Full-screen captures are sent to Google's Gemma API endpoint for multimodal processing.
- **Coordinate Grounding**: Direct UI click coordinates are experimental. The script prioritizes keyboard hotkeys, clipboard buffers, and CLI commands.
- **Third-Party Terms**: Automating browser chat interfaces may conflict with third-party service terms.
- **Graphify Dependency**: Graphify must be installed on the system PATH via `uv tool install graphifyy`.
- **Stall Detection Verification**: The SHA-256 no-progress check is unverified until `GRAPH_STALL_VERIFIED` is confirmed through runtime testing.

## Attribution

Graphify is a separate open-source project by [Graphify Labs](https://graphify.com), used under its Apache 2.0 license ([GitHub](https://github.com/Graphify-Labs/graphify)).
