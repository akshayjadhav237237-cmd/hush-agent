import React from 'react';
import { ATTENTION_GATES } from '@/data/gates';
import { GateCard } from './GateCard';
import { FatigueCallout } from './FatigueCallout';
import { Shield, ShieldCheck } from 'lucide-react';

export const Gates: React.FC = () => {
  return (
    <section
      id="gates"
      aria-labelledby="gates-heading"
      className="py-20 lg:py-32 border-t border-border bg-bg text-text"
    >
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-surface-2 border border-border text-text-muted mb-4">
            <Shield className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} aria-hidden="true" />
            <span>Deterministic Interruption Engine</span>
          </div>
          <h2
            id="gates-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-serif tracking-tight text-text"
          >
            The 6 Attention Gates
          </h2>
          <p className="mt-4 text-base sm:text-lg text-text-muted leading-relaxed">
            Autonomous progress does not require constant confirmation. Hush runs silently across verified safe states. It escalates to human review only when an invariant trips.
          </p>
        </div>

        {/* Fatigue Callout */}
        <FatigueCallout />

        {/* Bento Grid Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-text-muted">
          <span className="uppercase tracking-wider font-semibold">
            Active Gate Invariants ({ATTENTION_GATES.length} Total)
          </span>
          <span className="inline-flex items-center gap-1.5 text-text-muted font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} aria-hidden="true" />
            Continuous Sandbox Enforcement
          </span>
        </div>

        {/* 6-Card Bento Grid */}
        <ul
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 list-none p-0 m-0"
          role="list"
          aria-label="Attention Gates List"
        >
          {ATTENTION_GATES.map((gate, index) => (
            <li key={gate.id} className="flex">
              <GateCard gate={gate} index={index} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Gates;
