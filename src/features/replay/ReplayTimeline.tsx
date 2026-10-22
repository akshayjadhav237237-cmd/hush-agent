import React, { useEffect, useRef } from 'react';
import { EventBadge } from './EventBadge';
import type { ReplayEvent } from './types';
import { ListFilter } from 'lucide-react';

interface ReplayTimelineProps {
  events: ReplayEvent[];
  currentIndex: number;
  onSelectEvent: (index: number) => void;
}

export const ReplayTimeline: React.FC<ReplayTimelineProps> = ({
  events,
  currentIndex,
  onSelectEvent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll the active event into view
  useEffect(() => {
    if (activeItemRef.current && containerRef.current) {
      activeItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [currentIndex]);

  return (
    <div className="flex flex-col border border-border rounded-[14px] bg-surface overflow-hidden">
      {/* Timeline Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-2/60">
        <div className="flex items-center gap-2">
          <ListFilter className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-xs font-mono font-medium text-text uppercase tracking-wider">
            Event Log
          </span>
        </div>
        <span className="text-xs font-mono text-text-muted">
          {events.length} events
        </span>
      </div>

      {/* Scrollable list */}
      <div
        ref={containerRef}
        role="feed"
        aria-label="Replay event stream"
        className="max-h-[500px] overflow-y-auto divide-y divide-border/60 p-2 space-y-1"
      >
        {events.map((event, idx) => {
          const isActive = idx === currentIndex;
          const isGate = event.event === 'gate';

          return (
            <button
              key={`${event.step}-${idx}`}
              ref={isActive ? activeItemRef : null}
              type="button"
              onClick={() => onSelectEvent(idx)}
              aria-current={isActive ? 'true' : undefined}
              className={`w-full text-left p-2.5 rounded-[10px] transition-all cursor-pointer flex flex-col gap-1.5 ${
                isActive
                  ? 'bg-surface-2 border border-accent shadow-xs'
                  : 'hover:bg-surface-2/70 border border-transparent'
              }`}
            >
              {/* Event Top Meta */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`font-mono text-xs w-6 shrink-0 ${
                      isActive ? 'text-accent font-semibold' : 'text-text-muted'
                    }`}
                  >
                    #{event.step}
                  </span>
                  <EventBadge event={event.event} size="sm" />
                  {event.tool && (
                    <span className="truncate text-xs font-mono text-text-muted max-w-[120px]">
                      {event.tool}
                    </span>
                  )}
                </div>

                <span className="font-mono text-[11px] text-text-muted shrink-0">
                  {event.t.toFixed(1)}s
                </span>
              </div>

              {/* Event Clean Summary Preview */}
              <p
                className={`text-xs font-mono leading-snug line-clamp-2 ${
                  isActive ? 'text-text font-medium' : 'text-text-muted'
                } ${isGate ? 'text-warning font-semibold' : ''}`}
              >
                {event.summary}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
