import React from 'react';
import { Container } from '@/v2/ui/Container';
import { Eyebrow } from '@/v2/ui/Eyebrow';
import { SerifItalic } from '@/v2/ui/SerifItalic';
import { COPY_V2 } from '@/v2/data/copy.v2';
import { faqList } from '@/v2/data/adapters';
import { FAQ_SELECTED_IDS } from '@/v2/faqSelection';
import type { FaqItem } from '@/data/types';
import * as Accordion from '@radix-ui/react-accordion';
import { Plus, X } from 'lucide-react';

export const Faq: React.FC = () => {
  const allItems = faqList();
  const items: FaqItem[] = FAQ_SELECTED_IDS
    .map((id) => allItems.find((item) => item.q === id))
    .filter((item): item is FaqItem => item !== undefined);

  return (
    <div className="w-full py-16 sm:py-24">
      <Container size="narrow">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
          <div className="flex justify-center mb-4">
            <Eyebrow label={COPY_V2.faq.eyebrow} />
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-[var(--v2-headline)] tracking-tight">
            {COPY_V2.faq.title.plain}
            <SerifItalic>{COPY_V2.faq.title.italic}</SerifItalic>
          </h2>
        </div>

        {/* Radix Accordion */}
        <Accordion.Root
          type="single"
          collapsible
          className="divide-y divide-[var(--v2-line)] border-y border-[var(--v2-line)]"
        >
          {items.map((item, index) => {
            const numStr = (index + 1).toString().padStart(2, '0');
            const itemValue = `faq-${index}`;

            return (
              <Accordion.Item
                key={itemValue}
                value={itemValue}
                className="group py-2 overflow-hidden"
              >
                <Accordion.Header className="flex">
                  <Accordion.Trigger className="w-full py-5 flex items-center justify-between text-left transition-colors focus-visible:outline-2 focus-visible:outline-[var(--v2-accent)] focus-visible:outline-offset-2 rounded-lg cursor-pointer">
                    <div className="flex items-start sm:items-center gap-4 sm:gap-6 pr-4">
                      {/* Number: turns green on open */}
                      <span className="font-mono text-xs sm:text-sm tracking-wider text-[var(--v2-muted)] group-data-[state=open]:text-[var(--v2-accent)] font-semibold shrink-0 mt-0.5 sm:mt-0 transition-colors">
                        {numStr}
                      </span>
                      {/* Question title: bold grotesque */}
                      <span className="font-body font-bold text-base sm:text-lg text-[var(--v2-text)] group-hover:text-[var(--v2-headline)] group-data-[state=open]:text-[var(--v2-headline)] transition-colors">
                        {item.q}
                      </span>
                    </div>

                    {/* Icon: + when collapsed, × when open */}
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/[0.04] border border-[var(--v2-line)] flex items-center justify-center shrink-0 text-[var(--v2-muted)] group-data-[state=open]:text-[var(--v2-accent)] group-data-[state=open]:bg-[var(--v2-accent)]/10 group-data-[state=open]:border-[var(--v2-accent)]/30 transition-all">
                      <Plus className="w-4 h-4 block group-data-[state=open]:hidden" aria-hidden="true" />
                      <X className="w-4 h-4 hidden group-data-[state=open]:block" aria-hidden="true" />
                    </div>
                  </Accordion.Trigger>
                </Accordion.Header>

                <Accordion.Content className="pt-2 pb-6 pl-10 sm:pl-12 pr-4 sm:pr-8 text-sm sm:text-base text-[var(--v2-muted)] font-body leading-relaxed transition-all">
                  {item.a}
                </Accordion.Content>
              </Accordion.Item>
            );
          })}
        </Accordion.Root>
      </Container>
    </div>
  );
};

export default Faq;
