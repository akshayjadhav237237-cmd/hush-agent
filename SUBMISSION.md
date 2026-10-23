# Hush

> Builds quietly. Speaks only when it must.

## Inspiration

Most autonomous agent demos go one of two ways. Either the agent asks for your permission on every tiny action until you get alert fatigue and approve everything blindly, or it runs completely unconstrained until it breaks your working tree.

We wanted an agent that acts like a quiet colleague. You give it a task, it handles the boring work in the background, keeps moving when things are fine, and only taps your shoulder when it hits a real barrier it cannot solve alone.

## What it does

You give it a one-line project idea. From there, Google Gemma 4 (`gemma-4-26b-a4b-it`) takes over desktop control as the main orchestrator, coordinating tools using native function calling and visual screenshots.

- **Architecture & Prompts**: It opens Claude in Chrome to plan the system architecture and write implementation prompts.
- **Deep Research**: It sends technical research questions to Gemini Deep Research in Chrome and waits for the completed report.
- **Code Execution**: It brings Antigravity (the coding IDE) into focus and feeds it the build prompts to generate and edit files.
- **Codebase Graphing**: It runs Graphify locally to build an AST code graph of the project, mapping dependencies and checking whether code changes are actually progressing or stalling.
- **Selective Interruption**: It stays silent while tasks succeed. It pauses and alerts the operator only when progress is genuinely blocked—such as encountering a login screen, a CAPTCHA, missing API keys, ambiguous requirements, or repeated test stalls.

## How we built it

The core system is a modular Python orchestrator running on Windows, powered by Google's GenAI SDK and Gemma 4 (`gemma-4-26b-a4b-it`).

- **Desktop Navigation**: We use PyGetWindow to locate and focus application windows and PyAutoGUI to trigger navigation hotkeys and paste operations.
- **Vision Loop**: The orchestrator captures desktop screenshots downscaled to 1280px and passes them to Gemma for visual state verification. Older screenshots are pruned from history after each action step to keep context windows small and fast.
- **Payload Handling**: Instead of passing thousands of tokens of raw web research through tool call arguments, the runner routes large text blocks through the OS clipboard and local artifact files.
- **AST Code Analysis**: A background subprocess runs the Graphify CLI against the target codebase after build phases, generating knowledge graphs that let the orchestrator track structural growth and catch deadlocks.
- **Companion Showcase**: We built an interactive companion dashboard using React 19, TypeScript, and Tailwind CSS to visualize logs, captured frames, and agent activity.

## Safety design

Autonomous desktop orchestration requires clear boundaries to prevent runaway processes, unintended system modifications, credential exposure, and silent failures. Hush addresses these risks through a defense-in-depth safety architecture implemented across thirteen discrete controls:

1. **Command Allowlist (`core/command_safety.py`)**: Terminal execution via `run_cmd` is restricted to exactly ten permitted binaries: `git`, `npm`, `node`, `python`, `pip`, `dir`, `type`, `echo`, `mkdir`, and `cd`. Commands containing chained operators (`&&`, `||`, `;`, `&`), shell redirections (`>`, `<`), string interpolation (`$()`, backticks, `%`), dangerous administrative tools (`powershell -enc`, `curl`, `wget`), sensitive filenames (`.env`, `.ssh`, `id_rsa`, `credentials`, `secrets`), or destructive flags (`git push`, `git remote`, `pip install`) are intercepted and rejected prior to execution.
2. **Workspace Filesystem Containment (`core/command_safety.py`)**: All file paths referenced in tool calls and shell arguments are normalized using `os.path.realpath` and validated against `WORKDIR` and `PROJECT_DIR` via `os.path.commonpath`. Any attempts at path traversal (`..`), drive escapes, or UNC network paths (`\\`) outside the project root are rejected.
3. **Execution Step Cap (`core/constants.py`, `core/loop.py`)**: A hard limit of 80 turns (`MAX_STEPS = 80`, configurable via `--max-steps`) is enforced per run. If the orchestrator reaches this cap without completing the task, execution halts immediately with exit code 4 (`EXIT_MAX_STEPS`) to prevent infinite looping or runaway compute spend.
4. **Hardware Mouse-Corner Failsafe (`core/killswitch.py`, `core/desktop_tools.py`)**: PyAutoGUI's built-in corner failsafe is permanently enabled (`pyautogui.FAILSAFE = True`). If the user or agent moves the physical mouse cursor into the top-left corner of the primary display (coordinate `0, 0`), a `FailSafeException` triggers an immediate shutdown, logging a `failsafe_abort` event and exiting with code 2 (`EXIT_FAILSAFE`).
5. **Global Kill Hotkey (`core/killswitch.py`)**: A dedicated daemon thread polls the Windows `GetAsyncKeyState` API at 20 Hz for the key combination `Ctrl+Alt+K`. Triggering this hotkey immediately halts orchestrator execution and terminates child subprocesses with exit code 3 (`EXIT_KILL`), providing a non-visual emergency kill switch.
6. **Human-Notify Gate (`core/notify.py`)**: When the agent encounters ambiguous instructions, authentication walls (logins, captchas), payment requests, or repeated tool failures, it invokes `notify_human`. This pauses the model loop, prints an interactive prompt to the local console, and optionally dispatches a push notification via `ntfy.sh` to alert the operator. The agent remains paused until the human supplies guidance or resolves the blocker.
7. **Perceptual Loop Breaker (`core/loopbreaker.py`)**: To catch and break visual or operational stagnation, the orchestrator computes difference hashes (`dhash`) across consecutive screen captures. If the screenshot remains visually unchanged across 3 consecutive interactive actions (`act`) or 15 consecutive wait intervals (`wait`), the agent halts the loop and triggers an escalation alert.
8. **Service Limit Wait (`core/limits.py`)**: When a provider rate limit or quota wall is encountered, the agent executes `report_limit`, pausing operations for the required cooldown duration. The countdown timer runs in an active loop that continues to poll the emergency kill switch at regular intervals.
9. **Cryptographically Chained Audit Log (`core/audit.py`)**: Every action, tool call, parameter set, and state transition is appended to an append-only `audit.jsonl` log file. Each record contains a SHA-256 hash linking it to the previous record (`prev`), making tampering evident. Automated regex scrubbers redact API keys (`AIza...`, `sk-...`), GitHub tokens (`ghp_...`, `github_pat_...`), and HTTP Authorization headers before writing to disk.
10. **Atomic Checkpoints and Resumption (`core/checkpoint.py`)**: After every loop iteration, the complete run state—including step history, conversation context, current phase, and active variables—is serialized atomically to a JSON checkpoint. Interrupted or paused runs can be cleanly resumed using `python orchestrator.py --resume [RUN_ID|latest]` without duplicating work.
11. **Simulated Offline Demo Mode (`core/demo/`)**: A fully offline execution mode (`--demo`, `--demo-limit`, `--demo-answer`) allows testing and evaluating the orchestrator without live API keys, desktop manipulation, or window focusing. It renders synthetic 1280x720 PNG screens in-memory and executes mocked tool chains deterministically.
12. **Multi-Profile Account Switching (`core/accounts.py`)**: When enabled via `--account-switch`, Hush can alternate between pre-configured Google Chrome profiles upon hitting Claude or Gemini usage limits. Switching is constrained to a maximum of 2 switches per run (`MAX_SWITCHES = 2`) with a mandatory 120-second cooldown (`COOLDOWN_SECONDS = 120.0`). Enabling this feature requires explicit acknowledgment of risk terms by typing `I UNDERSTAND` or passing `--i-accept-account-switch-terms`.
13. **Graph No-Progress Alert (`core/graph_tools.py`)**: Calculates a SHA-256 hash of `graphify-out/GRAPH_REPORT.md` following each build cycle. If the report hash remains identical across two consecutive rounds, the agent invokes `notify_human` to prevent unproductive code generation loops.

### Account-Switching Caution Notice

The account switcher module enforces the following verbatim notice (`agent/core/accounts.py`):

> "Switching between accounts to work around usage limits may violate the terms of the services involved and could get those accounts restricted. Use only your own accounts. Hush never stores or types passwords."

Account switching is strictly browser-only and limited to web interfaces for Claude and Gemini. Switching is unsupported for Antigravity; any rate limits encountered in Antigravity require manual human resolution.

### Known Limitations

1. **Operational Guardrail vs. OS Sandbox**: The command allowlist is an operational guardrail, not an operating system sandbox. Permitted binaries like `python` and `npm` can execute arbitrary code within their runtime context.
2. **Visual Click Grounding**: Gemma UI click coordinate accuracy is unverified on physical hardware. The orchestrator relies on hotkeys, clipboard transfer, and CLI commands for reliable interactions.
3. **Limit Detection vs. Execution**: Service limit banners and cooldown times are judged visually by the model from screenshots, while countdown pauses and state resumption are executed deterministically in code.
4. **Push Notification Privacy**: `ntfy.sh` push notification topics are public by design (security through obscurity). If enabling mobile notifications, configure obscure, high-entropy topic names.

## What is verified

Hush maintains a strict boundary between automated code contracts and physical hardware validation. All core logic, safety constraints, state machines, and parsing logic are validated through an offline unit test suite consisting of **219 passing pytest tests**.

| Safety Feature | Verification Status | Verification Detail |
| :--- | :--- | :--- |
| **Command allowlist** | Implemented, unit-tested | Validated against 10 permitted binaries, blocked operators, redirection, and prohibited flags (`test_command_safety.py`). |
| **Workspace filesystem containment** | Implemented, unit-tested | Path normalization, drive escape checks, and directory traversal blocks validated across edge cases (`test_command_safety.py`). |
| **Step cap (`MAX_STEPS = 80`)** | Implemented, unit-tested | Termination at turn 80 with exit code 4 verified in synthetic execution loops (`test_loop.py`). |
| **Mouse-corner failsafe** | Implemented, unit-tested; not yet verified on a real desktop | `pyautogui.FailSafeException` handling, exit code 2 dispatch, and audit logging verified with mocked desktop drivers (`test_killswitch.py`). |
| **Human-notify gate** | Implemented, unit-tested; not yet verified on a real desktop | Console pause, prompt display, auto-answer mocks, and `ntfy.sh` secret scrubbing verified offline (`test_notify.py`). |
| **Graph no-progress alert** | Planned (`GRAPH_STALL_VERIFIED = false`) | Specification and hashing architecture designed; end-to-end multi-round stall tripping pending completion. |
| **Cryptographically chained audit log** | Implemented, unit-tested | SHA-256 chain continuity, tamper detection via `verify_chain()`, and automated secret scrubbing verified (`test_audit.py`). |
| **Atomic checkpoints and resume** | Implemented, unit-tested; not yet verified on a real desktop | State serialization, checkpoint writing, corrupt file handling, and discovery of `--resume latest` verified (`test_checkpoint.py`). |
| **Simulated demo mode** | Implemented, unit-tested | Synthetic 1280x720 PNG rendering, deterministic code generation, and simulated limit triggers verified offline (`test_demo_*.py`). |
| **Global kill hotkey (`Ctrl+Alt+K`)** | Implemented, unit-tested; not yet verified on a real desktop | 20 Hz polling thread, key state interception, and exit code 3 termination verified via mocked OS inputs (`test_killswitch.py`). |
| **Perceptual loop breaker** | Implemented, unit-tested; not yet verified on a real desktop | 64-bit `dhash` computation, Hamming distance checks, and action/wait threshold tripping verified on synthetic PNG frames (`test_loopbreaker.py`). |
| **Service limit wait** | Implemented, unit-tested | Countdown pause execution and active kill-switch check routines verified offline (`test_limits.py`). |
| **Multi-profile account switching** | Implemented, unit-tested; not yet verified on a real desktop | 2-switch maximum, 120s cooldown timer, terms confirmation gate, and Antigravity rejection verified (`test_accounts.py`). |

## Challenges we ran into

- **FailSafeException swallowed by generic handlers:** In early iterations, a broad `try/except Exception` block wrapped tool execution. PyAutoGUI raises `FailSafeException` when an operator jerks the mouse to the corner of the screen. Catching it generically caused the error to be formatted into a string and sent back to Gemma as a regular tool failure, allowing the agent to continue executing. We resolved this by explicitly checking for `FailSafeException` via an `is_failsafe` helper. The orchestrator now bypasses normal turn handling, logs a `failsafe_abort` event to the audit trail, and terminates immediately with exit code 2.
- **Large text payloads breaking tool arguments:** Passing multi-thousand-character research syntheses and code files directly as string parameters inside tool calls caused JSON schema serialization errors and wasted model context tokens. We decoupled large payloads from the LLM prompt stream by implementing artifact storage. The agent uses `save_artifact` and `paste_artifact` tools to write long text to disk and stream it into target desktop applications via clipboard buffers.
- **Single 429 rate limits crashing runs:** Provider rate limits or daily quota exhaustion initially terminated execution without recovery options. We resolved this with two mechanisms. First, transient model API failures trigger exponential backoff with randomized jitter. Second, for hard platform walls, we implemented the `report_limit` tool. When hit, the orchestrator either switches to an alternate profile (constrained by `MAX_SWITCHES = 2` and `COOLDOWN_SECONDS = 120.0`) or enters an operator-interruptible wait loop that polls the kill switch every 30 seconds.
- **Workspace filesystem confinement:** Allowing shell execution and filesystem navigation created potential directory traversal risks. Naive string checks failed against relative directory traversal, alternative drive letters, and UNC network shares. We enforced strict path normalization using `os.path.realpath` and `os.path.commonpath`. Any command token attempting parent traversal (`..`), drive escapes, or UNC paths (`\\`) is blocked before the subprocess spawns.

## Accomplishments that we're proud of

- **Fast, comprehensive unit test suite:** We built 219 unit tests across 28 test suites in pytest. The full suite completes in under 15 seconds. It exercises the state machine, tool registry (22 base tools, 23 with profile switching), loop breaker, rate limiter, and safety confinement without requiring live network APIs or physical desktop hardware.
- **Tamper-evident SHA-256 chained audit log:** Every model prompt, tool invocation, human intervention gate, and exit code is recorded in `audit.jsonl`. Each record includes a SHA-256 hash pointer to the previous entry, creating an immutable audit trail. API keys (Gemini, OpenAI, GitHub tokens) and authorization headers are scrubbed before writing to disk.
- **In-memory simulated desktop mode (`--demo`):** Testing desktop GUI agents typically requires physical screens or fragile headless X servers. We built a synthetic desktop engine that produces 1280x720 PNG screenshots and mock window hierarchies in memory. This enables full end-to-end evaluation of loop execution, screenshot downsampling, and tool dispatch in headless CI.
- **Self-contained showcase web app:** We engineered an interactive showcase site and audit log replay viewer. The site builds into static assets with zero external runtime dependencies and deploys directly to GitHub Pages.

## What we learned

- **Multimodal context requires strict visual budgeting:** High-resolution multi-monitor desktop screenshots rapidly exhaust model context windows and hit rate limits. Standardizing visual inputs to a 1280px downscaled width and aggressively pruning conversation history to retain only the 2 most recent screenshots stabilized token consumption while maintaining UI element legibility.
- **Command allowlists are guardrails, not sandboxes:** Granting an agent access to runtime binaries like `python` and `npm` is essential for practical engineering tasks. However, an allowlist functions only as an operational guardrail. Because `python` can execute arbitrary scripts, robust multi-tenant security requires OS-level container isolation rather than static string inspection alone.
- **Physical kill switches provide vital operator assurance:** Desktop agents that manipulate the mouse cursor can easily hijack window focus, rendering on-screen pause buttons useless. Running a dedicated background thread that polls `Ctrl+Alt+K` at 20 Hz, paired with corner-slam failsafes, is essential for operator trust and physical safety.

## What's next for Hush

- **Physical multi-monitor calibration:** Calibrate click coordinate mapping, DPI scaling ratios, and cross-monitor boundary transitions on multi-display Windows workstations.
- **Live run replay capture:** Record and publish a full end-to-end `replay.json` artifact from an uninterrupted live build session against production browsers and IDEs.
- **Live Graphify stall gate verification:** Validate the Graphify SHA-256 AST graph comparison gate across multi-round autonomous refactorings to automatically detect and halt circular code generation loops.
- **Local open-weight execution:** Benchmark local inference running open-weight Gemma 4 checkpoints through Ollama or LiteRT, enabling fully offline, private execution without cloud API quotas.

## Built with

Python, Google GenAI SDK, Gemma 4, PyAutoGUI, PyGetWindow, Pyperclip, Pillow, Requests, Pytest, React 19, TypeScript, Vite, Tailwind CSS v4, Motion, Radix UI, Lucide React, Graphify

## Links

- **Repository**: [https://github.com/akshayjadhav237237-cmd/hush-agent](https://github.com/akshayjadhav237237-cmd/hush-agent)
- **Live Showcase**: [https://akshayjadhav237237-cmd.github.io/hush-agent/](https://akshayjadhav237237-cmd.github.io/hush-agent/)
- **Demo Video**: [FILL: VIDEO_SRC]
- **Hackathon Submission**: [FILL: HACKATHON_NAME]
- **Team**: [FILL: TEAM]
