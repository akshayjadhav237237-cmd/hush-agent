import React, { useEffect } from 'react';
import { useReplay } from './useReplay';
import { ReplayControls } from './ReplayControls';
import { ReplayTimeline } from './ReplayTimeline';
import { ReplaySummaryCard } from './ReplaySummaryCard';
import { ReplayNotAvailable } from './ReplayNotAvailable';
import { ShieldCheck, Hash, Terminal } from 'lucide-react';

export const ReplayPlayer: React.FC = () => {
  const {
    status,
    payload,
    events,
    currentIndex,
    currentEvent,
    totalSteps,
    isPlaying,
    play,
    pause,
    togglePlay,
    stepNext,
    stepPrev,
    reset,
    jumpTo,
    refetch,
  } = useReplay();

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepPrev();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        reset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, stepNext, stepPrev, reset]);

  const currentTime = currentEvent ? currentEvent.t : 0;
  const totalTime = events.length > 0 ? events[events.length - 1].t : 0;

  return (
    <section
      id="simulator"
      aria-labelledby="replay-heading"
      className="w-full py-12 px-4 sm:px-6 relative scroll-mt-16 bg-[#000] text-[#F5F0E8]"
    >
      {/* Anchor for #replay navigation */}
      <span id="replay" className="absolute -top-16 opacity-0 pointer-events-none" />

      <div className="max-w-[1120px] mx-auto bg-[#141414] border border-white/[0.06] rounded-[24px] p-6 sm:p-8 flex flex-col gap-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
          <div className="flex flex-col gap-2.5">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-[#F5F0E8]/45">
              [ REPLAY ]
            </div>

            {/* Badges bar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Demo Mode Badge */}
              {payload?.mode === 'demo' && (
                <span
                  role="note"
                  className="inline-flex items-center px-3 py-1 rounded-full border border-[#E3B15C]/40 bg-[#E3B15C]/10 text-xs font-mono text-[#E3B15C] font-semibold tracking-tight"
                >
                  DEMO MODE: simulated desktop, real Gemma calls
                </span>
              )}

              {/* Real Mode Badge */}
              {payload?.mode === 'real' && (
                <span
                  role="note"
                  className="inline-flex items-center px-3 py-1 rounded-full border border-[#22FF6E]/40 bg-[#22FF6E]/10 text-xs font-mono text-[#22FF6E] font-semibold tracking-tight"
                >
                  REAL EXECUTION MODE
                </span>
              )}

              {/* Run ID Badge */}
              {payload?.run_id && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.04] text-xs font-mono text-[#F5F0E8]/60">
                  <Terminal className="w-3.5 h-3.5 text-[#22FF6E]" />
                  <span>Run: {payload.run_id}</span>
                </span>
              )}

              {/* Total Event Count */}
              {status === 'available' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.04] text-xs font-mono text-[#F5F0E8]/60">
                  <Hash className="w-3.5 h-3.5 text-[#22FF6E]" />
                  <span>{totalSteps} events</span>
                </span>
              )}

              {/* Chain Verified Badge - ONLY IF verified proof is explicitly present */}
              {payload?.chain_verified === true && (
                <span
                  role="status"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#22FF6E]/40 bg-[#22FF6E]/15 text-xs font-mono text-[#22FF6E] font-semibold"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Chain Verified</span>
                </span>
              )}
            </div>

            <h2
              id="replay-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold tracking-tight text-[#F0FFE8]"
            >
              Tamper-Evident <span className="font-serif italic font-normal text-[#22FF6E]">Audit Replay.</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#F5F0E8]/60 leading-relaxed max-w-2xl font-sans">
              Step-by-step telemetry reconstructed from cryptographic append-only audit records. Redacted for privacy.
            </p>
          </div>
        </div>

        {/* State Display: Loading, Not Available, or Active Replay */}
        {status === 'loading' && (
          <div className="w-full border border-white/[0.06] rounded-[20px] bg-[#0e0e0e] p-12 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-8 h-8 border-2 border-[#22FF6E] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-[#F5F0E8]/45">Loading audit replay...</p>
          </div>
        )}

        {status === 'not_available' && (
          <ReplayNotAvailable onRefresh={refetch} />
        )}

        {status === 'available' && (
          <div className="flex flex-col gap-6">
            {/* Top Transport & Scrubber Bar */}
            <ReplayControls
              currentIndex={currentIndex}
              totalSteps={totalSteps}
              currentTime={currentTime}
              totalTime={totalTime}
              isPlaying={isPlaying}
              onPlay={play}
              onPause={pause}
              onTogglePlay={togglePlay}
              onStepNext={stepNext}
              onStepPrev={stepPrev}
              onReset={reset}
              onScrub={jumpTo}
            />

            {/* Main Interactive Grid: Timeline on Left, Summary Card on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Event Stream Timeline */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <ReplayTimeline
                  events={events}
                  currentIndex={currentIndex}
                  onSelectEvent={jumpTo}
                />
              </div>

              {/* Right Column: Active Event Summary Card */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <ReplaySummaryCard
                  event={currentEvent}
                  totalEvents={totalSteps}
                />

                {/* Keyboard Shortcut Help */}
                <div className="p-3.5 rounded-[16px] bg-[#0e0e0e] border border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#F5F0E8]/45">
                  <span className="text-[11px] font-semibold text-[#F0FFE8] uppercase tracking-wider">
                    Shortcuts:
                  </span>
                  <div className="flex flex-wrap items-center gap-3 text-[11px]">
                    <span>
                      <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#F5F0E8] font-semibold">Space</kbd> Play/Pause
                    </span>
                    <span>
                      <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#F5F0E8] font-semibold">←</kbd> Prev
                    </span>
                    <span>
                      <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#F5F0E8] font-semibold">→</kbd> Next
                    </span>
                    <span>
                      <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#F5F0E8] font-semibold">R</kbd> Reset
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
