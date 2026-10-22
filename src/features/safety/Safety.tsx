import React, { useState } from 'react';
import { SAFETY_ITEMS } from '@/data/safety';
import { SafetySummary } from './SafetySummary';
import { EmergencyCallout } from './EmergencyCallout';
import { SafetyCard } from './SafetyCard';
import { ShieldCheck } from 'lucide-react';

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

        {/* Summary Counter at Top */}
        <SafetySummary
          implementedCount={implementedCount}
          plannedCount={plannedCount}
          totalCount={totalCount}
        />

        {/* Emergency Kill Switch & Allowlist Callout Box */}
        <EmergencyCallout />

        {/* Security Checklist Section */}
        <div className="mt-12">
          {/* Checklist controls: Title and Filter Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
            <div>
              <h3 className="text-xl font-semibold text-text tracking-tight">
                Security &amp; Guardrail Checklist
              </h3>
              <p className="text-xs sm:text-sm text-text-muted mt-1 font-mono">
                Showing {filteredItems.length} of {totalCount} items
              </p>
            </div>

            {/* Filter Tabs */}
            <div
              className="inline-flex items-center p-1 rounded-xl bg-surface-2 border border-border self-start sm:self-auto"
              role="group"
              aria-label="Filter guardrails"
            >
              <button
                type="button"
                onClick={() => setFilter('all')}
                aria-pressed={filter === 'all'}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  filter === 'all'
                    ? 'bg-surface text-text shadow-xs font-semibold'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('implemented')}
                aria-pressed={filter === 'implemented'}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  filter === 'implemented'
                    ? 'bg-surface text-success shadow-xs font-semibold'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Implemented ({implementedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('planned')}
                aria-pressed={filter === 'planned'}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  filter === 'planned'
                    ? 'bg-surface text-text shadow-xs font-semibold'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Planned ({plannedCount})
              </button>
            </div>
          </div>

          {/* Checklist Grid */}
          <ul
            className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 list-none p-0 m-0"
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
      </div>
    </section>
  );
};

export default Safety;
