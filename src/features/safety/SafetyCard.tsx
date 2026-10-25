import React from 'react';
import type { SafetyItem } from '@/data/types';
import { CheckCircle2, Clock, ShieldCheck, Wrench } from 'lucide-react';

interface SafetyCardProps {
  item: SafetyItem;
  index: number;
}

const ENFORCEMENT_METADATA: Record<string, { layer: string; scope: string }> = {
  'safety-command-allowlist': { layer: 'Process Guardrail', scope: 'Child Processes' },
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
      className="w-full group bg-[#141414] dark:bg-[#141414] bg-surface border border-border rounded-[24px] p-6 flex flex-col justify-between transition-all duration-200 hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 shadow-xs"
    >
      <div>
        {/* Top line: Status Pill Tags and Mono Index top-right */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Pill Tag */}
            {item.implemented ? (
              <span
                className="inline-flex items-center gap-1.5 border border-accent/30 bg-accent/10 text-accent font-mono text-xs px-2.5 py-0.5 rounded-full"
                aria-label={`Status: ${item.statusLabel || 'Implemented'}`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <span>{item.statusLabel || 'Implemented'}</span>
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 border border-warning/30 bg-warning/10 text-warning font-mono text-xs px-2.5 py-0.5 rounded-full"
                aria-label={`Status: ${item.statusLabel || 'Planned'}`}
              >
                <Clock className="w-3.5 h-3.5 text-warning shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <span>{item.statusLabel || 'Planned'}</span>
              </span>
            )}

            {/* Subtle grey pill for "Not yet verified on a real desktop" */}
            {item.desktopVerified === false && (
              <span
                className="inline-flex items-center gap-1 border border-border bg-surface-2/60 text-text-muted font-mono text-xs px-2.5 py-0.5 rounded-full"
                title="Not yet verified on a real desktop"
              >
                <span>Not yet verified on a real desktop</span>
              </span>
            )}
          </div>

          {/* Mono index top-right */}
          <span className="font-mono text-xs font-semibold text-text-muted/60 tracking-wider shrink-0 bg-surface-2/80 px-2.5 py-0.5 rounded-md border border-border">
            {itemNumber}
          </span>
        </div>

        {/* Bold Title in cream/mint */}
        <h3
          id={`safety-title-${item.id}`}
          className="text-base sm:text-lg font-bold text-text group-hover:text-accent transition-colors tracking-tight"
        >
          {item.title}
        </h3>

        {/* Description */}
        <p className="mt-2.5 text-xs sm:text-sm text-text-muted leading-relaxed">
          {item.description}
        </p>
      </div>

      {/* Footer metadata: Layer & Scope */}
      <div className="mt-6 pt-3.5 border-t border-border/70 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-text-muted">
        <span className="inline-flex items-center gap-1.5 text-text-muted">
          {item.implemented ? (
            <ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <Wrench className="w-3.5 h-3.5 text-text-muted shrink-0" strokeWidth={1.5} aria-hidden="true" />
          )}
          <span>{metadata.layer}</span>
        </span>
        <span className="text-text-muted/80">
          {metadata.scope}
        </span>
      </div>
    </article>
  );
};
