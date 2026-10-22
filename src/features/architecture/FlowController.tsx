import React from 'react';
import {
  Play,
  Pause,
  FastForward,
  ShieldAlert,
  Sparkles,
  Layers,
  Globe,
  Code2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { ScenarioId } from './types';
import { SCENARIOS } from './architectureData';

interface FlowControllerProps {
  activeScenarioId: ScenarioId;
  onSelectScenario: (scenarioId: ScenarioId) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackSpeed: number;
  onToggleSpeed: () => void;
  prefersReducedMotion: boolean;
}

const getScenarioIcon = (id: ScenarioId) => {
  switch (id) {
    case 'all':
      return <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />;
    case 'planning':
      return <Layers className="w-3.5 h-3.5" strokeWidth={1.5} />;
    case 'research':
      return <Globe className="w-3.5 h-3.5" strokeWidth={1.5} />;
    case 'coding':
      return <Code2 className="w-3.5 h-3.5" strokeWidth={1.5} />;
    case 'gate':
      return <ShieldAlert className="w-3.5 h-3.5 text-warning" strokeWidth={1.5} />;
    default:
      return <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />;
  }
};

export const FlowController: React.FC<FlowControllerProps> = ({
  activeScenarioId,
  onSelectScenario,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onToggleSpeed,
  prefersReducedMotion
}) => {
  const currentScenario =
    SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0];

  return (
    <div className="w-full space-y-3">
      {/* Top Toolbar: Scenario Buttons & Playback Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-[14px] bg-surface border border-border">
        {/* Scenario Selectors */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-mono text-text-muted mr-1 hidden sm:inline">
            Flow:
          </span>
          {SCENARIOS.map((scenario) => {
            const isSelected = scenario.id === activeScenarioId;
            const isGate = scenario.id === 'gate';

            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => onSelectScenario(scenario.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[8px] border transition-all whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isSelected
                    ? isGate
                      ? 'bg-warning text-accent-contrast border-warning shadow-sm font-semibold'
                      : 'bg-accent text-accent-contrast border-accent shadow-sm font-semibold'
                    : isGate
                    ? 'bg-surface-2 text-warning border-border hover:border-warning/50'
                    : 'bg-surface-2 text-text-muted border-border hover:text-text hover:bg-surface'
                }`}
                aria-pressed={isSelected}
                aria-label={`Select scenario: ${scenario.title}`}
              >
                {getScenarioIcon(scenario.id)}
                <span>{scenario.shortBadge}</span>
              </button>
            );
          })}
        </div>

        {/* Playback & Motion Controls */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {prefersReducedMotion && (
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-surface-2 border border-border text-text-muted flex items-center gap-1"
              title="System Reduced Motion preference active."
            >
              <Info className="w-3 h-3" strokeWidth={1.5} />
              <span>Reduced Motion</span>
            </span>
          )}

          <button
            type="button"
            onClick={onTogglePlay}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-[8px] border border-border bg-surface-2 text-text hover:bg-surface hover:text-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleSpeed}
            disabled={!isPlaying}
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-medium rounded-[8px] border border-border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              playbackSpeed === 2
                ? 'bg-accent/15 border-accent text-accent'
                : 'bg-surface-2 text-text hover:bg-surface'
            } ${!isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={`Playback pace: ${playbackSpeed === 2 ? 'Fast' : 'Standard'}. Click to toggle.`}
          >
            <FastForward className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>{playbackSpeed === 2 ? 'Fast' : 'Normal'}</span>
          </button>
        </div>
      </div>

      {/* Scenario Briefing & Safety Alerts */}
      <div className="rounded-[14px] bg-surface border border-border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-accent font-medium">
                Active Scenario
              </span>
              <span className="text-xs text-text-muted font-normal">•</span>
              <span className="text-sm font-semibold text-text">{currentScenario.title}</span>
            </div>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              {currentScenario.summary}
            </p>
          </div>
        </div>

        {/* Safety Note banner if gate triggered */}
        {currentScenario.safetyNote && (
          <div className="mt-3 p-3 rounded-[10px] bg-warning/10 border border-warning/40 text-text text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <span className="font-semibold text-warning">Policy Safety Intercept: </span>
              <span className="text-text leading-relaxed">
                {currentScenario.safetyNote}
              </span>
            </div>
          </div>
        )}

        {/* Narrative Steps Progress */}
        <div className="mt-4 pt-3 border-t border-border">
          <div className="text-[11px] font-mono uppercase tracking-wider text-text-muted mb-2">
            Execution Sequence
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {currentScenario.narrativeSteps.map((step) => (
              <div
                key={step.step}
                className="p-2.5 rounded-[10px] bg-surface-2/60 border border-border text-xs flex items-start gap-2"
              >
                <span className="w-4 h-4 rounded-full bg-accent/15 text-accent border border-accent/30 text-[10px] font-mono font-medium flex items-center justify-center shrink-0">
                  {step.step}
                </span>
                <div className="min-w-0">
                  <span className="font-semibold text-text block truncate">{step.agent}</span>
                  <span className="text-text-muted text-[11px] leading-snug line-clamp-2">
                    {step.action}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
