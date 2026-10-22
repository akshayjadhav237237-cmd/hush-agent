import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';

interface ReplayControlsProps {
  currentIndex: number;
  totalSteps: number;
  currentTime: number;
  totalTime: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onTogglePlay: () => void;
  onStepNext: () => void;
  onStepPrev: () => void;
  onReset: () => void;
  onScrub: (index: number) => void;
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({
  currentIndex,
  totalSteps,
  currentTime,
  totalTime,
  isPlaying,
  onTogglePlay,
  onStepNext,
  onStepPrev,
  onReset,
  onScrub,
}) => {
  const isAtStart = currentIndex === 0;
  const isAtEnd = totalSteps > 0 && currentIndex >= totalSteps - 1;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      onScrub(val);
    }
  };

  const progressPercent =
    totalSteps > 1 ? (currentIndex / (totalSteps - 1)) * 100 : 0;

  return (
    <div className="w-full flex flex-col gap-3 p-4 rounded-[14px] bg-surface border border-border">
      {/* Top Scrubber Track */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-mono text-text-muted">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-text-muted" />
            <span className="text-text font-medium">{currentTime.toFixed(1)}s</span>
            <span>/</span>
            <span>{totalTime.toFixed(1)}s</span>
          </span>

          <span className="text-text font-medium">
            Step {totalSteps > 0 ? currentIndex + 1 : 0} of {totalSteps}
          </span>
        </div>

        <div className="relative flex items-center w-full py-1">
          <input
            type="range"
            min={0}
            max={Math.max(0, totalSteps - 1)}
            value={currentIndex}
            onChange={handleSliderChange}
            disabled={totalSteps <= 1}
            aria-label="Replay timeline scrubber"
            className="w-full h-2 bg-surface-2 rounded-full appearance-none cursor-pointer accent-[var(--accent)] border border-border disabled:opacity-40"
          />
        </div>
      </div>

      {/* Buttons row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border">
        {/* Playback Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Reset button */}
          <button
            type="button"
            onClick={onReset}
            disabled={isAtStart && !isPlaying}
            title="Reset to start (R)"
            aria-label="Reset to start"
            className="p-2 rounded-[10px] border border-border bg-surface hover:bg-surface-2 text-text text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Previous Step button */}
          <button
            type="button"
            onClick={onStepPrev}
            disabled={isAtStart}
            title="Previous event (←)"
            aria-label="Previous event"
            className="p-2 rounded-[10px] border border-border bg-surface hover:bg-surface-2 text-text text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Play/Pause Main button */}
          <button
            type="button"
            onClick={onTogglePlay}
            disabled={totalSteps === 0}
            title={isPlaying ? 'Pause replay (Space)' : 'Play replay (Space)'}
            aria-label={isPlaying ? 'Pause replay' : 'Play replay'}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] bg-accent text-accent-contrast font-medium text-xs sm:text-sm hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{isAtEnd ? 'Replay' : 'Play'}</span>
              </>
            )}
          </button>

          {/* Next Step button */}
          <button
            type="button"
            onClick={onStepNext}
            disabled={isAtEnd}
            title="Next event (→)"
            aria-label="Next event"
            className="p-2 rounded-[10px] border border-border bg-surface hover:bg-surface-2 text-text text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Speed / Pace indicator */}
        <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
          <span className="px-2 py-1 rounded-[8px] bg-surface-2 border border-border">
            1.5s / event
          </span>
          <span className="hidden sm:inline text-[11px] text-text-muted">
            {progressPercent.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
};
