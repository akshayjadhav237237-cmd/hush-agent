import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import type { SimulatorStatus } from './useScenario';

interface TransportControlsProps {
  status: SimulatorStatus;
  currentIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  isGateBlocked: boolean;
  isAtStart: boolean;
  isAtEnd: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStepNext: () => void;
  onStepPrev: () => void;
  onReset: () => void;
}

export const TransportControls: React.FC<TransportControlsProps> = ({
  status,
  currentIndex,
  totalSteps,
  isPlaying,
  isGateBlocked,
  isAtStart,
  isAtEnd,
  onPlay,
  onPause,
  onStepNext,
  onStepPrev,
  onReset,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Status & Step Counter */}
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-xs font-mono border ${
            status === 'Gate Triggered'
              ? 'border-warning text-warning bg-surface-2'
              : status === 'Playing'
              ? 'border-border text-accent bg-surface-2'
              : status === 'Completed'
              ? 'border-border text-success bg-surface-2'
              : 'border-border text-text-muted bg-surface-2'
          }`}
        >
          {status === 'Playing' && <Play className="w-3 h-3" strokeWidth={1.5} aria-hidden="true" />}
          {status === 'Gate Triggered' && <AlertTriangle className="w-3 h-3" strokeWidth={1.5} aria-hidden="true" />}
          {status === 'Completed' && <CheckCircle className="w-3 h-3" strokeWidth={1.5} aria-hidden="true" />}
          {status === 'Paused' && <Clock className="w-3 h-3" strokeWidth={1.5} aria-hidden="true" />}
          <span>{status}</span>
        </span>

        <span className="font-mono text-xs text-text-muted">
          Step {currentIndex + 1} of {totalSteps}
        </span>
      </div>

      {/* Transport Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onReset}
          className="border border-border rounded-[10px] bg-transparent text-xs hover:bg-surface-2 transition-colors inline-flex items-center gap-1.5 px-3 py-1.5 text-text"
          title="Reset to start (R)"
          aria-label="Reset scenario"
        >
          <RotateCcw className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} aria-hidden="true" />
          <span>Reset</span>
        </button>

        <button
          type="button"
          onClick={onStepPrev}
          disabled={isAtStart}
          className="border border-border rounded-[10px] bg-transparent text-xs hover:bg-surface-2 transition-colors inline-flex items-center gap-1.5 px-3 py-1.5 text-text disabled:opacity-40 disabled:cursor-not-allowed"
          title="Previous step (Left Arrow)"
          aria-label="Previous step"
        >
          <SkipBack className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} aria-hidden="true" />
          <span>Prev</span>
        </button>

        {isPlaying ? (
          <button
            type="button"
            onClick={onPause}
            className="border border-border rounded-[10px] bg-transparent text-xs hover:bg-surface-2 transition-colors inline-flex items-center gap-1.5 px-3.5 py-1.5 text-text font-medium"
            title="Pause playback (Space)"
            aria-label="Pause playback"
          >
            <Pause className="w-3.5 h-3.5 text-text" strokeWidth={1.5} aria-hidden="true" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onPlay}
            disabled={isGateBlocked}
            className="border border-border rounded-[10px] bg-transparent text-xs hover:bg-surface-2 transition-colors inline-flex items-center gap-1.5 px-3.5 py-1.5 text-text font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            title={isGateBlocked ? "Attention gate resolution required" : "Play playback (Space)"}
            aria-label="Play playback"
          >
            <Play className="w-3.5 h-3.5 text-text" strokeWidth={1.5} aria-hidden="true" />
            <span>{isAtEnd ? 'Replay' : 'Play'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onStepNext}
          disabled={isAtEnd || isGateBlocked}
          className="border border-border rounded-[10px] bg-transparent text-xs hover:bg-surface-2 transition-colors inline-flex items-center gap-1.5 px-3 py-1.5 text-text disabled:opacity-40 disabled:cursor-not-allowed"
          title="Next step (Right Arrow)"
          aria-label="Next step"
        >
          <span>Next</span>
          <SkipForward className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
