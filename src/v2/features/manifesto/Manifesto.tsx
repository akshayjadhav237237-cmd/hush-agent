import React, { useMemo } from 'react';
import { Container } from '@/v2/ui/Container';
import { Eyebrow } from '@/v2/ui/Eyebrow';
import { WordReveal } from '@/v2/ui/reveal/WordReveal';
import { LineReveal } from '@/v2/ui/reveal/LineReveal';
import { COPY_V2 } from '@/v2/data/copy.v2';

export const Manifesto: React.FC = () => {
  const headlineTokens = useMemo(() => {
    const { part1, italic, part2 } = COPY_V2.manifesto.headline;
    const tokens: Array<{ word: string; isItalic?: boolean }> = [];

    part1.trim().split(/\s+/).filter(Boolean).forEach((w) => tokens.push({ word: w }));
    italic.trim().split(/\s+/).filter(Boolean).forEach((w) => tokens.push({ word: w, isItalic: true }));
    part2.trim().split(/\s+/).filter(Boolean).forEach((w) => tokens.push({ word: w }));

    return tokens;
  }, []);

  return (
    <div className="w-full py-16 sm:py-24 lg:py-32">
      <Container size="narrow">
        {/* Dark Rounded Manifesto Card */}
        <div className="relative w-full bg-[var(--v2-card)] border border-[var(--v2-line)] rounded-[28px] sm:rounded-[36px] lg:rounded-[var(--v2-radius-manifesto,40px)] px-6 py-12 sm:px-12 sm:py-20 lg:px-16 lg:py-24 text-center shadow-2xl overflow-hidden">
          {/* Subtle top sheen */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[var(--v2-line)] to-transparent pointer-events-none"
            aria-hidden="true"
          />

          {/* Eyebrow */}
          <div className="flex justify-center mb-8 sm:mb-10">
            <Eyebrow label={COPY_V2.manifesto.eyebrow} />
          </div>

          {/* Headline with Word-by-Word Scroll Reveal */}
          <div className="max-w-4xl mx-auto mb-10 sm:mb-14">
            <WordReveal
              tokens={headlineTokens}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] lg:leading-[1.18] font-bold tracking-tight text-[var(--v2-headline)]"
            />
          </div>

          {/* Paragraph with Line-by-Line Scroll Reveal */}
          <div className="max-w-2xl mx-auto mb-12 sm:mb-16">
            <LineReveal
              text={COPY_V2.manifesto.paragraph}
              className="text-base sm:text-lg md:text-xl text-[var(--v2-text)] leading-relaxed font-body"
            />
          </div>

          {/* Two Short Centered Lines */}
          <div className="flex flex-col items-center gap-2 pt-8 border-t border-[var(--v2-line)] text-xs sm:text-sm font-mono text-[var(--v2-muted)]">
            <p className="tracking-wide">{COPY_V2.manifesto.lineA}</p>
            <p className="tracking-wide text-[var(--v2-accent)]">{COPY_V2.manifesto.lineB}</p>
          </div>
        </div>
      </Container>
    </div>
  );
};
