import React from 'react';
import { Container } from '@/v2/ui/Container';
import { Eyebrow } from '@/v2/ui/Eyebrow';
import { SerifItalic } from '@/v2/ui/SerifItalic';
import { COPY_V2 } from '@/v2/data/copy.v2';
import { gatesList, verificationSummary } from '@/v2/data/adapters';
import { useReducedMotion } from '@/v2/ui/useReducedMotion';

export const Gates: React.FC = () => {
  const gates = gatesList();
  const summary = verificationSummary();
  const reducedMotion = useReducedMotion();

  return (
    <section id="gates" className="w-full py-16 sm:py-24">
      <style>{`
        @keyframes quietToPing {
          0% { width: 0px; opacity: 0.2; }
          50% { width: 60px; opacity: 1; }
          100% { width: 0px; opacity: 0.2; }
        }
        .quiet-ping-line {
          animation: quietToPing 3s ease-in-out infinite;
        }
      `}</style>
      <Container>
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <Eyebrow label={COPY_V2.gates.eyebrow} className="mb-4 font-mono text-[var(--v2-muted)]" />
          <h2 className="font-display font-[500] text-3xl sm:text-4xl md:text-5xl text-[var(--v2-headline)] tracking-tight mb-4">
            {COPY_V2.gates.title.plain}
            <SerifItalic className="font-italic text-[var(--v2-accent)]">{COPY_V2.gates.title.italic}</SerifItalic>
            {COPY_V2.gates.title.after}
          </h2>
          <p className="font-body font-[300] text-base sm:text-lg text-[var(--v2-muted)] leading-relaxed">
            {COPY_V2.gates.paragraph}
          </p>
        </div>

        {/* Bento Grid: 6 tiles in an asymmetric grid (two wide, four regular) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {gates.map((gate, index) => {
            const indexStr = String(index + 1).padStart(2, '0');
            const isEnforcedInCode = gate.enforcement === 'code';
            const isHumanAttention =
              gate.id === 'gate-auth-captcha' ||
              gate.id === 'gate-missing-credentials' ||
              gate.id === 'gate-ambiguous-requirement';

            // Make tile 01 and tile 05 wider (col-span-1 lg:col-span-2) to form asymmetric bento layout
            const isWide = index === 0 || index === 4;

            return (
              <div
                key={gate.id}
                className={`group flex flex-col justify-between rounded-[24px] p-6 sm:p-8 bg-[var(--v2-card)] border border-[var(--v2-line)] transition-all duration-300 hover:border-[var(--v2-accent)]/40 ${
                  isWide ? 'lg:col-span-2' : 'lg:col-span-1'
                }`}
              >
                <div>
                  {/* Top Bar: Large Mono Index + Status Chip */}
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <span className="font-mono text-xl sm:text-2xl font-light text-[var(--v2-muted)] tracking-wider">
                      {indexStr}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 font-mono text-[11px] px-3 py-1 rounded-full border ${
                        isHumanAttention
                          ? 'border-[var(--v2-warning)]/30 bg-[var(--v2-warning)]/10 text-[var(--v2-warning)]'
                          : 'border-[var(--v2-line)] bg-white/[0.03] text-[var(--v2-muted)]'
                      }`}
                    >
                      {isHumanAttention && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--v2-warning)] animate-pulse" aria-hidden="true" />
                      )}
                      <span>{isHumanAttention ? 'human-notify / attention' : (isEnforcedInCode ? 'Enforced in code' : 'Judged by model')}</span>
                    </span>
                  </div>

                  {/* Short Title in font-display */}
                  <h3 className="font-display font-medium text-lg sm:text-xl text-[var(--v2-headline)] mb-3 tracking-tight">
                    {gate.title}
                  </h3>

                  {/* One-line description in font-body 300 */}
                  <p className="font-body font-[300] text-xs sm:text-sm text-[var(--v2-muted)] leading-relaxed mb-6">
                    {gate.detects}
                  </p>
                </div>

                {/* Bottom section: Action & featured quiet-to-ping animation on tile 01 */}
                <div className="pt-4 border-t border-[var(--v2-line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="font-body font-[300] text-xs text-[var(--v2-muted)] leading-relaxed line-clamp-1">
                    <span className="text-[var(--v2-text)] font-[400]">Action: </span>
                    {gate.action}
                  </div>

                  {/* Featured tile animation: Quiet to ping line (Tile 01 / gate-auth-captcha) */}
                  {index === 0 && (
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[10px] text-[var(--v2-muted)] tracking-wider">QUIET</span>
                      <div className="relative w-12 h-3 flex items-center">
                        <div className={`absolute left-0 h-[1px] bg-[var(--v2-accent)]/50 ${reducedMotion ? 'w-6' : 'quiet-ping-line'}`} />
                        <div className="absolute right-0 w-2 h-2 rounded-full bg-[var(--v2-warning)] shadow-[0_0_8px_var(--v2-warning)]" />
                      </div>
                      <span className="font-mono text-[10px] text-[var(--v2-warning)] tracking-wider">PING</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Verification Footnote if present */}
        {summary && (
          <div className="mt-8 pt-6 border-t border-[var(--v2-line)] text-xs font-mono text-[var(--v2-muted)] flex items-center gap-2.5">
            <span
              className="w-2 h-2 rounded-full bg-[var(--v2-accent)] shrink-0"
              aria-hidden="true"
            />
            <span>{summary}</span>
          </div>
        )}
      </Container>
    </section>
  );
};
