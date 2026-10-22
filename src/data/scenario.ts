import type { Actor as BaseActor, Step as BaseStep } from "@/data/types";

export type Actor = BaseActor | "graphify";

export interface Step extends Omit<BaseStep, "actor"> {
  actor: Actor;
}

export const SCENARIO_STEPS: Step[] = [
  {
    id: "step-1",
    actor: "user",
    title: "User prompt submission",
    detail: "User submits the initial request: 'Build a portfolio site for a wedding photographer.'",
    terminal: [
      "$ prompt-input --topic 'Build a portfolio site for a wedding photographer'",
      "(output omitted in this recorded scenario)"
    ]
  },
  {
    id: "step-2",
    actor: "gemma",
    title: "Gemma requests research brief",
    detail: "Gemma evaluates the user request and prompts Claude to generate inquiry vectors for portfolio architecture research.",
    terminal: [
      "$ gemma-orchestrator dispatch --target claude --action synthesize-research-brief",
      "(output omitted in this recorded scenario)"
    ]
  },
  {
    id: "step-3",
    actor: "gemini",
    title: "Gemini Deep Research execution",
    detail: "Gemini Deep Research queries web benchmarks and synthesizes architectural requirements for wedding photography portfolios.",
    terminal: [
      "$ gemini-research query --topic 'wedding photography portfolio architecture and client proofing'",
      "(output omitted in this recorded scenario)"
    ]
  },
  {
    id: "step-4",
    actor: "claude",
    title: "Claude synthesizes build prompt 1",
    detail: "Claude analyzes the research report and structures component specifications into build prompt 1.",
    terminal: [
      "$ claude-coder plan --spec ./research-brief.json --out ./build-prompt-1.json",
      "(output omitted in this recorded scenario)"
    ]
  },
  {
    id: "step-5",
    actor: "antigravity",
    title: "Antigravity round 1 build",
    detail: "Antigravity scaffolds project components. The command allowlist intercepts and rejects an unapproved cleanup command.",
    terminal: [
      "$ antigravity build --prompt ./build-prompt-1.json",
      "$ rm -rf ./dist",
      "[SECURITY GATE BLOCKED] Command rejected: 'rm -rf ./dist' is not in the safe command allowlist.",
      "(output omitted in this recorded scenario)"
    ]
  },
  {
    id: "step-6",
    actor: "graphify",
    title: "Graphify AST refresh",
    detail: "Graphify re-extracts code AST locally, updates graphify-out/GRAPH_REPORT.md, and exports interactive graph.html.",
    terminal: [
      "$ graphify update .",
      "$ graphify export html",
      "(output omitted in this recorded scenario)"
    ]
  },
  {
    id: "step-7",
    actor: "claude",
    title: "Attention gate: ambiguous requirement",
    detail: "Claude inspects graph findings and raises an ambiguity regarding payment provider integration. Playback pauses for human resolution.",
    gate: {
      trigger: "Ambiguous requirement",
      reason: "Multiple viable booking payment options (Stripe vs Square) require human business decision.",
      action: "Pipeline paused until payment provider selection is resolved."
    },
    terminal: [
      "$ claude-architect evaluate --component booking-payment",
      "[Claude] NEEDS_HUMAN: which payment provider should bookings use?",
      "[GATE TRIGGERED: Ambiguous requirement]",
      "[Reason] Multiple viable booking payment options (Stripe vs Square) require human business decision.",
      "[Action] Pipeline paused until payment provider selection is resolved.",
      "[Operator Alert] Notification dispatched to human supervisor.",
      "(output omitted in this recorded scenario)"
    ]
  },
  {
    id: "step-8",
    actor: "human",
    title: "Human resolution and round 2 completion",
    detail: "Human operator resolves payment selection. Antigravity integrates provider, completes build round 2, and Gemma calls finish.",
    terminal: [
      "$ antigravity build --resume --provider stripe",
      "[Antigravity] Round 2 compilation succeeded.",
      "$ gemma-vision verify --screenshot ./preview-round-2.png",
      "[Gemma] Verification complete: SUCCESS.",
      "(output omitted in this recorded scenario)"
    ]
  }
];
