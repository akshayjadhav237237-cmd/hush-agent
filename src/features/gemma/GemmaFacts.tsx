import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { Cpu, Workflow, Scale } from 'lucide-react';
import { GemmaAwardCallout } from './GemmaAwardCallout';
import { GemmaSpecsTab } from './GemmaSpecsTab';
import { GemmaUsageTab } from './GemmaUsageTab';
import { GemmaLimitsTab } from './GemmaLimitsTab';

export const GemmaFacts: React.FC = () => {
  return (
    <section
      id="gemma-facts"
      aria-labelledby="gemma-facts-heading"
      className="py-20 lg:py-32 border-b border-[rgba(255,255,255,0.06)] bg-[#000000] text-[#F5F0E8]"
    >
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-[rgba(245,240,232,0.45)] mb-4">
            [ GEMMA 4 ORCHESTRATION ]
          </div>
          <h2
            id="gemma-facts-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-[#F0FFE8] tracking-tight mb-4 leading-[1.15]"
          >
            Gemma 4 <span className="font-serif italic font-normal text-[#22FF6E]">Architecture</span> &amp; Orchestration
          </h2>
          <p className="text-base sm:text-lg text-[rgba(245,240,232,0.55)] leading-relaxed max-w-2xl mx-auto">
            How Hush deploys open-weights Gemma 4 models for native function calling orchestration, multimodal visual verification, and attention gating.
          </p>
        </div>

        {/* Award Spotlight Callout */}
        <div className="mb-10">
          <GemmaAwardCallout />
        </div>

        {/* Radix Tabs Section */}
        <Tabs.Root defaultValue="specs" className="w-full">
          <Tabs.List
            className="flex flex-wrap sm:flex-nowrap gap-2 p-2 rounded-[24px] bg-[#141414] border border-[rgba(255,255,255,0.06)] mb-8"
            aria-label="Gemma 4 Features and Technical Details"
          >
            <Tabs.Trigger
              value="specs"
              className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-[16px] text-xs sm:text-sm font-mono font-medium transition-all cursor-pointer text-[rgba(245,240,232,0.55)] hover:text-[#F5F0E8] hover:bg-white/[0.03] data-[state=active]:bg-[#1C1C1C] data-[state=active]:text-[#F0FFE8] data-[state=active]:border data-[state=active]:border-[rgba(255,255,255,0.12)] data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22FF6E]"
            >
              <Cpu className="w-4 h-4 shrink-0 text-[#22FF6E]" strokeWidth={1.75} aria-hidden="true" />
              <span>Model Family</span>
            </Tabs.Trigger>

            <Tabs.Trigger
              value="usage"
              className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-[16px] text-xs sm:text-sm font-mono font-medium transition-all cursor-pointer text-[rgba(245,240,232,0.55)] hover:text-[#F5F0E8] hover:bg-white/[0.03] data-[state=active]:bg-[#1C1C1C] data-[state=active]:text-[#F0FFE8] data-[state=active]:border data-[state=active]:border-[rgba(255,255,255,0.12)] data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22FF6E]"
            >
              <Workflow className="w-4 h-4 shrink-0 text-[#22FF6E]" strokeWidth={1.75} aria-hidden="true" />
              <span>Where We Use Gemma</span>
            </Tabs.Trigger>

            <Tabs.Trigger
              value="limits"
              className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-[16px] text-xs sm:text-sm font-mono font-medium transition-all cursor-pointer text-[rgba(245,240,232,0.55)] hover:text-[#F5F0E8] hover:bg-white/[0.03] data-[state=active]:bg-[#1C1C1C] data-[state=active]:text-[#F0FFE8] data-[state=active]:border data-[state=active]:border-[rgba(255,255,255,0.12)] data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22FF6E]"
            >
              <Scale className="w-4 h-4 shrink-0 text-[#22FF6E]" strokeWidth={1.75} aria-hidden="true" />
              <span>Capabilities and Limits</span>
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content
            value="specs"
            className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22FF6E] rounded-[24px]"
          >
            <GemmaSpecsTab />
          </Tabs.Content>

          <Tabs.Content
            value="usage"
            className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22FF6E] rounded-[24px]"
          >
            <GemmaUsageTab />
          </Tabs.Content>

          <Tabs.Content
            value="limits"
            className="focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22FF6E] rounded-[24px]"
          >
            <GemmaLimitsTab />
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </section>
  );
};

export default GemmaFacts;
