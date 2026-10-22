import type { Fact } from "@/data/types";

export const GEMMA_FACTS: Fact[] = [
  {
    label: "Gemini API Model IDs",
    value: "gemma-4-26b-a4b-it, gemma-4-31b-it",
    source: "https://ai.google.dev/gemini-api/docs/models/gemma"
  },
  {
    label: "Family Sizes",
    value: "E2B, E4B, 12B, 26B A4B, 31B",
    source: "https://ai.google.dev/gemma/docs/core"
  },
  {
    label: "Function Calling",
    value: "Native function calling supported out-of-the-box for tool-use and autonomous orchestration",
    source: "https://ai.google.dev/gemini-api/docs/function-calling"
  },
  {
    label: "Vision Input",
    value: "Native multimodal image and screenshot vision input for visual verification and UI inspection",
    source: "https://ai.google.dev/gemini-api/docs/vision"
  },
  {
    label: "Context Window",
    value: "256K on larger models (12B, 26B-A4B, 31B), 128K on E2B/E4B",
    source: "https://ai.google.dev/gemma/docs/core"
  },
  {
    label: "License",
    value: "Apache 2.0 (permissive open-weights license)",
    source: "https://ai.google.dev/gemma/terms"
  }
];

export const GEMMA_USAGES: { title: string; description: string }[] = [
  {
    title: "Orchestration via Native Function Calling",
    description: "Gemma serves as the primary workflow coordinator, evaluating high-level pipeline status and dispatching specialized tool calls (prompt synthesis, research execution, code generation) via structured function calling."
  },
  {
    title: "Screenshot Verification",
    description: "Gemma leverages its multimodal vision capabilities to inspect rendered web components, verifying responsive layout fidelity, contrast, and visual alignment directly from headless browser screenshots."
  },
  {
    title: "Attention-Gate Classification",
    description: "Before executing risky tool calls or pausing for human intervention, Gemma classifies pipeline state to determine whether human review is required (e.g., ambiguous requirements or security violations)."
  }
];
