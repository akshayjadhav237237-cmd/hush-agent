import React from 'react';
import { Container } from '@/v2/ui/Container';
import { VideoBg } from '@/v2/ui/VideoBg';
import { BENTO_MEDIA } from '@/v2/data/media';
import { COPY_V2 } from '@/v2/data/copy.v2';
import { bentoCards } from '@/v2/data/adapters';
import { Bot, Shield, Network, Check } from 'lucide-react';
import { useReducedMotion } from '@/v2/ui/useReducedMotion';

export const Bento: React.FC = () => {
  const cards = bentoCards();
  const reducedMotion = useReducedMotion();

  const hoverLiftClass = reducedMotion
    ? ''
    : 'motion-safe:hover:-translate-y-1 motion-safe:transition-transform motion-safe:duration-200 motion-reduce:transform-none';

  const getIcon = (name: 'bot' | 'shield' | 'network') => {
    switch (name) {
      case 'bot':
        return <Bot className="w-5 h-5 text-[var(--v2-accent)]" strokeWidth={1.5} />;
      case 'shield':
        return <Shield className="w-5 h-5 text-[var(--v2-accent)]" strokeWidth={1.5} />;
      case 'network':
        return <Network className="w-5 h-5 text-[var(--v2-accent)]" strokeWidth={1.5} />;
    }
  };

  return (
    <div className="w-full py-16 sm:py-24">
      <Container>
        {/* Section Header: Cormorant serif title with periwinkle subtitle */}
        <div className="mb-12 sm:mb-16">
          <h2 className="font-serif-title text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[var(--v2-text)] font-normal tracking-tight">
            {COPY_V2.bento.title.plain}
          </h2>
          <p className="mt-2.5 text-base sm:text-lg text-[var(--v2-link)] font-body">
            {COPY_V2.bento.subtitle}
          </p>
        </div>

        {/* 4-Column Bento Grid: 1 col mobile, 2 col tablet, 4 col desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* Column 1: Tall tile with VIDEO background and serif caption bottom-left */}
          <div
            className={`relative min-h-[380px] sm:min-h-[440px] rounded-[var(--v2-radius-card,28px)] overflow-hidden border border-[var(--v2-line)] bg-[var(--v2-card)] shadow-lg flex flex-col justify-end p-6 sm:p-8 ${hoverLiftClass}`}
          >
            <VideoBg
              mp4Src={BENTO_MEDIA.src}
              webmSrc={BENTO_MEDIA.webm}
              posterSrc={BENTO_MEDIA.poster}
              alt="Hush workflow orchestration demo"
              className="absolute inset-0"
              overlayGradient={true}
            />

            <div className="relative z-10">
              <p className="font-serif-title text-2xl sm:text-3xl text-[var(--v2-headline)] font-normal leading-tight">
                {COPY_V2.bento.tile1.caption}
              </p>
            </div>
          </div>

          {/* Columns 2-4: Dark rounded cards (28px radius) */}
          {cards.map((card) => (
            <div
              key={card.number}
              className={`flex flex-col justify-between rounded-[var(--v2-radius-card,28px)] p-6 sm:p-7 bg-[var(--v2-card)] border border-[var(--v2-line)] shadow-lg ${hoverLiftClass}`}
            >
              <div>
                {/* Top Row: Lucide icon in rounded square top-left, mono numeral top-right */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-[var(--v2-line)] flex items-center justify-center">
                    {getIcon(card.iconName)}
                  </div>
                  <span className="font-mono text-xs tracking-wider text-[var(--v2-muted)]">
                    {card.number}
                  </span>
                </div>

                {/* Serif Title */}
                <h3 className="font-serif-title text-xl sm:text-2xl text-[var(--v2-text)] font-normal mb-5 leading-snug">
                  {card.title}
                </h3>

                {/* Checkmark List (Lucide Check 1.5 stroke) */}
                <ul className="space-y-3.5 mb-8">
                  {card.items.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-[var(--v2-text)] opacity-80 font-body leading-relaxed"
                    >
                      <span className="shrink-0 mt-0.5 text-[var(--v2-accent)]" aria-hidden="true">
                        <Check className="w-4 h-4" strokeWidth={1.5} />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom: Learn more ↗ link */}
              <div className="pt-4 border-t border-[var(--v2-line)] mt-auto">
                <a
                  href={card.learnMoreHref}
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--v2-link)] hover:text-[var(--v2-accent)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--v2-accent)]"
                >
                  <span>Learn more ↗</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
};

export default Bento;
