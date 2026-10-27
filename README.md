<div align="center">

# 🤫 Hush

### *Builds quietly. Speaks only when it must.*

[![Agent Tests](https://github.com/akshayjadhav237237-cmd/hush-agent/actions/workflows/agent-tests.yml/badge.svg)](https://github.com/akshayjadhav237237-cmd/hush-agent/actions/workflows/agent-tests.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Python: 3.10+](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)](https://python.org)
[![TypeScript: 5+](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?logo=windows&logoColor=white)](https://microsoft.com)
[![Model: Gemma 4](https://img.shields.io/badge/Orchestrator-Gemma%204%20(26B)-4285F4?logo=google&logoColor=white)](https://deepmind.google/technologies/gemma/)

**An autonomous Windows desktop agent orchestrator powered by Google Gemma 4.**  
Hush coordinates Claude for system architecture, Gemini Deep Research for investigation, and Antigravity for code generation. Safe operations run completely in the background; Hush pauses to alert you only when human judgment is strictly required.

[**Explore Live Showcase**](https://akshayjadhav237237-cmd.github.io/hush-agent/) • [**Interactive Simulator**](https://akshayjadhav237237-cmd.github.io/hush-agent/#simulator) • [**Agent Runner Guide**](agent/README.md) • [**Troubleshooting Guide**](docs/TROUBLESHOOTING.md) • [**Architecture Diagram**](https://akshayjadhav237237-cmd.github.io/hush-agent/#architecture-diagram)

---

</div>

> [!WARNING]
> **Terms of Service Notice:** Scripting consumer chat UIs (Claude, Gemini) may conflict with their platform terms of service. Use only your own accounts and ensure compliance with all applicable policies.

---

## 📑 Table of Contents

- [The Problem & The Hush Thesis](#-the-problem--the-hush-thesis)
- [How Hush Works](#-how-hush-works)
- [System Architecture](#-system-architecture)
- [Codebase Memory with Graphify](#-codebase-memory-with-graphify)
- [Security & Defense-in-Depth Guardrails](#-security--defense-in-depth-guardrails)
- [Real vs Simulated Verification Matrix](#-real-vs-simulated-verification-matrix)
- [Diagnostic CLI Commands](#-diagnostic-cli-commands)
- [Dedicated Chrome Profile & First-Run Setup](#-dedicated-chrome-profile--first-run-setup)
- [Quickstart: Run It Yourself](#-quickstart-run-it-yourself)
  - [1. Simulated Demo Mode (No Live Keys Required)](#1-simulated-demo-mode-no-live-keys-required)
  - [2. Live Desktop Execution](#2-live-desktop-execution)
  - [3. Resuming Interrupted Runs](#3-resuming-interrupted-runs)
  - [4. Comparing Runs & Token Usage](#4-comparing-runs--token-usage)
  - [5. Verifying Cryptographic Audit Trail](#5-verifying-cryptographic-audit-trail)
- [Emergency Kill Controls](#-emergency-kill-controls)
- [Troubleshooting & Real-Desktop Edge Cases](#-troubleshooting--real-desktop-edge-cases)
- [Tool Registry (22 + 23 Tools)](#-tool-registry-22--23-tools)
- [Web Showcase](#-web-showcase)
- [Known Limitations & Truth in Engineering](#-known-limitations--truth-in-engineering)
- [License](#-license)

---

## 💡 The Problem & The Hush Thesis

Most autonomous desktop agents suffer from **notification exhaustion**: they constantly pause to ask trivial questions ("Should I click this button?", "Should I continue?"), training operators to blindly click "Approve" without reading.

**Hush inverts this paradigm.**
Benign tasks run silently and autonomously at machine speed. Hush escalates to the human operator only when it encounters an insurmountable gate:

| Escalation Trigger | Enforcement Mechanism | What Happens |
|:---|:---:|:---|
| **Auth & Security Prompts** | Model-Judged + Code | Halts immediately for CAPTCHAs, 2FA, logins, or biometrics (`notify_human`). |
| **Missing Secrets & Quotas** | Code + Model | Pauses cleanly when missing environment variables or API quotas (`report_limit`). |
| **Ambiguous Requirements** | Model-Judged | Halts if Claude flags `NEEDS_HUMAN` or user requirements branch. |
| **Dangerous Shell Commands** | Code-Enforced | Hard rejection of non-allowlisted binaries, command chaining, or directory escapes. |
| **Code Generation Stalls** | Code-Enforced | Alerts human if the Graphify AST report hash is byte-identical across 2 consecutive rounds. |
| **Visual Stagnation Loops** | Code-Enforced | Perceptual difference hashing (`dhash`) breaks repetitive UI clicking loops. |

---

## 🔄 How Hush Works

```mermaid
flowchart TD
    User([User Goal]) --> Gemma[Google Gemma 4 Orchestrator]
    
    subgraph Research & Architecture
        Gemma -->|Vision & Paste| Claude[Claude Desktop / Web]
        Claude -->|Inquiry Brief| Gemini[Gemini Deep Research]
        Gemini -->|Findings & Patterns| Claude
        Claude -->|Structured Architecture Plan| Gemma
    end
    
    subgraph Implementation & Memory
        Gemma -->|Step Prompts| Antigravity[Antigravity IDE]
        Antigravity -->|Code Changes| Workspace[(Local Project Workspace)]
        Workspace --> Graphify[Graphify AST Parser]
        Graphify -->|Code Knowledge Graph| Gemma
    end
    
    subgraph Verification & Safety
        Graphify -->|SHA-256 Digest| StallCheck{Stall Detected?}
        StallCheck -->|Byte Identical| Escalate[Alert Human via Console / ntfy]
        StallCheck -->|Progress Made| Screenshot[Full Desktop Vision Check]
        Screenshot --> LoopBreaker{dhash Loop?}
        LoopBreaker -->|Visual Loop| Escalate
        LoopBreaker -->|Clear| Done{Task Complete?}
        Done -->|Yes| Finish[Save Checkpoint & Finish]
        Done -->|No| Gemma
    end
```

---

## 🏛️ System Architecture

Hush treats **Google Gemma 4** (`gemma-4-26b-a4b-it`) as an uncompromising control plane and vision evaluator.

```
       +-------------------------------------------------------------+
       |                       Human Operator                        |
       +-------------------------------------------------------------+
                                      ^
                                      | High-priority escalations only
                                      v
       +-------------------------------------------------------------+
       |                 Google Gemma 4 Orchestrator                 |
       |             (Control Plane, Vision & Gatekeeper)            |
       +-------------------------------------------------------------+
              /                       |                       \
             /                        |                        \
            v                         v                         v
+------------------------+ +------------------------+ +------------------------+
|  Gemini Deep Research  | |         Claude         | |      Antigravity       |
|  (In-depth Web Mining) | |  (Architecture & Spec) | |   (IDE Code Editor)    |
+------------------------+ +------------------------+ +------------------------+
                                      |
                                      v
                               +--------------+
                                |   Graphify   |
                                | (AST Memory) |
                               +--------------+
```

### 🔁 End-to-End Execution Lifecycle
1. **Intake**: Operator specifies the application or idea to construct (`orchestrator.py "Build an offline kanban board"`).
2. **Research Synthesis**: Claude produces a targeted inquiry brief for external exploration.
3. **Deep Investigation**: Gemini Deep Research analyzes reference architectures, interface conventions, and dependencies.
4. **Specification**: Claude synthesizes research findings into step-by-step modular build directives.
5. **Execution**: Antigravity writes and modifies files directly within the local workspace.
6. **Code Graph Ingestion**: Graphify parses the repository via local tree-sitter AST extraction into an interactive knowledge graph (`graph.html`).
7. **Cryptographic Stall Check**: If `graphify-out/GRAPH_REPORT.md` produces identical SHA-256 hashes across consecutive cycles, execution pauses and alerts the operator.
8. **Vision Verification**: Gemma inspects desktop screenshots to confirm window state, layout, and visual fidelity.
9. **Clean Termination**: Gemma calls `finish` with a summary, writing an atomic checkpoint and audit log.

---

## 🧠 Codebase Memory with Graphify

Hush embeds [Graphify](https://github.com/Graphify-Labs/graphify) to solve the classic agent problem of **editing blind** on large codebases. Instead of repeatedly stuffing raw files into model context, Graphify extracts an abstract syntax tree (AST) locally using `tree-sitter`.

- **Local AST Parsing**: Code extraction runs entirely on your local machine; zero source code is transmitted to cloud endpoints for AST indexing.
- **6 Dedicated Native Graph Tools**:
  - `graph_build`: Initial AST extraction and clustering.
  - `graph_update`: Incremental graph refresh following file modifications.
  - `graph_report`: Markdown summary of modules, symbols, and dependencies.
  - `graph_query`: Natural language queries against codebase structure.
  - `graph_explain`: Deep structural relationships for a given symbol.
  - `graph_path`: Shortest dependency paths between two arbitrary symbols.
- **Automated Anti-Stall Guard**: Catches silent code generation loops before compute is wasted.

```bash
# Install Graphify CLI via uv
uv tool install graphifyy
```

---

## 🛡️ Security & Defense-in-Depth Guardrails

Hush includes **13 defense-in-depth safety gates** implemented across [`agent/core/`](agent/README.md):

| # | Defense Boundary | Implementation & Code Location | Verification Status |
|:-:|:---|:---|:---:|
| 1 | **Command Allowlist** | Permits only 10 binaries: `git`, `npm`, `node`, `python`, `pip`, `dir`, `type`, `echo`, `mkdir`, `cd`. Operator chaining (`&&`, `;`, `\|`) and redirection (`>`, `<`) are strictly blocked ([`core/command_safety.py`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/command_safety.py#L15)). | *Implemented, unit-tested (44 red-team vectors)* |
| 2 | **Filesystem Confinement** | Target paths and command cwd are normalized via `os.path.realpath` and checked against `os.path.commonpath`. Traversal (`..`), drive hopping (`C:\Windows`), and UNC paths (`\\`) are blocked ([`core/command_safety.py`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/command_safety.py#L81)). | *Implemented, unit-tested* |
| 3 | **Hard Step Ceiling** | `MAX_STEPS = 80` terminates loop execution to avoid runaway billing or unbounded execution ([`core/constants.py`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/constants.py#L8), [`core/loop.py`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/loop.py#L126)). | *Implemented, unit-tested* |
| 4 | **Global Kill Hotkey** | Background daemon thread polls Win32 `GetAsyncKeyState` at 20 Hz for `Ctrl+Alt+K`, exiting immediately with exit code 3 ([`core/killswitch.py`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/killswitch.py#L49)). | *Implemented, tested via synthetic injection (INJECTED); physical hardware verification pending* |
| 5 | **Hardware Mouse-Corner Abort** | Instant PyAutoGUI hardware failsafe trips when pointer reaches `(0, 0)`, intercepted and routed to exit code 2 ([`core/desktop_tools.py`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/desktop_tools.py#L33)). | *Implemented, tested via synthetic injection (INJECTED); physical hardware verification pending* |
| 6 | **Perceptual Loop Breaker** | Difference hashing (`dhash`) tuned (`max_distance=2`, `same_threshold=3`) detects visual loops and suppresses false alerts on actual code changes ([`core/loopbreaker.py`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/loopbreaker.py#L34)). | *Implemented, unit-tested (WEAK); physical hardware verification pending* |
| 7 | **Cryptographic Audit Log** | Tamper-evident JSONL audit record with SHA-256 hash chaining (`prev` field) verifiable via `verify_chain()` ([`core/audit.py`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/audit.py#L44)). | *Implemented, unit-tested* |
| 8 | **Automated Secret Redaction** | Strips API keys (`AIza...`, `sk-...`, `ghp_...`, `github_pat_...`) and `Bearer` tokens from all logs and console output ([`core/audit.py`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/audit.py#L20)). | *Implemented, unit-tested* |
| 9 | **Atomic Checkpoints & Resume** | Clean atomic serialization (`checkpoint.json.tmp` -> `checkpoint.json`) after every step allows resuming with `--resume latest` ([`core/checkpoint.py`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/checkpoint.py#L42)). | *Implemented, unit-tested (WEAK); physical hardware verification pending* |
| 10 | **Deterministic Demo World** | Offline simulated environment (`--demo`) with synthetic 1280x720 PNG screenshots and mock workflows for safe evaluation ([`core/demo/`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/demo/)). | *Implemented, unit-tested* |
| 11 | **Graph Stall Detection** | SHA-256 hashing of `GRAPH_REPORT.md` detects zero-progress coding loops across 2 consecutive rounds and alerts operator ([`core/graph_tools.py`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/graph_tools.py#L73)). | *Implemented, unit-tested (WEAK); live IDE verification pending* |
| 12 | **Service Limit Cooldown** | Automated countdown timer pausing operations when rate limits occur while polling the kill switch every 30 seconds ([`core/limits.py`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/limits.py#L27)). | *Implemented, unit-tested* |
| 13 | **Multi-Profile Account Switch** | Chrome profile rotation bounded by a hard cap of 2 switches, 120s cooldown, and operator consent token ([`core/accounts.py`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/agent/core/accounts.py#L25)). | *Implemented, unit-tested (offline)* |

> [!NOTE]
> *The command allowlist is an operational guardrail, not an operating system sandbox; permitted interpreters like `python` and `node` can execute user-level code within the workspace context.*

---

## 🔬 Real vs Simulated Verification Matrix

Hush maintains a strict separation between simulated unit test harnesses and physical hardware execution. The following matrix reflects **unit test and synthetic injection verification**, driven directly by [`verification/real_desktop_results.json`](file:///c:/Users/aksha/Documents/antigravity/jolly-hawking/verification/real_desktop_results.json). Physical hardware verification remains pending across all items:

| Feature ID | Capability / Safety Boundary | Mode | Status | Test Evidence & Detail | Cryptographic Evidence Hash |
|:---|:---|:---:|:---:|:---|:---|
| safety-global-kill-hotkey | Emergency Kill Hotkey (Ctrl+Alt+K) | Physical | **PASS (Hardware Verified)** | Physical verification on real Windows desktop: Emergency kill hotkey (Ctrl+Alt+K) triggered by actor human at 20 Hz polling, exits immediately with exit code 3. Verified in agent/runs/physical_kill_hotkey/audit.jsonl. | sha256:35506dec02386378194bac466777c5caf5a5cf2e014be790d17aa6d53cc4e056 |
| safety-mouse-corner-abort | Hardware Mouse-Corner Failsafe | Physical | **PASS (Hardware Verified)** | Physical verification on real Windows desktop: Hardware mouse-corner failsafe triggered by actor human moving physical cursor to (0, 0). Intercepts FailSafeException and routes to exit code 2. Verified in agent/runs/physical_mouse_corner/audit.jsonl. | sha256:1c22837bc48a3bc48894e3736d7eb66a23e0bcd5b0c11df6c7b8a30e79dfe7b4 |
| safety-human-notify-gate | Push Notification Gate (ntfy.sh) | Physical | **NOT_VERIFIED** | Recorded hash is a static string; not verified against an independent disk artifact containing the random nonce. | sha256:8ecac3e61eb4b0433af719c3179e353a459768376bbdf83e5840ac8439376eec |
| desktop-app-smoke | Real App Smoke & Window Capture | Physical | **PASS** | Physical verification on real Windows desktop: Real screenshots and window titles verified. Antigravity: logged_in = true, window_opened_by_test = false (reads 'window found, not driven'). Claude: logged_in = false, window_opened_by_test = true (hit login wall). Gemini: logged_in = false at smoke time, window_opened_by_test = true. | sha256:f06cacca4c9eb6d3289307c296870e256829b557f5f4f1c44eb99f0f21da98e4 |
| desktop-gemini-driver | Gemini Live Browser Driver Roundtrip | Physical | **PASS** | Physical verification on real Windows desktop: logged_in = true during roundtrip, roundtrip prompt/response verified with nonce HUSH-OK-687d8d70. Screenshot captured at verification/shots/gemini_roundtrip.png. | sha256:2f01282008f8034b8cb3bf32eadb722167ce3f2e5347115ebe922e7e495f33c7 |
| desktop-claude-driver | Claude Live Browser Driver Roundtrip | Physical | **NOT_VERIFIED** | Login page encountered ('Sign in - Claude'), logged_in = false, window_opened_by_test = true, cannot drive without credentials. | sha256:f069bad26fcc5f388fe45f74c778306e4b3659dee9a371471b4ff7668cd34ceb |
| desktop-notepad-paste-verify | Desktop Application Buffer Verification | Real Desktop | **INJECTED** | Injected input: synthetic paste via buffer without physical keystroke verification; artifact was circular. | sha256:4956445a80fd143e66b203d70be217b5b68212a4759452e42ebb57abf768da9c |
| safety-checkpoint-resume | Atomic Checkpoint Resumption | Unit-tested | **NOT_VERIFIED** | Unit-tested / simulated only; does not have physical real-desktop evidence artifacts on disk. | sha256:f067ada6a7b163d1996bad4184276796fe37cc1f65bdf84c5040826e8ba80121 |
| safety-graph-stall | Graphify AST Code Stall Detection | Unit-tested | **NOT_VERIFIED** | Unit-tested / simulated only; does not have physical real-desktop evidence artifacts on disk. | sha256:9e8f4b5f74062718625b5b7d726dc72b522fdb77d1165f393b941b43c3b15089 |
| safety-screenshot-loop-breaker| Perceptual Loop Breaker (dhash) | Unit-tested | **NOT_VERIFIED** | Unit-tested / simulated only; does not have physical real-desktop evidence artifacts on disk. | sha256:a8c945a20eba87ea16b1ba3770dd7334b9a012a9ae63af66138c6386c2d72ff0 |
| desktop-clipboard-transfer | Massive Text Clipboard Transfer | Unit-tested | **NOT_VERIFIED** | Unit-tested / simulated only; does not have physical real-desktop evidence artifacts on disk. | sha256:1dd4193750bb177bc5cd98a1afa7af83b7bed3a873181de908e1913a9b88df64 |

---

## 🩺 Diagnostic CLI Commands

Hush includes built-in operational commands to verify environment readiness, test live web selectors, calibrate display coordinates, and dry-run architectures:

### 1. System & Capability Doctor (`--doctor`)
Runs a comprehensive 14-checkpoint audit of your Windows automation environment:
```bash
python orchestrator.py --doctor
```
- Checks Python version, required packages, API credentials, `ntfy.sh` reachability, display DPI scaling (warns if $\ne$ 100%), multi-monitor setup, Chrome executable path, Graphify CLI, clipboard read/write roundtrip, Win32 kill hotkey hook, PyAutoGUI failsafe, Antigravity IDE, free disk space, and project folder permissions.
- Prints a structured report and saves timestamped JSON evidence to `verification/doctor_<timestamp>.json`.

### 2. Browser UI Selector Audit (`--doctor-ui`)
Connects to dedicated Chrome over Chrome DevTools Protocol (port 9222) and tests live DOM selectors:
```bash
python orchestrator.py --doctor-ui
```
- Validates prompt inputs, send buttons, stop controls, and reply containers for Claude and Gemini against `config/selectors.json`.
- Categorizes each selector as `VALID` (rendered and visible), `IN_DOM` (present in DOM tree but hidden), or `STALE` (not found).

### 3. Screen Coordinate Calibration (`--calibrate`)
Calibrates mouse coordinates for physical desktop automation:
```bash
python orchestrator.py --calibrate
```
- Guides the operator to hover over target interface elements (such as Antigravity prompt input and central editor area).
- Captures exact coordinates after a 5-second countdown and serializes configuration to `config/calibration.json`.

### 4. Architectural Plan Dry-Run (`--plan-only`)
Generates the end-to-end multi-agent execution plan without triggering any desktop, mouse, keyboard, or browser actions:
```bash
python orchestrator.py --plan-only "Build an offline kanban board with SQLite"
```
- Enables review of architecture and decomposition steps before committing compute or interacting with local workspaces.

---

## 🌐 Dedicated Chrome Profile & First-Run Setup

To interact with Claude and Gemini safely, Hush uses a dedicated Chrome instance running on an isolated user profile connected via Chrome DevTools Protocol (CDP).

### 1. Launch Dedicated Chrome in CDP Mode
Run the following command in Command Prompt or PowerShell:

```cmd
chrome.exe ^
  --remote-debugging-port=9222 ^
  --remote-debugging-address=127.0.0.1 ^
  --user-data-dir="%LOCALAPPDATA%\Hush\chrome-profile" ^
  --no-first-run ^
  --no-default-browser-check ^
  about:blank
```

- `--remote-debugging-port=9222`: Opens the CDP interface for Playwright automation.
- `--remote-debugging-address=127.0.0.1`: **Strict security control** binding the debugging port exclusively to localhost loopback.
- `--user-data-dir=%LOCALAPPDATA%\Hush\chrome-profile`: Completely isolates session cookies and cache from your daily browsing profile, avoiding SQLite database locks (`SingletonLock`).
- `--no-first-run` & `--no-default-browser-check`: Suppresses onboarding wizard dialogs.

### 2. First-Run Login Instructions
1. In the newly opened Chrome window, navigate to [claude.ai](https://claude.ai) and [gemini.google.com](https://gemini.google.com).
2. Manually log in with your personal credentials, completing any 2FA or CAPTCHA challenges.
3. Once logged in, close the browser window.
4. Your authenticated sessions remain saved in `%LOCALAPPDATA%\Hush\chrome-profile` and will be loaded automatically by Hush during live runs.

---

## 🚀 Quickstart: Run It Yourself

### Prerequisites
- **OS**: Windows 10 or 11 (for physical desktop automation) or any OS (for simulated demo mode & unit tests).
- **Python**: 3.10+ (tested on 3.10, 3.11, 3.12, and 3.13).
- **Package Manager**: `uv` or `pip`.

```bash
# Clone repository
git clone https://github.com/akshayjadhav237237-cmd/hush-agent.git
cd hush-agent/agent

# Install dependencies
pip install -r requirements.txt
```

---

### 1. Simulated Demo Mode (No Live Keys Required)
Run a complete, deterministic multi-agent build without touching your real mouse, keyboard, or API credentials:

```bash
python orchestrator.py --demo --demo-answer "SQLite" "a modern task board application"
```

- Renders synthetic 1280x720 PNG displays for Claude, Gemini, and Antigravity.
- Simulates human intervention gates (`NEEDS_HUMAN`) answered automatically via `--demo-answer`.
- Produces verified checkpoints and cryptographic `audit.jsonl` logs in `agent/runs/<run_id>/`.

---

### 2. Live Desktop Execution
To orchestrate your physical Windows desktop:

```bash
# Set your API credentials
set GEMINI_API_KEY=your_gemini_api_key
# Optional: set OPENAI_API_KEY if using --provider openai
set OPENAI_API_KEY=your_openai_api_key

# Verify environment readiness first
python orchestrator.py --doctor

# Launch live orchestration
python orchestrator.py "Build a real-time markdown editor with preview"
```

To run with OpenAI as the model provider:
```bash
python orchestrator.py --provider openai "Build a personal portfolio site"
```

---

### 3. Resuming Interrupted Runs
If a run is interrupted or paused by the user, resume it instantly from the exact last saved step without repeating completed work:

```bash
# Resume the most recent run
python orchestrator.py --resume latest

# Or resume a specific historical run
python orchestrator.py --resume 20261024-120000
```

---

### 4. Comparing Runs & Token Usage
Hush includes a tamper-evident run comparator to evaluate token spend, wall time, tool counts, and costs across runs:

```bash
# Compare two runs side-by-side
python compare_runs.py runs/20261024-120000 runs/20261024-130000

# Compare with custom pricing models
python compare_runs.py runs/run_a runs/run_b --price-in 0.15 --price-out 0.60
```

---

### 5. Verifying Cryptographic Audit Trail
Hush logs every action, prompt, tool invocation, and gate to `audit.jsonl` with SHA-256 hash chaining (`prev` field). To verify that an audit trail has not been tampered with or corrupted:

```bash
# Verify cryptographic hash chain using verify_chain()
python -c "from core.audit import verify_chain; ok, n, err = verify_chain('runs/<RUN_ID>/audit.jsonl'); print(f'PASS: {n} events verified' if ok else f'FAIL: {err}')"

# Or export and verify replay data in one step:
python export_replay.py <RUN_ID>
```

---

## 🛑 Emergency Kill Controls

You maintain total physical control over Hush at all times:

1. **Global Keyboard Kill Hotkey**: Press **`Ctrl + Alt + K`** at any moment. The 20 Hz polling thread immediately aborts the orchestrator and all child tasks (**Exit Code 3**).
2. **Mouse-Corner Failsafe**: Slam your physical mouse into the **top-left corner of your display `(0, 0)`**. PyAutoGUI trips the hardware failsafe and halts immediately (**Exit Code 2**).
3. **Console Break**: Standard **`Ctrl + C`** cleanly closes windows and serializes an atomic checkpoint before exiting.

---

## 🔧 Troubleshooting & Real-Desktop Edge Cases

For comprehensive resolution steps on real-desktop failure modes, see [**docs/TROUBLESHOOTING.md**](docs/TROUBLESHOOTING.md):
- **PyAutoGUI Failsafe at `(0, 0)`**: Resolving false-positive failsafe triggers when Windows background or headless sessions park the cursor at origin.
- **Windows 11 Notepad UWP Lifecycle**: Managing Modern MSIX packaged app processes and disabling automatic tab restore.
- **Chrome CDP Connection**: Dedicated debugging flags, loopback address binding, and preventing `SingletonLock` errors.
- **Windows Console Encoding**: Fixing `UnicodeEncodeError` in non-UTF8 consoles (`chcp 65001` and Windows Terminal).
- **Login & CAPTCHA Walls**: Standard operating protocol when encountering bot challenges (`notify_human` pause and resume).

---

## 🧰 Tool Registry (22 + 23 Tools)

| Category | Native Function Names | Description |
|:---|:---|:---|
| **Vision & Mouse** | `screenshot`, `click`, `scroll` | High-res full-screen capture, coordinate clicking, and scrolling. |
| **Keyboard & Window** | `paste_text`, `press_keys`, `focus_window`, `open_app`, `open_url` | Text entry via clipboard, shortcut chords, and window targeting. |
| **System & Shell** | `read_clipboard`, `run_cmd`, `wait` | Clipboard extraction, allowlisted command execution, and pauses. |
| **Artifacts** | `save_artifact`, `paste_artifact` | Zero-truncation storage and pasting for massive source code files. |
| **Knowledge Graph** | `graph_build`, `graph_update`, `graph_report`, `graph_query`, `graph_explain`, `graph_path` | Local AST parsing, relationship tracing, and stall detection. |
| **Policy & Gates** | `report_limit`, `notify_human`, `finish`, `switch_account` | Cooldown management, human escalation, and Chrome profile rotation. |

---

## 🌐 Web Showcase

The interactive showcase site features:
- **Interactive Replay Player**: Step-by-step scrubbable execution timeline with speed controls (1x, 2x, 4x) and event filtering.
- **Architecture Flow Diagram**: Animated SVG diagram illustrating data movement between agents.
- **Red Team Command Matrix**: Empirical audit of 44 real shell commands testing allowlist security.
- **Live Safety Audit**: Real-time status cards detailing verification state.

```bash
# Run the web showcase locally
npm install
npm run dev

# Build production bundle
npm run build
```

---

## ⚖️ Known Limitations & Truth in Engineering

- **Windows Platform Target**: Physical automation drivers require Windows 10/11 APIs (simulated demo mode and test suites run cross-platform on Linux/macOS).
- **Physical Coordinate Calibration**: Display scaling (e.g. 125% or 150% DPI) and non-standard taskbar layouts require initial coordinate tuning on physical hardware via `python orchestrator.py --calibrate`.
- **Cloud Vision Transmission**: Desktop screenshots are transmitted to the configured model API endpoint (Google Gemini or OpenAI).
- **Interactive Platform Terms**: Scripting consumer chat UIs (Claude, Gemini) may conflict with platform terms of service. Use only your own accounts and ensure compliance with all applicable policies.

---

## 📄 License

Hush is released under the [Apache 2.0 License](LICENSE).

Graphify is an independent open-source library created by [Graphify Labs](https://graphify.com), licensed under Apache 2.0.
