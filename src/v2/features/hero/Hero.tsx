import React from 'react';
import { VideoBg } from '@/v2/ui/VideoBg';
import { PillButton } from '@/v2/ui/PillButton';
import { HERO_MEDIA } from '@/v2/data/media';
import { COPY_V2 } from '@/v2/data/copy.v2';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { useReducedMotion } from '@/v2/ui/useReducedMotion';

export const Hero: React.FC = () => {
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="hero"
      aria-label="Hero"
      className="relative w-full p-3 sm:p-5 lg:p-[30px] bg-black"
    >
      {/* Inset Rounded Video Panel: 24px radius mobile, 40px desktop */}
      <div className="relative w-full min-h-[calc(100dvh-24px)] lg:min-h-[calc(100vh-60px)] rounded-[24px] sm:rounded-[32px] lg:rounded-[40px] overflow-hidden border border-[var(--v2-line)] shadow-2xl flex flex-col justify-end p-6 sm:p-10 lg:p-14">
        {/* Background Video */}
        <VideoBg
          mp4Src={HERO_MEDIA.src}
          webmSrc={HERO_MEDIA.webm}
          posterSrc={HERO_MEDIA.poster}
          alt="Hush autonomous desktop orchestrator hero video"
          className="absolute inset-0"
        />

        {/* Bottom Content Grid */}
        <div className="relative z-10 w-full flex flex-col lg:flex-row lg:items-end justify-between gap-8 sm:gap-12 pt-20">
          {/* Bottom Left: Giant Cream Bold Wordmark + Green Dot */}
          <div className="w-full lg:flex-1 lg:max-w-[55%]">
            <div className="inline-flex items-start">
              <h1 className="font-display font-extrabold text-[var(--v2-text)] tracking-[-0.04em] leading-[0.8] text-[19vw] sm:text-[14vw] md:text-[12vw] lg:text-[10vw] xl:text-[140px] 2xl:text-[170px] select-none">
                {COPY_V2.hero.wordmark}
              </h1>
              <span
                className="w-3.5 h-3.5 sm:w-5 sm:h-5 lg:w-7 lg:h-7 rounded-full bg-[var(--v2-accent)] mt-1.5 sm:mt-2.5 lg:mt-3.5 ml-1.5 sm:ml-2.5 shadow-[0_0_24px_var(--v2-accent)] shrink-0"
                aria-hidden="true"
              />
            </div>
            <p className="mt-3 text-xs sm:text-sm md:text-base font-mono uppercase tracking-[0.16em] text-[var(--v2-muted)]">
              {COPY_V2.hero.tagline}
            </p>
          </div>

          {/* Bottom Right: Paragraph, PillButton, GitHub Link, Scroll Cue */}
          <div className="w-full lg:max-w-md xl:max-w-lg flex flex-col items-start lg:items-end text-left lg:text-right gap-6">
            <p className="text-sm sm:text-base md:text-lg text-[var(--v2-text)] font-body leading-relaxed">
              {COPY_V2.hero.paragraph}
            </p>

            <div className="flex flex-wrap items-center gap-4 sm:gap-5">
              <PillButton href={COPY_V2.hero.ctaPillHref}>
                {COPY_V2.hero.ctaPill}
              </PillButton>

              <a
                href={COPY_V2.hero.textLinkHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[var(--v2-muted)] hover:text-[var(--v2-accent)] transition-colors py-2 px-1 focus-visible:outline-2 focus-visible:outline-[var(--v2-accent)]"
              >
                <span>{COPY_V2.hero.textLink}</span>
                <ArrowUpRight className="w-4 h-4 opacity-70" aria-hidden="true" />
              </a>
            </div>

            {/* Scroll Cue (static under reduced motion) */}
            <a
              href="#manifesto"
              aria-label="Scroll to manifesto"
              className="hidden sm:flex items-center gap-2 pt-2 text-[11px] font-mono tracking-[0.2em] text-[var(--v2-muted)] hover:text-[var(--v2-text)] uppercase select-none transition-colors"
            >
              <span>{COPY_V2.hero.cue}</span>
              <ArrowDown
                className={`w-3.5 h-3.5 ${
                  reducedMotion ? '' : 'animate-bounce'
                }`}
                aria-hidden="true"
              />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
