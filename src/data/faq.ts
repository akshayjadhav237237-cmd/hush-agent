import type { FaqItem } from "@/data/types";

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Why Gemma and not just Claude?",
    a: "Claude excels at code generation and architectural synthesis. However, high-frequency desktop orchestration, screenshot inspection, and gate evaluation benefit from a focused open-weights model. Gemma 4 provides fast execution with native function calling and multimodal vision. Using Gemma as the desktop operator and Claude as the code architect separates visual manipulation from software engineering."
  },
  {
    q: "What runs locally vs in the cloud?",
    a: "Gemma 4 is called through the Google Gemini API. Claude and Gemini Deep Research run in the browser. Antigravity runs as a desktop application on Windows. Graphify runs locally via CLI tools to generate dependency graphs. Command execution via run_cmd runs locally in the workspace folder. Screenshots captured with pyautogui are sent to the Gemini API for visual inspection by Gemma."
  },
  {
    q: "What is simulated vs real in this project?",
    a: "The TypeScript web application, interactive state machine, command allowlist sandbox, and attention gate flows are fully implemented. The wedding photographer build trace demonstrates real orchestrator execution patterns in a recorded walkthrough so evaluators can inspect every decision, terminal output, and gate event without live API keys or long research waits."
  },
  {
    q: "What are the known limitations (including UI click/coordinate accuracy)?",
    a: "Hush operates under four core operational boundaries: (1) Allowlisted commands like python and npm can still execute arbitrary code (operational guardrail, not OS sandbox); (2) Gemma UI click accuracy is unverified; spatial coordinate grounding is experimental; (3) Limit detection is judged by the model visually from screenshots, while countdown waiting and state resumption are executed in code; and (4) ntfy push notification topics are public by design (security through obscurity; use high-entropy topic names)."
  },
  {
    q: "How are API rate limits and token budgets managed?",
    a: "Hush enforces a hard execution cap of 80 steps (MAX_STEPS = 80) in orchestrator.py. The orchestrator retains only the two most recent screenshots in context (KEEP_SCREENSHOTS = 2), replacing older screenshots with text placeholders to minimize token usage. Screenshots are downscaled to a width of 1280 pixels before transmission."
  },
  {
    q: "How does safety and system command containment work?",
    a: "Shell execution is controlled by run_cmd with an allowlist restricted to ten commands: git, npm, node, python, pip, dir, type, echo, mkdir, and cd, running strictly within WORKDIR and PROJECT_DIR with path traversal blocked. Emergency stops include mouse-corner failsafe (pyautogui.FAILSAFE = True, exiting code 2) and a global kill hotkey (Ctrl+Alt+K, polled at 20 Hz, exiting code 3). Cryptographically chained JSONL audit logs and atomic checkpoints ensure safety, transparency, and resumption."
  },
  {
    q: "How can judges reproduce this build?",
    a: "For the web application: clone the repository, run npm install, and run npm run dev to open http://localhost:5173. For the Python orchestrator in agent/orchestrator.py: install dependencies with pip install google-genai pyautogui pyperclip pygetwindow requests pillow, install Graphify with uv tool install graphifyy, set GEMINI_API_KEY, and run python orchestrator.py with your prompt."
  },
  {
    q: "What are the open-source licensing and commercial use terms?",
    a: "This project is released under the Apache 2.0 license. Gemma weights and model artifacts are governed by the Google Gemma Terms of Use, which permit commercial deployment under responsible AI guidelines."
  },
  {
    q: "What does Graphify do here?",
    a: "Graphify parses the code written by Antigravity locally using tree-sitter, extracts an AST dependency graph into graphify-out/, and exports an interactive graph.html. Gemma provides these structural insights (clusters, dependencies, connection paths) to Claude to help write informed subsequent build prompts. Additionally, graph_update monitors GRAPH_REPORT.md checksums to alert the human if two consecutive rounds produce identical code structure."
  },
  {
    q: "Does Graphify send my code anywhere?",
    a: "No. Graphify operates entirely locally on your machine using tree-sitter parsing without uploading source code to external servers. Note that other components in Hush do make network calls: Gemma 4 runs via Google's Gemini API, Claude and Gemini Deep Research run through the browser, and screenshots are transmitted to the Gemma API for visual verification."
  }
];
