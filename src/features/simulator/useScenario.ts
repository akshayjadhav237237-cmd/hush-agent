import { useReducer, useEffect, useCallback, useMemo } from 'react';
import { SCENARIO_STEPS, type Step } from '@/data/scenario';

export type SimulatorStatus = 'Playing' | 'Paused' | 'Gate Triggered' | 'Completed';

export interface ScenarioState {
  currentStepIndex: number;
  isPlaying: boolean;
  isGateBlocked: boolean;
  resolvedGates: Record<string, boolean>;
  playbackSpeedMs: number;
}

export type ScenarioAction =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'STEP_FORWARD' }
  | { type: 'STEP_BACK' }
  | { type: 'RESET' }
  | { type: 'JUMP_TO_STEP'; payload: number }
  | { type: 'RESOLVE_GATE' }
  | { type: 'TICK' };

const INITIAL_SPEED_MS = 2600;

export const initialScenarioState: ScenarioState = {
  currentStepIndex: 0,
  isPlaying: false,
  isGateBlocked: false,
  resolvedGates: {},
  playbackSpeedMs: INITIAL_SPEED_MS,
};

export function scenarioReducer(state: ScenarioState, action: ScenarioAction): ScenarioState {
  const total = SCENARIO_STEPS.length;

  switch (action.type) {
    case 'PLAY': {
      // Cannot play if currently blocked by an unresolved gate
      if (state.isGateBlocked) {
        return state;
      }
      // If already at the end, restart from step 0
      const nextIndex = state.currentStepIndex >= total - 1 ? 0 : state.currentStepIndex;
      const step = SCENARIO_STEPS[nextIndex];
      const stepHasGate = Boolean(step?.gate && !state.resolvedGates[step.id]);

      if (stepHasGate) {
        return {
          ...state,
          currentStepIndex: nextIndex,
          isPlaying: false,
          isGateBlocked: true,
        };
      }

      return {
        ...state,
        currentStepIndex: nextIndex,
        isPlaying: true,
        isGateBlocked: false,
      };
    }

    case 'PAUSE': {
      return {
        ...state,
        isPlaying: false,
      };
    }

    case 'STEP_FORWARD': {
      if (state.currentStepIndex >= total - 1) {
        return { ...state, isPlaying: false };
      }
      const nextIndex = state.currentStepIndex + 1;
      const nextStep = SCENARIO_STEPS[nextIndex];
      const hasUnresolvedGate = Boolean(nextStep?.gate && !state.resolvedGates[nextStep.id]);

      return {
        ...state,
        currentStepIndex: nextIndex,
        isPlaying: false, // manual step pauses playback
        isGateBlocked: hasUnresolvedGate,
      };
    }

    case 'STEP_BACK': {
      if (state.currentStepIndex <= 0) {
        return state;
      }
      const prevIndex = state.currentStepIndex - 1;
      const prevStep = SCENARIO_STEPS[prevIndex];
      const hasUnresolvedGate = Boolean(prevStep?.gate && !state.resolvedGates[prevStep.id]);

      return {
        ...state,
        currentStepIndex: prevIndex,
        isPlaying: false,
        isGateBlocked: hasUnresolvedGate,
      };
    }

    case 'RESET': {
      return {
        ...initialScenarioState,
        playbackSpeedMs: state.playbackSpeedMs,
      };
    }

    case 'JUMP_TO_STEP': {
      const clampedIndex = Math.max(0, Math.min(action.payload, total - 1));
      const targetStep = SCENARIO_STEPS[clampedIndex];
      const hasUnresolvedGate = Boolean(targetStep?.gate && !state.resolvedGates[targetStep.id]);

      return {
        ...state,
        currentStepIndex: clampedIndex,
        isPlaying: false,
        isGateBlocked: hasUnresolvedGate,
      };
    }

    case 'RESOLVE_GATE': {
      const currentStep = SCENARIO_STEPS[state.currentStepIndex];
      const updatedResolved = {
        ...state.resolvedGates,
        ...(currentStep ? { [currentStep.id]: true } : {}),
      };

      const hasNext = state.currentStepIndex < total - 1;
      const nextIndex = hasNext ? state.currentStepIndex + 1 : state.currentStepIndex;
      const nextStep = SCENARIO_STEPS[nextIndex];
      const nextHasGate = Boolean(nextStep?.gate && !updatedResolved[nextStep.id]);

      return {
        ...state,
        resolvedGates: updatedResolved,
        currentStepIndex: nextIndex,
        isGateBlocked: nextHasGate,
        // Resume playing if moving forward into a non-blocked step
        isPlaying: hasNext && !nextHasGate,
      };
    }

    case 'TICK': {
      if (!state.isPlaying || state.isGateBlocked) {
        return state;
      }

      if (state.currentStepIndex >= total - 1) {
        return {
          ...state,
          isPlaying: false,
        };
      }

      const nextIndex = state.currentStepIndex + 1;
      const nextStep = SCENARIO_STEPS[nextIndex];
      const nextHasGate = Boolean(nextStep?.gate && !state.resolvedGates[nextStep.id]);

      if (nextHasGate) {
        return {
          ...state,
          currentStepIndex: nextIndex,
          isPlaying: false, // Pause automatically at gate
          isGateBlocked: true,
        };
      }

      return {
        ...state,
        currentStepIndex: nextIndex,
        isGateBlocked: false,
      };
    }

    default:
      return state;
  }
}

export function useScenario() {
  const [state, dispatch] = useReducer(scenarioReducer, initialScenarioState);

  const currentStep: Step = SCENARIO_STEPS[state.currentStepIndex] ?? SCENARIO_STEPS[0];
  const totalSteps = SCENARIO_STEPS.length;
  const isAtStart = state.currentStepIndex === 0;
  const isAtEnd = state.currentStepIndex === totalSteps - 1;

  // Determine current high-level status
  const status: SimulatorStatus = useMemo(() => {
    if (state.isGateBlocked) {
      return 'Gate Triggered';
    }
    if (isAtEnd && !state.isPlaying) {
      return 'Completed';
    }
    if (state.isPlaying) {
      return 'Playing';
    }
    return 'Paused';
  }, [state.isGateBlocked, isAtEnd, state.isPlaying]);

  // Auto-advance timer when playing
  useEffect(() => {
    if (!state.isPlaying || state.isGateBlocked) {
      return;
    }

    const timer = setInterval(() => {
      dispatch({ type: 'TICK' });
    }, state.playbackSpeedMs);

    return () => clearInterval(timer);
  }, [state.isPlaying, state.isGateBlocked, state.playbackSpeedMs, state.currentStepIndex]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      if (event.code === 'Space') {
        if (activeEl?.tagName === 'BUTTON') {
          return;
        }
        event.preventDefault();
        if (state.isGateBlocked) {
          dispatch({ type: 'RESOLVE_GATE' });
        } else if (state.isPlaying) {
          dispatch({ type: 'PAUSE' });
        } else {
          dispatch({ type: 'PLAY' });
        }
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        dispatch({ type: 'STEP_FORWARD' });
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        dispatch({ type: 'STEP_BACK' });
      } else if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        dispatch({ type: 'RESET' });
      } else if (event.key === 'Enter' && state.isGateBlocked) {
        if (activeEl?.tagName === 'BUTTON') {
          return;
        }
        event.preventDefault();
        dispatch({ type: 'RESOLVE_GATE' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isPlaying, state.isGateBlocked]);

  const play = useCallback(() => dispatch({ type: 'PLAY' }), []);
  const pause = useCallback(() => dispatch({ type: 'PAUSE' }), []);
  const stepForward = useCallback(() => dispatch({ type: 'STEP_FORWARD' }), []);
  const stepBack = useCallback(() => dispatch({ type: 'STEP_BACK' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);
  const jumpToStep = useCallback((index: number) => dispatch({ type: 'JUMP_TO_STEP', payload: index }), []);
  const resolveGate = useCallback(() => dispatch({ type: 'RESOLVE_GATE' }), []);

  return {
    state,
    currentStep,
    totalSteps,
    isAtStart,
    isAtEnd,
    status,
    dispatch,
    play,
    pause,
    stepForward,
    stepBack,
    reset,
    jumpToStep,
    resolveGate,
  };
}
