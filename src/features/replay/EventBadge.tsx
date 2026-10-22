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
          className: 'border-accent/40 bg-accent/10 text-accent',
        };
      case 'model_text':
        return {
          label: 'model_text',
          icon: Bot,
          className: 'border-accent/40 bg-surface-2 text-accent',
        };
      case 'tool_call':
        return {
          label: 'tool_call',
          icon: Terminal,
          className: 'border-border bg-surface-2 text-text',
        };
      case 'tool_result':
        return {
          label: 'tool_result',
          icon: CheckCircle2,
          className: 'border-border bg-surface-2 text-text-muted',
        };
      case 'screenshot':
        return {
          label: 'screenshot',
          icon: Camera,
          className: 'border-border bg-surface-2 text-text-muted',
        };
      case 'gate':
        return {
          label: 'gate',
          icon: ShieldAlert,
          className: 'border-warning/60 bg-warning/10 text-warning font-semibold',
        };
      case 'limit':
        return {
          label: 'limit',
          icon: Clock,
          className: 'border-warning/50 bg-warning/10 text-warning',
        };
      case 'switch':
        return {
          label: 'switch',
          icon: RefreshCw,
          className: 'border-accent/40 bg-accent/10 text-accent',
        };
      case 'checkpoint':
        return {
          label: 'checkpoint',
          icon: Bookmark,
          className: 'border-border bg-surface-2 text-text-muted',
        };
      case 'retry':
        return {
          label: 'retry',
          icon: RotateCcw,
          className: 'border-warning/50 bg-warning/10 text-warning',
        };
      case 'kill':
        return {
          label: 'kill',
          icon: OctagonX,
          className: 'border-danger/60 bg-danger/10 text-danger font-semibold',
        };
      case 'failsafe_abort':
        return {
          label: 'failsafe_abort',
          icon: AlertOctagon,
          className: 'border-danger/60 bg-danger/10 text-danger font-semibold',
        };
      case 'resumed':
        return {
          label: 'resumed',
          icon: FastForward,
          className: 'border-accent/40 bg-surface-2 text-accent',
        };
      case 'finish':
        return {
          label: 'finish',
          icon: Award,
          className: 'border-accent/60 bg-accent/15 text-accent font-semibold',
        };
      case 'max_steps':
        return {
          label: 'max_steps',
          icon: AlertTriangle,
          className: 'border-warning/50 bg-warning/10 text-warning',
        };
      case 'kill_switch_unavailable':
        return {
          label: 'kill_switch_unavailable',
          icon: AlertOctagon,
          className: 'border-danger/60 bg-danger/10 text-danger font-semibold',
        };
      default:
        return {
          label: evt,
          icon: Activity,
          className: 'border-border bg-surface-2 text-text-muted',
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
      className={`inline-flex items-center rounded-[10px] border font-mono tracking-tight transition-colors ${sizeClasses} ${className}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />
      <span>{label}</span>
    </span>
  );
};
