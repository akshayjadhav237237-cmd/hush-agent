import type { FaqItem } from "@/data/types";

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "Why Gemma and not just Claude?",
    a: "Claude excels at complex code generation and nuanced reasoning, but relying exclusively on proprietary frontier models for high-frequency orchestration, visual screenshot inspection, and security gate classification is cost-prohibitive and locks developers into a closed ecosystem. Gemma provides open-weights flexibility, responsive execution, native function calling, and multimodal vision in a transparent, inspectable footprint. Combining Gemma as the fast local/open orchestrator and gatekeeper with Claude as the downstream code synthesizer achieves the optimal balance of speed, auditability, cost, and code quality."
  },
  {
    q: "What runs locally vs in the cloud?",
    a: "Local execution encompasses the orchestration runtime, command allowlist sandbox, step-cap counters, workspace filesystem operations, and headless browser screenshot capture. Cloud APIs power Gemini Deep Research queries and Claude code synthesis endpoints. Gemma inference can be served either locally (via Ollama, vLLM, or llama.cpp) or through the Gemini API endpoints depending on developer hardware and deployment preferences."
  },
  {
    q: "What is simulated vs real in this project?",
    a: "Real: The complete TypeScript architecture, interactive UI state machine, command allowlist enforcement engine, step playback mechanism, and attention gate resolution flow are fully implemented and running live in the application. Simulated in this demo walkthrough: The specific 7-step wedding photographer scenario utilizes a pre-recorded real-world execution trace so judges can deterministically inspect every terminal output, gate event, and decision branch without requiring external live API credentials, billing setup, or waiting for minutes of deep research processing."
  },
  {
    q: "What are the known limitations (including UI click/coordinate accuracy)?",
    a: "Hush uses keyboard shortcuts, clipboard, and CLI interfaces wherever possible. Gemma's direct UI click coordinate accuracy is unverified, and Hush does not claim any spatial grounding capability. Additional limitations include: long-horizon multi-file refactors risk context drift without modular subtask boundaries; interactive terminal prompts (such as ncurses menus or raw TTY password inputs) cannot be automated without dedicated PTY hooks; and ambiguous requirements depend on model prompts explicitly raising branching assumptions."
  },
  {
    q: "How are API rate limits and token budgets managed?",
    a: "Hush enforces a hard per-run step cap (default 25 iterations) and tracks token burn across all agent invocations. By offloading frequent routing and screenshot verification to Gemma rather than larger frontier models, token expenditure is drastically reduced. When rate limits (HTTP 429) are encountered, exponential backoff with jitter is applied; if limits persist, a circuit breaker trips an Attention Gate rather than burning budget in retry loops."
  },
  {
    q: "How does safety and system command containment work?",
    a: "Shell execution is governed by a strict command allowlist and workspace containment sandbox. Commands are validated against permitted binaries (such as npm, npx, git, node, vite). Unrecognized or dangerous patterns—including recursive deletion (rm -rf), pipe-to-shell interpreters (curl | sh), out-of-workspace file paths (../), and privilege escalation (sudo)—are blocked before execution. Additionally, a mouse-corner abort mechanism provides an immediate physical kill switch for any automated screen control."
  },
  {
    q: "How can judges reproduce this build?",
    a: "Clone the repository from GitHub, ensure Node.js 18+ is installed, run `npm install` to install dependencies, and execute `npm run dev` to launch the local Vite development server. The interactive walkthrough, gate simulator, and architecture views will be immediately accessible in your browser at `http://localhost:5173`. To verify static type safety, execute `npx tsc --noEmit`."
  },
  {
    q: "What are the open-source licensing and commercial use terms?",
    a: "This project is released under the permissive Apache 2.0 license. Gemma weights and model artifacts are licensed under the Google Gemma Terms of Use (a permissive open-model license permitting commercial use under responsible AI guidelines). Developers and organizations are free to adapt, modify, and integrate this architecture into their own commercial or private pipelines."
  }
];
