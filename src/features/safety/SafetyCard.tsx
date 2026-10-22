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
  'safety-jsonl-audit-log': { layer: 'Append-Only Ledger', scope: 'Forensic Audit' },
  'safety-global-kill-hotkey': { layer: 'System Daemon', scope: 'OS Subprocess Tree' },
  'safety-screenshot-hash-loop-breaker': { layer: 'Perceptual Hash', scope: 'UI Vision Guard' },
};

export const SafetyCard: React.FC<SafetyCardProps> = ({ item, index }) => {
  const metadata = ENFORCEMENT_METADATA[item.id] ?? { layer: 'Guardrail Engine', scope: 'Runtime Security' };
  const itemNumber = String(index + 1).padStart(2, '0');

  return (
    <article
      tabIndex={0}
      aria-labelledby={`safety-title-${item.id}`}
      className="w-full group bg-surface border border-border rounded-[14px] p-5 sm:p-6 flex flex-col justify-between transition-colors duration-150 hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
    >
      <div>
        {/* Top line: Index and Status Badge (Thin tag with icon + text) */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="font-mono text-xs font-semibold text-text-muted bg-surface-2 px-2.5 py-1 rounded-md border border-border">
            SEC-{itemNumber}
          </span>

          {item.implemented ? (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-surface-2 text-success border border-border"
              aria-label="Status: Implemented"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span>Implemented</span>
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-surface-2 text-text-muted border border-border"
              aria-label="Status: Planned"
            >
              <Clock className="w-3.5 h-3.5 text-text-muted shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span>Planned</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          id={`safety-title-${item.id}`}
          className="text-base sm:text-lg font-semibold text-text tracking-tight group-hover:text-accent transition-colors"
        >
          {item.title}
        </h3>

        {/* Description */}
        <p className="mt-2 text-sm text-text-muted leading-relaxed">
          {item.description}
        </p>
      </div>

      {/* Footer metadata: Layer & Scope */}
      <div className="mt-5 pt-3 border-t border-border/70 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-text-muted">
        <span className="inline-flex items-center gap-1 text-text-muted">
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
