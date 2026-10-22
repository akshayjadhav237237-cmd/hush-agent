import React from 'react';
import { COPY } from '@/data/copy';

export const Mission: React.FC = () => {
  return (
    <section
      id="mission"
      aria-labelledby="mission-heading"
      className="w-full px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-[1120px] mx-auto my-16 p-8 sm:p-14 bg-[#141414] rounded-[24px] border border-[rgba(255,255,255,0.06)] text-center relative overflow-hidden">
        {/* Subtle decorative radial accent glow */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(34,255,110,0.05),transparent_70%)]"
          aria-hidden="true"
        />

        {/* Section label */}
        <div className="font-mono text-xs uppercase tracking-[0.2em] text-[rgba(245,240,232,0.45)] mb-6">
          [ MISSION ]
        </div>

        {/* Huge centered mint headline with Cormorant Garamond italic serif accent phrase */}
        <h2
          id="mission-heading"
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-[#F0FFE8] leading-[1.15] max-w-4xl mx-auto"
        >
          Builds <span className="font-serif italic font-normal text-[#22FF6E]">Quietly.</span> Speaks Only When It Must.
        </h2>

        {/* Scroll-reveal paragraph */}
        <p className="scroll-reveal text-lg sm:text-xl lg:text-2xl text-[#F5F0E8] leading-relaxed text-center max-w-3xl mx-auto my-8 font-sans font-normal">
          {COPY.hero.subhead}
        </p>

        {/* Two centered one-liners below */}
        <div className="pt-8 border-t border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm font-mono text-[rgba(245,240,232,0.45)] text-center">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22FF6E] shrink-0" aria-hidden="true" />
            <span>Autonomous multi-agent desktop execution without human friction.</span>
          </div>
          <span className="hidden sm:inline text-[rgba(255,255,255,0.15)]" aria-hidden="true">
            •
          </span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22FF6E] shrink-0" aria-hidden="true" />
            <span>Attention gates suspend execution only when progress is impossible without you.</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Mission;
