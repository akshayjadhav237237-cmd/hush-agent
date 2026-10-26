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

  const timelineScale = useTransform(scrollYProgress, [0.08, 0.85], [0, 1]);
  const node2Active = useTransform(scrollYProgress, [0.35, 0.5], [0, 1]);
  const node3Active = useTransform(scrollYProgress, [0.7, 0.85], [0, 1]);

  return (
    <div ref={containerRef} className="w-full py-16 sm:py-24">
      <Container>
        {/* Top Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-16 sm:mb-20">
          <div>
            <Eyebrow label={COPY_V2.how.eyebrow} className="mb-4" />
            <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-[var(--v2-headline)] tracking-tight">
              {COPY_V2.how.title.plain}
              <SerifItalic>{COPY_V2.how.title.italic}</SerifItalic>
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base text-[var(--v2-muted)] font-body leading-relaxed">
            {COPY_V2.how.paragraph}
          </p>
        </div>

        {/* 3-Node Timeline Bar (Desktop: Horizontal) */}
        <div className="relative mb-16 hidden md:block">
          {/* Background hairline from center of Col 1 to center of Col 3 */}
          <div className="absolute top-[10px] left-[calc(16.667%-8px)] right-[calc(16.667%-8px)] h-[1px] bg-[var(--v2-line)] pointer-events-none" />

          {/* Animated filling hairline */}
          <motion.div
            style={{ scaleX: reducedMotion ? 1 : timelineScale }}
            className="absolute top-[10px] left-[calc(16.667%-8px)] right-[calc(16.667%-8px)] h-[1px] bg-[var(--v2-accent)] origin-left pointer-events-none"
          />

          {/* Nodes aligned with 3-column card grid */}
          <div className="grid grid-cols-3 gap-6">
            {COPY_V2.how.nodes.map((node, idx) => {
              const isFirst = idx === 0;
              const activeMotion = idx === 1 ? node2Active : idx === 2 ? node3Active : null;

              return (
                <div key={node.id} className="flex flex-col items-center gap-3">
                  {/* Circle Node */}
                  <div className="relative z-10 flex items-center justify-center w-5 h-5">
                    {isFirst ? (
                      <div className="w-3.5 h-3.5 rounded-full bg-[var(--v2-accent)] shadow-[0_0_12px_var(--v2-accent)]" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-[var(--v2-line)] bg-[var(--v2-card)] relative">
                        <motion.div
                          style={{ opacity: reducedMotion ? 1 : activeMotion! }}
                          className="absolute inset-0 rounded-full bg-[var(--v2-accent)] shadow-[0_0_12px_var(--v2-accent)]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Mono Pill Label */}
                  {isFirst ? (
                    <span className="font-mono text-xs uppercase tracking-wider px-3.5 py-1 rounded-full border border-[var(--v2-accent)]/40 bg-[var(--v2-accent)]/10 text-[var(--v2-headline)] flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--v2-accent)]" />
                      {node.label}
                    </span>
                  ) : (
                    <span className="relative font-mono text-xs uppercase tracking-wider px-3.5 py-1 rounded-full border border-[var(--v2-line)] bg-white/[0.04] text-[var(--v2-muted)] overflow-hidden shadow-sm">
                      <motion.span
                        style={{ opacity: reducedMotion ? 1 : activeMotion! }}
                        className="absolute inset-0 bg-[var(--v2-accent)]/10 border border-[var(--v2-accent)]/40 rounded-full"
                      />
                      <span className="relative z-10 flex items-center gap-1.5">
                        <motion.span
                          style={{ opacity: reducedMotion ? 1 : activeMotion! }}
                          className="w-1.5 h-1.5 rounded-full bg-[var(--v2-accent)]"
                        />
                        <span>{node.label}</span>
                      </span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3-Node Timeline Bar (Mobile: Vertical/Stacked) */}
        <div className="relative mb-12 block md:hidden">
          <div className="relative flex flex-col gap-6 pl-2">
            {/* Background vertical hairline */}
            <div className="absolute left-[22px] top-[14px] bottom-[14px] w-[1px] bg-[var(--v2-line)] pointer-events-none" />

            {/* Animated filling vertical hairline */}
            <motion.div
              style={{ scaleY: reducedMotion ? 1 : timelineScale }}
              className="absolute left-[22px] top-[14px] bottom-[14px] w-[1px] bg-[var(--v2-accent)] origin-top pointer-events-none"
            />

            {/* Nodes Stack */}
            {COPY_V2.how.nodes.map((node, idx) => {
              const isFirst = idx === 0;
              const activeMotion = idx === 1 ? node2Active : idx === 2 ? node3Active : null;

              return (
                <div key={node.id} className="relative flex items-center gap-4">
                  {/* Circle Node */}
                  <div className="relative z-10 flex items-center justify-center w-7 h-7">
                    {isFirst ? (
                      <div className="w-3.5 h-3.5 rounded-full bg-[var(--v2-accent)] shadow-[0_0_12px_var(--v2-accent)]" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-[var(--v2-line)] bg-[var(--v2-card)] relative">
                        <motion.div
                          style={{ opacity: reducedMotion ? 1 : activeMotion! }}
                          className="absolute inset-0 rounded-full bg-[var(--v2-accent)] shadow-[0_0_12px_var(--v2-accent)]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Mono Pill Label */}
                  {isFirst ? (
                    <span className="font-mono text-xs uppercase tracking-wider px-3.5 py-1 rounded-full border border-[var(--v2-accent)]/40 bg-[var(--v2-accent)]/10 text-[var(--v2-headline)] flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--v2-accent)]" />
                      {node.label}
                    </span>
                  ) : (
                    <span className="relative font-mono text-xs uppercase tracking-wider px-3.5 py-1 rounded-full border border-[var(--v2-line)] bg-white/[0.04] text-[var(--v2-muted)] overflow-hidden shadow-sm">
                      <motion.span
                        style={{ opacity: reducedMotion ? 1 : activeMotion! }}
                        className="absolute inset-0 bg-[var(--v2-accent)]/10 border border-[var(--v2-accent)]/40 rounded-full"
                      />
                      <span className="relative z-10 flex items-center gap-1.5">
                        <motion.span
                          style={{ opacity: reducedMotion ? 1 : activeMotion! }}
                          className="w-1.5 h-1.5 rounded-full bg-[var(--v2-accent)]"
                        />
                        <span>{node.label}</span>
                      </span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3 Dark Phase Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COPY_V2.how.phases.map((item, idx) => {
            const isFirst = idx === 0;
            const activeMotion = idx === 1 ? node2Active : idx === 2 ? node3Active : null;

            return (
              <div
                key={item.phase}
                className="flex flex-col justify-between rounded-[var(--v2-radius-card)] p-6 sm:p-8 bg-[var(--v2-card)] border border-[var(--v2-line)] shadow-lg relative overflow-hidden group transition-colors duration-300 hover:border-[var(--v2-accent)]/30"
              >
                {/* Top border accent line on hover */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-transparent group-hover:bg-[var(--v2-accent)]/50 transition-colors duration-300 z-10" />

                {/* Scroll-activated top highlight */}
                {isFirst ? (
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--v2-accent)]/30" />
                ) : (
                  <motion.div
                    style={{ opacity: reducedMotion ? 1 : activeMotion! }}
                    className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--v2-accent)]/30"
                  />
                )}

                <div>
                  {/* Header row: Phase + Step Tag */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-xs font-semibold tracking-widest text-[var(--v2-accent)]">
                      {item.phase}
                    </span>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.06] text-[var(--v2-muted)]">
                      {item.step}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-bold text-xl sm:text-2xl text-[var(--v2-headline)] mb-4 tracking-tight">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="font-body text-xs sm:text-sm text-[var(--v2-muted)] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Step indicator in card footer */}
                <div className="pt-6 mt-6 border-t border-[var(--v2-line)] flex items-center justify-between text-xs font-mono text-[var(--v2-text)]/40">
                  <span>STAGE 0{idx + 1}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-[var(--v2-accent)] transition-colors duration-200" />
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </div>
  );
};
