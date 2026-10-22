import React from 'react';
import { ShieldCheck, Clock, Layers } from 'lucide-react';

interface SafetySummaryProps {
  implementedCount: number;
  plannedCount: number;
  totalCount: number;
}

export const SafetySummary: React.FC<SafetySummaryProps> = ({
  implementedCount,
  plannedCount,
  totalCount,
}) => {
  const implementedPercentage = Math.round((implementedCount / totalCount) * 100);

  return (
    <div className="bg-surface border border-border rounded-[14px] p-5 sm:p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Summary Counter */}
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-text-muted mb-1.5">
            Guardrail Status Counter
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-text tracking-tight flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1.5 text-success">
              <ShieldCheck className="w-5 h-5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span>{implementedCount} Implemented Guardrails</span>
            </span>
            <span className="text-text-muted" aria-hidden="true">&bull;</span>
            <span className="inline-flex items-center gap-1.5 text-text-muted">
              <Clock className="w-4 h-4 shrink-0 text-text-muted" strokeWidth={1.5} aria-hidden="true" />
              <span>{plannedCount} Planned Extensions</span>
            </span>
          </div>
        </div>

        {/* Right: Operational Status Indicator */}
        <div className="shrink-0 flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-mono text-text-muted">Active Defense Level</div>
            <div className="text-sm font-semibold font-mono text-text">
              {implementedPercentage}% Hardened ({implementedCount}/{totalCount})
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-accent">
            <Layers className="w-5 h-5" strokeWidth={1.5} aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Progress Track */}
      <div
        className="mt-5 w-full bg-surface-2 rounded-full h-2 overflow-hidden flex border border-border"
        role="progressbar"
        aria-valuenow={implementedCount}
        aria-valuemin={0}
        aria-valuemax={totalCount}
        aria-label={`${implementedCount} of ${totalCount} guardrails active`}
      >
        <div
          className="bg-success h-full transition-all duration-300 rounded-l-full"
          style={{ width: `${implementedPercentage}%` }}
        />
        <div
          className="bg-surface-2 h-full transition-all duration-300 rounded-r-full"
          style={{ width: `${100 - implementedPercentage}%` }}
        />
      </div>
    </div>
  );
};
