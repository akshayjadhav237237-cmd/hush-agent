import React, { useState } from 'react';
import { SAFETY_ITEMS } from '@/data/safety';
import { SafetySummary } from './SafetySummary';
import { EmergencyCallout } from './EmergencyCallout';
import { SafetyCard } from './SafetyCard';
import { AlertTriangle } from 'lucide-react';

type FilterState = 'all' | 'implemented' | 'planned';

export const Safety: React.FC = () => {
  const [filter, setFilter] = useState<FilterState>('all');

  const implementedCount = SAFETY_ITEMS.filter((item) => item.implemented).length;
  const plannedCount = SAFETY_ITEMS.filter((item) => !item.implemented).length;
  const totalCount = SAFETY_ITEMS.length;

  const filteredItems = SAFETY_ITEMS.filter((item) => {
    if (filter === 'implemented') return item.implemented;
    if (filter === 'planned') return !item.implemented;
    return true;
  });

  return (
    <section
      id="safety"
      aria-labelledby="safety-heading"
      className="py-20 lg:py-32 border-t border-white/[0.06] bg-[#000] text-[#F5F0E8]"
    >
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-[#F5F0E8]/45 mb-4">
            [ SAFETY ]
          </div>
          <h2
            id="safety-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-sans font-bold tracking-tight text-[#F0FFE8]"
          >
            Multi-Tier <span className="font-serif italic font-normal text-[#22FF6E]">Defense Architecture.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#F5F0E8]/60 leading-relaxed font-sans">
            Autonomous agent execution requires explicit containment. Hush combines policy command sandboxing, process limits, hardware interrupts, and planned forensic audit trails.
          </p>
        </div>

        {/* Summary Counter at Top */}
        <SafetySummary
          implementedCount={implementedCount}
          plannedCount={plannedCount}
          totalCount={totalCount}
        />

        {/* Emergency Kill Switch & Allowlist Callout Box */}
        <EmergencyCallout />

        {/* Security Checklist Section */}
        <div className="mt-14">
          {/* Checklist controls: Title and Filter Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/[0.06]">
            <div>
              <h3 className="text-xl font-sans font-semibold text-[#F0FFE8] tracking-tight">
                Security &amp; Guardrail Checklist
              </h3>
              <p className="text-xs sm:text-sm text-[#F5F0E8]/45 mt-1 font-mono">
                Showing {filteredItems.length} of {totalCount} items
              </p>
            </div>

            {/* Filter Tabs */}
            <div
              className="inline-flex items-center p-1 rounded-full bg-[#141414] border border-white/[0.06] self-start sm:self-auto"
              role="group"
              aria-label="Filter guardrails"
            >
              <button
                type="button"
                onClick={() => setFilter('all')}
                aria-pressed={filter === 'all'}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22FF6E] ${
                  filter === 'all'
                    ? 'bg-white/10 text-[#F5F0E8] font-semibold'
                    : 'text-[#F5F0E8]/45 hover:text-[#F5F0E8]'
                }`}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('implemented')}
                aria-pressed={filter === 'implemented'}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22FF6E] ${
                  filter === 'implemented'
                    ? 'bg-[#22FF6E]/15 text-[#22FF6E] font-semibold'
                    : 'text-[#F5F0E8]/45 hover:text-[#F5F0E8]'
                }`}
              >
                Implemented ({implementedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('planned')}
                aria-pressed={filter === 'planned'}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22FF6E] ${
                  filter === 'planned'
                    ? 'bg-[#E3B15C]/15 text-[#E3B15C] font-semibold'
                    : 'text-[#F5F0E8]/45 hover:text-[#F5F0E8]'
                }`}
              >
                Planned ({plannedCount})
              </button>
            </div>
          </div>

          {/* Checklist Grid */}
          <ul
            className="grid grid-cols-1 md:grid-cols-2 gap-5 list-none p-0 m-0"
            role="list"
            aria-label="Security Checklist"
          >
            {filteredItems.map((item, index) => (
              <li key={item.id} className="flex">
                <SafetyCard item={item} index={index} />
              </li>
            ))}
          </ul>
        </div>

        {/* Known Limitations Block */}
        <div className="mt-16 bg-[#141414] border border-white/[0.06] rounded-[24px] p-6 sm:p-8">
          <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-white/[0.06]">
            <div className="w-10 h-10 rounded-[12px] bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#E3B15C] shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#E3B15C]" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.15em] text-[#F5F0E8]/45 font-medium">
                [ TRANSPARENT BOUNDARIES ]
              </span>
              <h3 className="text-lg sm:text-xl font-sans font-semibold text-[#F0FFE8] tracking-tight">
                Known Limitations
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="p-5 rounded-[18px] bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 font-mono text-xs font-semibold text-[#F5F0E8]">
                  <span className="w-2 h-2 rounded-full bg-[#E3B15C] shrink-0" aria-hidden="true" />
                  <span>1. Operational Guardrail vs. OS Sandbox</span>
                </div>
                <p className="text-xs sm:text-sm text-[#F5F0E8]/60 leading-relaxed font-sans">
                  Allowlisted commands like <code className="font-mono text-[#F0FFE8] bg-white/5 px-1 py-0.5 rounded">python</code> and <code className="font-mono text-[#F0FFE8] bg-white/5 px-1 py-0.5 rounded">npm</code> can still execute arbitrary code (operational guardrail, not OS sandbox).
                </p>
              </div>
            </div>

            <div className="p-5 rounded-[18px] bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 font-mono text-xs font-semibold text-[#F5F0E8]">
                  <span className="w-2 h-2 rounded-full bg-[#E3B15C] shrink-0" aria-hidden="true" />
                  <span>2. Unverified UI Click Accuracy</span>
                </div>
                <p className="text-xs sm:text-sm text-[#F5F0E8]/60 leading-relaxed font-sans">
                  Gemma UI click accuracy is unverified; spatial coordinate grounding is experimental.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-[18px] bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 font-mono text-xs font-semibold text-[#F5F0E8]">
                  <span className="w-2 h-2 rounded-full bg-[#E3B15C] shrink-0" aria-hidden="true" />
                  <span>3. Limit Detection vs. Code Handling</span>
                </div>
                <p className="text-xs sm:text-sm text-[#F5F0E8]/60 leading-relaxed font-sans">
                  Limit detection is judged by the model visually from screenshots, while countdown waiting and state resumption are executed in code.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-[18px] bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 font-mono text-xs font-semibold text-[#F5F0E8]">
                  <span className="w-2 h-2 rounded-full bg-[#E3B15C] shrink-0" aria-hidden="true" />
                  <span>4. Public ntfy Notification Topics</span>
                </div>
                <p className="text-xs sm:text-sm text-[#F5F0E8]/60 leading-relaxed font-sans">
                  ntfy push notification topics are public by design (security through obscurity; use high-entropy topic names).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Safety;
