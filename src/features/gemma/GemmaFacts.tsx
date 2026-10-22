import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Cpu, Workflow, Scale } from 'lucide-react';
import { GemmaAwardCallout } from './GemmaAwardCallout';
import { GemmaSpecsTab } from './GemmaSpecsTab';
import { GemmaUsageTab } from './GemmaUsageTab';
import { GemmaLimitsTab } from './GemmaLimitsTab';

export const GemmaFacts: React.FC = () => {
  return (
    <section id="gemma-facts" className="py-20 lg:py-32 border-b border-border bg-bg">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border border-border bg-surface-2 text-text-muted mb-4">
            <Cpu className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} aria-hidden="true" />
            <span>Open Weights</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-text tracking-tight mb-3">
            Gemma 4 Architecture and Integration
          </h2>
          <p className="text-base text-text-muted leading-relaxed">
            How Hush uses open-weights Gemma 4 models for function orchestration, visual verification, and attention gating.
          </p>
        </div>

        {/* Award Spotlight Callout */}
        <GemmaAwardCallout />

        {/* Radix Tabs Section */}
        <Tabs.Root defaultValue="specs" className="w-full">
          <Tabs.List
            className="flex flex-wrap sm:flex-nowrap gap-1.5 p-1.5 rounded-[14px] bg-surface border border-border mb-8"
            aria-label="Gemma 4 Features and Technical Details"
          >
            <Tabs.Trigger
              value="specs"
              className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] text-xs sm:text-sm font-medium transition-colors cursor-pointer text-text-muted hover:text-text data-[state=active]:bg-surface-2 data-[state=active]:text-text data-[state=active]:border data-[state=active]:border-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <Cpu className="w-4 h-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span>Model Family</span>
            </Tabs.Trigger>

            <Tabs.Trigger
              value="usage"
              className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] text-xs sm:text-sm font-medium transition-colors cursor-pointer text-text-muted hover:text-text data-[state=active]:bg-surface-2 data-[state=active]:text-text data-[state=active]:border data-[state=active]:border-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <Workflow className="w-4 h-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span>Where We Use Gemma</span>
            </Tabs.Trigger>

            <Tabs.Trigger
              value="limits"
              className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] text-xs sm:text-sm font-medium transition-colors cursor-pointer text-text-muted hover:text-text data-[state=active]:bg-surface-2 data-[state=active]:text-text data-[state=active]:border data-[state=active]:border-border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <Scale className="w-4 h-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span>Capabilities and Limits</span>
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content
            value="specs"
            className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-[14px]"
          >
            <GemmaSpecsTab />
          </Tabs.Content>

          <Tabs.Content
            value="usage"
            className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-[14px]"
          >
            <GemmaUsageTab />
          </Tabs.Content>

          <Tabs.Content
            value="limits"
            className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-[14px]"
          >
            <GemmaLimitsTab />
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </section>
  );
};
