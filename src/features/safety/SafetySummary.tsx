import React from 'react';
import { ShieldCheck, Clock } from 'lucide-react';
import { BASE_TOOL_COUNT, SWITCHING_TOOL_COUNT } from '@/data/brand';

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

  return (
    <div className="bg-[#141414] border border-white/[0.06] rounded-[24px] p-6 sm:p-8 mb-10">
      {/* Stats row with big bold numbers separated by thin vertical dividers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06] pb-8 mb-8 border-b border-white/[0.06]">
        <div className="py-4 lg:py-0 px-4 sm:px-6 text-center first:pl-0">
          <div className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold text-[#F0FFE8] tracking-tight">
            {BASE_TOOL_COUNT}
          </div>
          <div className="mt-2 text-[11px] sm:text-xs font-mono uppercase tracking-[0.15em] text-[#F5F0E8]/45">
            BASE TOOLS
          </div>
        </div>

        <div className="py-4 lg:py-0 px-4 sm:px-6 text-center">
          <div className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold text-[#22FF6E] tracking-tight">
            {SWITCHING_TOOL_COUNT}
          </div>
          <div className="mt-2 text-[11px] sm:text-xs font-mono uppercase tracking-[0.15em] text-[#F5F0E8]/45">
            WITH SWITCHING
          </div>
        </div>

        <div className="py-4 lg:py-0 px-4 sm:px-6 text-center">
          <div className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold text-[#F0FFE8] tracking-tight">
            80
          </div>
          <div className="mt-2 text-[11px] sm:text-xs font-mono uppercase tracking-[0.15em] text-[#F5F0E8]/45">
            MAX STEPS
          </div>
        </div>

        <div className="py-4 lg:py-0 px-4 sm:px-6 text-center last:pr-0">
          <div className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold text-[#22FF6E] tracking-tight">
            2
          </div>
          <div className="mt-2 text-[11px] sm:text-xs font-mono uppercase tracking-[0.15em] text-[#F5F0E8]/45">
            MAX PROFILE SWITCHES
          </div>
        </div>
      </div>

      {/* Guardrail Status Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Summary Counter */}
        <div>
          <div className="text-xs font-mono uppercase tracking-[0.15em] text-[#F5F0E8]/45 mb-1.5">
            Guardrail Status Counter
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-[#F5F0E8] tracking-tight flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1.5 text-[#22FF6E]">
              <ShieldCheck className="w-5 h-5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span>{implementedCount} Implemented Guardrails</span>
            </span>
            <span className="text-[#F5F0E8]/30" aria-hidden="true">&bull;</span>
            <span className="inline-flex items-center gap-1.5 text-[#E3B15C]">
              <Clock className="w-4 h-4 shrink-0 text-[#E3B15C]" strokeWidth={1.5} aria-hidden="true" />
              <span>{plannedCount} Planned Extension{plannedCount === 1 ? '' : 's'}</span>
            </span>
          </div>
        </div>

        {/* Right: Operational Status Indicator */}
        <div className="shrink-0 flex items-center gap-3">
          <div className="text-left sm:text-right">
            <div className="text-xs font-mono text-[#F5F0E8]/45">Active Defense Level</div>
            <div className="text-sm font-semibold font-mono text-[#22FF6E]">
              {implementedPercentage}% Hardened ({implementedCount}/{totalCount})
            </div>
          </div>
        </div>
      </div>

      {/* Progress Track */}
      <div
        className="mt-5 w-full bg-white/5 rounded-full h-2 overflow-hidden flex border border-white/[0.06]"
        role="progressbar"
        aria-valuenow={implementedCount}
        aria-valuemin={0}
        aria-valuemax={totalCount}
        aria-label={`${implementedCount} of ${totalCount} guardrails active`}
      >
        <div
          className="bg-[#22FF6E] h-full transition-all duration-300 rounded-l-full"
          style={{ width: `${implementedPercentage}%` }}
        />
        <div
          className="bg-white/5 h-full transition-all duration-300 rounded-r-full"
          style={{ width: `${100 - implementedPercentage}%` }}
        />
      </div>
    </div>
  );
};
