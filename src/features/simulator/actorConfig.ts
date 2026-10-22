import React from 'react';
import { User, Cpu, Bot, Search, Terminal, UserCheck } from 'lucide-react';
import type { Actor } from '@/data/types';

export interface ActorMeta {
  id: Actor;
  label: string;
  role: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: boolean | 'true' | 'false' }>;
}

export const ACTOR_CONFIG: Record<Actor, ActorMeta> = {
  user: {
    id: 'user',
    label: 'User',
    role: 'Goal definition and prompt submission',
    icon: User,
  },
  gemma: {
    id: 'gemma',
    label: 'Gemma 4',
    role: 'Local triage and verification sentinel',
    icon: Cpu,
  },
  gemini: {
    id: 'gemini',
    label: 'Gemini Deep Research',
    role: 'Industry and competitor synthesis',
    icon: Search,
  },
  claude: {
    id: 'claude',
    label: 'Claude',
    role: 'Architecture and component specification',
    icon: Bot,
  },
  antigravity: {
    id: 'antigravity',
    label: 'Antigravity',
    role: 'Sandboxed code generation',
    icon: Terminal,
  },
  human: {
    id: 'human',
    label: 'Human',
    role: 'Attention gate resolution',
    icon: UserCheck,
  },
};
