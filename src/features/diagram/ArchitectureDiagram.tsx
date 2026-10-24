import React, { useState, useEffect, useId } from 'react';
import {
  Camera,
  BrainCircuit,
  Workflow,
  MonitorPlay,
  ScrollText,
  ShieldAlert,
  Play,
  Pause,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Lock
} from 'lucide-react';

export type NodeId = 'perception' | 'reasoning' | 'dispatch' | 'action' | 'audit' | 'gate';
export type ScenarioId = 'full' | 'autonomous' | 'escalation' | 'fallback';

export interface ArchitectureNode {
  id: NodeId;
  stepNumber: string;
  title: string;
  subtitle: string;
  module: string;
  category: 'perception' | 'cognition' | 'execution' | 'safety' | 'governance';
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge: string;
  badgeColor: string;
  description: string;
  responsibilities: string[];
  keyConstants: Array<{ label: string; value: string }>;
  guardrails: string[];
  samplePayload: Record<string, unknown>;
  codeSnippet: string;
  coordinates: {
    cx: number;
    cy: number;
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

const NODES: ArchitectureNode[] = [
  {
    id: 'perception',
    stepNumber: '01',
    title: 'Screenshot Perception',
    subtitle: '1280px downscaled, memory buffer',
    module: 'agent/core/vision.py & loopbreaker.py',
    category: 'perception',
    icon: Camera,
    badge: 'VISION & DHASH',
    badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-950/30',
    description:
      'Captures full-screen state into an in-memory PNG buffer downscaled to 1280px width. Maintains a sliding context window of 2 images and runs perceptual difference hashing to detect stuck loops.',
    responsibilities: [
      'Captures primary display using PyAutoGUI into in-memory PNG bytes.',
      'Downscales image to 1280px width (SHOT_WIDTH = 1280) preserving aspect ratio.',
      'Computes dhash (difference hash) to track consecutive screen variation.',
      'Executes strip_old_images() to enforce KEEP_SCREENSHOTS = 2 context budget.'
    ],
    keyConstants: [
      { label: 'SHOT_WIDTH', value: '1280 px' },
      { label: 'KEEP_SCREENSHOTS', value: '2 images' },
      { label: 'DHASH_ACT_TRIP', value: '3 identical frames' },
      { label: 'DHASH_WAIT_TRIP', value: '15 identical intervals' }
    ],
    guardrails: [
      'Memory-only buffer: Raw screenshot frames are never written to disk without explicit operator flag.',
      'Context Pruning: strip_old_images prevents model token exhaustion on long sessions.',
      'Perceptual Loop Breaker: Intercepts repetitive cycles before token waste.'
    ],
    samplePayload: {
      action: 'desktop.screenshot_png()',
      resolution: '1280x720 (scaled from 2560x1440)',
      format: 'image/png (memory buffer)',
      dhash: 'd8a49c2d1b703f8a',
      retained_in_context: 2,
      stuck_detector: 'PASS (frame_delta: +18.4%)'
    },
    codeSnippet: `# agent/core/vision.py & loopbreaker.py
png = desktop.screenshot_png()
h = dhash(png)
reason = ctx.breaker.observe(h, action_kind(previous_tool))
if reason:
    ctx.audit.log("gate", trigger="loop_breaker", reason=reason)
    reply = ctx.notifier.ask_human(f"Loop breaker alert: {reason}")
    ctx.breaker.reset()
strip_old_images(contents, keep=KEEP_SCREENSHOTS)`,
    coordinates: { cx: 170, cy: 100, x: 50, y: 42, w: 240, h: 116 }
  },
  {
    id: 'reasoning',
    stepNumber: '02',
    title: 'Model Reasoning',
    subtitle: 'Gemma 4 default / OpenAI fallback',
    module: 'agent/core/loop.py & model_client.py',
    category: 'cognition',
    icon: BrainCircuit,
    badge: 'GEMMA 4 IT',
    badgeColor: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/30',
    description:
      'Evaluates multimodal screenshot context against operator intent and system playbook. Emits structured tool calls via Google GenAI native function calling or OpenAI chat completions fallback.',
    responsibilities: [
      'Loads multimodal context with system prompt, tool schemas, and screenshot buffer.',
      'Performs generation with candidate extraction and token usage extraction.',
      'Provides automatic fallback from Google Gemma 4 to OpenAI GPT-4o if specified.',
      'Implements exponential backoff with jitter on API rate limit responses.'
    ],
    keyConstants: [
      { label: 'DEFAULT_MODEL', value: 'gemma-4-26b-a4b-it' },
      { label: 'OPENAI_MODEL', value: 'gpt-4o' },
      { label: 'MAX_STEPS_DEFAULT', value: '80 steps' },
      { label: 'CLIENT_TIMEOUT', value: '90 seconds' }
    ],
    guardrails: [
      'ModelUnavailable handler: Retries 3 times with operator prompt before clean EXIT_MODEL_FAILURE (5).',
      'Token consumption bounds: Extracts and audits prompt_tokens and completion_tokens.',
      'Tool schema validation: Guarantees function arguments conform to strict JSON schemas.'
    ],
    samplePayload: {
      provider: 'gemma',
      model: 'gemma-4-26b-a4b-it',
      step: 14,
      thought: 'Identified search bar at (640, 360). Dispatching click event to focus input.',
      function_call: {
        name: 'click',
        args: { x: 640, y: 360 }
      },
      tokens: { prompt: 2140, completion: 48 },
      duration_ms: 1084
    },
    codeSnippet: `# agent/core/loop.py
try:
    content = model.generate(contents)
except ModelUnavailable as exc:
    save_checkpoint(ctx.run_dir, ctx.state)
    for _ in range(3):
        ctx.notifier.ask_human(f"Model failed: {exc}. Retry?")
        if recovered: break
    if not recovered:
        return EXIT_MODEL_FAILURE`,
    coordinates: { cx: 520, cy: 100, x: 400, y: 42, w: 240, h: 116 }
  },
  {
    id: 'dispatch',
    stepNumber: '03',
    title: 'Tool Call Dispatch',
    subtitle: '22/23 allowlisted tools, coordinate scaling',
    module: 'agent/core/tool_registry.py & tool_schema.py',
    category: 'governance',
    icon: Workflow,
    badge: 'SCHEMA REGISTRY',
    badgeColor: 'border-amber-500/40 text-amber-400 bg-amber-950/30',
    description:
      'Routes model function calls through allowlisted schema boundaries. Scales 1280px screenshot coordinates to physical desktop resolution, verifies killswitch state, and checks permissions.',
    responsibilities: [
      'Maintains 22 standard tools (23 tools when --account-switch is enabled).',
      'Translates screenshot coordinates (x, y) into native display pixel space.',
      'Evaluates asynchronous global kill switch state (Ctrl+Alt+K) before dispatching.',
      'Rejects prohibited system calls and shell command injection patterns.'
    ],
    keyConstants: [
      { label: 'BASE_TOOL_COUNT', value: '22 tools' },
      { label: 'SWITCH_TOOL_COUNT', value: '23 tools' },
      { label: 'ALLOWED_SHELL_CMDS', value: 'git, npm, node, python, pip, dir, type, echo, mkdir, cd' },
      { label: 'BLOCKED_TOKENS', value: '&&, ||, ;, |, >, <, $, powershell -enc' }
    ],
    guardrails: [
      'Filesystem Path Confinement: All shell paths resolved against project_dir with realpath traversal check.',
      'Command Allowlist: Rejects dangerous administration tools (curl, wget, invoke-webrequest).',
      'Pre-execution Kill Switch: Polls kill event before invoking any tool handler.'
    ],
    samplePayload: {
      tool: 'click',
      input_coordinates: { x: 640, y: 360 },
      display_metrics: { screen_w: 2560, screen_h: 1440, ratio: 2.0 },
      scaled_coordinates: { x: 1280, y: 720 },
      killswitch_polled: 'CLEAR (20 Hz loop active)',
      permission_verification: 'PASSED'
    },
    codeSnippet: `# agent/core/tool_registry.py & loop.py
if ctx.kill.is_set():
    ctx.audit.log("kill", step=step, tool=tool_name)
    return EXIT_KILL

fn = registry.get(tool_name)
if fn is None:
    res_str = f"Unknown tool: {tool_name}"
else:
    res_str = str(fn(**tool_args))`,
    coordinates: { cx: 870, cy: 100, x: 750, y: 42, w: 240, h: 116 }
  },
  {
    id: 'action',
    stepNumber: '04',
    title: 'Desktop Action',
    subtitle: 'Windows API, Start menu, clipboard transfer',
    module: 'agent/core/desktop_tools.py & killswitch.py',
    category: 'execution',
    icon: MonitorPlay,
    badge: 'WIN32 DRIVER',
    badgeColor: 'border-blue-500/40 text-blue-400 bg-blue-950/30',
    description:
      'Performs real or simulated Windows OS interactions including Start menu application launches, window focus management, artifact clipboard transfers, and hardware-failsafe mouse clicks.',
    responsibilities: [
      'Executes desktop primitives via PyAutoGUI, PyGetWindow, and Pyperclip.',
      'Supports open_app, focus_window, paste_text, press_keys, click, and scroll.',
      'Streams large code and prompt artifacts directly between disk and clipboard.',
      'Tracks mouse corner movements to trigger immediate hardware failsafe aborts.'
    ],
    keyConstants: [
      { label: 'FAILSAFE_CORNER', value: '(0, 0) top-left' },
      { label: 'EXIT_FAILSAFE', value: 'Code 2' },
      { label: 'KILL_HOTKEY', value: 'Ctrl+Alt+K (polled at 20 Hz)' },
      { label: 'MAX_WAIT_TIME', value: '120 seconds' }
    ],
    guardrails: [
      'Hardware Corner Failsafe: Moving cursor to screen corner triggers PyAutoGUI FailSafeException.',
      'Emergency Abort Hotkey: Asynchronous Windows GetAsyncKeyState thread intercepts running actions.',
      'Artifact Clipboard Guard: Bypasses model text injection token limits safely.'
    ],
    samplePayload: {
      action_type: 'pyautogui.click',
      target: { x: 1280, y: 720 },
      focused_window_title: 'Visual Studio Code',
      clipboard_buffer_length: 3120,
      failsafe_corner_detected: false,
      hardware_response_time_ms: 68
    },
    codeSnippet: `# agent/core/desktop_tools.py
try:
    pyautogui.click(scaled_x, scaled_y)
except BaseException as exc:
    if is_failsafe(exc):
        ctx.audit.log("failsafe_abort")
        return EXIT_FAILSAFE
    res_str = f"ERROR: {redact(str(exc))}"`,
    coordinates: { cx: 870, cy: 410, x: 750, y: 352, w: 240, h: 116 }
  },
  {
    id: 'audit',
    stepNumber: '05',
    title: 'Audit Logging',
    subtitle: 'SHA-256 chained JSONL, secret redaction',
    module: 'agent/core/audit.py & checkpoint.py',
    category: 'safety',
    icon: ScrollText,
    badge: 'SHA-256 CHAIN',
    badgeColor: 'border-purple-500/40 text-purple-400 bg-purple-950/30',
    description:
      'Appends tamper-evident, cryptographically chained JSONL events with secret scrubbing. Each line incorporates the SHA-256 hash of the preceding line, paired with atomic state checkpointing.',
    responsibilities: [
      'Records model text, function calls, tool results, and screenshot perceptual hashes.',
      'Calculates SHA-256 hash chain: current record links to previous record via prev hash.',
      'Redacts Google API keys (AIza...), OpenAI keys (sk-...), and authorization headers.',
      'Persists atomic run checkpoints to disk for fault-tolerant session resume.'
    ],
    keyConstants: [
      { label: 'LOG_FILE', value: 'audit.jsonl' },
      { label: 'CHAIN_ALGORITHM', value: 'SHA-256 cryptographic chain' },
      { label: 'SCRUBBED_PATTERNS', value: 'AIza..., sk-..., ghp_..., Bearer ...' },
      { label: 'VERIFICATION_TOOL', value: 'verify_chain()' }
    ],
    guardrails: [
      'Cryptographic Tamper-Evidence: Any retroactive line modification invalidates the SHA-256 chain.',
      'Automated Secret Redaction: Strips API credentials before appending to permanent disk logs.',
      'Atomic Checkpoints: Serializes RunState to disk on every step boundary.'
    ],
    samplePayload: {
      step: 14,
      event: 'tool_result',
      tool: 'click',
      result: 'success',
      redacted: true,
      prev_hash: '5f9b31d8e09a341c2b5e78a694d80214a1e9c70281b379015c7e1239aa2f567b',
      sha256: '9a8d42c7103f19e48b52c00a6e382d5f81249b6743c9812e47209da34bc98120',
      timestamp: '2026-10-24T12:04:18.892Z'
    },
    codeSnippet: `# agent/core/audit.py
def log(self, event: str, **kwargs) -> dict:
    payload = {"event": event, "step": self.step, **kwargs}
    scrubbed = redact_dict(payload)
    current_hash = hashlib.sha256(
        f"{self.prev_hash}:{json.dumps(scrubbed)}".encode()
    ).hexdigest()
    scrubbed["prev"] = self.prev_hash
    self.prev_hash = current_hash
    self.file.write(json.dumps(scrubbed) + "\\n")`,
    coordinates: { cx: 520, cy: 410, x: 400, y: 352, w: 240, h: 116 }
  },
  {
    id: 'gate',
    stepNumber: '06',
    title: 'Human Attention Gate',
    subtitle: 'console / ntfy push, triggers on unrecoverable blocks',
    module: 'agent/core/notify.py & limits.py',
    category: 'governance',
    icon: ShieldAlert,
    badge: 'OPERATOR GATE',
    badgeColor: 'border-rose-500/40 text-rose-400 bg-rose-950/30',
    description:
      'Intercepts privileged operations, ambiguous tasks, rate limits, loop breaker alerts, or repeated model failures. Prompts the operator via interactive terminal and optional ntfy.sh push notifications.',
    responsibilities: [
      'Escalates when the model explicitly calls notify_human(message).',
      'Intercepts unrecoverable 3x ModelUnavailable exceptions before halting.',
      'Handles rate limit backoff countdowns and optional Chrome profile account switching.',
      'Dispatches instant push alerts via ntfy.sh when configured in environment.'
    ],
    keyConstants: [
      { label: 'INTERACTION_CHANNELS', value: 'Terminal CLI & ntfy.sh push' },
      { label: 'SWITCH_CONFIRMATION', value: '"I UNDERSTAND" explicit prompt' },
      { label: 'ACCOUNT_COOLDOWN', value: '120.0 seconds' },
      { label: 'MAX_ACCOUNT_SWITCHES', value: '2 per task' }
    ],
    guardrails: [
      'Deterministic Halt: Freezes autonomous execution timer while awaiting operator response.',
      'Consent Requirement: Account switching strictly blocked without interactive typing of "I UNDERSTAND".',
      'Mobile Operator Awareness: Push notifications allow long-running operations away from desk.'
    ],
    samplePayload: {
      gate_status: 'TRIGGERED_ATTENTION_GATE',
      trigger_source: 'report_limit(app="Claude", minutes_until_reset=45)',
      channels: ['cli_interactive_prompt', 'ntfy_push: https://ntfy.sh/hush-demo'],
      operator_prompt: 'Claude 5h message limit reached. Switch to Chrome Profile 2? [y/N]',
      consent_token: 'I UNDERSTAND',
      system_state: 'PAUSED_AT_CHECKPOINT_STEP_14'
    },
    codeSnippet: `# agent/core/notify.py & loop.py
if tool_name == "notify_human":
    message = str(tool_args.get("message", ""))
    answer = ctx.notifier.ask_human(message)
    if ctx.audit:
        ctx.audit.log("human_reply", reply=redact(answer))
    return types.Part.from_text(f"Operator instruction: {answer}")`,
    coordinates: { cx: 170, cy: 410, x: 50, y: 352, w: 240, h: 116 }
  }
];

export const ArchitectureDiagram: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<NodeId>('perception');
  const [hoveredNodeId, setHoveredNodeId] = useState<NodeId | null>(null);
  const [activeScenario, setActiveScenario] = useState<ScenarioId>('full');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'overview' | 'guardrails' | 'payload' | 'code'>('overview');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  const filterId = useId();

  // Detect prefers-reduced-motion media query
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const activeNode = NODES.find((n) => n.id === selectedNodeId) || NODES[0];
  const highlightedNodeId = hoveredNodeId || selectedNodeId;

  // Connection path helpers
  const isPathActive = (from: NodeId, to: NodeId): boolean => {
    if (activeScenario === 'full') return true;
    if (activeScenario === 'autonomous') {
      return (
        (from === 'perception' && to === 'reasoning') ||
        (from === 'reasoning' && to === 'dispatch') ||
        (from === 'dispatch' && to === 'action') ||
        (from === 'action' && to === 'audit') ||
        (from === 'audit' && to === 'perception')
      );
    }
    if (activeScenario === 'escalation') {
      return (
        (from === 'action' && to === 'audit') ||
        (from === 'audit' && to === 'gate') ||
        (from === 'gate' && to === 'perception') ||
        (from === 'perception' && to === 'reasoning')
      );
    }
    if (activeScenario === 'fallback') {
      return (
        (from === 'reasoning' && to === 'gate') ||
        (from === 'gate' && to === 'reasoning')
      );
    }
    return true;
  };

  const isNodeHighlighted = (id: NodeId): boolean => {
    if (highlightedNodeId === id) return true;
    if (activeScenario === 'autonomous') {
      return id !== 'gate';
    }
    if (activeScenario === 'escalation') {
      return id === 'audit' || id === 'gate' || id === 'perception';
    }
    if (activeScenario === 'fallback') {
      return id === 'reasoning' || id === 'gate';
    }
    return false;
  };

  return (
    <section
      id="architecture-diagram"
      aria-label="The Autonomous Loop Lifecycle Architecture"
      className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 max-w-[1240px] mx-auto w-full space-y-10"
    >
      {/* Header Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-medium tracking-wider border border-accent/30 bg-accent/10 text-accent">
          <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
          <span>[ ARCHITECTURE FLOW ]</span>
        </div>

        {/* Section Title */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif tracking-tight text-text">
          The Autonomous <span className="italic font-normal">Loop Lifecycle.</span>
        </h2>

        {/* Subhead */}
        <p className="text-sm sm:text-base md:text-lg text-text-muted leading-relaxed max-w-2xl mx-auto">
          Deterministic cycle connecting visual perception, model reasoning, tool execution, tamper-evident audit logging, and human attention gating.
        </p>

        {/* Controls Toolbar: Scenarios, Play/Pause, Speed */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          {/* Scenario Filter Pills */}
          <div className="inline-flex flex-wrap items-center p-1 rounded-xl bg-surface-2 border border-border text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveScenario('full')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeScenario === 'full'
                  ? 'bg-surface text-text shadow-sm border border-border font-semibold'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Full 6-Node Lifecycle
            </button>
            <button
              type="button"
              onClick={() => setActiveScenario('autonomous')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeScenario === 'autonomous'
                  ? 'bg-surface text-text shadow-sm border border-border font-semibold'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Autonomous Fast Loop (1-5-1)
            </button>
            <button
              type="button"
              onClick={() => setActiveScenario('escalation')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeScenario === 'escalation'
                  ? 'bg-surface text-text shadow-sm border border-border font-semibold'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Attention Gate Escalation
            </button>
            <button
              type="button"
              onClick={() => setActiveScenario('fallback')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeScenario === 'fallback'
                  ? 'bg-surface text-text shadow-sm border border-border font-semibold'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Model Failure Recovery
            </button>
          </div>

          {/* Animation & Speed Controls */}
          <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-surface-2 border border-border text-xs">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-surface text-text-muted hover:text-text transition-colors"
              title={isPlaying ? 'Pause flow animation' : 'Resume flow animation'}
              aria-label={isPlaying ? 'Pause flow animation' : 'Resume flow animation'}
            >
              {isPlaying && !prefersReducedMotion ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-accent" />
                  <span className="font-mono">Live</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-text-muted" />
                  <span className="font-mono">Paused</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setPlaybackSpeed((s) => (s === 1 ? 2 : 1))}
              disabled={!isPlaying || prefersReducedMotion}
              className={`px-2 py-1.5 rounded-lg font-mono transition-colors ${
                playbackSpeed === 2
                  ? 'bg-accent/20 text-accent font-semibold'
                  : 'text-text-muted hover:text-text'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              title="Toggle playback speed"
            >
              {playbackSpeed}x
            </button>

            {prefersReducedMotion && (
              <span className="text-[10px] font-mono text-amber-400 px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-800/40">
                Reduced Motion Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Interactive Dark Panel */}
      <div className="bg-[#141414] border border-border rounded-[24px] p-5 sm:p-7 lg:p-9 shadow-2xl relative overflow-hidden">
        {/* Subtle Ambient Radial Lighting */}
        <div
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-accent/10 blur-[120px] rounded-full"
          aria-hidden="true"
        />

        {/* Panel Top Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-[#272624] text-xs">
          <div className="flex items-center gap-2 text-text-muted font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-text font-semibold">ORCHESTRATION PIPELINE</span>
            <span className="text-border">|</span>
            <span>Loop Frequency: Event-driven</span>
            <span className="text-border">|</span>
            <span>Max Steps: 80</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-text-muted text-xs hidden sm:inline">Active Stage:</span>
            <span className="font-mono px-2.5 py-1 rounded-full bg-surface-2 border border-border text-accent text-xs">
              {activeNode.stepNumber} - {activeNode.title}
            </span>
          </div>
        </div>

        {/* Interactive Inline SVG Diagram */}
        <div className="py-6 sm:py-8 w-full overflow-x-auto">
          <div className="min-w-[860px] max-w-[1040px] mx-auto">
            <svg
              viewBox="0 0 1040 520"
              className="w-full h-auto select-none overflow-visible"
              aria-label="Interactive architecture flow diagram showing 6 connected nodes"
              role="img"
            >
              <defs>
                {/* Flow Dot CSS Animation Styles */}
                <style>{`
                  @keyframes flowDotForward {
                    0% { stroke-dashoffset: 80; }
                    100% { stroke-dashoffset: 0; }
                  }
                  @keyframes flowDotBackward {
                    0% { stroke-dashoffset: -80; }
                    100% { stroke-dashoffset: 0; }
                  }
                  .flow-dot-stream {
                    stroke-dasharray: 8 32;
                    animation: flowDotForward ${2.4 / playbackSpeed}s linear infinite;
                  }
                  .flow-dot-stream-reverse {
                    stroke-dasharray: 8 32;
                    animation: flowDotBackward ${2.4 / playbackSpeed}s linear infinite;
                  }
                  @media (prefers-reduced-motion: reduce) {
                    .flow-dot-stream,
                    .flow-dot-stream-reverse {
                      animation: none !important;
                      stroke-dashoffset: 0 !important;
                      stroke-dasharray: none !important;
                    }
                  }
                `}</style>

                {/* Subtle Grid Pattern */}
                <pattern id={`grid-${filterId}`} width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="#222220" />
                </pattern>

                {/* Node Gradients */}
                <linearGradient id={`grad-card-${filterId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1E1E1C" />
                  <stop offset="100%" stopColor="#161615" />
                </linearGradient>

                <linearGradient id={`grad-active-${filterId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#252F29" />
                  <stop offset="100%" stopColor="#181D1A" />
                </linearGradient>

                {/* Arrowhead Markers */}
                <marker
                  id={`arrow-accent-${filterId}`}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#7FB59D" />
                </marker>

                <marker
                  id={`arrow-amber-${filterId}`}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#E3B15C" />
                </marker>

                <marker
                  id={`arrow-muted-${filterId}`}
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#3D3C38" />
                </marker>
              </defs>

              {/* Background Grid Layer */}
              <rect
                x="10"
                y="10"
                width="1020"
                height="500"
                rx="20"
                fill={`url(#grid-${filterId})`}
                stroke="#1F1F1D"
                strokeWidth="1"
              />

              {/* Central Architecture Loop Label */}
              <g className="pointer-events-none select-none">
                <rect
                  x="410"
                  y="238"
                  width="220"
                  height="44"
                  rx="10"
                  fill="#181817"
                  stroke="#272624"
                  strokeWidth="1"
                />
                <text
                  x="520"
                  y="256"
                  textAnchor="middle"
                  fill="#9A988F"
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                  letterSpacing="0.08em"
                >
                  AUTONOMOUS STATE BUS
                </text>
                <text
                  x="520"
                  y="272"
                  textAnchor="middle"
                  fill="#7FB59D"
                  fontSize="9"
                  fontFamily="var(--font-mono)"
                >
                  SHA-256 Chained Execution
                </text>
              </g>

              {/* ================= SVG CONNECTOR PATHS ================= */}

              {/* 1. Path: Node 1 (Perception) -> Node 2 (Model Reasoning) */}
              <g id="conn-1-2" className="transition-opacity duration-300">
                <path
                  d="M 290 100 L 400 100"
                  fill="none"
                  stroke={isPathActive('perception', 'reasoning') ? '#2B4C3F' : '#222220'}
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  markerEnd={`url(#${isPathActive('perception', 'reasoning') ? `arrow-accent-${filterId}` : `arrow-muted-${filterId}`})`}
                />
                {isPlaying && !prefersReducedMotion && isPathActive('perception', 'reasoning') && (
                  <path
                    d="M 290 100 L 400 100"
                    fill="none"
                    stroke="#7FB59D"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="flow-dot-stream"
                  />
                )}
                {/* Connector Label */}
                <rect x="315" y="80" width="60" height="16" rx="4" fill="#141414" stroke="#272624" strokeWidth="0.75" />
                <text x="345" y="91" textAnchor="middle" fill="#9A988F" fontSize="8" fontFamily="var(--font-mono)">
                  1280px PNG
                </text>
              </g>

              {/* 2. Path: Node 2 (Reasoning) -> Node 3 (Tool Dispatch) */}
              <g id="conn-2-3" className="transition-opacity duration-300">
                <path
                  d="M 640 100 L 750 100"
                  fill="none"
                  stroke={isPathActive('reasoning', 'dispatch') ? '#2B4C3F' : '#222220'}
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  markerEnd={`url(#${isPathActive('reasoning', 'dispatch') ? `arrow-accent-${filterId}` : `arrow-muted-${filterId}`})`}
                />
                {isPlaying && !prefersReducedMotion && isPathActive('reasoning', 'dispatch') && (
                  <path
                    d="M 640 100 L 750 100"
                    fill="none"
                    stroke="#7FB59D"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="flow-dot-stream"
                  />
                )}
                <rect x="662" y="80" width="68" height="16" rx="4" fill="#141414" stroke="#272624" strokeWidth="0.75" />
                <text x="696" y="91" textAnchor="middle" fill="#9A988F" fontSize="8" fontFamily="var(--font-mono)">
                  FunctionCall
                </text>
              </g>

              {/* 3. Path: Node 3 (Tool Dispatch) -> Node 4 (Desktop Action) */}
              <g id="conn-3-4" className="transition-opacity duration-300">
                <path
                  d="M 870 158 L 870 352"
                  fill="none"
                  stroke={isPathActive('dispatch', 'action') ? '#2B4C3F' : '#222220'}
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  markerEnd={`url(#${isPathActive('dispatch', 'action') ? `arrow-accent-${filterId}` : `arrow-muted-${filterId}`})`}
                />
                {isPlaying && !prefersReducedMotion && isPathActive('dispatch', 'action') && (
                  <path
                    d="M 870 158 L 870 352"
                    fill="none"
                    stroke="#7FB59D"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="flow-dot-stream"
                  />
                )}
                <rect x="880" y="246" width="94" height="26" rx="5" fill="#141414" stroke="#272624" strokeWidth="0.75" />
                <text x="927" y="258" textAnchor="middle" fill="#9A988F" fontSize="8" fontFamily="var(--font-mono)">
                  Scaled Coordinates
                </text>
                <text x="927" y="268" textAnchor="middle" fill="#7FB59D" fontSize="7.5" fontFamily="var(--font-mono)">
                  (1280 to Display)
                </text>
              </g>

              {/* 4. Path: Node 4 (Desktop Action) -> Node 5 (Audit Logging) */}
              <g id="conn-4-5" className="transition-opacity duration-300">
                <path
                  d="M 750 410 L 640 410"
                  fill="none"
                  stroke={isPathActive('action', 'audit') ? '#2B4C3F' : '#222220'}
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  markerEnd={`url(#${isPathActive('action', 'audit') ? `arrow-accent-${filterId}` : `arrow-muted-${filterId}`})`}
                />
                {isPlaying && !prefersReducedMotion && isPathActive('action', 'audit') && (
                  <path
                    d="M 750 410 L 640 410"
                    fill="none"
                    stroke="#7FB59D"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="flow-dot-stream"
                  />
                )}
                <rect x="662" y="392" width="66" height="16" rx="4" fill="#141414" stroke="#272624" strokeWidth="0.75" />
                <text x="695" y="403" textAnchor="middle" fill="#9A988F" fontSize="8" fontFamily="var(--font-mono)">
                  Tool Result
                </text>
              </g>

              {/* 5. Path: Node 5 (Audit Logging) -> Node 6 (Human Attention Gate) */}
              <g id="conn-5-6" className="transition-opacity duration-300">
                <path
                  d="M 400 410 L 290 410"
                  fill="none"
                  stroke={isPathActive('audit', 'gate') ? '#B7791F' : '#222220'}
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  markerEnd={`url(#${isPathActive('audit', 'gate') ? `arrow-amber-${filterId}` : `arrow-muted-${filterId}`})`}
                />
                {isPlaying && !prefersReducedMotion && isPathActive('audit', 'gate') && (
                  <path
                    d="M 400 410 L 290 410"
                    fill="none"
                    stroke="#E3B15C"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="flow-dot-stream"
                  />
                )}
                <rect x="310" y="392" width="70" height="26" rx="5" fill="#141414" stroke="#3D2E14" strokeWidth="0.75" />
                <text x="345" y="403" textAnchor="middle" fill="#E3B15C" fontSize="8" fontFamily="var(--font-mono)">
                  Escalation
                </text>
                <text x="345" y="414" textAnchor="middle" fill="#9A988F" fontSize="7.5" fontFamily="var(--font-mono)">
                  Block / Limit
                </text>
              </g>

              {/* 6. Path: Node 6 (Human Attention Gate) -> Node 1 (Perception) [Resolution loop] */}
              <g id="conn-6-1" className="transition-opacity duration-300">
                <path
                  d="M 170 352 L 170 158"
                  fill="none"
                  stroke={isPathActive('gate', 'perception') ? '#7FB59D' : '#222220'}
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  markerEnd={`url(#${isPathActive('gate', 'perception') ? `arrow-accent-${filterId}` : `arrow-muted-${filterId}`})`}
                />
                {isPlaying && !prefersReducedMotion && isPathActive('gate', 'perception') && (
                  <path
                    d="M 170 352 L 170 158"
                    fill="none"
                    stroke="#7FB59D"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="flow-dot-stream-reverse"
                  />
                )}
                <rect x="68" y="246" width="94" height="26" rx="5" fill="#141414" stroke="#272624" strokeWidth="0.75" />
                <text x="115" y="258" textAnchor="middle" fill="#7FB59D" fontSize="8" fontFamily="var(--font-mono)">
                  Operator Input
                </text>
                <text x="115" y="268" textAnchor="middle" fill="#9A988F" fontSize="7.5" fontFamily="var(--font-mono)">
                  Resume Execution
                </text>
              </g>

              {/* 7. Autonomous Return Bus: Node 5 (Audit) -> Node 1 (Perception) [Bypasses human gate when clear] */}
              <g id="conn-5-1-autonomous" className="transition-opacity duration-300">
                <path
                  d="M 500 352 C 500 240, 260 250, 260 158"
                  fill="none"
                  stroke={isPathActive('audit', 'perception') ? '#2B4C3F' : '#1C1C1A'}
                  strokeWidth="1.75"
                  strokeDasharray="3 3"
                  markerEnd={`url(#${isPathActive('audit', 'perception') ? `arrow-accent-${filterId}` : `arrow-muted-${filterId}`})`}
                />
                {isPlaying && !prefersReducedMotion && isPathActive('audit', 'perception') && (
                  <path
                    d="M 500 352 C 500 240, 260 250, 260 158"
                    fill="none"
                    stroke="#7FB59D"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="flow-dot-stream-reverse"
                  />
                )}
                <rect x="300" y="210" width="102" height="18" rx="4" fill="#141414" stroke="#2B4C3F" strokeWidth="0.75" />
                <text x="351" y="222" textAnchor="middle" fill="#7FB59D" fontSize="7.5" fontFamily="var(--font-mono)">
                  Next Loop (Unattended)
                </text>
              </g>

              {/* 8. Fallback / Direct Escalation from Model Reasoning to Gate */}
              {activeScenario === 'fallback' && (
                <g id="conn-2-6-fallback">
                  <path
                    d="M 450 158 C 450 250, 230 250, 230 352"
                    fill="none"
                    stroke="#E5776B"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    markerEnd={`url(#arrow-amber-${filterId})`}
                  />
                  {isPlaying && !prefersReducedMotion && (
                    <path
                      d="M 450 158 C 450 250, 230 250, 230 352"
                      fill="none"
                      stroke="#E5776B"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      className="flow-dot-stream"
                    />
                  )}
                  <rect x="290" y="270" width="106" height="18" rx="4" fill="#1E1414" stroke="#682420" strokeWidth="0.75" />
                  <text x="343" y="282" textAnchor="middle" fill="#E5776B" fontSize="7.5" fontFamily="var(--font-mono)">
                    3x ModelUnavailable Retry
                  </text>
                </g>
              )}

              {/* ================= SVG CORE NODES (6 NODES) ================= */}
              {NODES.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isHovered = hoveredNodeId === node.id;
                const isHighlighted = isNodeHighlighted(node.id);

                return (
                  <g
                    key={node.id}
                    id={`node-${node.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedNodeId(node.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedNodeId(node.id);
                      }
                    }}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    className="cursor-pointer transition-transform duration-200 focus:outline-none"
                    style={{
                      transformOrigin: `${node.coordinates.cx}px ${node.coordinates.cy}px`
                    }}
                  >
                    {/* Active Selection Glow Ring */}
                    {isSelected && (
                      <rect
                        x={node.coordinates.x - 4}
                        y={node.coordinates.y - 4}
                        width={node.coordinates.w + 8}
                        height={node.coordinates.h + 8}
                        rx="20"
                        fill="none"
                        stroke="#7FB59D"
                        strokeWidth="1.5"
                        strokeOpacity="0.8"
                        strokeDasharray="4 4"
                      />
                    )}

                    {/* Node Container Card */}
                    <rect
                      x={node.coordinates.x}
                      y={node.coordinates.y}
                      width={node.coordinates.w}
                      height={node.coordinates.h}
                      rx="16"
                      fill={isSelected ? `url(#grad-active-${filterId})` : `url(#grad-card-${filterId})`}
                      stroke={isSelected ? '#7FB59D' : isHovered ? '#474642' : '#272624'}
                      strokeWidth={isSelected ? '2' : '1'}
                      className="transition-colors duration-200"
                    />

                    {/* Step Number Pill */}
                    <rect
                      x={node.coordinates.x + 14}
                      y={node.coordinates.y + 14}
                      width="26"
                      height="20"
                      rx="6"
                      fill={isSelected ? '#2B4C3F' : '#1F1F1D'}
                      stroke={isSelected ? '#7FB59D' : '#333230'}
                      strokeWidth="1"
                    />
                    <text
                      x={node.coordinates.x + 27}
                      y={node.coordinates.y + 28}
                      textAnchor="middle"
                      fill={isSelected ? '#FFFFFF' : '#9A988F'}
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                      fontWeight="bold"
                    >
                      {node.stepNumber}
                    </text>

                    {/* Category / Module Mini Badge */}
                    <text
                      x={node.coordinates.x + 48}
                      y={node.coordinates.y + 28}
                      fill={isSelected ? '#7FB59D' : '#6B6A63'}
                      fontSize="9"
                      fontFamily="var(--font-mono)"
                      letterSpacing="0.05em"
                    >
                      {node.badge}
                    </text>

                    {/* Active Status Pulse Indicator */}
                    <circle
                      cx={node.coordinates.x + node.coordinates.w - 18}
                      cy={node.coordinates.y + 24}
                      r={isSelected ? 4 : 3}
                      fill={isSelected ? '#7FB59D' : isHighlighted ? '#E3B15C' : '#444340'}
                    />
                    {isSelected && (
                      <circle
                        cx={node.coordinates.x + node.coordinates.w - 18}
                        cy={node.coordinates.y + 24}
                        r="7"
                        fill="none"
                        stroke="#7FB59D"
                        strokeWidth="1"
                        opacity="0.6"
                      />
                    )}

                    {/* Node Title */}
                    <text
                      x={node.coordinates.x + 14}
                      y={node.coordinates.y + 60}
                      fill="#F2F1EC"
                      fontSize="13"
                      fontFamily="var(--font-sans)"
                      fontWeight="600"
                    >
                      {node.title}
                    </text>

                    {/* Node Subtitle Line 1 */}
                    <text
                      x={node.coordinates.x + 14}
                      y={node.coordinates.y + 80}
                      fill="#9A988F"
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                    >
                      {node.subtitle.split(',')[0]}
                    </text>

                    {/* Node Subtitle Line 2 */}
                    <text
                      x={node.coordinates.x + 14}
                      y={node.coordinates.y + 96}
                      fill="#6B6A63"
                      fontSize="9.5"
                      fontFamily="var(--font-mono)"
                    >
                      {node.subtitle.split(',')[1] || ''}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Quick Node Selector Tabs */}
        <div className="pt-4 pb-2 border-t border-[#272624]">
          <div className="text-xs font-mono text-text-muted mb-3 flex items-center justify-between">
            <span>INSPECT STAGE METADATA &amp; CONTRACTS:</span>
            <span className="text-[11px] text-accent">Click node in diagram or tab below</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {NODES.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const NodeIcon = node.icon;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`flex flex-col text-left p-2.5 rounded-xl border text-xs transition-all ${
                    isSelected
                      ? 'bg-surface-2 border-accent text-text shadow-sm ring-1 ring-accent'
                      : 'bg-[#181817] border-[#272624] text-text-muted hover:border-[#3D3C38] hover:text-text'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center gap-1.5">
                      <NodeIcon className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
                      <span className="font-mono text-[10px] text-accent font-semibold">{node.stepNumber}</span>
                    </div>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-accent' : 'bg-[#3D3C38]'}`}
                    />
                  </div>
                  <span className="font-semibold truncate text-[11px] text-text">{node.title}</span>
                  <span className="text-[10px] text-text-muted truncate font-mono">{node.module.split('/')[2]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= INTERACTIVE NODE INSPECTOR CARD ================= */}
        <div className="mt-6 rounded-2xl bg-[#181817] border border-[#272624] p-5 sm:p-7">
          {/* Card Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#272624]">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-accent/20 text-accent border border-accent/40">
                  STAGE {activeNode.stepNumber}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${activeNode.badgeColor}`}>
                  {activeNode.badge}
                </span>
                <span className="text-xs text-text-muted font-mono">{activeNode.module}</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-semibold text-text tracking-tight flex items-center gap-2">
                {React.createElement(activeNode.icon, { className: 'w-5 h-5 text-accent', strokeWidth: 1.5 })}
                <span>{activeNode.title}</span>
                <span className="text-sm font-normal text-text-muted font-mono hidden sm:inline">({activeNode.subtitle})</span>
              </h3>
            </div>

            {/* Inspector Detail Sub-tabs */}
            <div className="inline-flex items-center p-1 rounded-xl bg-[#121211] border border-[#272624] text-xs font-mono self-start md:self-auto">
              <button
                type="button"
                onClick={() => setActiveInspectorTab('overview')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeInspectorTab === 'overview'
                    ? 'bg-[#222220] text-accent font-semibold'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveInspectorTab('guardrails')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeInspectorTab === 'guardrails'
                    ? 'bg-[#222220] text-accent font-semibold'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Guardrails
              </button>
              <button
                type="button"
                onClick={() => setActiveInspectorTab('payload')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeInspectorTab === 'payload'
                    ? 'bg-[#222220] text-accent font-semibold'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Sample Payload
              </button>
              <button
                type="button"
                onClick={() => setActiveInspectorTab('code')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeInspectorTab === 'code'
                    ? 'bg-[#222220] text-accent font-semibold'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Implementation
              </button>
            </div>
          </div>

          {/* Card Body by Selected Sub-tab */}
          <div className="pt-5">
            {/* 1. OVERVIEW TAB */}
            {activeInspectorTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <p className="text-sm sm:text-base text-text leading-relaxed">
                    {activeNode.description}
                  </p>

                  <div className="space-y-2">
                    <span className="text-xs font-mono text-text-muted uppercase tracking-wider block">
                      Core Responsibilities in Autonomous Loop:
                    </span>
                    <ul className="space-y-2 text-xs sm:text-sm text-text">
                      {activeNode.responsibilities.map((resp, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Key Codebase Constants Box */}
                <div className="bg-[#121211] border border-[#272624] rounded-xl p-4 space-y-3">
                  <span className="text-xs font-mono text-text-muted uppercase tracking-wider block">
                    Constants Quoted from Code:
                  </span>
                  <div className="space-y-2.5">
                    {activeNode.keyConstants.map((c, idx) => (
                      <div key={idx} className="text-xs font-mono border-b border-[#222220] pb-2 last:border-0 last:pb-0">
                        <span className="text-text-muted block text-[10px]">{c.label}</span>
                        <span className="text-accent font-semibold break-all">{c.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. GUARDRAILS TAB */}
            {activeInspectorTab === 'guardrails' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>SAFETY CONTAINMENT &amp; POLICY CONTROLS</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {activeNode.guardrails.map((guard, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#121211] border border-[#272624] space-y-2 text-xs"
                    >
                      <div className="flex items-center gap-2 font-mono text-text font-semibold">
                        <Lock className="w-3.5 h-3.5 text-accent" />
                        <span>Policy Check #{idx + 1}</span>
                      </div>
                      <p className="text-text-muted leading-relaxed">{guard}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. SAMPLE PAYLOAD TAB */}
            {activeInspectorTab === 'payload' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-text-muted">
                  <span>TELEMETRY &amp; DATA CONTRACT SNAPSHOT</span>
                  <span className="text-[11px] text-accent">JSON / Memory Buffer</span>
                </div>
                <div className="bg-[#0C0C0B] border border-[#272624] rounded-xl p-4 font-mono text-xs text-text overflow-x-auto leading-relaxed">
                  <pre className="text-emerald-400/90 whitespace-pre">
                    {JSON.stringify(activeNode.samplePayload, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* 4. CODE IMPLEMENTATION TAB */}
            {activeInspectorTab === 'code' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-text-muted">
                  <span>ORCHESTRATOR CORE EXTRACT</span>
                  <span className="text-[11px] text-text-muted">{activeNode.module}</span>
                </div>
                <div className="bg-[#0C0C0B] border border-[#272624] rounded-xl p-4 font-mono text-xs text-text overflow-x-auto leading-relaxed">
                  <pre className="text-cyan-300/90 whitespace-pre">
                    {activeNode.codeSnippet}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panel Footer Legend */}
        <div className="mt-6 pt-4 border-t border-[#272624] flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-text-muted">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              <span>Autonomous Flow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Human Attention Gate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6B6A63]" />
              <span>State Audit Link</span>
            </div>
          </div>

          <div className="text-[11px] text-text-muted">
            Emergency Override: <code className="text-text font-bold px-1.5 py-0.5 rounded bg-surface-2 border border-border">Ctrl+Alt+K</code> (20 Hz Polling)
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureDiagram;
