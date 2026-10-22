import React from 'react';
import { Shield, BellOff } from 'lucide-react';

export const FatigueCallout: React.FC = () => {
  return (
    <div className="bg-surface border border-border rounded-[14px] p-6 sm:p-8 mb-10">
      {/* Top Banner / Invariant Thesis */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-surface-2 border border-border text-text-muted mb-2">
            <Shield className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} aria-hidden="true" />
            Core Invariant
          </span>
          <h3 className="text-xl sm:text-2xl font-serif text-text tracking-tight">
            Interrupt only when progress cannot continue without human decision.
          </h3>
        </div>
        <div className="shrink-0 flex items-center gap-2 text-xs font-mono px-3.5 py-2 rounded-lg bg-surface-2 border border-border text-text-muted">
          <BellOff className="w-4 h-4 text-accent" strokeWidth={1.5} aria-hidden="true" />
          <span>Zero Prompt Noise</span>
        </div>
      </div>

      {/* Comparison Grid: Alert Fatigue vs Deterministic Invariants */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* The Problem: Alert Fatigue */}
        <div className="bg-surface-2 border border-border rounded-[14px] p-5">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-text text-sm">
              The Failure Mode: Alert Fatigue
            </h4>
          </div>
          <p className="text-sm text-text-muted leading-relaxed">
            Standard coding agents interrupt operators continuously for routine steps. Frequent prompts create confirmation fatigue. Operators approve actions without reading details. Unintended destructive commands pass through unchecked.
          </p>
        </div>

        {/* The Solution: Deterministic Invariants */}
        <div className="bg-surface-2 border border-border rounded-[14px] p-5">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-text text-sm">
              The Attention Gate Invariant
            </h4>
          </div>
          <p className="text-sm text-text-muted leading-relaxed">
            Hush runs silently through valid builds, tests, and edits. It requests attention only when a deterministic invariant trips. Every interruption has operational consequence. Human review remains deliberate.
          </p>
        </div>
      </div>
    </div>
  );
};
