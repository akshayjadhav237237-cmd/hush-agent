import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { ReplayEvent, ReplayFilterType } from './types';
import { REPLAY_FILTER_TYPES } from './types';
import { ReplayEventRow } from './ReplayEventRow';
import { ListFilter, X, Filter } from 'lucide-react';

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
  const [activeFilters, setActiveFilters] = useState<Set<ReplayFilterType>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  // Compute event counts per filter type
  const eventCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ev of events) {
      counts[ev.event] = (counts[ev.event] || 0) + 1;
    }
    return counts;
  }, [events]);

  const toggleFilter = (filterType: ReplayFilterType) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filterType)) {
        next.delete(filterType);
      } else {
        next.add(filterType);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setActiveFilters(new Set());
  };

  // Filtered event list with original indices
  const filteredIndexedEvents = useMemo(() => {
    if (activeFilters.size === 0) {
      return events.map((ev, originalIndex) => ({ ev, originalIndex }));
    }
    return events
      .map((ev, originalIndex) => ({ ev, originalIndex }))
      .filter(({ ev }) => activeFilters.has(ev.event as ReplayFilterType));
  }, [events, activeFilters]);

  // Auto-scroll active event into view if present in list
  useEffect(() => {
    if (activeItemRef.current && containerRef.current) {
      activeItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [currentIndex, filteredIndexedEvents]);

  const isFiltering = activeFilters.size > 0;

  return (
    <div className="flex flex-col border border-border rounded-[14px] bg-surface overflow-hidden shadow-xs">
      {/* Timeline Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-border bg-surface-2/60">
        <div className="flex items-center gap-2">
          <ListFilter className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-xs font-mono font-medium text-text uppercase tracking-wider">
            Event Log
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
          {isFiltering ? (
            <>
              <span className="text-accent font-medium">
                Showing {filteredIndexedEvents.length} of {events.length}
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-text cursor-pointer"
                title="Clear all filters"
              >
                <X className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </>
          ) : (
            <span>{events.length} events</span>
          )}
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="p-2.5 border-b border-border bg-surface/50">
        <div className="flex items-center gap-1.5 mb-1.5 text-[11px] font-mono text-text-muted">
          <Filter className="w-3 h-3 text-text-muted" />
          <span className="uppercase tracking-wider">Filter by type:</span>
        </div>

        <div
          className="flex flex-wrap gap-1.5 items-center"
          role="toolbar"
          aria-label="Filter events by type"
        >
          {/* All events chip */}
          <button
            type="button"
            onClick={clearFilters}
            aria-pressed={!isFiltering}
            className={`px-2 py-0.5 rounded-[8px] text-[11px] font-mono transition-all cursor-pointer border ${
              !isFiltering
                ? 'bg-accent/15 border-accent text-accent font-semibold shadow-2xs'
                : 'bg-surface-2 border-border text-text-muted hover:text-text hover:bg-surface-2/80'
            }`}
          >
            All ({events.length})
          </button>

          {/* Individual filter chips */}
          {REPLAY_FILTER_TYPES.map((type) => {
            const count = eventCounts[type] || 0;
            const isSelected = activeFilters.has(type);

            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleFilter(type)}
                aria-pressed={isSelected}
                className={`px-2 py-0.5 rounded-[8px] text-[11px] font-mono transition-all cursor-pointer border flex items-center gap-1 ${
                  isSelected
                    ? 'bg-accent text-accent-contrast border-accent font-semibold shadow-2xs'
                    : count > 0
                    ? 'bg-surface-2 border-border text-text hover:border-accent/40 hover:bg-surface-2/80'
                    : 'bg-surface-2/40 border-border/50 text-text-muted/60 opacity-60 hover:opacity-100'
                }`}
              >
                <span>{type}</span>
                <span
                  className={`text-[10px] px-1 py-0.2 rounded-full ${
                    isSelected ? 'bg-black/20 text-accent-contrast' : 'bg-surface text-text-muted'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable list */}
      <div
        ref={containerRef}
        role="feed"
        aria-label="Replay event stream"
        className="max-h-[500px] overflow-y-auto divide-y divide-border/60 p-2 space-y-1"
      >
        {filteredIndexedEvents.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-2 text-text-muted">
            <p className="text-xs font-mono">No events match the selected filters.</p>
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-1 text-xs font-mono rounded-[8px] border border-border bg-surface-2 text-text hover:bg-surface-2/80 transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredIndexedEvents.map(({ ev, originalIndex }) => {
            const isActive = originalIndex === currentIndex;
            return (
              <ReplayEventRow
                key={`${ev.step}-${originalIndex}`}
                itemRef={isActive ? activeItemRef : undefined}
                event={ev}
                index={originalIndex}
                isActive={isActive}
                onSelect={onSelectEvent}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
