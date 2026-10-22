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

export interface ReplayEvent {
  t: number;
  step: number;
  event: KnownAuditEvent | string;
  tool?: string;
  gate?: string;
  summary: string;
}

export interface ReplayPayload {
  mode?: string;
  run_id?: string;
  chain_verified?: boolean;
  verified?: boolean;
  events: ReplayEvent[];
}

export type ReplayStatus = 'loading' | 'available' | 'not_available';
