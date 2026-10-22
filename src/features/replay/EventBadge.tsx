import React from 'react';
import {
  Play,
  Bot,
  Terminal,
  CheckCircle2,
  Camera,
  ShieldAlert,
  Clock,
  RefreshCw,
  Bookmark,
  RotateCcw,
  OctagonX,
  AlertOctagon,
  FastForward,
  Award,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import type { KnownAuditEvent } from './types';

interface EventBadgeProps {
  event: KnownAuditEvent | string;
  size?: 'sm' | 'md';
}

export const EventBadge: React.FC<EventBadgeProps> = ({ event, size = 'sm' }) => {
  const getBadgeConfig = (evt: string) => {
    switch (evt) {
      case 'run_start':
        return {
          label: 'run_start',
          icon: Play,
          className: 'border-[#22FF6E]/40 bg-[#22FF6E]/10 text-[#22FF6E]',
        };
      case 'model_text':
        return {
          label: 'model_text',
          icon: Bot,
          className: 'border-white/[0.08] bg-white/[0.04] text-[#F0FFE8]',
        };
      case 'tool_call':
        return {
          label: 'tool_call',
          icon: Terminal,
          className: 'border-white/[0.08] bg-white/[0.04] text-[#F5F0E8]',
        };
      case 'tool_result':
        return {
          label: 'tool_result',
          icon: CheckCircle2,
          className: 'border-white/[0.08] bg-white/[0.04] text-[#F5F0E8]/60',
        };
      case 'screenshot':
        return {
          label: 'screenshot',
          icon: Camera,
          className: 'border-white/[0.08] bg-white/[0.04] text-[#F5F0E8]/60',
        };
      case 'gate':
        return {
          label: 'gate',
          icon: ShieldAlert,
          className: 'border-[#E3B15C]/40 bg-[#E3B15C]/10 text-[#E3B15C] font-semibold',
        };
      case 'limit':
        return {
          label: 'limit',
          icon: Clock,
          className: 'border-[#E3B15C]/40 bg-[#E3B15C]/10 text-[#E3B15C]',
        };
      case 'switch':
        return {
          label: 'switch',
          icon: RefreshCw,
          className: 'border-[#22FF6E]/40 bg-[#22FF6E]/10 text-[#22FF6E]',
        };
      case 'checkpoint':
        return {
          label: 'checkpoint',
          icon: Bookmark,
          className: 'border-white/[0.08] bg-white/[0.04] text-[#F5F0E8]/60',
        };
      case 'retry':
        return {
          label: 'retry',
          icon: RotateCcw,
          className: 'border-[#E3B15C]/40 bg-[#E3B15C]/10 text-[#E3B15C]',
        };
      case 'kill':
        return {
          label: 'kill',
          icon: OctagonX,
          className: 'border-[#E5776B]/40 bg-[#E5776B]/10 text-[#E5776B] font-semibold',
        };
      case 'failsafe_abort':
        return {
          label: 'failsafe_abort',
          icon: AlertOctagon,
          className: 'border-[#E5776B]/40 bg-[#E5776B]/10 text-[#E5776B] font-semibold',
        };
      case 'resumed':
        return {
          label: 'resumed',
          icon: FastForward,
          className: 'border-[#22FF6E]/40 bg-[#22FF6E]/10 text-[#22FF6E]',
        };
      case 'finish':
        return {
          label: 'finish',
          icon: Award,
          className: 'border-[#22FF6E]/50 bg-[#22FF6E]/15 text-[#22FF6E] font-semibold',
        };
      case 'max_steps':
        return {
          label: 'max_steps',
          icon: AlertTriangle,
          className: 'border-[#E3B15C]/40 bg-[#E3B15C]/10 text-[#E3B15C]',
        };
      case 'kill_switch_unavailable':
        return {
          label: 'kill_switch_unavailable',
          icon: AlertOctagon,
          className: 'border-[#E5776B]/40 bg-[#E5776B]/10 text-[#E5776B] font-semibold',
        };
      default:
        return {
          label: evt,
          icon: Activity,
          className: 'border-white/[0.08] bg-white/[0.04] text-[#F5F0E8]/60',
        };
    }
  };

  const { label, icon: Icon, className } = getBadgeConfig(event);
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs gap-1.5'
      : 'px-2.5 py-1 text-xs gap-2';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-mono tracking-tight transition-colors ${sizeClasses} ${className}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />
      <span>{label}</span>
    </span>
  );
};
