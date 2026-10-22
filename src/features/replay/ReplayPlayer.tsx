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
      className="w-full py-12 px-4 sm:px-6 relative scroll-mt-16"
    >
      {/* Anchor for #replay navigation */}
      <span id="replay" className="absolute -top-16 opacity-0 pointer-events-none" />

      <div className="max-w-[1120px] mx-auto flex flex-col gap-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="flex flex-col gap-2">
            {/* Badges bar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Demo Mode Badge */}
              {payload?.mode === 'demo' && (
                <span
                  role="note"
                  className="inline-flex items-center px-2.5 py-1 rounded-[10px] border border-warning/60 bg-warning/10 text-xs font-mono text-warning font-semibold tracking-tight"
                >
                  DEMO MODE: simulated desktop, real Gemma calls
                </span>
              )}

              {/* Real Mode Badge */}
              {payload?.mode === 'real' && (
                <span
                  role="note"
                  className="inline-flex items-center px-2.5 py-1 rounded-[10px] border border-accent/60 bg-accent/10 text-xs font-mono text-accent font-semibold tracking-tight"
                >
                  REAL EXECUTION MODE
                </span>
              )}

              {/* Run ID Badge */}
              {payload?.run_id && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[10px] border border-border bg-surface-2 text-xs font-mono text-text-muted">
                  <Terminal className="w-3 h-3 text-text-muted" />
                  <span>Run: {payload.run_id}</span>
                </span>
              )}

              {/* Total Event Count */}
              {status === 'available' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[10px] border border-border bg-surface-2 text-xs font-mono text-text-muted">
                  <Hash className="w-3 h-3 text-text-muted" />
                  <span>{totalSteps} events</span>
                </span>
              )}

              {/* Chain Verified Badge - ONLY IF verified proof is explicitly present */}
              {payload?.chain_verified === true && (
                <span
                  role="status"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[10px] border border-accent/60 bg-accent/15 text-xs font-mono text-accent font-semibold"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Chain Verified</span>
                </span>
              )}
            </div>

            <h2
              id="replay-heading"
              className="text-lg sm:text-2xl font-serif font-semibold tracking-tight text-text"
            >
              Execution Replay & Audit Trace
            </h2>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed max-w-2xl">
              Step-by-step telemetry reconstructed from cryptographic append-only audit records. Redacted for privacy.
            </p>
          </div>
        </div>

        {/* State Display: Loading, Not Available, or Active Replay */}
        {status === 'loading' && (
          <div className="w-full border border-border rounded-[14px] bg-surface p-12 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-text-muted">Loading audit replay...</p>
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
                <div className="p-3 rounded-[10px] bg-surface-2 border border-border flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-text-muted">
                  <span className="text-[11px] font-semibold text-text uppercase tracking-wider">
                    Shortcuts:
                  </span>
                  <div className="flex flex-wrap items-center gap-3 text-[11px]">
                    <span>
                      <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-text font-semibold">Space</kbd> Play/Pause
                    </span>
                    <span>
                      <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-text font-semibold">←</kbd> Prev
                    </span>
                    <span>
                      <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-text font-semibold">→</kbd> Next
                    </span>
                    <span>
                      <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border text-text font-semibold">R</kbd> Reset
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
