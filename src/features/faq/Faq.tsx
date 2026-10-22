import React from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { FAQ_ITEMS } from '@/data/faq';
import { Plus, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const Faq: React.FC = () => {
  return (
    <section
      id="faq"
      aria-labelledby="faq-headline"
      className="relative py-20 lg:py-32 bg-black border-t border-white/[0.06] text-[#F5F0E8] font-['Space_Grotesk',sans-serif] overflow-hidden"
    >
      <style>{`
        @keyframes faqAccordionDown {
          from {
            height: 0;
            opacity: 0;
          }
          to {
            height: var(--radix-accordion-content-height);
            opacity: 1;
          }
        }
        @keyframes faqAccordionUp {
          from {
            height: var(--radix-accordion-content-height);
            opacity: 1;
          }
          to {
            height: 0;
            opacity: 0;
          }
        }
        .faq-content[data-state='open'] {
          animation: faqAccordionDown 260ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .faq-content[data-state='closed'] {
          animation: faqAccordionUp 200ms cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          {/* Section Mono Label */}
          <div className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-[0.2em] text-[rgba(245,240,232,0.45)] mb-4 select-none">
            [ FAQ ]
          </div>

          {/* Headline: Bold Grotesque with Italic Serif Accent Phrase */}
          <h2
            id="faq-headline"
            className="text-3xl sm:text-4xl lg:text-5xl font-['Archivo',sans-serif] font-bold tracking-tight text-[#F0FFE8]"
          >
            Frequently Asked{' '}
            <span className="font-['Cormorant_Garamond',serif] italic font-normal text-[#22FF6E]">
              Questions.
            </span>
          </h2>

          {/* Subtitle / Description */}
          <p className="mt-4 text-sm sm:text-base text-[rgba(245,240,232,0.75)] max-w-2xl mx-auto leading-relaxed">
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
            const formattedIndex = (index + 1).toString().padStart(2, '0');

            return (
              <Accordion.Item
                key={itemValue}
                value={itemValue}
                className="bg-[#141414] rounded-[16px] border border-white/[0.06] mb-3 overflow-hidden transition-all duration-300 hover:border-white/[0.12] data-[state=open]:border-white/[0.12]"
              >
                <Accordion.Header className="flex m-0 p-0">
                  <Accordion.Trigger className="group flex flex-1 items-center justify-between p-5 sm:p-6 text-left cursor-pointer w-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#22FF6E] transition-colors">
                    <div className="flex items-center gap-4 sm:gap-5 min-w-0 pr-4">
                      {/* Mono index */}
                      <span className="font-['JetBrains_Mono',monospace] text-xs sm:text-sm font-semibold tracking-wider text-[rgba(245,240,232,0.45)] group-data-[state=open]:text-[#22FF6E] transition-colors shrink-0">
                        {formattedIndex}
                      </span>
                      {/* Bold question title */}
                      <span className="font-['Space_Grotesk',sans-serif] font-semibold text-sm sm:text-base text-[#F5F0E8] group-hover:text-[#F0FFE8] transition-colors break-words">
                        {item.q}
                      </span>
                    </div>

                    {/* Indicator Icon */}
                    <div className="shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-white/[0.03] border border-white/[0.06] group-hover:border-white/[0.12] transition-colors">
                      <Plus
                        className="w-4 h-4 text-[rgba(245,240,232,0.45)] group-data-[state=open]:text-[#22FF6E] group-data-[state=open]:rotate-45 transition-transform duration-300"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </div>
                  </Accordion.Trigger>
                </Accordion.Header>

                {/* Expandable answer */}
                <Accordion.Content className="faq-content overflow-hidden text-sm sm:text-base leading-relaxed transition-all">
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-3 border-t border-white/[0.04]">
                    <p className="font-['Space_Grotesk',sans-serif] text-[rgba(245,240,232,0.75)] leading-relaxed text-sm sm:text-base">
                      {item.a}
                    </p>
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            );
          })}
        </Accordion.Root>

        {/* Reproducibility & Open Source Box */}
        <div className="mt-12 p-5 sm:p-6 rounded-[16px] bg-[#141414] border border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[12px] bg-white/[0.03] border border-white/[0.06] text-[#22FF6E] shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#22FF6E]" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-sm font-semibold font-['Space_Grotesk',sans-serif] text-[#F5F0E8]">
                Reproducible and Open Source
              </h4>
              <p className="text-xs text-[rgba(245,240,232,0.45)] font-['Space_Grotesk',sans-serif] mt-0.5">
                Run the interactive walkthrough locally with zero external API dependencies required.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-white/[0.03] text-[#F5F0E8] border border-white/[0.06]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22FF6E]" strokeWidth={1.5} aria-hidden="true" />
              Apache-2.0
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
