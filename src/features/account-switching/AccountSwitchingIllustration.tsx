import React from 'react';
import {
  UserCheck,
  AlertTriangle,
  Lock,
  Terminal,
  Clock,
  RotateCw,
  FolderTree,
  Ban,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';

export const AccountSwitchingIllustration: React.FC = () => {
  const cautionNoticeText =
    'Switching between accounts to work around usage limits may violate the terms of the services involved and could get those accounts restricted. Use only your own accounts. Hush never stores or types passwords.';

  return (
    <section
      id="account-switching"
      aria-labelledby="account-switching-heading"
      className="py-20 lg:py-32 border-t border-border bg-bg text-text"
    >
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-surface-2 border border-border text-text-muted">
              <UserCheck className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} aria-hidden="true" />
              <span>Rate Limit Management</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-surface border border-border text-text-muted tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" aria-hidden="true" />
              <span>ARCHITECTURAL ILLUSTRATION &bull; NON-INTERACTIVE</span>
            </div>
          </div>

          <h2
            id="account-switching-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-serif tracking-tight text-text"
          >
            Multi-Profile Account Switching
          </h2>
          <p className="mt-4 text-base sm:text-lg text-text-muted leading-relaxed">
            How Hush routes between authenticated Chrome profiles when rate limits occur, guarded by strict operational cooldowns and explicit user consent.
          </p>
        </div>

        {/* Verbatim Caution Notice Box */}
        <div className="bg-surface-2 border-2 border-warning/30 rounded-[14px] p-6 sm:p-8 mb-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-warning/5 rounded-bl-[100px] pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-surface border border-warning/40 flex items-center justify-center text-warning shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-warning" strokeWidth={1.75} aria-hidden="true" />
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wider text-warning font-semibold">
                    agent/core/accounts.py &bull; CAUTION_NOTICE
                  </span>
                  <h3 className="text-lg font-semibold text-text tracking-tight mt-0.5">
                    Terms of Service &amp; Usage Limit Warning
                  </h3>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-surface border border-border text-text-muted font-medium">
                  Verbatim Notice
                </span>
              </div>

              {/* Exact Verbatim Text Block */}
              <blockquote className="p-4 rounded-lg bg-surface border border-border/80 border-l-4 border-l-warning font-mono text-xs sm:text-sm text-text leading-relaxed select-text">
                &ldquo;{cautionNoticeText}&rdquo;
              </blockquote>

              {/* Password Safety Guarantee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-lg bg-surface border border-border flex items-start gap-3">
                  <div className="p-1.5 rounded-md bg-accent/10 text-accent border border-accent/20 shrink-0 mt-0.5">
                    <KeyRound className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-text">Zero Credential Access</h4>
                    <p className="text-xs text-text-muted leading-relaxed mt-0.5">
                      Hush never stores, reads, or types account passwords. All logins remain strictly inside Google Chrome.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-surface border border-border flex items-start gap-3">
                  <div className="p-1.5 rounded-md bg-accent/10 text-accent border border-accent/20 shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-text">OS Chrome Profile Delegation</h4>
                    <p className="text-xs text-text-muted leading-relaxed mt-0.5">
                      Sessions are launched purely via Chrome&apos;s native <code className="font-mono text-[11px] bg-surface-2 px-1 py-0.5 rounded">--profile-directory</code> CLI argument.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The "I UNDERSTAND" Consent Gate Section */}
        <div className="bg-surface border border-border rounded-[14px] p-6 sm:p-8 mb-10 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-text shrink-0">
                <ShieldCheck className="w-5 h-5 text-accent" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <div>
                <span className="font-mono text-xs uppercase tracking-wider text-text-muted font-medium">
                  Mandatory Operator Consent
                </span>
                <h3 className="text-lg sm:text-xl font-semibold text-text tracking-tight">
                  The &ldquo;I UNDERSTAND&rdquo; Consent Gate
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-text-muted self-start sm:self-auto">
              <Terminal className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} aria-hidden="true" />
              <span>Blocking Gate: AccountSwitcher.confirm()</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Interactive Console Prompt Flow */}
            <div className="p-5 rounded-[12px] bg-surface-2 border border-border flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-mono font-semibold text-text uppercase tracking-wider">
                    Interactive Console Gate
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-accent font-medium">
                    Default Mode
                  </span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed mb-4">
                  Execution halts synchronously. The operator is presented with the terms and must enter the exact confirmation phrase:
                </p>

                {/* Simulated CLI View */}
                <div className="p-4 rounded-lg bg-[#0C0C0B] text-[#F2F1EC] font-mono text-xs space-y-2 border border-[#272624]">
                  <div className="text-text-muted text-[11px]"># Interactive prompt before switching is enabled:</div>
                  <div className="text-amber-400/90 leading-relaxed text-[11px]">
                    Switching between accounts to work around usage limits may violate...
                  </div>
                  <div className="text-[#9A988F] text-[11px]">
                    Type &apos;<span className="text-emerald-400 font-bold">I UNDERSTAND</span>&apos; to enable account switching:
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <span>&gt;</span>
                    <span className="bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40 text-emerald-300">
                      I UNDERSTAND
                    </span>
                    <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/80 flex items-center justify-between text-[11px] font-mono text-text-muted">
                <span>Pass condition: phrase === &quot;I UNDERSTAND&quot;</span>
                <span className="text-success font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                </span>
              </div>
            </div>

            {/* Non-Interactive CLI Flag & Audit Guard */}
            <div className="p-5 rounded-[12px] bg-surface-2 border border-border flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-mono font-semibold text-text uppercase tracking-wider">
                    Automated / CLI Flag Acceptance
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-text-muted font-medium">
                    Headless Mode
                  </span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed mb-4">
                  For automated orchestrations, the operator may pass the explicit CLI argument to acknowledge and confirm the terms programmatically:
                </p>

                {/* Simulated CLI Flag */}
                <div className="p-4 rounded-lg bg-[#0C0C0B] text-[#F2F1EC] font-mono text-xs space-y-2 border border-[#272624]">
                  <div className="text-text-muted text-[11px]"># Command-line invocation parameter:</div>
                  <div className="text-accent text-[12px] font-semibold break-all">
                    python -m agent.run <span className="text-amber-300">--i-accept-account-switch-terms</span>
                  </div>
                  <div className="text-text-muted text-[11px] pt-1 border-t border-[#272624]">
                    Audit Log: <span className="text-emerald-400">&apos;switch_terms_accepted&apos;</span> (accepted_by=&quot;flag&quot;)
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/80 flex items-center justify-between text-[11px] font-mono text-text-muted">
                <span>Blocked if missing: can_switch() &rarr; False</span>
                <span className="text-danger font-semibold flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Locked by default
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Guardrails Card Grid */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-text-muted font-medium">
                Hardcoded Constraints
              </span>
              <h3 className="text-xl font-semibold text-text tracking-tight">
                Operational Guardrails &amp; Parameters
              </h3>
            </div>
            <span className="text-xs font-mono text-text-muted hidden sm:inline-block">
              agent/core/accounts.py parameters
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: MAX_SWITCHES */}
            <div className="p-6 rounded-[14px] bg-surface border border-border flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-text shrink-0">
                    <RotateCw className="w-4 h-4 text-accent" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-surface-2 border border-border font-semibold text-text">
                    MAX_SWITCHES = 2
                  </span>
                </div>
                <h4 className="text-base font-semibold text-text mb-1">
                  Hard Execution Cap (Max 2 Switches)
                </h4>
                <p className="text-xs text-text-muted leading-relaxed">
                  Hush enforces a hard cap of at most 2 profile switches per execution run to prevent continuous, unbounded cycling across accounts.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border text-[11px] font-mono text-text-muted flex items-center justify-between">
                <span>Quota exceeded behavior:</span>
                <span className="text-warning font-semibold">&ldquo;Notify the human&rdquo;</span>
              </div>
            </div>

            {/* Card 2: COOLDOWN_SECONDS */}
            <div className="p-6 rounded-[14px] bg-surface border border-border flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-text shrink-0">
                    <Clock className="w-4 h-4 text-accent" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-surface-2 border border-border font-semibold text-text">
                    COOLDOWN_SECONDS = 120.0
                  </span>
                </div>
                <h4 className="text-base font-semibold text-text mb-1">
                  120-Second Mandatory Cooldown
                </h4>
                <p className="text-xs text-text-muted leading-relaxed">
                  Requires a minimum 2-minute mandatory wait between consecutive profile switches. Prevents profile thrashing, rapid-fire session churn, and immediate repeat switching.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border text-[11px] font-mono text-text-muted flex items-center justify-between">
                <span>Throttle check:</span>
                <span className="text-accent font-semibold">120s timer before next switch</span>
              </div>
            </div>

            {/* Card 3: HUSH_CHROME_PROFILES */}
            <div className="p-6 rounded-[14px] bg-surface border border-border flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-text shrink-0">
                    <FolderTree className="w-4 h-4 text-accent" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-surface-2 border border-border font-semibold text-text">
                    HUSH_CHROME_PROFILES
                  </span>
                </div>
                <h4 className="text-base font-semibold text-text mb-1">
                  Environment Configuration
                </h4>
                <p className="text-xs text-text-muted leading-relaxed mb-3">
                  Must be configured with at least 2 comma-separated Chrome profile directory names. If fewer than 2 profiles are specified, switching is completely disabled.
                </p>

                <div className="p-2.5 rounded-lg bg-surface-2 border border-border font-mono text-[11px] text-text select-text overflow-x-auto">
                  <code>setx HUSH_CHROME_PROFILES &quot;Profile 1,Profile 2&quot;</code>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border text-[11px] font-mono text-text-muted flex items-center justify-between">
                <span>Minimum requirement:</span>
                <span className="text-text font-semibold">&gt;= 2 distinct Chrome profiles</span>
              </div>
            </div>

            {/* Card 4: Antigravity Unsupported Limitation */}
            <div className="p-6 rounded-[14px] bg-surface border-2 border-danger/30 flex flex-col justify-between shadow-xs relative">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-danger/10 border border-danger/20 flex items-center justify-center text-danger shrink-0">
                    <Ban className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-danger/10 border border-danger/20 font-semibold text-danger">
                    DESKTOP IDE LIMITATION
                  </span>
                </div>
                <h4 className="text-base font-semibold text-danger mb-1">
                  Antigravity switching is unsupported
                </h4>
                <p className="text-xs text-text-muted leading-relaxed">
                  Switching applies <strong>only to browser-based Claude and Gemini</strong> targets. IDE desktop agents like Antigravity cannot be switched and require manual operator resolution.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border text-[11px] font-mono text-text-muted flex items-center justify-between">
                <span>Resolution policy:</span>
                <span className="text-danger font-semibold">Immediate human operator alert</span>
              </div>
            </div>
          </div>
        </div>

        {/* Static Architecture Lifecycle Schematic */}
        <div className="bg-surface-2 border border-border rounded-[14px] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-border mb-6">
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-text-muted font-medium">
                System Lifecycle Flowchart
              </span>
              <h3 className="text-lg font-semibold text-text tracking-tight">
                Switch Decision &amp; Verification Pipeline
              </h3>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full bg-surface border border-border text-text-muted">
              Static Blueprint &bull; No Interactive Controls
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono font-semibold uppercase text-accent mb-1.5">
                  Step 01 &bull; Detection
                </div>
                <h5 className="text-xs font-semibold text-text mb-1">Rate Limit Hit</h5>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Claude or Gemini web interface hits usage rate limit or session exhaustion.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-border/60 text-[10px] font-mono text-text-muted">
                Antigravity &rarr; <span className="text-danger font-semibold">Abort</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono font-semibold uppercase text-accent mb-1.5">
                  Step 02 &bull; Consent
                </div>
                <h5 className="text-xs font-semibold text-text mb-1">Terms Validation</h5>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Validates consent confirmed via <code className="text-accent font-semibold">&ldquo;I UNDERSTAND&rdquo;</code> or CLI flag.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-border/60 text-[10px] font-mono text-text-muted">
                Unconfirmed &rarr; <span className="text-danger font-semibold">Blocked</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono font-semibold uppercase text-accent mb-1.5">
                  Step 03 &bull; Guardrails
                </div>
                <h5 className="text-xs font-semibold text-text mb-1">Cooldown &amp; Cap</h5>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Checks <code className="font-mono text-[10px]">switches &lt; 2</code> and <code className="font-mono text-[10px]">elapsed &gt;= 120s</code> before proceeding.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-border/60 text-[10px] font-mono text-text-muted">
                Cooldown &rarr; <span className="text-warning font-semibold">Wait timer</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono font-semibold uppercase text-accent mb-1.5">
                  Step 04 &bull; Execution
                </div>
                <h5 className="text-xs font-semibold text-text mb-1">Chrome Spawning</h5>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Launches Chrome subprocess with next <code className="text-accent font-mono text-[10px]">--profile-directory</code>.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-border/60 text-[10px] font-mono text-text-muted">
                Zero password inputs
              </div>
            </div>

            {/* Step 5 */}
            <div className="p-4 rounded-xl bg-surface border border-border flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono font-semibold uppercase text-accent mb-1.5">
                  Step 05 &bull; Audit
                </div>
                <h5 className="text-xs font-semibold text-text mb-1">Screenshot Verification</h5>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Takes screenshot to verify ready state. If login prompt or error shows, alerts operator.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-border/60 text-[10px] font-mono text-text-muted">
                Failure &rarr; <span className="text-warning font-semibold">notify_human</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AccountSwitchingIllustration;
