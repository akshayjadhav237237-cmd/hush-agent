import React, { useState } from 'react';
import { SAFETY_ITEMS } from '@/data/safety';
import { SafetySummary } from './SafetySummary';
import { EmergencyCallout } from './EmergencyCallout';
import { SafetyCard } from './SafetyCard';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

type FilterState = 'All' | 'Implemented' | 'Unverified' | 'Planned';

export const Safety: React.FC = () => {
  const [filter, setFilter] = useState<FilterState>('All');

  const totalCount = SAFETY_ITEMS.length;
  const implementedCount = SAFETY_ITEMS.filter((item) => item.implemented).length;
  const unverifiedCount = SAFETY_ITEMS.filter((item) => item.desktopVerified === false).length;
  const plannedCount = SAFETY_ITEMS.filter((item) => !item.implemented).length;

  const filteredItems = SAFETY_ITEMS.filter((item) => {
    if (filter === 'Implemented') return item.implemented;
    if (filter === 'Unverified') return item.desktopVerified === false;
    if (filter === 'Planned') return !item.implemented;
    return true;
  });

  const filterTabs: { id: FilterState; label: string; count: number }[] = [
    { id: 'All', label: 'All', count: totalCount },
    { id: 'Implemented', label: 'Implemented', count: implementedCount },
    { id: 'Unverified', label: 'Unverified', count: unverifiedCount },
    { id: 'Planned', label: 'Planned', count: plannedCount },
  ];

  return (
    <section
      id="safety"
      aria-labelledby="safety-heading"
      className="py-20 lg:py-32 border-t border-border bg-bg text-text"
    >
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-surface-2 border border-border text-text-muted mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} aria-hidden="true" />
            <span>Multi-Tier Defense Architecture</span>
          </div>
          <h2
            id="safety-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-serif tracking-tight text-text"
          >
            Safety Guardrails &amp; Controls
          </h2>
          <p className="mt-4 text-base sm:text-lg text-text-muted leading-relaxed">
            Autonomous agent execution requires explicit containment. Hush combines policy command sandboxing, process limits, hardware interrupts, and planned forensic audit trails.
          </p>
        </div>

        {/* Stats Row & Summary Counter at Top */}
        <SafetySummary
          implementedCount={implementedCount}
          plannedCount={plannedCount}
          totalCount={totalCount}
        />

        {/* Emergency Kill Switch & Allowlist Callout Box */}
        <EmergencyCallout />

        {/* Security Checklist Section */}
        <div className="mt-12">
          {/* Checklist controls: Title and Mono Pill Filter Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
            <div>
              <h3 className="text-xl font-semibold text-text tracking-tight">
                Security &amp; Guardrail Checklist
              </h3>
              <p className="text-xs sm:text-sm text-text-muted mt-1 font-mono">
                Showing {filteredItems.length} of {totalCount} items
              </p>
            </div>

            {/* Filter Buttons Styled as Mono Pills */}
            <div
              className="flex flex-wrap items-center gap-2 self-start sm:self-auto"
              role="group"
              aria-label="Filter guardrails"
            >
              {filterTabs.map((tab) => {
                const isActive = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilter(tab.id)}
                    aria-pressed={isActive}
                    className={`px-3.5 py-1.5 rounded-full font-mono text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      isActive
                        ? 'bg-accent/15 text-accent border border-accent/40 font-semibold shadow-xs'
                        : 'bg-surface border border-border text-text-muted hover:text-text hover:border-border/80'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="ml-1.5 opacity-75 font-normal">({tab.count})</span>
                  </button>
                );
              })}
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

          {filteredItems.length === 0 && (
            <div className="py-12 text-center font-mono text-sm text-text-muted">
              No guardrails match the current filter selection.
            </div>
          )}
        </div>

        {/* Known Limitations Block */}
        <div className="mt-16 bg-[#141414] dark:bg-[#141414] bg-surface border border-border rounded-[24px] p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
            <div className="w-10 h-10 rounded-xl bg-surface-2 border border-border flex items-center justify-center text-text shrink-0">
              <AlertTriangle className="w-5 h-5 text-warning" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-text-muted font-medium">
                Transparent Boundaries
              </span>
              <h3 className="text-lg sm:text-xl font-semibold text-text tracking-tight">
                Known Limitations
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="p-5 rounded-2xl bg-surface-2/60 border border-border flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 font-mono text-xs font-semibold text-text">
                  <span className="w-2 h-2 rounded-full bg-warning shrink-0" aria-hidden="true" />
                  <span>1. Operational Guardrail vs. OS Sandbox</span>
                </div>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                  Allowlisted commands like <code className="font-mono text-text">python</code> and <code className="font-mono text-text">npm</code> can still execute arbitrary code (operational guardrail, not OS sandbox).
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-surface-2/60 border border-border flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 font-mono text-xs font-semibold text-text">
                  <span className="w-2 h-2 rounded-full bg-warning shrink-0" aria-hidden="true" />
                  <span>2. Unverified UI Click Accuracy</span>
                </div>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                  Gemma UI click accuracy is unverified; spatial coordinate grounding is experimental.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-surface-2/60 border border-border flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 font-mono text-xs font-semibold text-text">
                  <span className="w-2 h-2 rounded-full bg-warning shrink-0" aria-hidden="true" />
                  <span>3. Limit Detection vs. Code Handling</span>
                </div>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                  Limit detection is judged by the model visually from screenshots, while countdown waiting and state resumption are executed in code.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-surface-2/60 border border-border flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 font-mono text-xs font-semibold text-text">
                  <span className="w-2 h-2 rounded-full bg-warning shrink-0" aria-hidden="true" />
                  <span>4. Public ntfy Notification Topics</span>
                </div>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
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
