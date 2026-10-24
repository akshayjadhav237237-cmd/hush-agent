export type KnownAuditEvent =
  | 'run_start'
  | 'model_text'
  | 'tool_call'
  | 'tool_result'
  | 'screenshot'
  | 'gate'
  | 'limit'
  | 'switch'
  | 'checkpoint'
  | 'retry'
  | 'kill'
  | 'failsafe_abort'
  | 'resumed'
  | 'finish'
  | 'max_steps'
  | 'kill_switch_unavailable';

export type PlaybackSpeed = 1 | 2 | 4;

export type ReplayFilterType =
  | 'tool_call'
  | 'tool_result'
  | 'gate'
  | 'kill'
  | 'limit'
  | 'switch'
  | 'retry'
  | 'checkpoint'
  | 'finish';

export const REPLAY_FILTER_TYPES: readonly ReplayFilterType[] = [
  'tool_call',
  'tool_result',
  'gate',
  'kill',
  'limit',
  'switch',
  'retry',
  'checkpoint',
  'finish',
] as const;

export interface ReplayEvent {
  t: number;
  step: number;
  event: KnownAuditEvent | string;
  tool?: string;
  gate?: string;
  provider?: string;
  summary: string;
}

export interface ReplayPayload {
  mode?: string;
  run_id?: string;
  chain_verified?: boolean;
  verified?: boolean;
  provider?: string;
  events: ReplayEvent[];
}

export type ReplayStatus = 'loading' | 'available' | 'not_available';
