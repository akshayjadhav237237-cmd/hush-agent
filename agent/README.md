# Hush Agent

Runs the desktop orchestration loop on Windows.

## Overview

Hush orchestrates autonomous desktop workflows using Google Gemma 4 via the Gemini API. The orchestrator coordinates research, architectural design, and coding tools, executing safe actions silently and escalating to the human operator only when progress cannot continue without operator judgment.

## Platform

- **Operating System**: Windows only (uses Windows desktop APIs via `pyautogui` and `pygetwindow`).

## Setup

1. Create and activate a virtual environment:

```bash
python -m venv venv
venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set your environment variables:

```bash
set GEMINI_API_KEY=your_gemini_api_key_here
```

Optional desktop/mobile push notification topic via ntfy:

```bash
set NTFY_TOPIC=your_optional_ntfy_topic
```

Note: Never hardcode your API key in source files. The script reads credentials exclusively from the `GEMINI_API_KEY` environment variable.

## Usage

```bash
python orchestrator.py "your idea"
```

## Tools

Tool definitions and signatures are registered natively in `orchestrator.py`. The runner binds function-calling tools to the Gemma 4 Gemini API client for dispatching tasks across browser and desktop environments.

## Safety Behavior

- **Command Allowlist**: Validates shell commands against an approved toolchain allowlist before execution, denying destructive patterns (such as recursive deletion or privilege escalation).
- **Workspace-Only Commands**: Restricts file modifications and process execution strictly within the target workspace directory.
- **Step Cap**: Enforces a maximum step cap per run to prevent infinite loops and runaway execution.
- **Mouse-Corner Failsafe**: Moving the mouse pointer to the top-left screen corner triggers an immediate hardware abort via PyAutoGUI fail-safe.
- **Human Notification Gate (`notify_human`)**: Pauses the automation loop and surfaces a notification when credentials, CAPTCHAs, or ambiguous requirements arise.

## Known Limitations

- **Untested on other machines**: Designed and tested specifically for Windows desktop environments.
- **UI click accuracy unverified**: Direct coordinate clicking is experimental; the orchestrator relies on keyboard shortcuts and clipboard transfer where possible.
- **Third-party UI fragility**: Automation of third-party desktop and web application UIs can break when application layouts or selectors change.
- **Consumer chat terms**: Scripting consumer chat interfaces directly may conflict with those services' terms of use.
