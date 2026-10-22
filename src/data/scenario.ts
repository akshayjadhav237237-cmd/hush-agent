import type { Step } from "@/data/types";

export const SCENARIO_STEPS: Step[] = [
  {
    id: "step-1",
    actor: "user",
    title: "User Prompt: Wedding Photographer Portfolio",
    detail: "User initiates the autonomous workflow: 'Build a portfolio site for a wedding photographer.'",
    terminal: [
      "$ prompt-input --topic 'Build a portfolio site for a wedding photographer'",
      "[User] Request submitted: Portfolio site with responsive gallery, booking flow, and testimonial showcase.",
      "[Workflow] Initializing orchestration pipeline..."
    ]
  },
  {
    id: "step-2",
    actor: "gemma",
    title: "Gemma Coordinates Research Prompt",
    detail: "Gemma evaluates the initial user request and prompts Claude to generate targeted inquiry vectors for deep industry research.",
    terminal: [
      "$ gemma-orchestrator dispatch --target claude --action synthesize-research-brief",
      "[Gemma] Formulating task context for Claude...",
      "[Claude] Formulating research directions: High-conversion gallery UX, client proofing workflows, image CDN architectures, and booking deposit models.",
      "[Gemma] Research prompt prepared for Gemini Deep Research execution."
    ]
  },
  {
    id: "step-3",
    actor: "gemini",
    title: "Gemini Deep Research Execution",
    detail: "Gemma runs Gemini Deep Research across web benchmarks, examining top photography portfolio structures, UX patterns, and technical requirements.",
    terminal: [
      "$ gemini-research query --topic 'modern wedding photography portfolio UX best practices'",
      "[Gemini Deep Research] Analyzing 40+ premier studio websites and booking conversion funnels...",
      "[Gemini Deep Research] Synthesizing findings: Lightbox masonry grid, calendar scheduling integration, client proofing portal, mobile-first responsive design.",
      "[Gemini] Research report emitted: 14 key architectural requirements identified."
    ]
  },
  {
    id: "step-4",
    actor: "claude",
    title: "Claude Synthesizes Build Specification",
    detail: "Claude digests the Gemini research report and generates a comprehensive component specification and actionable build prompt.",
    terminal: [
      "$ claude-coder plan --spec ./research-brief.json --out ./build-prompt.json",
      "[Claude] Structuring component hierarchy: HeroSection, MasonryGallery, PackageTiers, BookingModal, ContactForm.",
      "[Claude] Defining state management and styling tokens with Tailwind CSS.",
      "[Claude] Build specification emitted: ready for Antigravity engine."
    ]
  },
  {
    id: "step-5",
    actor: "antigravity",
    title: "Antigravity Round 1 Build & Gemma Screenshot Verification",
    detail: "Antigravity executes Round 1 code generation. The security allowlist intercepts an unsafe cleanup attempt (`rm -rf ./dist`), then Gemma verifies the rendered UI via screenshot inspection.",
    terminal: [
      "$ antigravity build --prompt ./build-prompt.json",
      "[Antigravity] Scaffolding React + Vite application structure...",
      "[Antigravity] Generated Hero, MasonryGallery, and BookingModal components.",
      "$ rm -rf ./dist",
      "[SECURITY GATE BLOCKED] Command rejected: 'rm -rf ./dist' is not in the safe command allowlist.",
      "[Sandbox] Falling back to safe clean: vite build --emptyOutDir",
      "[Antigravity] Production build artifact emitted in 1.48s.",
      "$ gemma-vision verify --screenshot ./preview-round-1.png",
      "[Gemma Vision] Screenshot analysis: Layout aligns with spec, masonry grid responsive, booking modal skeleton present."
    ]
  },
  {
    id: "step-6",
    actor: "claude",
    title: "Attention Gate: Ambiguous Requirement Encountered",
    detail: "Claude detects an ambiguous requirement regarding payment processing options (Stripe vs Square) and emits NEEDS_HUMAN. The pipeline pauses and alerts the human operator.",
    gate: {
      trigger: "Ambiguous requirement",
      reason: "Multiple viable booking payment options (Stripe vs Square) require human business decision",
      action: "Pipeline paused until payment provider selection is resolved"
    },
    terminal: [
      "$ claude-architect evaluate --component booking-payment",
      "[Claude] Inspecting booking checkout integration...",
      "[Claude] NEEDS_HUMAN: which payment provider should bookings use?",
      "[GATE TRIGGERED: Ambiguous requirement]",
      "[Reason] Multiple viable booking payment options (Stripe vs Square) require human business decision.",
      "[Action] Pipeline paused until payment provider selection is resolved.",
      "[Operator Alert] Notification dispatched to human supervisor."
    ]
  },
  {
    id: "step-7",
    actor: "human",
    title: "Human Operator Resolution & Gemma Final Finish",
    detail: "The human operator selects Stripe Checkout. Antigravity integrates the provider, completes Build Round 2, and Gemma certifies completion.",
    terminal: [
      "[Human Input] Selected provider: Stripe Checkout with webhooks for deposit confirmation.",
      "$ antigravity build --resume --provider stripe",
      "[Antigravity] Integrating Stripe Checkout SDK into BookingModal...",
      "[Antigravity] Round 2 compilation succeeded with 0 warnings.",
      "$ gemma-vision verify --screenshot ./preview-round-2.png",
      "[Gemma Vision] Visual check: Stripe payment drawer verified, end-to-end booking flow certified.",
      "[Gemma] Pipeline execution complete: SUCCESS."
    ]
  }
];
