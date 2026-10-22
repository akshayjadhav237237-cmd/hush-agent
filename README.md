# Hush

> Builds quietly. Speaks only when it must.

Hush is a Windows desktop automation orchestrator. Google Gemma 4 operates as the central control plane, driving Claude (architecture), Gemini Deep Research (web research), and Antigravity (coding engine) in an autonomous loop. The desktop agent runner code is located in [`agent/`](agent/README.md).

## Core Thesis

Traditional autonomous agents generate continuous notification fatigue. Constant prompts lead humans to reflexively approve destructive actions.

Hush inverts this model. All safe tasks execute silently. The system interrupts the human operator only when progress is impossible without them:

- **Auth, CAPTCHA, or MFA**: Login prompts, CAPTCHA challenges, two-factor authentication requests, or biometric verification barriers (model-judged).
- **Missing Credentials or Billing**: Missing API keys, expired service tokens, missing cloud environment secrets, or paid plan quota limits (model-judged).
- **Ambiguous Requirements**: Underspecified architectural choices, conflicting UX paths, branching business rules, or explicit `NEEDS_HUMAN` flags (model-judged).
- **Destructive or Non-Allowlisted Commands**: Unrecognized terminal commands, recursive deletions (`rm -rf`), privilege escalation (`sudo`), or out-of-sandbox modifications (enforced in code).
- **Repeated Failures**: Looping compiler errors, persistent test failures (>3 attempts), or recursive prompt-refinement stalls that trip the circuit breaker (model-judged).
- **Domain or Scope Drift**: Hallucinated dependencies, feature creep outside the initial specification, or unrequested architectural redesigns (model-judged).

## How It Works

Hush organizes specialized agents into an execution loop governed by Google Gemma 4 as the orchestrator using function calling and screenshot vision via the Gemini API.

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
```

### Execution Loop

1. **Task Formulation**: The user inputs a project request.
2. **Research Dispatch**: Gemma evaluates the prompt and coordinates inquiry vectors for Gemini Deep Research.
3. **Web Exploration**: Gemini Deep Research analyzes industry benchmarks and emits a structured research report.
4. **Architecture Planning**: Claude digests the findings and synthesizes component hierarchies and build specifications.
5. **Sandbox Implementation**: Antigravity scaffolds components and runs builds inside an isolated workspace.
6. **Visual Inspection**: Gemma inspects rendered output via multimodal screenshot vision to verify responsive layout fidelity.
7. **Attention Gate Enforcement**: If ambiguity, missing credentials, or policy violations occur, Gemma pauses the loop and alerts the human operator. Safe tasks continue silently.

## Real vs Simulated

To enable clear and reproducible evaluation, the codebase separates real engine components from recorded walkthrough data:

- **Real**:
  - Complete TypeScript showcase architecture and UI state machine.
  - Command allowlist parsing and policy boundary model.
  - Timeline playback engine.
  - Policy attention gate resolution flow and enforcement tags (code vs model).
  - Desktop automation runner setup in [`agent/`](agent/README.md).
- **Simulated in Demo**:
  - The 7-step wedding photographer scenario uses a recorded execution trace. This provides reproducible judge evaluation without requiring external live API credentials or waiting for minutes of deep research latency.

## Security and Guardrails

Safety controls match the definitions in `src/data/safety.ts`.

### Implemented

- **Command Allowlist**: Strict whitelist restricting terminal execution to benign toolchains (`git`, `npm`, `vite`, `python`, `node`) while blocking destructive binaries and recursive deletions.
- **Workspace-Only Filesystem Containment**: Filesystem sandboxing enforcing all read/write and process execution to stay strictly within the designated project root directory.
- **Step Cap**: Hard iteration limit per autonomous task run (max 25 agent steps) preventing infinite loops and runaway compute consumption.
- **Mouse-Corner Abort**: Failsafe hardware interrupt that halts browser and OS automation immediately if the pointer is moved into any screen corner.
- **Human-Notify Gate**: Automated trigger system that pauses agent execution and sends desktop notifications whenever high-consequence decisions or ambiguities arise.

### Planned

- **JSONL Audit Log**: Tamper-evident, structured append-only record tracking all agent prompts, shell commands, file modifications, and attention gate triggers.
- **Global Kill Hotkey**: OS-level global key combination (such as Ctrl+Shift+Esc) that terminates all active subprocesses and background runners instantly.
- **Screenshot-Hash Loop Breaker**: Perceptual hashing mechanism that compares consecutive UI screenshots and trips an alert if identical visual states recur across consecutive iterations.

## Gemma 4 Usage

Google Gemma 4 serves as the primary control plane across three core roles:

- **Native Function Calling**: Orchestrates workflow dispatch, tool routing, and agent delegation.
- **Multimodal Screenshot Vision**: Inspects rendered web components to verify layout alignment, responsive fidelity, and visual contrast directly from screenshots.
- **Attention-Gate Classification**: Classifies pipeline state to evaluate risk, ambiguity, and policy compliance before human escalation.
- **Model Deployment**: In the current build, Gemma 4 is called through the Gemini API (`gemma-4-26b-a4b-it`). Running the same loop on a local runtime such as Ollama is a possible next step and has not been verified.

## Known Limitations

- **UI Click Coordinates**: Direct UI click coordinate accuracy is unverified. Hush uses keyboard shortcuts, clipboard, and CLI interfaces wherever possible, and does not claim spatial grounding.
- **Refactoring Scope**: Long-horizon multi-file refactors risk context drift without modular subtask boundaries.
- **Interactive Terminals**: Interactive terminal prompts (such as ncurses menus or raw TTY password inputs) cannot be automated without dedicated PTY hooks.
- **Ambiguity Detection**: Ambiguous requirement gates depend on model prompts explicitly raising branching assumptions.

## Run Instructions

### Showcase Website

```bash
npm install
npm run dev
npm run build
```

Typecheck:

```bash
tsc --noEmit
```

### Desktop Agent

See [`agent/README.md`](agent/README.md) for environment configuration and usage instructions.

## License

MIT License. See [LICENSE](LICENSE) for details.
