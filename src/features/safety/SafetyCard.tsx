import React from 'react';
import type { SafetyItem } from '@/data/types';
import { CheckCircle2, Clock, ShieldCheck, Wrench } from 'lucide-react';

interface SafetyCardProps {
  item: SafetyItem;
  index: number;
}

const ENFORCEMENT_METADATA: Record<string, { layer: string; scope: string }> = {
  'safety-command-allowlist': { layer: 'POSIX Sandbox', scope: 'Child Processes' },
  'safety-workspace-only': { layer: 'Path Boundary Validator', scope: 'File Operations' },
  'safety-step-cap': { layer: 'Iteration Counter', scope: 'Runtime Loop Engine' },
  'safety-mouse-corner-abort': { layer: 'OS Pointer Hook', scope: 'Hardware Interruption' },
  'safety-human-notify-gate': { layer: 'Policy Gate Barrier', scope: 'Handoff Protocol' },
  'safety-graph-stall': { layer: 'AST Checksum Guard', scope: 'Code Graph Monitor' },
  'safety-jsonl-audit-log': { layer: 'Cryptographic Ledger', scope: 'Forensic Audit' },
  'safety-checkpoint-resume': { layer: 'State Machine Engine', scope: 'Atomic Recovery' },
  'safety-demo-mode': { layer: 'Deterministic Mock', scope: 'E2E Testing' },
  'safety-global-kill-hotkey': { layer: 'System Daemon', scope: 'OS Subprocess Tree' },
  'safety-screenshot-loop-breaker': { layer: 'Perceptual Hash', scope: 'UI Vision Guard' },
  'safety-screenshot-hash-loop-breaker': { layer: 'Perceptual Hash', scope: 'UI Vision Guard' },
  'safety-limit-wait': { layer: 'Backoff Engine', scope: 'Rate Limit Governor' },
  'safety-account-switch': { layer: 'Profile Switcher', scope: 'Quota Rotation' },
};

export const SafetyCard: React.FC<SafetyCardProps> = ({ item, index }) => {
  const metadata = ENFORCEMENT_METADATA[item.id] ?? { layer: 'Guardrail Engine', scope: 'Runtime Security' };
  const itemNumber = String(index + 1).padStart(2, '0');

  return (
    <article
      tabIndex={0}
      aria-labelledby={`safety-title-${item.id}`}
      className="w-full group bg-[#141414] border border-white/[0.06] rounded-[24px] p-6 sm:p-7 flex flex-col justify-between transition-colors duration-150 hover:border-[#22FF6E]/30 focus-visible:outline-2 focus-visible:outline-[#22FF6E] focus-visible:outline-offset-2"
    >
      <div>
        {/* Top line: Index and Status Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <span className="font-mono text-xs font-semibold text-[#22FF6E] bg-white/[0.04] px-2.5 py-1 rounded-[8px] border border-white/[0.06]">
            SEC-{itemNumber}
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Status Badge */}
            {item.implemented ? (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border border-[#22FF6E]/30 bg-[#22FF6E]/10 text-[#22FF6E]"
                aria-label={`Status: ${item.statusLabel || 'Implemented'}`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22FF6E] shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <span>{item.statusLabel || 'Implemented'}</span>
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border border-[#E3B15C]/30 bg-[#E3B15C]/10 text-[#E3B15C]"
                aria-label={`Status: ${item.statusLabel || 'Planned'}`}
              >
                <Clock className="w-3.5 h-3.5 text-[#E3B15C] shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <span>{item.statusLabel || 'Planned'}</span>
              </span>
            )}

            {/* Subtle secondary tag when not yet verified on a real desktop */}
            {item.desktopVerified === false && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-normal border border-white/10 bg-white/5 text-[#F5F0E8]/45"
                title="Not yet verified on a real desktop"
              >
                <span>Not yet verified on a real desktop</span>
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3
          id={`safety-title-${item.id}`}
          className="text-base sm:text-lg font-sans font-bold text-[#F0FFE8] tracking-tight group-hover:text-[#22FF6E] transition-colors"
        >
          {item.title}
        </h3>

        {/* Description */}
        <p className="mt-2.5 text-sm text-[#F5F0E8]/60 leading-relaxed font-sans">
          {item.description}
        </p>
      </div>

      {/* Footer metadata: Layer & Scope */}
      <div className="mt-6 pt-3.5 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#F5F0E8]/45">
        <span className="inline-flex items-center gap-1.5 text-[#F5F0E8]/60">
          {item.implemented ? (
            <ShieldCheck className="w-3.5 h-3.5 text-[#22FF6E] shrink-0" strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <Wrench className="w-3.5 h-3.5 text-[#E3B15C] shrink-0" strokeWidth={1.5} aria-hidden="true" />
          )}
          <span>{metadata.layer}</span>
        </span>
        <span className="text-[#F5F0E8]/40">
          {metadata.scope}
        </span>
      </div>
    </article>
  );
};
