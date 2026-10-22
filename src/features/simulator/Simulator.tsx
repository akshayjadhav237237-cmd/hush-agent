import React from 'react';
import { useScenario } from './useScenario';
import { Terminal } from './Terminal';
import { GateCard } from './GateCard';
import { StepTimeline } from './StepTimeline';
import { TransportControls } from './TransportControls';
import { KeyboardLegend } from './KeyboardLegend';

export const Simulator: React.FC = () => {
  const {
    state,
    currentStep,
    totalSteps,
    isAtStart,
    isAtEnd,
    status,
    play,
    pause,
    stepForward,
    stepBack,
    reset,
    jumpToStep,
    resolveGate,
  } = useScenario();

  const isGateStep = Boolean(currentStep.gate);
  const isGateResolved = Boolean(state.resolvedGates[currentStep.id]);
  const isGateActive = isGateStep && !isGateResolved;

  return (
    <section
      id="simulator"
      aria-labelledby="simulator-heading"
      className="w-full py-12 px-4 sm:px-6"
    >
      {/* Simulator Container */}
      <div
        className={`max-w-[1120px] mx-auto border rounded-[14px] bg-surface p-4 sm:p-6 flex flex-col gap-6 transition-colors duration-200 motion-reduce:transition-none ${
          isGateActive ? 'border-warning' : 'border-border'
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="flex flex-col gap-1.5">
            {/* PROMINENT MANDATORY LABEL */}
            <div className="flex items-center">
              <span
                role="note"
                className="inline-flex items-center px-2.5 py-1 rounded-[10px] border border-border bg-surface-2 text-xs font-mono text-text-muted"
              >
                Simulated run (recorded scenario)
              </span>
            </div>

            <h2
              id="simulator-heading"
              className="text-lg sm:text-xl font-semibold tracking-tight text-text"
            >
              Execution trace
            </h2>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Step-by-step playback of autonomous multi-agent orchestration.
            </p>
          </div>

          {/* Transport Controls Header */}
          <TransportControls
            status={status}
            currentIndex={state.currentStepIndex}
            totalSteps={totalSteps}
            isPlaying={state.isPlaying}
            isGateBlocked={state.isGateBlocked}
            isAtStart={isAtStart}
            isAtEnd={isAtEnd}
            onPlay={play}
            onPause={pause}
            onStepNext={stepForward}
            onStepPrev={stepBack}
            onReset={reset}
          />
        </div>

        {/* Two-Panel Layout: Timeline on Left, Terminal & Gate on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Step Timeline */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <StepTimeline
              currentIndex={state.currentStepIndex}
              onJump={jumpToStep}
              resolvedGates={state.resolvedGates}
            />
          </div>

          {/* Right Panel: Attention Gate Card & Terminal */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {isGateStep && (
              <GateCard
                step={currentStep}
                isResolved={isGateResolved}
                onResolve={resolveGate}
              />
            )}

            <Terminal
              step={currentStep}
              stepIndex={state.currentStepIndex}
              totalSteps={totalSteps}
            />
          </div>
        </div>

        {/* Keyboard Legend */}
        <KeyboardLegend />
      </div>
    </section>
  );
};
