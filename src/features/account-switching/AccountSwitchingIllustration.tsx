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
      className="py-20 lg:py-32 border-t border-white/[0.06] bg-[#000] text-[#F5F0E8]"
    >
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-[#F5F0E8]/45 mb-4">
            [ ACCOUNT SWITCHING ]
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#22FF6E]/10 border border-[#22FF6E]/30 text-[#22FF6E]">
              <UserCheck className="w-3.5 h-3.5 text-[#22FF6E]" strokeWidth={1.5} aria-hidden="true" />
              <span>Rate Limit Management</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-white/[0.04] border border-white/[0.06] text-[#F5F0E8]/60 tracking-wider uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22FF6E] animate-pulse" aria-hidden="true" />
              <span>ARCHITECTURAL ILLUSTRATION &bull; NON-INTERACTIVE</span>
            </div>
          </div>

          <h2
            id="account-switching-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold tracking-tight text-[#F0FFE8]"
          >
            Multi-Profile <span className="font-serif italic font-normal text-[#22FF6E]">Account Switching.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#F5F0E8]/60 leading-relaxed font-sans">
            How Hush routes between authenticated Chrome profiles when rate limits occur, guarded by strict operational cooldowns and explicit user consent.
          </p>
        </div>

        {/* Verbatim Caution Notice Box */}
        <div className="bg-[#141414] border border-[#E3B15C]/30 rounded-[24px] p-6 sm:p-8 mb-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#E3B15C]/5 rounded-bl-[100px] pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start gap-4">
            <div className="w-11 h-11 rounded-[14px] bg-white/[0.04] border border-[#E3B15C]/40 flex items-center justify-center text-[#E3B15C] shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-[#E3B15C]" strokeWidth={1.75} aria-hidden="true" />
            </div>

            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-xs uppercase tracking-[0.15em] text-[#E3B15C] font-semibold">
                    agent/core/accounts.py &bull; CAUTION_NOTICE
                  </span>
                  <h3 className="text-lg font-sans font-bold text-[#F0FFE8] tracking-tight mt-0.5">
                    Terms of Service &amp; Usage Limit Warning
                  </h3>
                </div>
                <span className="text-[11px] font-mono px-3 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[#F5F0E8]/60 font-medium">
                  Verbatim Notice
                </span>
              </div>

              {/* Exact Verbatim Text Block */}
              <blockquote className="p-4 sm:p-5 rounded-[16px] bg-[#0a0a0a] border border-white/[0.06] border-l-4 border-l-[#E3B15C] font-mono text-xs sm:text-sm text-[#F5F0E8] leading-relaxed select-text">
                &ldquo;{cautionNoticeText}&rdquo;
              </blockquote>

              {/* Password Safety Guarantee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="p-4 rounded-[16px] bg-[#0e0e0e] border border-white/[0.06] flex items-start gap-3">
                  <div className="p-2 rounded-[10px] bg-[#22FF6E]/10 text-[#22FF6E] border border-[#22FF6E]/20 shrink-0 mt-0.5">
                    <KeyRound className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-xs font-sans font-bold text-[#F0FFE8]">Zero Credential Access</h4>
                    <p className="text-xs text-[#F5F0E8]/60 leading-relaxed mt-0.5 font-sans">
                      Hush never stores, reads, or types account passwords. All logins remain strictly inside Google Chrome.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-[16px] bg-[#0e0e0e] border border-white/[0.06] flex items-start gap-3">
                  <div className="p-2 rounded-[10px] bg-[#22FF6E]/10 text-[#22FF6E] border border-[#22FF6E]/20 shrink-0 mt-0.5">
                    <Lock className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-xs font-sans font-bold text-[#F0FFE8]">OS Chrome Profile Delegation</h4>
                    <p className="text-xs text-[#F5F0E8]/60 leading-relaxed mt-0.5 font-sans">
                      Sessions are launched purely via Chrome&apos;s native <code className="font-mono text-[11px] bg-white/5 text-[#22FF6E] px-1 py-0.5 rounded">--profile-directory</code> CLI argument.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* The "I UNDERSTAND" Consent Gate Section */}
        <div className="bg-[#141414] border border-white/[0.06] rounded-[24px] p-6 sm:p-8 mb-10 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-white/[0.06]">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-[12px] bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#22FF6E] shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#22FF6E]" strokeWidth={1.5} aria-hidden="true" />
              </div>
              <div>
                <span className="font-mono text-xs uppercase tracking-[0.15em] text-[#F5F0E8]/45 font-medium">
                  Mandatory Operator Consent
                </span>
                <h3 className="text-lg sm:text-xl font-sans font-bold text-[#F0FFE8] tracking-tight">
                  The &ldquo;I UNDERSTAND&rdquo; Consent Gate
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[#F5F0E8]/60 self-start sm:self-auto">
              <Terminal className="w-3.5 h-3.5 text-[#22FF6E]" strokeWidth={1.5} aria-hidden="true" />
              <span>Blocking Gate: AccountSwitcher.confirm()</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Interactive Console Prompt Flow */}
            <div className="p-5 sm:p-6 rounded-[18px] bg-[#0e0e0e] border border-white/[0.06] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-mono font-semibold text-[#F0FFE8] uppercase tracking-wider">
                    Interactive Console Gate
                  </span>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[#22FF6E] font-medium">
                    Default Mode
                  </span>
                </div>
                <p className="text-xs text-[#F5F0E8]/60 leading-relaxed mb-4 font-sans">
                  Execution halts synchronously. The operator is presented with the terms and must enter the exact confirmation phrase:
                </p>

                {/* Simulated CLI View */}
                <div className="p-4 rounded-[14px] bg-[#050505] text-[#F5F0E8] font-mono text-xs space-y-2 border border-white/[0.06]">
                  <div className="text-[#F5F0E8]/40 text-[11px]"># Interactive prompt before switching is enabled:</div>
                  <div className="text-[#E3B15C]/90 leading-relaxed text-[11px]">
                    Switching between accounts to work around usage limits may violate...
                  </div>
                  <div className="text-[#F5F0E8]/60 text-[11px]">
                    Type &apos;<span className="text-[#22FF6E] font-bold">I UNDERSTAND</span>&apos; to enable account switching:
                  </div>
                  <div className="flex items-center gap-1.5 text-[#22FF6E] font-bold">
                    <span>&gt;</span>
                    <span className="bg-[#22FF6E]/15 px-2 py-0.5 rounded border border-[#22FF6E]/40 text-[#22FF6E]">
                      I UNDERSTAND
                    </span>
                    <span className="inline-block w-2 h-4 bg-[#22FF6E] animate-pulse" />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[#F5F0E8]/45">
                <span>Pass condition: phrase === &quot;I UNDERSTAND&quot;</span>
                <span className="text-[#22FF6E] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
                </span>
              </div>
            </div>

            {/* Non-Interactive CLI Flag & Audit Guard */}
            <div className="p-5 sm:p-6 rounded-[18px] bg-[#0e0e0e] border border-white/[0.06] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-mono font-semibold text-[#F0FFE8] uppercase tracking-wider">
                    Automated / CLI Flag Acceptance
                  </span>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[#F5F0E8]/60 font-medium">
                    Headless Mode
                  </span>
                </div>
                <p className="text-xs text-[#F5F0E8]/60 leading-relaxed mb-4 font-sans">
                  For automated orchestrations, the operator may pass the explicit CLI argument to acknowledge and confirm the terms programmatically:
                </p>

                {/* Simulated CLI Flag */}
                <div className="p-4 rounded-[14px] bg-[#050505] text-[#F5F0E8] font-mono text-xs space-y-2 border border-white/[0.06]">
                  <div className="text-[#F5F0E8]/40 text-[11px]"># Command-line invocation parameter:</div>
                  <div className="text-[#22FF6E] text-[12px] font-semibold break-all">
                    python -m agent.run <span className="text-[#E3B15C]">--i-accept-account-switch-terms</span>
                  </div>
                  <div className="text-[#F5F0E8]/45 text-[11px] pt-1.5 border-t border-white/[0.06]">
                    Audit Log: <span className="text-[#22FF6E]">&apos;switch_terms_accepted&apos;</span> (accepted_by=&quot;flag&quot;)
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[#F5F0E8]/45">
                <span>Blocked if missing: can_switch() &rarr; False</span>
                <span className="text-[#E5776B] font-semibold flex items-center gap-1">
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
              <span className="font-mono text-xs uppercase tracking-[0.15em] text-[#F5F0E8]/45 font-medium">
                Hardcoded Constraints
              </span>
              <h3 className="text-xl font-sans font-bold text-[#F0FFE8] tracking-tight">
                Operational Guardrails &amp; Parameters
              </h3>
            </div>
            <span className="text-xs font-mono text-[#F5F0E8]/45 hidden sm:inline-block">
              agent/core/accounts.py parameters
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: MAX_SWITCHES */}
            <div className="p-6 sm:p-7 rounded-[24px] bg-[#141414] border border-white/[0.06] flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-10 h-10 rounded-[12px] bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#22FF6E] shrink-0">
                    <RotateCw className="w-5 h-5 text-[#22FF6E]" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <span className="font-mono text-xs px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] font-semibold text-[#22FF6E]">
                    MAX_SWITCHES = 2
                  </span>
                </div>
                <h4 className="text-base font-sans font-bold text-[#F0FFE8] mb-1.5">
                  Hard Execution Cap (Max 2 Switches)
                </h4>
                <p className="text-xs text-[#F5F0E8]/60 leading-relaxed font-sans">
                  Hush enforces a hard cap of at most 2 profile switches per execution run to prevent continuous, unbounded cycling across accounts.
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-white/[0.06] text-[11px] font-mono text-[#F5F0E8]/45 flex items-center justify-between">
                <span>Quota exceeded behavior:</span>
                <span className="text-[#E3B15C] font-semibold">&ldquo;Notify the human&rdquo;</span>
              </div>
            </div>

            {/* Card 2: COOLDOWN_SECONDS */}
            <div className="p-6 sm:p-7 rounded-[24px] bg-[#141414] border border-white/[0.06] flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-10 h-10 rounded-[12px] bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#22FF6E] shrink-0">
                    <Clock className="w-5 h-5 text-[#22FF6E]" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <span className="font-mono text-xs px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] font-semibold text-[#22FF6E]">
                    COOLDOWN_SECONDS = 120.0
                  </span>
                </div>
                <h4 className="text-base font-sans font-bold text-[#F0FFE8] mb-1.5">
                  120-Second Mandatory Cooldown
                </h4>
                <p className="text-xs text-[#F5F0E8]/60 leading-relaxed font-sans">
                  Requires a minimum 2-minute mandatory wait between consecutive profile switches. Prevents profile thrashing, rapid-fire session churn, and immediate repeat switching.
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-white/[0.06] text-[11px] font-mono text-[#F5F0E8]/45 flex items-center justify-between">
                <span>Throttle check:</span>
                <span className="text-[#22FF6E] font-semibold">120s timer before next switch</span>
              </div>
            </div>

            {/* Card 3: HUSH_CHROME_PROFILES */}
            <div className="p-6 sm:p-7 rounded-[24px] bg-[#141414] border border-white/[0.06] flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-10 h-10 rounded-[12px] bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#22FF6E] shrink-0">
                    <FolderTree className="w-5 h-5 text-[#22FF6E]" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <span className="font-mono text-xs px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] font-semibold text-[#F0FFE8]">
                    HUSH_CHROME_PROFILES
                  </span>
                </div>
                <h4 className="text-base font-sans font-bold text-[#F0FFE8] mb-1.5">
                  Environment Configuration
                </h4>
                <p className="text-xs text-[#F5F0E8]/60 leading-relaxed mb-3.5 font-sans">
                  Must be configured with at least 2 comma-separated Chrome profile directory names. If fewer than 2 profiles are specified, switching is completely disabled.
                </p>

                <div className="p-3 rounded-[12px] bg-[#0e0e0e] border border-white/[0.06] font-mono text-[11px] text-[#22FF6E] select-text overflow-x-auto">
                  <code>setx HUSH_CHROME_PROFILES &quot;Profile 1,Profile 2&quot;</code>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-white/[0.06] text-[11px] font-mono text-[#F5F0E8]/45 flex items-center justify-between">
                <span>Minimum requirement:</span>
                <span className="text-[#F0FFE8] font-semibold">&gt;= 2 distinct Chrome profiles</span>
              </div>
            </div>

            {/* Card 4: Antigravity Unsupported Limitation */}
            <div className="p-6 sm:p-7 rounded-[24px] bg-[#141414] border border-[#E5776B]/30 flex flex-col justify-between shadow-xs relative">
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-10 h-10 rounded-[12px] bg-[#E5776B]/10 border border-[#E5776B]/20 flex items-center justify-center text-[#E5776B] shrink-0">
                    <Ban className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <span className="font-mono text-xs px-3 py-1 rounded-full bg-[#E5776B]/10 border border-[#E5776B]/20 font-semibold text-[#E5776B]">
                    DESKTOP IDE LIMITATION
                  </span>
                </div>
                <h4 className="text-base font-sans font-bold text-[#E5776B] mb-1.5">
                  Antigravity switching is unsupported
                </h4>
                <p className="text-xs text-[#F5F0E8]/60 leading-relaxed font-sans">
                  Switching applies <strong>only to browser-based Claude and Gemini</strong> targets. IDE desktop agents like Antigravity cannot be switched and require manual operator resolution.
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-white/[0.06] text-[11px] font-mono text-[#F5F0E8]/45 flex items-center justify-between">
                <span>Resolution policy:</span>
                <span className="text-[#E5776B] font-semibold">Immediate human operator alert</span>
              </div>
            </div>
          </div>
        </div>

        {/* Static Architecture Lifecycle Schematic */}
        <div className="bg-[#141414] border border-white/[0.06] rounded-[24px] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-white/[0.06] mb-6">
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.15em] text-[#F5F0E8]/45 font-medium">
                System Lifecycle Flowchart
              </span>
              <h3 className="text-lg font-sans font-bold text-[#F0FFE8] tracking-tight">
                Switch Decision &amp; Verification Pipeline
              </h3>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[#F5F0E8]/60">
              Static Blueprint &bull; No Interactive Controls
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Step 1 */}
            <div className="p-4 sm:p-5 rounded-[18px] bg-[#0e0e0e] border border-white/[0.06] flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono font-semibold uppercase text-[#22FF6E] mb-1.5">
                  Step 01 &bull; Detection
                </div>
                <h5 className="text-xs font-sans font-bold text-[#F0FFE8] mb-1">Rate Limit Hit</h5>
                <p className="text-[11px] text-[#F5F0E8]/60 leading-relaxed font-sans">
                  Claude or Gemini web interface hits usage rate limit or session exhaustion.
                </p>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-white/[0.06] text-[10px] font-mono text-[#F5F0E8]/45">
                Antigravity &rarr; <span className="text-[#E5776B] font-semibold">Abort</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 sm:p-5 rounded-[18px] bg-[#0e0e0e] border border-white/[0.06] flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono font-semibold uppercase text-[#22FF6E] mb-1.5">
                  Step 02 &bull; Consent
                </div>
                <h5 className="text-xs font-sans font-bold text-[#F0FFE8] mb-1">Terms Validation</h5>
                <p className="text-[11px] text-[#F5F0E8]/60 leading-relaxed font-sans">
                  Validates consent confirmed via <code className="text-[#22FF6E] font-semibold">&ldquo;I UNDERSTAND&rdquo;</code> or CLI flag.
                </p>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-white/[0.06] text-[10px] font-mono text-[#F5F0E8]/45">
                Unconfirmed &rarr; <span className="text-[#E5776B] font-semibold">Blocked</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-4 sm:p-5 rounded-[18px] bg-[#0e0e0e] border border-white/[0.06] flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono font-semibold uppercase text-[#22FF6E] mb-1.5">
                  Step 03 &bull; Guardrails
                </div>
                <h5 className="text-xs font-sans font-bold text-[#F0FFE8] mb-1">Cooldown &amp; Cap</h5>
                <p className="text-[11px] text-[#F5F0E8]/60 leading-relaxed font-sans">
                  Checks <code className="font-mono text-[10px] text-[#22FF6E]">switches &lt; 2</code> and <code className="font-mono text-[10px] text-[#22FF6E]">elapsed &gt;= 120s</code> before proceeding.
                </p>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-white/[0.06] text-[10px] font-mono text-[#F5F0E8]/45">
                Cooldown &rarr; <span className="text-[#E3B15C] font-semibold">Wait timer</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-4 sm:p-5 rounded-[18px] bg-[#0e0e0e] border border-white/[0.06] flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono font-semibold uppercase text-[#22FF6E] mb-1.5">
                  Step 04 &bull; Execution
                </div>
                <h5 className="text-xs font-sans font-bold text-[#F0FFE8] mb-1">Chrome Spawning</h5>
                <p className="text-[11px] text-[#F5F0E8]/60 leading-relaxed font-sans">
                  Launches Chrome subprocess with next <code className="text-[#22FF6E] font-mono text-[10px]">--profile-directory</code>.
                </p>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-white/[0.06] text-[10px] font-mono text-[#F5F0E8]/45">
                Zero password inputs
              </div>
            </div>

            {/* Step 5 */}
            <div className="p-4 sm:p-5 rounded-[18px] bg-[#0e0e0e] border border-white/[0.06] flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono font-semibold uppercase text-[#22FF6E] mb-1.5">
                  Step 05 &bull; Audit
                </div>
                <h5 className="text-xs font-sans font-bold text-[#F0FFE8] mb-1">Screenshot Verification</h5>
                <p className="text-[11px] text-[#F5F0E8]/60 leading-relaxed font-sans">
                  Takes screenshot to verify ready state. If login prompt or error shows, alerts operator.
                </p>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-white/[0.06] text-[10px] font-mono text-[#F5F0E8]/45">
                Failure &rarr; <span className="text-[#E3B15C] font-semibold">notify_human</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AccountSwitchingIllustration;
