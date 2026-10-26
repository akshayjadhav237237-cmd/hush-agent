import React, { useState, useEffect } from 'react';
import { Container } from '@/v2/ui/Container';
import { Eyebrow } from '@/v2/ui/Eyebrow';
import { SerifItalic } from '@/v2/ui/SerifItalic';
import { COPY_V2 } from '@/v2/data/copy.v2';
import { ReplayPlayer } from '@/features/replay/ReplayPlayer';

export const ReplaySection: React.FC = () => {
  const [hasRealReplay, setHasRealReplay] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'demo' | 'real'>('demo');

  useEffect(() => {
    // Graceful check for optional public/replay_real.json
    fetch('./replay_real.json', { method: 'HEAD' })
      .then((res) => {
        if (res.ok) setHasRealReplay(true);
      })
      .catch(() => {
        // Fallback silently if missing
      });
  }, []);

  // Prevent v1 ReplayPlayer global spacebar interceptor from suppressing native Space
  // activations on interactive button elements (e.g., Radix Accordion FAQ triggers).
  useEffect(() => {
    const handleCaptureKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const target = e.target as HTMLElement | null;
        if (
          target instanceof HTMLButtonElement ||
          target?.closest('button') ||
          target?.getAttribute('role') === 'button' ||
          target?.closest('[role="button"]')
        ) {
          if (!target.closest('#simulator')) {
            // Stop propagation before ReplayPlayer's bubble-phase window listener runs e.preventDefault()
            e.stopImmediatePropagation();
          }
        }
      }
    };

    window.addEventListener('keydown', handleCaptureKeyDown, true);
    return () => window.removeEventListener('keydown', handleCaptureKeyDown, true);
  }, []);

  return (
    <div className="w-full py-16 sm:py-24">
      <Container>
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <Eyebrow label={COPY_V2.replay.eyebrow} className="mb-4" />
          <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-[var(--v2-headline)] tracking-tight">
            {COPY_V2.replay.title.plain}
            <SerifItalic>{COPY_V2.replay.title.italic}</SerifItalic>
          </h2>
        </div>

        {/* Optional Tabs if real replay is present */}
        {hasRealReplay && (
          <div className="flex items-center gap-2 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('demo')}
              className={`px-4 py-2 rounded-full text-xs font-mono transition-colors ${
                activeTab === 'demo'
                  ? 'bg-white/10 text-[var(--v2-headline)] border border-white/20'
                  : 'text-[var(--v2-muted)] hover:text-white'
              }`}
            >
              Simulated run
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('real')}
              className={`px-4 py-2 rounded-full text-xs font-mono transition-colors ${
                activeTab === 'real'
                  ? 'bg-white/10 text-[var(--v2-headline)] border border-white/20'
                  : 'text-[var(--v2-muted)] hover:text-white'
              }`}
            >
              Recorded real run
            </button>
          </div>
        )}

        {/* Remapped dark card wrapper for v1 ReplayPlayer */}
        <div className="v2-replay-scope w-full rounded-[28px] bg-[var(--v2-card)] border border-white/[0.08] shadow-2xl p-4 sm:p-6 lg:p-8 overflow-hidden">
          <ReplayPlayer />
        </div>
      </Container>
    </div>
  );
};
