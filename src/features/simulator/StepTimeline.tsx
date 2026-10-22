import React from 'react';
import { SCENARIO_STEPS } from '@/data/scenario';
import { ACTOR_CONFIG } from './actorConfig';
import { Check, AlertTriangle } from 'lucide-react';

interface StepTimelineProps {
  currentIndex: number;
  onJump: (index: number) => void;
  resolvedGates: Record<string, boolean>;
}

export const StepTimeline: React.FC<StepTimelineProps> = ({
  currentIndex,
  onJump,
  resolvedGates,
}) => {
  const currentStep = SCENARIO_STEPS[currentIndex] ?? SCENARIO_STEPS[0];
  const activeActorMeta = ACTOR_CONFIG[currentStep.actor];

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Timeline Header */}
      <div className="flex items-center justify-between pb-1">
        <span className="font-mono text-xs uppercase tracking-wider text-text-muted">
          Pipeline steps
        </span>
        <span className="font-mono text-xs text-text-muted">
          {currentIndex + 1} / {SCENARIO_STEPS.length}
        </span>
      </div>

      {/* Step List */}
      <ol className="flex flex-col gap-1.5" aria-label="Pipeline execution steps">
        {SCENARIO_STEPS.map((step, idx) => {
          const isActive = idx === currentIndex;
          const isPassed = idx < currentIndex;
          const actorMeta = ACTOR_CONFIG[step.actor];
          const ActorIcon = actorMeta.icon;
          const hasGate = Boolean(step.gate);
          const isGateResolved = Boolean(resolvedGates[step.id]);
          const isGateActive = hasGate && !isGateResolved && isActive;

          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => onJump(idx)}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`Step ${idx + 1}: ${step.title}. Actor: ${actorMeta.label}`}
                className={`w-full text-left p-2.5 rounded-[10px] border transition-colors flex items-center justify-between gap-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
                  isGateActive
                    ? 'border-warning bg-surface-2 text-text font-medium'
                    : isActive
                    ? 'border-border bg-surface-2 text-text font-medium'
                    : isPassed
                    ? 'border-border/60 bg-transparent text-text-muted hover:bg-surface-2/60 hover:text-text'
                    : 'border-border/40 bg-transparent text-text-muted hover:bg-surface-2/40'
                }`}
              >
                {/* Left: Step number & title */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-[6px] text-xs font-mono flex items-center justify-center shrink-0 border ${
                      isGateActive
                        ? 'border-warning text-warning bg-surface'
                        : isActive
                        ? 'border-border text-text bg-surface'
                        : isPassed
                        ? 'border-border/60 text-text-muted bg-surface/50'
                        : 'border-border/40 text-text-muted/60 bg-transparent'
                    }`}
                  >
                    {isPassed ? (
                      <Check className="w-3 h-3 text-text-muted" strokeWidth={1.5} aria-hidden="true" />
                    ) : (
                      idx + 1
                    )}
                  </span>

                  <span className="truncate text-xs text-text">
                    {step.title}
                  </span>
                </div>

                {/* Right: Quiet Actor Chip + Gate tag */}
                <div className="flex items-center gap-2 shrink-0">
                  {hasGate && !isGateResolved && (
                    <span
                      title="Attention gate pending"
                      className="inline-flex items-center gap-1 font-mono text-[10px] text-warning"
                    >
                      <AlertTriangle className="w-3 h-3 text-warning" strokeWidth={1.5} aria-hidden="true" />
                      <span className="hidden sm:inline">Gate</span>
                    </span>
                  )}

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[10px] text-[11px] font-mono ${
                      actorMeta.badgeClassName || 'border border-border bg-surface text-text-muted'
                    }`}
                  >
                    <ActorIcon
                      className={`w-3 h-3 ${actorMeta.id === 'graphify' ? 'text-accent' : 'text-text-muted'}`}
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                    <span>{actorMeta.label}</span>
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Active Step Details Card */}
      <div className="p-3.5 rounded-[10px] border border-border bg-surface-2 text-xs flex flex-col gap-1.5 mt-1">
        <div className="flex items-center justify-between font-mono text-text-muted text-[11px]">
          <span>Active step detail</span>
          <span className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] text-[10px] ${
                activeActorMeta.badgeClassName || 'border border-border bg-surface text-text-muted'
              }`}
            >
              {activeActorMeta.label}
            </span>
            <span aria-hidden="true">·</span>
            <span>{activeActorMeta.role}</span>
          </span>
        </div>
        <p className="text-text leading-relaxed">
          {currentStep.detail}
        </p>
      </div>
    </div>
  );
};
