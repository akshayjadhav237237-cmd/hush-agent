import React from 'react';
import {
  Play,
  CheckCircle2,
  PackageCheck,
  KeyRound,
  RotateCcw,
  FileSpreadsheet,
  ShieldAlert,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import { EmergencyGuardrailsCard } from './EmergencyGuardrailsCard';
import { CliReferenceTable } from './CliReferenceTable';

export const RunItYourself: React.FC = () => {
  return (
    <section
      id="run-it-yourself"
      aria-labelledby="run-it-yourself-heading"
      className="py-20 lg:py-32 border-t border-white/[0.06] bg-[#000] text-[#F5F0E8]"
    >
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-[#F5F0E8]/45 mb-4">
            [ RUN IT YOURSELF ]
          </div>

          <h2
            id="run-it-yourself-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold tracking-tight text-[#F0FFE8]"
          >
            Evaluate <span className="font-serif italic font-normal text-[#22FF6E]">Locally on Windows.</span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-[#F5F0E8]/60 leading-relaxed font-sans">
            Evaluate the orchestration loop locally on Windows. Run in simulated demo mode with synthetic desktop frames, or inspect audit logs and replay traces.
          </p>
        </div>

        {/* Quick Highlights Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          <div className="p-6 rounded-[24px] bg-[#141414] border border-white/[0.06] flex items-start gap-4">
            <div className="p-2.5 rounded-[12px] bg-white/[0.04] border border-white/[0.06] text-[#22FF6E] shrink-0">
              <Sparkles className="w-5 h-5 text-[#22FF6E]" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#F0FFE8]">
                Zero-Risk Simulation
              </h3>
              <p className="text-xs text-[#F5F0E8]/60 mt-1.5 leading-relaxed font-sans">
                <code className="font-mono text-[#22FF6E] bg-white/5 px-1 py-0.5 rounded">--demo</code> mode executes against in-memory 1280x720 mock frames without physical mouse movement.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-[24px] bg-[#141414] border border-white/[0.06] flex items-start gap-4">
            <div className="p-2.5 rounded-[12px] bg-white/[0.04] border border-white/[0.06] text-[#22FF6E] shrink-0">
              <CheckCircle2 className="w-5 h-5 text-[#22FF6E]" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#F0FFE8]">
                Tamper-Evident Audit
              </h3>
              <p className="text-xs text-[#F5F0E8]/60 mt-1.5 leading-relaxed font-sans">
                Cryptographic SHA-256 hash chaining links every event in <code className="font-mono text-[#22FF6E] bg-white/5 px-1 py-0.5 rounded">audit.jsonl</code> with automatic secret redaction.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-[24px] bg-[#141414] border border-white/[0.06] flex items-start gap-4">
            <div className="p-2.5 rounded-[12px] bg-white/[0.04] border border-white/[0.06] text-[#22FF6E] shrink-0">
              <ShieldAlert className="w-5 h-5 text-[#22FF6E]" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#F0FFE8]">
                Dual Emergency Kill
              </h3>
              <p className="text-xs text-[#F5F0E8]/60 mt-1.5 leading-relaxed font-sans">
                Global hotkey <kbd className="font-mono text-[11px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-[#F0FFE8]">Ctrl+Alt+K</kbd> (20&nbsp;Hz) and hardware corner abort at <code className="font-mono text-[#22FF6E] bg-white/5 px-1 py-0.5 rounded">(0, 0)</code>.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Step-by-Step Instructions */}
        <div className="space-y-6">
          {/* Section Subtitle */}
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
            <div>
              <h3 className="text-lg sm:text-xl font-sans font-bold text-[#F0FFE8] tracking-tight">
                Step-by-Step Evaluation Walkthrough
              </h3>
              <p className="text-xs sm:text-sm text-[#F5F0E8]/45 mt-1 font-mono">
                From dependency installation to sanitized replay export
              </p>
            </div>
            <span className="text-xs font-mono text-[#22FF6E] bg-white/[0.04] border border-white/[0.06] px-3 py-1 rounded-full">
              6 Steps
            </span>
          </div>

          {/* STEP 1 */}
          <div className="p-6 sm:p-7 rounded-[24px] bg-[#141414] border border-white/[0.06] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-[10px] bg-white/[0.04] text-xs font-mono font-bold text-[#22FF6E] border border-white/[0.06] shrink-0">
                  01
                </span>
                <h4 className="text-base font-sans font-bold text-[#F0FFE8]">
                  Install Dependencies
                </h4>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-white/[0.04] border border-white/[0.06] text-[#F5F0E8]/60 self-start sm:self-auto">
                <PackageCheck className="w-3.5 h-3.5 text-[#22FF6E]" strokeWidth={1.5} />
                <span>Python &amp; Graphify CLI</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#F5F0E8]/60 leading-relaxed font-sans">
              Clone the repository and install core runtime packages, developer test tools, and the Graphify knowledge graph CLI for codebase indexing:
            </p>

            <CodeBlock
              language="bash"
              title="Terminal / PowerShell (Dependencies)"
              code={`cd agent
pip install -r requirements.txt
pip install -r requirements-dev.txt
uv tool install graphifyy`}
              caption="requirements.txt installs google-genai, pyautogui, pyperclip, and pillow. graphifyy powers the structural graph analysis."
            />
          </div>

          {/* STEP 2 */}
          <div className="p-6 sm:p-7 rounded-[24px] bg-[#141414] border border-white/[0.06] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-[10px] bg-white/[0.04] text-xs font-mono font-bold text-[#22FF6E] border border-white/[0.06] shrink-0">
                  02
                </span>
                <h4 className="text-base font-sans font-bold text-[#F0FFE8]">
                  Configure Environment
                </h4>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-white/[0.04] border border-white/[0.06] text-[#F5F0E8]/60 self-start sm:self-auto">
                <KeyRound className="w-3.5 h-3.5 text-[#22FF6E]" strokeWidth={1.5} />
                <span>API Keys &amp; Alerts</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#F5F0E8]/60 leading-relaxed font-sans">
              Set your Gemini API key in your Windows user environment. Optionally configure an <code className="font-mono text-[#22FF6E] bg-white/5 px-1 py-0.5 rounded">ntfy.sh</code> topic for mobile push notifications when attention gates trigger human escalation:
            </p>

            <CodeBlock
              language="cmd"
              title="Windows Command Prompt / PowerShell"
              code={`# Windows Command Prompt / PowerShell
setx GEMINI_API_KEY "your-gemini-api-key"

# Optional: Push notifications via ntfy.sh
setx NTFY_TOPIC "your-private-topic"`}
              caption="setx writes environment variables permanently to your Windows user registry. Open a fresh terminal after running setx."
            />
          </div>

          {/* STEP 3 */}
          <div className="p-6 sm:p-7 rounded-[24px] bg-[#141414] border border-white/[0.06] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-[10px] bg-white/[0.04] text-xs font-mono font-bold text-[#22FF6E] border border-white/[0.06] shrink-0">
                  03
                </span>
                <h4 className="text-base font-sans font-bold text-[#F0FFE8]">
                  Run in Simulated Demo Mode
                </h4>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-white/[0.04] border border-white/[0.06] text-[#F5F0E8]/60 self-start sm:self-auto">
                <Play className="w-3.5 h-3.5 text-[#22FF6E]" strokeWidth={1.5} />
                <span>Synthetic 1280x720 Frames</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#F5F0E8]/60 leading-relaxed font-sans">
              Run against in-memory 1280x720 screens with live Gemma function calling (no real mouse movement). Hush renders synthetic application windows, writes real code into the run project folder, and simulates human answers:
            </p>

            <CodeBlock
              language="bash"
              title="Standard Demo Mode"
              code={`python orchestrator.py --demo --demo-answer "SQLite" "a todo app"`}
              caption="Executes live model function calls against synthetic in-memory screens with zero physical mouse interference."
            />

            <p className="text-xs sm:text-sm text-[#F5F0E8]/60 leading-relaxed pt-2 font-sans">
              You can also test the autonomous backoff and human notification behavior under a simulated usage limit scenario:
            </p>

            <CodeBlock
              language="bash"
              title="Demo Mode with Simulated Limit"
              code={`python orchestrator.py --demo --demo-limit --demo-answer "SQLite" "a kanban board"`}
              caption="Injects a simulated service quota limit to verify rate-limit pause countdowns and operator escalation paths."
            />
          </div>

          {/* STEP 4 */}
          <div className="p-6 sm:p-7 rounded-[24px] bg-[#141414] border border-white/[0.06] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-[10px] bg-white/[0.04] text-xs font-mono font-bold text-[#22FF6E] border border-white/[0.06] shrink-0">
                  04
                </span>
                <h4 className="text-base font-sans font-bold text-[#F0FFE8]">
                  Resume an Interrupted Run
                </h4>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-white/[0.04] border border-white/[0.06] text-[#F5F0E8]/60 self-start sm:self-auto">
                <RotateCcw className="w-3.5 h-3.5 text-[#22FF6E]" strokeWidth={1.5} />
                <span>Atomic Checkpoints</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#F5F0E8]/60 leading-relaxed font-sans">
              Atomic checkpoints allow resuming from the exact step. The orchestrator reloads the disk state, artifact ledger, and hash-verified audit log:
            </p>

            <CodeBlock
              language="bash"
              title="Resume Interrupted Session"
              code={`python orchestrator.py --resume latest`}
              caption="Finds the most recent run in runs/ directory and seamlessly continues execution from the last saved turn."
            />
          </div>

          {/* STEP 5 */}
          <div className="p-6 sm:p-7 rounded-[24px] bg-[#141414] border border-white/[0.06] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-[10px] bg-white/[0.04] text-xs font-mono font-bold text-[#22FF6E] border border-white/[0.06] shrink-0">
                  05
                </span>
                <h4 className="text-base font-sans font-bold text-[#F0FFE8]">
                  Export Sanitized Audit Replay
                </h4>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-white/[0.04] border border-white/[0.06] text-[#F5F0E8]/60 self-start sm:self-auto">
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#22FF6E]" strokeWidth={1.5} />
                <span>SHA-256 Verified JSON</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#F5F0E8]/60 leading-relaxed font-sans">
              Validate the SHA-256 tamper-evident log and export clean replay events. The export script verifies every cryptographic link in the audit chain and automatically redacts API keys, credentials, and full clipboard payloads:
            </p>

            <CodeBlock
              language="bash"
              title="Export Sanitized Replay"
              code={`python export_replay.py latest`}
              caption="Or target a specific run: python export_replay.py <run_id>. Generates a sanitized replay.json ready for inspection."
            />
          </div>

          {/* STEP 6 */}
          <div className="p-6 sm:p-7 rounded-[24px] bg-[#141414] border border-white/[0.06] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-[10px] bg-white/[0.04] text-xs font-mono font-bold text-[#22FF6E] border border-white/[0.06] shrink-0">
                  06
                </span>
                <h4 className="text-base font-sans font-bold text-[#F0FFE8]">
                  Emergency Stop Guardrails
                </h4>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-white/[0.04] border border-white/[0.06] text-[#F5F0E8]/60 self-start sm:self-auto">
                <ShieldAlert className="w-3.5 h-3.5 text-[#22FF6E]" strokeWidth={1.5} />
                <span>Operator Override</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#F5F0E8]/60 leading-relaxed font-sans">
              Two independent kill mechanisms provide hardware-level and OS-level intervention:
            </p>

            {/* Emergency Guardrails Detailed Comparison Card */}
            <EmergencyGuardrailsCard />
          </div>
        </div>

        {/* 3. CLI Options Reference Table */}
        <div className="mt-16">
          <div className="mb-4">
            <h3 className="text-xl sm:text-2xl font-sans font-bold text-[#F0FFE8] tracking-tight">
              Command-Line Reference
            </h3>
            <p className="text-xs sm:text-sm text-[#F5F0E8]/60 mt-1 leading-relaxed font-sans">
              Complete reference of orchestrator arguments, flags, and default values matching <code className="font-mono text-[#22FF6E]">agent/core/cli.py</code>.
            </p>
          </div>

          <CliReferenceTable />
        </div>

        {/* Local Reproduction Callout Footer */}
        <div className="mt-12 p-6 sm:p-7 rounded-[24px] bg-[#141414] border border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-[12px] bg-white/[0.04] border border-white/[0.06] text-[#22FF6E] shrink-0">
              <CheckCircle2 className="w-5 h-5 text-[#22FF6E]" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-sm font-sans font-bold text-[#F0FFE8]">
                Fully Tested on Windows &amp; Mock Desktops
              </h4>
              <p className="text-xs text-[#F5F0E8]/60 mt-0.5 font-sans">
                Run pytest across the test suite in <code className="font-mono text-[#22FF6E]">agent/tests/</code> to verify safety sandboxing and audit trails.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <a
              href="#safety"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] text-xs font-mono font-medium bg-white/[0.04] text-[#F5F0E8] hover:text-[#22FF6E] border border-white/[0.06] hover:border-[#22FF6E]/30 transition-colors"
            >
              <span>View Safety Guardrails</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#22FF6E]" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RunItYourself;
