import React, { useRef } from 'react';
import { Container } from '@/v2/ui/Container';
import { Eyebrow } from '@/v2/ui/Eyebrow';
import { SerifItalic } from '@/v2/ui/SerifItalic';
import { COPY_V2 } from '@/v2/data/copy.v2';
import { useScroll, motion, useTransform } from 'motion/react';
import { useReducedMotion } from '@/v2/ui/useReducedMotion';

export const How: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.85', 'end 0.35'],
  });

  const progressHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <div ref={containerRef} className="w-full py-20 sm:py-28 relative">
      <Container>
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16 sm:mb-20">
          <div>
            <Eyebrow label={COPY_V2.how.eyebrow} className="mb-4 font-mono tracking-wider" />
            <h2 className="font-display font-medium text-3xl sm:text-5xl text-[var(--v2-headline)] tracking-[-0.03em] leading-tight">
              {COPY_V2.how.title.plain}
              <SerifItalic className="font-accent italic">{COPY_V2.how.title.italic}</SerifItalic>
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base text-[var(--v2-muted)] font-body font-light leading-relaxed">
            {COPY_V2.how.paragraph}
          </p>
        </div>

        {/* Modern Vertical Step Layout */}
        <div className="relative pl-6 sm:pl-12">
          {/* Background thin vertical progress line */}
          <div className="absolute left-[11px] sm:left-[23px] top-6 bottom-6 w-[1px] bg-[var(--v2-line)] pointer-events-none" />

          {/* Filling vertical progress line */}
          <motion.div
            style={{ height: reducedMotion ? '100%' : progressHeight }}
            className="absolute left-[11px] sm:left-[23px] top-6 w-[1px] bg-[var(--v2-accent)] origin-top pointer-events-none"
          />

          <div className="flex flex-col gap-8 sm:gap-12">
            {COPY_V2.how.phases.map((item, idx) => {
              const stepNum = `0${idx + 1}`;

              const cardContent = (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs uppercase tracking-widest text-[var(--v2-accent)] px-3 py-1 rounded-full bg-[var(--v2-accent)]/10 border border-[var(--v2-accent)]/20">
                        {item.phase}
                      </span>
                      <span className="font-mono text-xs text-[var(--v2-muted)]">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="font-display font-medium text-2xl sm:text-[40px] text-[var(--v2-headline)] tracking-[-0.03em] leading-tight">
                      {item.title}
                    </h3>
                    <p className="font-body font-light text-base sm:text-lg text-[var(--v2-muted)] leading-relaxed max-w-2xl">
                      {item.description}
                    </p>
                  </div>

                  <div className="hidden lg:flex items-center justify-center font-display font-light text-6xl sm:text-7xl text-white/10 select-none">
                    {stepNum}
                  </div>
                </div>
              );

              return (
                <div key={item.phase} className="relative flex items-start gap-6 sm:gap-10">
                  {/* Step Node indicator on the line */}
                  <div className="absolute -left-[23px] sm:-left-[35px] top-8 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-[#101010] border border-[var(--v2-line)]">
                    <div className="w-2 h-2 rounded-full bg-[var(--v2-accent)]" />
                  </div>

                  {/* Step Card */}
                  {reducedMotion ? (
                    <div className="w-full rounded-[var(--v2-radius-card)] p-6 sm:p-10 bg-[#101010] border border-[white/0.06] shadow-xl hover:-translate-y-1 transition-all duration-300">
                      {cardContent}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-100px' }}
                      transition={{ duration: 0.6, delay: idx * 0.15, ease: [0.21, 0.47, 0.32, 0.98] }}
                      className="w-full rounded-[var(--v2-radius-card)] p-6 sm:p-10 bg-[#101010] border border-[rgba(255,255,255,0.06)] shadow-xl hover:-translate-y-1 hover:border-[var(--v2-accent)]/30 transition-all duration-300"
                    >
                      {cardContent}
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </div>
  );
};
