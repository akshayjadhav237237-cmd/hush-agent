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
      return <ShieldAlert className="w-3.5 h-3.5 text-[#FFBD2E]" strokeWidth={1.5} />;
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
    <div className="w-full space-y-4">
      {/* Top Toolbar: Scenario Buttons & Playback Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-[24px] bg-[#141414] border border-white/[0.06]">
        {/* Scenario Selectors */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-mono uppercase tracking-wider text-[#F5F0E8]/45 mr-1 hidden sm:inline">
            Scenario:
          </span>
          {SCENARIOS.map((scenario) => {
            const isSelected = scenario.id === activeScenarioId;
            const isGate = scenario.id === 'gate';

            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => onSelectScenario(scenario.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[12px] border transition-all whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-[#22FF6E] ${
                  isSelected
                    ? isGate
                      ? 'bg-[#FFBD2E] text-black border-[#FFBD2E] shadow-sm font-semibold'
                      : 'bg-[#22FF6E] text-black border-[#22FF6E] shadow-[0_0_15px_rgba(34,255,110,0.25)] font-semibold'
                    : isGate
                    ? 'bg-white/[0.04] text-[#FFBD2E] border-white/[0.08] hover:border-[#FFBD2E]/50'
                    : 'bg-white/[0.04] text-[#F5F0E8]/70 border-white/[0.08] hover:text-[#F5F0E8] hover:bg-white/[0.08]'
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
              className="text-[10px] font-mono px-2 py-0.5 rounded-[6px] bg-white/[0.04] border border-white/[0.08] text-[#F5F0E8]/45 flex items-center gap-1"
              title="System Reduced Motion preference active."
            >
              <Info className="w-3 h-3" strokeWidth={1.5} />
              <span>Reduced Motion</span>
            </span>
          )}

          <button
            type="button"
            onClick={onTogglePlay}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-[12px] border border-white/[0.08] bg-white/[0.04] text-[#F5F0E8] hover:bg-white/[0.08] hover:text-[#22FF6E] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#22FF6E]"
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
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-[12px] border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#22FF6E] ${
              playbackSpeed === 2
                ? 'bg-[#22FF6E]/15 border-[#22FF6E] text-[#22FF6E]'
                : 'bg-white/[0.04] border-white/[0.08] text-[#F5F0E8] hover:bg-white/[0.08]'
            } ${!isPlaying ? 'opacity-40 cursor-not-allowed' : ''}`}
            aria-label={`Playback pace: ${playbackSpeed === 2 ? 'Fast' : 'Standard'}. Click to toggle.`}
          >
            <FastForward className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>{playbackSpeed === 2 ? '2x Fast' : '1x Speed'}</span>
          </button>
        </div>
      </div>

      {/* Scenario Briefing & Safety Alerts */}
      <div className="rounded-[24px] bg-[#141414] border border-white/[0.06] p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#22FF6E] font-medium">
                Active Scenario
              </span>
              <span className="text-xs text-[#F5F0E8]/45 font-normal">•</span>
              <span className="text-sm sm:text-base font-semibold text-[#F0FFE8]">{currentScenario.title}</span>
            </div>
            <p className="text-xs sm:text-sm text-[#F5F0E8]/45 mt-1.5 leading-relaxed">
              {currentScenario.summary}
            </p>
          </div>
        </div>

        {/* Safety Note banner if gate triggered */}
        {currentScenario.safetyNote && (
          <div className="p-3.5 rounded-[16px] bg-[#FFBD2E]/10 border border-[#FFBD2E]/30 text-[#F5F0E8] text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-[#FFBD2E] shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <span className="font-semibold text-[#FFBD2E]">Policy Safety Intercept: </span>
              <span className="text-[#F5F0E8]/80 leading-relaxed">
                {currentScenario.safetyNote}
              </span>
            </div>
          </div>
        )}

        {/* Narrative Steps Progress */}
        <div className="pt-4 border-t border-white/[0.06]">
          <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-[#F5F0E8]/45 mb-3">
            Execution Sequence
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {currentScenario.narrativeSteps.map((step) => (
              <div
                key={step.step}
                className="p-3 rounded-[16px] bg-white/[0.02] border border-white/[0.06] text-xs flex items-start gap-2.5 hover:border-white/[0.12] transition-colors"
              >
                <span className="w-4 h-4 rounded-full bg-[#22FF6E]/15 text-[#22FF6E] border border-[#22FF6E]/30 text-[10px] font-mono font-medium flex items-center justify-center shrink-0">
                  {step.step}
                </span>
                <div className="min-w-0">
                  <span className="font-semibold text-[#F0FFE8] block truncate">{step.agent}</span>
                  <span className="text-[#F5F0E8]/45 text-[11px] leading-snug line-clamp-2 mt-0.5">
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
