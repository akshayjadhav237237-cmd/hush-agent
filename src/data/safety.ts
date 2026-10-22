import type { SafetyItem } from "@/data/types";

export const SAFETY_ITEMS: SafetyItem[] = [
  {
    id: "safety-command-allowlist",
    title: "Command Allowlist",
    description: "Strict whitelist restricting terminal execution to benign toolchains (git, npm, vite, python, node) while blocking destructive binaries and recursive deletions.",
    implemented: true
  },
  {
    id: "safety-workspace-only",
    title: "Workspace-Only Commands",
    description: "Filesystem sandboxing enforcing all read/write and process execution to stay strictly within the designated project root directory.",
    implemented: true
  },
  {
    id: "safety-step-cap",
    title: "Step Cap",
    description: "Hard iteration limit per autonomous task run (max 25 agent steps) preventing infinite loops and runaway compute consumption.",
    implemented: true
  },
  {
    id: "safety-mouse-corner-abort",
    title: "Mouse-Corner Abort",
    description: "Failsafe hardware interrupt that halts browser and OS automation immediately if the pointer is moved into any screen corner.",
    implemented: true
  },
  {
    id: "safety-human-notify-gate",
    title: "Human-Notify Gate",
    description: "Automated trigger system that pauses agent execution and sends desktop notifications whenever high-consequence decisions or ambiguities arise.",
    implemented: true
  },
  {
    id: "safety-jsonl-audit-log",
    title: "JSONL Audit Log",
    description: "Tamper-evident, structured append-only record tracking all agent prompts, shell commands, file modifications, and attention gate triggers.",
    implemented: false
  },
  {
    id: "safety-global-kill-hotkey",
    title: "Global Kill Hotkey",
    description: "OS-level global key combination (e.g. Ctrl+Shift+Esc / Cmd+Alt+Escape) that terminates all active subprocesses and background runners instantly.",
    implemented: false
  },
  {
    id: "safety-screenshot-hash-loop-breaker",
    title: "Screenshot-Hash Loop Breaker",
    description: "Perceptual hashing mechanism that compares consecutive UI screenshots and trips an alert if identical visual states recur across consecutive iterations.",
    implemented: false
  }
];
