import React from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { FAQ_ITEMS } from '@/data/faq';
import { HelpCircle, ChevronDown, CheckCircle2, ShieldCheck } from 'lucide-react';

export const Faq: React.FC = () => {
  return (
    <section id="faq" className="py-20 lg:py-32 border-b border-border bg-bg">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border border-border bg-surface-2 text-text-muted mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} aria-hidden="true" />
            <span>Questions and Answers</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-text tracking-tight mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-base text-text-muted leading-relaxed">
            Technical answers regarding architecture, simulation scope, known limitations, and reproduction.
          </p>
        </div>

        {/* Radix Accordion */}
        <Accordion.Root
          type="single"
          collapsible
          defaultValue="item-0"
          className="w-full space-y-3"
        >
          {FAQ_ITEMS.map((item, index) => {
            const itemValue = `item-${index}`;
            return (
              <Accordion.Item
                key={itemValue}
                value={itemValue}
                className="rounded-[14px] bg-surface border border-border overflow-hidden transition-colors"
              >
                <Accordion.Header className="flex m-0">
                  <Accordion.Trigger className="group flex flex-1 items-center justify-between gap-4 p-5 sm:p-6 text-left font-medium text-sm sm:text-base text-text transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent cursor-pointer">
                    <span className="flex items-center gap-3.5 min-w-0">
                      <span className="flex items-center justify-center w-7 h-7 rounded-[8px] bg-surface-2 text-xs font-mono text-text-muted border border-border shrink-0">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                      <span className="break-words">{item.q}</span>
                    </span>
                    <ChevronDown
                      className="w-4 h-4 text-text-muted transition-transform duration-200 shrink-0 group-data-[state=open]:rotate-180 group-data-[state=open]:text-accent"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </Accordion.Trigger>
                </Accordion.Header>

                <Accordion.Content className="overflow-hidden text-sm text-text-muted leading-relaxed transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 border-t border-border/40 mt-1">
                    <p className="leading-relaxed text-text-muted pt-3">
                      {item.a}
                    </p>
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            );
          })}
        </Accordion.Root>

        {/* Footer Box */}
        <div className="mt-12 p-5 sm:p-6 rounded-[14px] bg-surface-2 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[10px] bg-surface border border-border text-accent shrink-0">
              <ShieldCheck className="w-5 h-5 text-accent" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text">
                Reproducible and Open Source
              </h4>
              <p className="text-xs text-text-muted">
                Run the interactive walkthrough locally with zero external API dependencies required.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-surface text-text border border-border">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" strokeWidth={1.5} aria-hidden="true" />
              Apache-2.0
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
