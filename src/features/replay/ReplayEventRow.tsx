import React from 'react';
import { EventBadge } from './EventBadge';
import type { ReplayEvent } from './types';
import { Wrench, ShieldAlert } from 'lucide-react';

interface ReplayEventRowProps {
  event: ReplayEvent;
  index: number;
  isActive: boolean;
  onSelect: (index: number) => void;
  itemRef?: React.Ref<HTMLButtonElement>;
}

export const ReplayEventRow: React.FC<ReplayEventRowProps> = ({
  event,
  index,
  isActive,
  onSelect,
  itemRef,
}) => {
  const isGate = event.event === 'gate' || Boolean(event.gate);
  const isLimit = event.event === 'limit';
  const isSwitch = event.event === 'switch';
  const isKill = event.event === 'kill' || event.event === 'failsafe_abort';

  return (
    <button
      ref={itemRef}
      type="button"
      onClick={() => onSelect(index)}
      aria-current={isActive ? 'true' : undefined}
      className={`w-full text-left p-2.5 rounded-[10px] transition-all cursor-pointer flex flex-col gap-1.5 ${
        isActive
          ? 'bg-surface-2 border border-accent shadow-xs'
          : 'hover:bg-surface-2/70 border border-transparent'
      }`}
    >
      {/* Event Top Meta */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span
            className={`font-mono text-xs w-6 shrink-0 ${
              isActive ? 'text-accent font-semibold' : 'text-text-muted'
            }`}
          >
            #{event.step}
          </span>
          <EventBadge event={event.event} size="sm" />
          {event.tool && (
            <span className="inline-flex items-center gap-1 truncate text-xs font-mono text-text-muted max-w-[140px]">
              <Wrench className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{event.tool}</span>
            </span>
          )}
          {event.gate && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-warning max-w-[130px] truncate">
              <ShieldAlert className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{event.gate}</span>
            </span>
          )}
        </div>

        <span className="font-mono text-[11px] text-text-muted shrink-0">
          {event.t.toFixed(1)}s
        </span>
      </div>

      {/* Event Clean Summary Preview (strictly sanitized) */}
      <p
        className={`text-xs font-mono leading-snug line-clamp-2 ${
          isActive ? 'text-text font-medium' : 'text-text-muted'
        } ${
          isGate || isLimit
            ? 'text-warning font-semibold'
            : isKill
            ? 'text-danger font-semibold'
            : isSwitch
            ? 'text-accent font-medium'
            : ''
        }`}
      >
        {event.summary}
      </p>
    </button>
  );
};
