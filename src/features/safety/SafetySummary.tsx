import React from 'react';
import { TEST_COUNT } from '@/data/testcount';
import { BASE_TOOL_COUNT, SWITCHING_TOOL_COUNT } from '@/data/brand';
import { ShieldCheck, Clock } from 'lucide-react';

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
  const implementedPercentage = totalCount > 0 ? Math.round((implementedCount / totalCount) * 100) : 0;
  const maxSteps = 80;
  const maxSwitches = 2;

  return (
    <div className="bg-[#141414] dark:bg-[#141414] bg-surface border border-border rounded-[24px] p-6 sm:p-8 mb-10 shadow-xs">
      {/* Stats Row with Thin Vertical Dividers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:items-stretch md:justify-between gap-4 md:gap-0">
        {/* Metric 1: Safety Controls */}
        <div className="flex-1 min-w-[120px] text-center py-2 px-3">
          <div className="text-2xl sm:text-3xl font-mono font-bold text-text">
            {totalCount}
          </div>
          <div className="text-xs font-mono uppercase tracking-wider text-text-muted mt-1 font-semibold">
            Safety Controls
          </div>
          <div className="text-[11px] font-mono text-accent mt-0.5">
            {implementedCount} active · {plannedCount} planned
          </div>
        </div>

        {/* Thin vertical divider */}
        <div className="hidden md:block w-px bg-border my-1 self-stretch" aria-hidden="true" />

        {/* Metric 2: Tool Containment */}
        <div className="flex-1 min-w-[120px] text-center py-2 px-3">
          <div className="text-2xl sm:text-3xl font-mono font-bold text-text">
            {BASE_TOOL_COUNT} / {SWITCHING_TOOL_COUNT}
          </div>
          <div className="text-xs font-mono uppercase tracking-wider text-text-muted mt-1 font-semibold">
            Tool Count
          </div>
          <div className="text-[11px] font-mono text-text-muted mt-0.5">
            Base / Switching mode
          </div>
        </div>

        {/* Thin vertical divider */}
        <div className="hidden md:block w-px bg-border my-1 self-stretch" aria-hidden="true" />

        {/* Metric 3: Step Cap */}
        <div className="flex-1 min-w-[120px] text-center py-2 px-3">
          <div className="text-2xl sm:text-3xl font-mono font-bold text-text">
            {maxSteps}
          </div>
          <div className="text-xs font-mono uppercase tracking-wider text-text-muted mt-1 font-semibold">
            MAX_STEPS
          </div>
          <div className="text-[11px] font-mono text-text-muted mt-0.5">
            Hard execution limit
          </div>
        </div>

        {/* Thin vertical divider */}
        <div className="hidden md:block w-px bg-border my-1 self-stretch" aria-hidden="true" />

        {/* Metric 4: Max Switches */}
        <div className="flex-1 min-w-[120px] text-center py-2 px-3">
          <div className="text-2xl sm:text-3xl font-mono font-bold text-text">
            {maxSwitches}
          </div>
          <div className="text-xs font-mono uppercase tracking-wider text-text-muted mt-1 font-semibold">
            MAX_SWITCHES
          </div>
          <div className="text-[11px] font-mono text-text-muted mt-0.5">
            Per-session quota
          </div>
        </div>

        {/* Thin vertical divider */}
        <div className="hidden md:block w-px bg-border my-1 self-stretch" aria-hidden="true" />

        {/* Metric 5: Unit Tests */}
        <div className="flex-1 min-w-[120px] text-center py-2 px-3 col-span-2 sm:col-span-1">
          <div className="text-2xl sm:text-3xl font-mono font-bold text-accent">
            {TEST_COUNT > 0 ? TEST_COUNT : TEST_COUNT}
          </div>
          <div className="text-xs font-mono uppercase tracking-wider text-text-muted mt-1 font-semibold">
            UNIT TESTS
          </div>
          <div className="text-[11px] font-mono text-text-muted mt-0.5">
            Automated test suite
          </div>
        </div>
      </div>

      {/* Progress Track & Hardened Status Bar */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-accent">
              <ShieldCheck className="w-4 h-4 text-accent shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span>Active Defense Level</span>
            </span>
            <span className="text-text-muted text-xs font-mono">·</span>
            <span className="text-xs font-mono text-text-muted">
              {implementedPercentage}% Hardened ({implementedCount}/{totalCount} controls)
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
            <Clock className="w-3.5 h-3.5 text-warning shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span>{plannedCount} Planned Extension{plannedCount === 1 ? '' : 's'}</span>
          </div>
        </div>

        <div
          className="w-full bg-surface-2 rounded-full h-2 overflow-hidden flex border border-border"
          role="progressbar"
          aria-valuenow={implementedCount}
          aria-valuemin={0}
          aria-valuemax={totalCount}
          aria-label={`${implementedCount} of ${totalCount} guardrails active`}
        >
          <div
            className="bg-accent h-full transition-all duration-300 rounded-l-full"
            style={{ width: `${implementedPercentage}%` }}
          />
          <div
            className="bg-surface-2 h-full transition-all duration-300 rounded-r-full"
            style={{ width: `${100 - implementedPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
