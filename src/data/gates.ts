import type { Gate } from "@/data/types";

export const ATTENTION_GATES: Gate[] = [
  {
    id: "gate-auth-captcha",
    title: "Auth / CAPTCHA / MFA",
    detects: "Login prompts, CAPTCHA challenges, two-factor authentication requests, or biometric verification barriers.",
    action: "Pauses agent automation and surfaces interactive browser session to human operator for secure credential entry.",
    icon: "ShieldAlert",
    enforcement: "model"
  },
  {
    id: "gate-missing-credentials",
    title: "Missing Credentials or Billing",
    detects: "Missing API keys, expired service tokens, missing cloud environment secrets, or paid plan / billing quota walls.",
    action: "Halts workflow, prompts human operator to securely supply needed credentials or approve billing tier escalation.",
    icon: "KeyRound",
    enforcement: "model"
  },
  {
    id: "gate-ambiguous-requirement",
    title: "Ambiguous Requirement (NEEDS_HUMAN)",
    detects: "Underspecified architectural choices, conflicting UX paths, branching business rules, or explicit NEEDS_HUMAN model flags.",
    action: "Suspends downstream code generation and presents structured multiple-choice decision card to human operator.",
    icon: "HelpCircle",
    enforcement: "model"
  },
  {
    id: "gate-destructive-command",
    title: "Destructive or Non-Allowlisted Command",
    detects: "Unrecognized terminal commands, recursive deletion (rm -rf), privilege escalation (sudo/chmod), or out-of-workspace disk modifications.",
    action: "Immediately blocks command execution at command allowlist boundary, records alert in audit log, and awaits operator confirmation.",
    icon: "Terminal",
    enforcement: "code"
  },
  {
    id: "gate-repeated-failure",
    title: "Repeated failure or no progress",
    detects: "Total execution step cap (80 steps) reached, or Graphify GRAPH_REPORT.md checksum identical for two consecutive build rounds. Detects an unchanged code graph or step cap, not compiler or test build errors.",
    action: "Pipeline halted; human notified via console or optional ntfy push to diagnose stall.",
    icon: "RefreshCw",
    enforcement: "code"
  },
  {
    id: "gate-scope-drift",
    title: "Domain / Scope Drift",
    detects: "Hallucinated dependencies, feature creep outside initial specification, or unrequested architectural redesigns.",
    action: "Freezes execution branch, highlights divergence against baseline spec, and requests human scope re-alignment.",
    icon: "Compass",
    enforcement: "model"
  }
];
