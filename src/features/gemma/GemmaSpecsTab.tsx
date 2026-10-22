import React from 'react';
import { GEMMA_FACTS } from '@/data/gemma';
import { ExternalLink, Layers, Cpu, Code2, Eye, BookOpen, ShieldCheck } from 'lucide-react';

interface ModelTier {
  name: string;
  type: string;
  context: string;
  bestFor: string;
  activeParams?: string;
}

const MODEL_TIERS: ModelTier[] = [
  {
    name: 'Gemma 4 E2B / E4B',
    type: 'Edge & Mobile Dense',
    context: '128K tokens',
    bestFor: 'Edge automation, LiteRT runtime, classification',
  },
  {
    name: 'Gemma 4 12B',
    type: 'Workstation Dense',
    context: '256K tokens',
    bestFor: 'Open-weights execution on consumer GPUs and Apple Silicon unified memory',
  },
  {
    name: 'Gemma 4 26B A4B',
    type: 'Mixture-of-Experts (MoE)',
    activeParams: '4B active / 26B total',
    context: '256K tokens',
    bestFor: 'Workflow routing and cloud API orchestration with gemma-4-26b-a4b-it',
  },
  {
    name: 'Gemma 4 31B',
    type: 'Flagship Dense',
    context: '256K tokens',
    bestFor: 'Reasoning and visual screenshot inspection with gemma-4-31b-it',
  },
];

const getFactIcon = (label: string) => {
  const lower = label.toLowerCase();
  if (lower.includes('model id') || lower.includes('api')) return <Code2 className="w-5 h-5 text-accent" strokeWidth={1.5} aria-hidden="true" />;
  if (lower.includes('family') || lower.includes('size')) return <Layers className="w-5 h-5 text-accent" strokeWidth={1.5} aria-hidden="true" />;
  if (lower.includes('function') || lower.includes('tool')) return <Cpu className="w-5 h-5 text-accent" strokeWidth={1.5} aria-hidden="true" />;
  if (lower.includes('vision') || lower.includes('screenshot')) return <Eye className="w-5 h-5 text-accent" strokeWidth={1.5} aria-hidden="true" />;
  if (lower.includes('context')) return <BookOpen className="w-5 h-5 text-accent" strokeWidth={1.5} aria-hidden="true" />;
  if (lower.includes('license')) return <ShieldCheck className="w-5 h-5 text-accent" strokeWidth={1.5} aria-hidden="true" />;
  return <Cpu className="w-5 h-5 text-accent" strokeWidth={1.5} aria-hidden="true" />;
};

export const GemmaSpecsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Overview introduction */}
      <div className="rounded-[14px] bg-surface border border-border p-5 sm:p-6">
        <h4 className="text-base sm:text-lg font-semibold text-text mb-2 flex items-center gap-2">
          <Layers className="w-5 h-5 text-accent" strokeWidth={1.5} aria-hidden="true" />
          Model Family Architecture
        </h4>
        <p className="text-sm text-text-muted leading-relaxed mb-6">
          Google&apos;s Gemma 4 family spans mobile edge variants to 256K-context reasoning models.
          With native function calling and image understanding in the base weights under an Apache 2.0 license,
          Gemma provides open foundation models for autonomous orchestration.
        </p>

        {/* Model Family Tiers Table / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MODEL_TIERS.map((tier) => (
            <div
              key={tier.name}
              className="p-4 rounded-[10px] bg-surface-2 border border-border flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h5 className="font-semibold text-sm text-text">{tier.name}</h5>
                  <span className="text-xs px-2 py-0.5 rounded-[6px] bg-surface border border-border text-accent font-mono font-medium">
                    {tier.context}
                  </span>
                </div>
                <div className="text-xs font-medium text-text-muted mb-2 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
                  {tier.type}
                  {tier.activeParams && (
                    <span className="text-xs text-accent">({tier.activeParams})</span>
                  )}
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  {tier.bestFor}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Facts Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base sm:text-lg font-semibold text-text flex items-center gap-2">
            <Cpu className="w-5 h-5 text-accent" strokeWidth={1.5} aria-hidden="true" />
            Verified Technical Specifications
          </h4>
          <span className="text-xs font-mono text-text-muted">Source: ai.google.dev</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GEMMA_FACTS.map((fact) => (
            <div
              key={fact.label}
              className="p-5 rounded-[14px] bg-surface border border-border flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-2 rounded-[8px] bg-surface-2 border border-border">
                    {getFactIcon(fact.label)}
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-[6px] bg-surface-2 text-text-muted border border-border">
                    Verified
                  </span>
                </div>
                <h5 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-1.5">
                  {fact.label}
                </h5>
                <p className="text-sm font-medium text-text mb-4 break-words leading-snug">
                  {fact.value}
                </p>
              </div>

              <div className="pt-3 border-t border-border mt-auto">
                <a
                  href={fact.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded transition-colors break-all"
                  aria-label={`Official documentation for ${fact.label} on Google AI`}
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  <span className="truncate">{fact.source}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
