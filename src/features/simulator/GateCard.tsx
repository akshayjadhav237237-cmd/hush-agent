import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import type { Step } from '@/data/types';

interface GateCardProps {
  step: Step;
  isResolved?: boolean;
  onResolve: () => void;
}

export const GateCard: React.FC<GateCardProps> = ({ step, isResolved = false, onResolve }) => {
  const gate = step.gate;
  const [selectedOption, setSelectedOption] = useState<'stripe' | 'square'>('stripe');

  if (!gate) return null;

  if (isResolved) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="w-full rounded-[10px] border border-border bg-surface-2 p-4 flex items-center justify-between gap-3 text-xs"
      >
        <div className="flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-text shrink-0" strokeWidth={1.5} aria-hidden="true" />
          <div>
            <div className="font-medium text-text">Attention gate resolved</div>
            <div className="text-text-muted mt-0.5">
              Decision recorded. Execution resumed with selected payment integration.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="w-full rounded-[10px] border border-warning bg-surface p-4 flex flex-col gap-4 text-xs"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0" strokeWidth={1.5} aria-hidden="true" />
          <h3 className="text-sm font-semibold text-text">Why I paused</h3>
          <span className="font-mono text-[11px] text-warning px-2 py-0.5 rounded-[6px] border border-warning bg-surface-2">
            Attention required
          </span>
        </div>

        <div className="font-mono text-text-muted text-[11px]">
          Trigger: <span className="text-text">{gate.trigger}</span>
        </div>
      </div>

      {/* Detection Reason */}
      <div className="flex flex-col gap-1 leading-relaxed">
        <span className="font-medium text-text">Reason</span>
        <p className="text-text-muted">{gate.reason}</p>
      </div>

      {/* Choice: Stripe vs Square */}
      <div className="flex flex-col gap-2">
        <span className="font-medium text-text">Select payment provider</span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setSelectedOption('stripe')}
            aria-pressed={selectedOption === 'stripe'}
            className={`p-3 rounded-[10px] border text-left transition-colors flex flex-col gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
              selectedOption === 'stripe'
                ? 'border-warning bg-surface-2 text-text font-medium'
                : 'border-border bg-surface text-text-muted hover:text-text'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-text font-medium">Stripe Checkout</span>
              {selectedOption === 'stripe' && (
                <span className="w-2 h-2 rounded-full bg-warning" aria-hidden="true" />
              )}
            </div>
            <span className="text-[11px] text-text-muted">
              Automated webhooks for deposit confirmation
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedOption('square')}
            aria-pressed={selectedOption === 'square'}
            className={`p-3 rounded-[10px] border text-left transition-colors flex flex-col gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
              selectedOption === 'square'
                ? 'border-warning bg-surface-2 text-text font-medium'
                : 'border-border bg-surface text-text-muted hover:text-text'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-text font-medium">Square Invoicing</span>
              {selectedOption === 'square' && (
                <span className="w-2 h-2 rounded-full bg-warning" aria-hidden="true" />
              )}
            </div>
            <span className="text-[11px] text-text-muted">
              In-person POS and offline invoicing
            </span>
          </button>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
        <span className="text-text-muted text-[11px]">
          Resolving unpauses playback and injects the selection. Shortcut: Enter.
        </span>

        <button
          type="button"
          onClick={onResolve}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-[10px] border border-warning bg-transparent hover:bg-surface-2 text-warning text-xs font-medium transition-colors"
        >
          <span>Resolve and continue ({selectedOption === 'stripe' ? 'Stripe' : 'Square'})</span>
          <ArrowRight className="w-3.5 h-3.5 text-warning" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
