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
    <div className="flex flex-col border border-white/[0.06] rounded-[20px] bg-[#0e0e0e] overflow-hidden">
      {/* Timeline Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <ListFilter className="w-3.5 h-3.5 text-[#22FF6E]" />
          <span className="text-xs font-mono font-medium text-[#F0FFE8] uppercase tracking-wider">
            Event Log
          </span>
        </div>
        <span className="text-xs font-mono text-[#F5F0E8]/45">
          {events.length} events
        </span>
      </div>

      {/* Scrollable list */}
      <div
        ref={containerRef}
        role="feed"
        aria-label="Replay event stream"
        className="max-h-[500px] overflow-y-auto divide-y divide-white/[0.04] p-2 space-y-1"
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
              className={`w-full text-left p-3 rounded-[12px] transition-all cursor-pointer flex flex-col gap-1.5 ${
                isActive
                  ? 'bg-[#22FF6E]/10 border border-[#22FF6E]/40 shadow-xs'
                  : 'hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              {/* Event Top Meta */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`font-mono text-xs w-6 shrink-0 ${
                      isActive ? 'text-[#22FF6E] font-semibold' : 'text-[#F5F0E8]/45'
                    }`}
                  >
                    #{event.step}
                  </span>
                  <EventBadge event={event.event} size="sm" />
                  {event.tool && (
                    <span className="truncate text-xs font-mono text-[#F5F0E8]/60 max-w-[120px]">
                      {event.tool}
                    </span>
                  )}
                </div>

                <span className="font-mono text-[11px] text-[#F5F0E8]/45 shrink-0">
                  {event.t.toFixed(1)}s
                </span>
              </div>

              {/* Event Clean Summary Preview */}
              <p
                className={`text-xs font-mono leading-snug line-clamp-2 ${
                  isActive ? 'text-[#F0FFE8] font-medium' : 'text-[#F5F0E8]/60'
                } ${isGate ? 'text-[#E3B15C] font-semibold' : ''}`}
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
