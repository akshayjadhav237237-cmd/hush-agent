import React from 'react';
import {
  Terminal,
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
      className="py-20 lg:py-32 border-t border-border bg-bg text-text"
    >
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-surface-2 border border-border text-text-muted mb-4">
            <Terminal className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} aria-hidden="true" />
            <span>Local Evaluation &amp; Reproduction</span>
          </div>

          <h2
            id="run-it-yourself-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-serif tracking-tight text-text"
          >
            Run It Yourself
          </h2>

          <p className="mt-4 text-base sm:text-lg text-text-muted leading-relaxed">
            Evaluate the orchestration loop locally on Windows. Run in simulated demo mode with synthetic desktop frames, or inspect audit logs and replay traces.
          </p>
        </div>

        {/* Quick Highlights Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
          <div className="p-4 rounded-[14px] bg-surface border border-border flex items-start gap-3">
            <div className="p-2 rounded-[10px] bg-surface-2 border border-border text-accent shrink-0">
              <Sparkles className="w-4 h-4 text-accent" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-text">
                Zero-Risk Simulation
              </h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                <code className="font-mono text-text">--demo</code> mode executes against in-memory 1280x720 mock frames without physical mouse movement.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-[14px] bg-surface border border-border flex items-start gap-3">
            <div className="p-2 rounded-[10px] bg-surface-2 border border-border text-accent shrink-0">
              <CheckCircle2 className="w-4 h-4 text-success" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-text">
                Tamper-Evident Audit
              </h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Cryptographic SHA-256 hash chaining links every event in <code className="font-mono text-text">audit.jsonl</code> with automatic secret redaction.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-[14px] bg-surface border border-border flex items-start gap-3">
            <div className="p-2 rounded-[10px] bg-surface-2 border border-border text-accent shrink-0">
              <ShieldAlert className="w-4 h-4 text-accent" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-text">
                Dual Emergency Kill
              </h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Global hotkey <kbd className="font-mono text-[11px] bg-surface-2 px-1 rounded">Ctrl+Alt+K</kbd> (20&nbsp;Hz) and hardware corner abort at <code className="font-mono text-text">(0, 0)</code>.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Step-by-Step Instructions */}
        <div className="space-y-8">
          {/* Section Subtitle */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-text tracking-tight">
                Step-by-Step Evaluation Walkthrough
              </h3>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5 font-mono">
                From dependency installation to sanitized replay export
              </p>
            </div>
            <span className="text-xs font-mono text-text-muted bg-surface-2 border border-border px-2.5 py-1 rounded-full">
              6 Steps
            </span>
          </div>

          {/* STEP 1 */}
          <div className="p-5 sm:p-6 rounded-[14px] bg-surface border border-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-[8px] bg-surface-2 text-xs font-mono font-bold text-accent border border-border shrink-0">
                  01
                </span>
                <h4 className="text-base font-semibold text-text">
                  Install Dependencies
                </h4>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-surface-2 border border-border text-text-muted self-start sm:self-auto">
                <PackageCheck className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
                <span>Python &amp; Graphify CLI</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
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
          <div className="p-5 sm:p-6 rounded-[14px] bg-surface border border-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-[8px] bg-surface-2 text-xs font-mono font-bold text-accent border border-border shrink-0">
                  02
                </span>
                <h4 className="text-base font-semibold text-text">
                  Configure Environment
                </h4>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-surface-2 border border-border text-text-muted self-start sm:self-auto">
                <KeyRound className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
                <span>API Keys &amp; Alerts</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Set your Gemini API key in your Windows user environment. Optionally configure an <code className="font-mono text-text">ntfy.sh</code> topic for mobile push notifications when attention gates trigger human escalation:
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
          <div className="p-5 sm:p-6 rounded-[14px] bg-surface border border-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-[8px] bg-surface-2 text-xs font-mono font-bold text-accent border border-border shrink-0">
                  03
                </span>
                <h4 className="text-base font-semibold text-text">
                  Run in Simulated Demo Mode
                </h4>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-surface-2 border border-border text-text-muted self-start sm:self-auto">
                <Play className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
                <span>Synthetic 1280x720 Frames</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Run against in-memory 1280x720 screens with live Gemma function calling (no real mouse movement). Hush renders synthetic application windows, writes real code into the run project folder, and simulates human answers:
            </p>

            <CodeBlock
              language="bash"
              title="Standard Demo Mode"
              code={`python orchestrator.py --demo --demo-answer "SQLite" "a todo app"`}
              caption="Executes live model function calls against synthetic in-memory screens with zero physical mouse interference."
            />

            <p className="text-xs sm:text-sm text-text-muted leading-relaxed pt-2">
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
          <div className="p-5 sm:p-6 rounded-[14px] bg-surface border border-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-[8px] bg-surface-2 text-xs font-mono font-bold text-accent border border-border shrink-0">
                  04
                </span>
                <h4 className="text-base font-semibold text-text">
                  Resume an Interrupted Run
                </h4>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-surface-2 border border-border text-text-muted self-start sm:self-auto">
                <RotateCcw className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
                <span>Atomic Checkpoints</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
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
          <div className="p-5 sm:p-6 rounded-[14px] bg-surface border border-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-[8px] bg-surface-2 text-xs font-mono font-bold text-accent border border-border shrink-0">
                  05
                </span>
                <h4 className="text-base font-semibold text-text">
                  Export Sanitized Audit Replay
                </h4>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-surface-2 border border-border text-text-muted self-start sm:self-auto">
                <FileSpreadsheet className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
                <span>SHA-256 Verified JSON</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
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
          <div className="p-5 sm:p-6 rounded-[14px] bg-surface border border-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-[8px] bg-surface-2 text-xs font-mono font-bold text-accent border border-border shrink-0">
                  06
                </span>
                <h4 className="text-base font-semibold text-text">
                  Emergency Stop Guardrails
                </h4>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-surface-2 border border-border text-text-muted self-start sm:self-auto">
                <ShieldAlert className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
                <span>Operator Override</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Two independent kill mechanisms provide hardware-level and OS-level intervention:
            </p>

            {/* Emergency Guardrails Detailed Comparison Card */}
            <EmergencyGuardrailsCard />
          </div>
        </div>

        {/* 3. CLI Options Reference Table */}
        <div className="mt-16">
          <div className="mb-4">
            <h3 className="text-xl sm:text-2xl font-serif text-text tracking-tight">
              Command-Line Reference
            </h3>
            <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
              Complete reference of orchestrator arguments, flags, and default values matching <code className="font-mono text-text">agent/core/cli.py</code>.
            </p>
          </div>

          <CliReferenceTable />
        </div>

        {/* Local Reproduction Callout Footer */}
        <div className="mt-12 p-5 sm:p-6 rounded-[14px] bg-surface-2 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[10px] bg-surface border border-border text-accent shrink-0">
              <CheckCircle2 className="w-5 h-5 text-success" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text">
                Unit-Tested Suite with Simulated Desktop
              </h4>
              <p className="text-xs text-text-muted">
                Run pytest across the test suite in <code className="font-mono text-text">agent/tests/</code> to verify safety containment and audit trails.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <a
              href="#safety"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-mono font-medium bg-surface text-text hover:text-accent border border-border hover:border-accent/40 transition-colors"
            >
              <span>View Safety Guardrails</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RunItYourself;
