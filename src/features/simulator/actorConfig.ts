import React from 'react';
import { User, Cpu, Bot, Search, Terminal, UserCheck, Network } from 'lucide-react';
import type { Actor } from '@/data/scenario';

export type SimulatorActor = Actor;

export interface ActorMeta {
  id: SimulatorActor;
  label: string;
  role: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  badgeClassName?: string;
}

export const ACTOR_CONFIG: Record<SimulatorActor, ActorMeta> = {
  user: {
    id: 'user',
    label: 'User',
    role: 'Goal definition and prompt submission',
    icon: User,
    badgeClassName: 'border border-border bg-surface text-text-muted',
  },
  gemma: {
    id: 'gemma',
    label: 'Gemma 4',
    role: 'Triage and verification orchestrator',
    icon: Cpu,
    badgeClassName: 'border border-border bg-surface text-text-muted',
  },
  gemini: {
    id: 'gemini',
    label: 'Gemini Deep Research',
    role: 'Industry and competitor synthesis',
    icon: Search,
    badgeClassName: 'border border-border bg-surface text-text-muted',
  },
  claude: {
    id: 'claude',
    label: 'Claude',
    role: 'Architecture and component specification',
    icon: Bot,
    badgeClassName: 'border border-border bg-surface text-text-muted',
  },
  antigravity: {
    id: 'antigravity',
    label: 'Antigravity',
    role: 'Sandboxed code generation',
    icon: Terminal,
    badgeClassName: 'border border-border bg-surface text-text-muted',
  },
  graphify: {
    id: 'graphify',
    label: 'Graphify',
    role: 'Code Graph',
    icon: Network,
    badgeClassName: 'bg-surface-2 text-accent border border-accent/20',
  },
  human: {
    id: 'human',
    label: 'Human',
    role: 'Attention gate resolution',
    icon: UserCheck,
    badgeClassName: 'border border-border bg-surface text-text-muted',
  },
};
