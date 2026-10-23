# Hush

> Builds quietly. Speaks only when it must.

Hush is a Windows desktop automation orchestrator. Google Gemma 4 serves as the central control plane, coordinating Claude for architecture, Gemini Deep Research for investigation, and Antigravity for code generation. Safe tasks execute silently. Hush halts and requests human intervention only when judgment is strictly required.

The desktop agent runner code is located in [`agent/`](agent/README.md).

## Core Thesis

Autonomous agents often generate continuous notification noise. Frequent prompts cause operators to reflexively approve actions without review.

Hush inverts this pattern. Benign operations proceed without interruption. The system escalates to the human operator only when progress cannot continue autonomously:

- **Authentication and Verification**: Login screens, CAPTCHAs, two-factor authentication, or biometric prompts (model-judged).
- **Missing Secrets and Quotas**: Missing API keys, billing limits, or unconfigured environment variables (model-judged).
- **Ambiguous Requirements**: Conflicting user specifications, branching product decisions, or explicit `NEEDS_HUMAN` flags from Claude (model-judged).
- **Disallowed Commands**: Unrecognized shell commands or dangerous patterns outside the command allowlist (code-enforced).
- **Repeated Failures and Stalls**: Unresolved errors after three attempts or zero changes in the codebase knowledge graph across two consecutive rounds (code- and model-judged).

## System Architecture

Google Gemma 4 (`gemma-4-26b-a4b-it`) operates as the control plane. It uses function calling and desktop vision via the Gemini API to coordinate three external tools.

```
       +---------------------------------------------+
       |               Human Operator                |
       +---------------------------------------------+
                              ^
                              | Escalations only
                              v
       +---------------------------------------------+
       |          Google Gemma 4 Orchestrator        |
       |      (Control Plane, Vision, Gatekeeper)     |
       +---------------------------------------------+
             /                |                \
            /                 |                 \
           v                  v                  v
+--------------------+ +--------------------+ +--------------------+
| Gemini Deep        | | Claude             | | Antigravity        |
| Research           | | Architecture       | | Coding Engine      |
| (Web Research)     | | (Planning & Specs) | | (Implementation)   |
+--------------------+ +--------------------+ +--------------------+
                              |
                              v
                       +--------------+
                       |   Graphify   |
                       | (AST Memory) |
                       +--------------+
```

### Execution Flow

1. **Intake**: The user supplies a project goal or specification.
2. **Research Prompt Generation**: Claude receives the task and creates an inquiry brief for web exploration.
3. **Deep Research**: Gemini Deep Research gathers interface patterns, technical choices, and component libraries.
4. **Architectural Specification**: Claude parses the research report and generates structured build instructions.
5. **Implementation**: Antigravity executes code edits inside the project workspace.
6. **Codebase Memory**: Graphify parses the workspace using tree-sitter, updates the AST knowledge graph, and exports status artifacts.
7. **Stall Verification**: If the knowledge graph report remains unchanged across two consecutive build rounds, Hush alerts the human operator.
8. **Visual Review**: Gemma inspects desktop screenshots to verify output fidelity.
9. **Next Round or Completion**: If further refinement is needed, the loop continues. If complete, Gemma calls `finish`.

## Codebase Memory with Graphify

Hush integrates Graphify for structured codebase memory across multi-round builds. Graphify converts the generated project folder into an AST knowledge graph using local tree-sitter parsing. Source code parsing runs entirely on the local machine. No source code is uploaded to external endpoints during extraction.

### Installation

Install the Graphify CLI using `uv`:

```bash
uv tool install graphifyy
```

The executable name is `graphify`.

### Graph Tools and Commands

The orchestrator in [`agent/orchestrator.py`](agent/README.md) defines 6 dedicated tools that invoke Graphify directly as a subprocess:

| Tool | Invoked CLI Command | Function |
| --- | --- | --- |
| `graph_build` | `graphify extract . --code-only`<br>`graphify cluster-only . --no-label`<br>`graphify export html` | Extracts code AST, clusters code symbols without LLM labels, and exports HTML. |
| `graph_update` | `graphify update .`<br>`graphify export html` | Refreshes graph nodes and updates the exported visual graph. |
| `graph_report` | none (reads `graphify-out/GRAPH_REPORT.md`) | Retrieves the latest graph report summary up to 6,000 characters. |
| `graph_query` | `graphify query "<question>"` | Queries the code graph with a specific technical question. |
| `graph_explain` | `graphify explain "<symbol>"` | Returns a structural summary of a specific symbol and its relations. |
| `graph_path` | `graphify path "<source>" "<target>"` | Finds relationship paths connecting two symbols in the graph. |

Graph outputs are written to `graphify-out/` in the project directory:
- `graphify-out/graph.html`: Interactive visual graph of the codebase.
- `graphify-out/GRAPH_REPORT.md`: Markdown summary of modules, symbols, and dependencies.

### Automated Stall Detection

`graph_update` computes the SHA-256 hash of `graphify-out/GRAPH_REPORT.md` on each invocation. If the digest is unchanged across two consecutive iterations, Hush alerts the operator that code generation has made no observable progress.

### Attribution

Graphify is a separate open-source project by [Graphify Labs](https://graphify.com), used under its Apache 2.0 license ([GitHub](https://github.com/Graphify-Labs/graphify)).

## Security and Guardrails

Hush implements thirteen defense-in-depth boundaries across `agent/core/`:

- **Command Allowlist**: Shell execution via `run_cmd` permits only 10 binaries: `git`, `npm`, `node`, `python`, `pip`, `dir`, `type`, `echo`, `mkdir`, and `cd`. Commands containing chained operators, redirection, or dangerous administrative patterns are rejected. The command allowlist is an operational guardrail, not an operating system sandbox; permitted binaries like `python` and `npm` can run arbitrary code within their runtime context.
- **Workspace Filesystem Confinement**: Command execution and path arguments are resolved against the workspace root using `os.path.realpath` and `os.path.commonpath`. Path traversal (`..`), drive escapes, and UNC network paths are blocked.
- **Step Cap**: A hard execution ceiling per run (`MAX_STEPS = 80`) prevents runaway execution loops and unbounded compute spend.
- **Mouse-Corner Failsafe**: Hardware failsafe via `pyautogui.FAILSAFE = True`. Moving the pointer to the top-left screen corner `(0, 0)` immediately aborts the orchestrator process with exit code 2 and records a `failsafe_abort` event.
- **Human-Notify Gate**: Interactive policy gate that halts execution, prints to the console, and optionally dispatches push notifications via `ntfy.sh` when operator guidance, credentials, or judgment are required.
- **Graph Stall Detection**: Computes a SHA-256 digest of `graphify-out/GRAPH_REPORT.md` on every build update. If the hash remains unchanged across two consecutive iterations, Hush alerts the operator to prevent stagnant looping.
- **SHA-256 Chained Audit Log**: Tamper-evident JSONL audit record tracking every tool call, argument, and screen state with SHA-256 hash chaining (`prev` field) and automated secret redaction for API keys and tokens.
- **Atomic Checkpoint & Resume**: Atomic state serialization after every step enables resumption of interrupted runs via `--resume [RUN_ID|latest]` without repeating completed work.
- **Simulated Demo Mode**: Deterministic offline execution (`--demo`, `--demo-limit`, `--demo-answer`) generating synthetic 1280x720 PNG screens and mock runs without live credentials or UI manipulation.
- **Ctrl+Alt+K Kill Hotkey Polled at 20 Hz**: Dedicated background daemon thread polling keyboard state at 20 Hz for `Ctrl+Alt+K` via `GetAsyncKeyState`, immediately terminating the orchestrator and all child processes with exit code 3.
- **Perceptual Loop Breaker dhash**: Perceptual difference hashing (`dhash`) across consecutive screenshots detects visual stagnation and terminates repetitive UI interaction loops after 3 consecutive identical actions or 15 wait intervals.
- **Service Limit Wait**: Automated cooldown countdown when provider rate limits are encountered, safely pausing execution while continuously polling the emergency kill switch.
- **Multi-Profile Account Switching**: Controlled browser profile rotation via `--account-switch`, bounded by a hard cap of 2 switches per session, a 120-second cooldown period, and explicit operator consent.

## Gemma 4 Integration

- **Model Identifier**: `gemma-4-26b-a4b-it` by default, configurable via `GEMMA_MODEL`.
- **API Client**: Google GenAI SDK (`google-genai`).
- **Tool Registrations**: 22 native tools (23 with account switching enabled via --account-switch).
- **Multimodal Vision**: Full-screen desktop screenshots downscaled to 1280px width and sent to the Gemma API. Older screenshots in the conversation history are stripped to maintain context space.

## Real vs Simulated

To facilitate clear evaluation, the repository separates real engine components from recorded demonstration data:

- **Real**:
  - Full desktop orchestrator script in [`agent/orchestrator.py`](agent/README.md).
  - Graphify integration with local tree-sitter AST extraction and SHA-256 stall detection.
  - Interactive web showcase with state machine, policy gates, and safety matrix.
- **Simulated in Demo**:
  - The wedding photographer walkthrough scenario presents a recorded execution trace for reproducible review without third-party API dependencies or long research wait times.

## Known Limitations

- **Physical Desktop Calibration**: The desktop automation runner is covered by unit and integration test suites, but physical screen coordinates, sleep intervals, and window titles require machine-specific calibration on physical Windows hardware.
- **Platform**: Windows only.
- **Cloud Screenshot Transmission**: Desktop screenshots are transmitted to Google's cloud API endpoint.
- **Click Grounding**: Direct coordinate clicking is unverified. The orchestrator relies primarily on keyboard shortcuts, clipboard transfer, and terminal commands.
- **Service Terms**: Automating browser chat interfaces may conflict with third-party service policies.
- **Graphify CLI**: Requires local installation via `uv tool install graphifyy`.
- **Stall Check Verification**: The graph no-progress check remains unverified until `GRAPH_STALL_VERIFIED` is confirmed through runtime testing.

## Running the Showcase

Install dependencies and start the local development server:

```bash
npm install
npm run dev
```

Build the production bundle:

```bash
npm run build
```

## Running the Desktop Agent

Refer to [`agent/README.md`](agent/README.md) for environment configuration, requirements, and execution instructions.

## License

Hush is released under the MIT License. See [LICENSE](LICENSE) for details.
