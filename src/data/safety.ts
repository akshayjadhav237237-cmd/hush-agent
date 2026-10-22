import type { SafetyItem } from "@/data/types";
import { GRAPH_STALL_VERIFIED } from "@/data/brand";

export const SAFETY_ITEMS: SafetyItem[] = [
  {
    id: "safety-command-allowlist",
    title: "Command allowlist",
    description: "Strict allowlist restricting terminal execution to ten permitted binaries: git, npm, node, python, pip, dir, type, echo, mkdir, and cd. Blocks dangerous substrings and shell redirection.",
    implemented: true
  },
  {
    id: "safety-workspace-only",
    title: "Workspace filesystem containment",
    description: "Filesystem sandboxing enforcing all command execution and graph extraction to stay strictly within WORKDIR and PROJECT_DIR.",
    implemented: true
  },
  {
    id: "safety-step-cap",
    title: "Step cap",
    description: "Hard execution limit per run (MAX_STEPS = 80) preventing runaway execution loops and unbounded compute spend.",
    implemented: true
  },
  {
    id: "safety-mouse-corner-abort",
    title: "Mouse-corner abort",
    description: "Hardware failsafe via pyautogui.FAILSAFE = True. Moving the pointer to the top-left screen corner immediately aborts the orchestrator process.",
    implemented: true
  },
  {
    id: "safety-human-notify-gate",
    title: "Human-notify gate",
    description: "Interactive pause invoking console input and optional push notification via ntfy to request human guidance when gates trip.",
    implemented: true
  },
  {
    id: "safety-graph-stall",
    title: "Graph no-progress alert",
    description: "Calculates SHA-256 hash of graphify-out/GRAPH_REPORT.md after every build round. If the hash remains unchanged across two consecutive rounds, the agent invokes notify_human to prevent infinite stagnant looping.",
    implemented: GRAPH_STALL_VERIFIED
  },
  {
    id: "safety-jsonl-audit-log",
    title: "JSONL audit log",
    description: "Append-only structured audit record tracking every tool call, arguments, and screenshot metadata. Planned.",
    implemented: false
  },
  {
    id: "safety-global-kill-hotkey",
    title: "Global kill hotkey",
    description: "OS-level daemon hotkey to terminate the orchestrator and all background child processes. Planned.",
    implemented: false
  },
  {
    id: "safety-screenshot-hash-loop-breaker",
    title: "Screenshot-hash loop breaker",
    description: "Perceptual image hashing to detect identical screen state loops across tool calls. Planned.",
    implemented: false
  }
];
