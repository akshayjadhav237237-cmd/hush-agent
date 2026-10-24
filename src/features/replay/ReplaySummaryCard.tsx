import React from 'react';
import { EventBadge } from './EventBadge';
import type { ReplayEvent } from './types';
import { Clock, ShieldCheck, Wrench, ShieldAlert, Bot } from 'lucide-react';
import { sanitizeReplayText } from './sanitizer';

interface ReplaySummaryCardProps {
  event: ReplayEvent | null;
  totalEvents: number;
  payloadProvider?: string;
}

export const ReplaySummaryCard: React.FC<ReplaySummaryCardProps> = ({
  event,
  totalEvents,
  payloadProvider,
}) => {
  if (!event) {
    return (
      <div className="border border-border rounded-[14px] bg-surface p-6 flex flex-col items-center justify-center text-center text-text-muted min-h-[320px]">
        <p className="text-sm font-mono">No event selected</p>
      </div>
    );
  }

  const isGate = event.event === 'gate' || Boolean(event.gate);
  const activeProvider = event.provider || (event.event === 'run_start' ? payloadProvider : undefined);
  const sanitizedSummary = sanitizeReplayText(event.summary);

  return (
    <div
      className={`border rounded-[14px] bg-surface p-5 sm:p-6 flex flex-col gap-5 transition-colors duration-200 shadow-xs ${
        isGate ? 'border-warning shadow-sm' : 'border-border'
      }`}
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-2.5 flex-wrap">
          <EventBadge event={event.event} size="md" />

          {event.tool && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] border border-border bg-surface-2 text-xs font-mono text-text">
              <Wrench className="w-3 h-3 text-text-muted" />
              <span>{event.tool}</span>
            </span>
          )}

          {event.gate && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] border border-warning/50 bg-warning/10 text-xs font-mono text-warning font-medium">
              <ShieldAlert className="w-3 h-3" />
              <span>{event.gate}</span>
            </span>
          )}

          {activeProvider && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] border border-accent/40 bg-accent/10 text-xs font-mono text-accent font-medium">
              <Bot className="w-3 h-3" />
              <span>{activeProvider}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-text-muted">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] bg-surface-2 border border-border">
            <Clock className="w-3 h-3 text-text-muted" />
            <span className="text-text font-medium">{event.t.toFixed(1)}s</span>
          </span>
          <span className="px-2 py-0.5 rounded-[8px] bg-surface-2 border border-border">
            Event {event.step} of {totalEvents}
          </span>
        </div>
      </div>

      {/* Structured Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-[10px] bg-surface-2 border border-border flex flex-col gap-1">
          <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider">Event Type</span>
          <span className="text-xs font-mono font-semibold text-text truncate">{event.event}</span>
        </div>

        <div className="p-3 rounded-[10px] bg-surface-2 border border-border flex flex-col gap-1">
          <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider">Timestamp</span>
          <span className="text-xs font-mono font-semibold text-text">{event.t.toFixed(1)}s</span>
        </div>

        <div className="p-3 rounded-[10px] bg-surface-2 border border-border flex flex-col gap-1">
          <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider">Sequence</span>
          <span className="text-xs font-mono font-semibold text-text">#{event.step}</span>
        </div>

        <div className="p-3 rounded-[10px] bg-surface-2 border border-border flex flex-col gap-1">
          <span className="text-[11px] font-mono text-text-muted uppercase tracking-wider">
            {activeProvider ? 'Target / Provider' : 'Target / Tool'}
          </span>
          <span className="text-xs font-mono font-semibold text-text truncate">
            {event.tool || event.gate || activeProvider || '—'}
          </span>
        </div>
      </div>

      {/* Sanitized Summary Box (strictly no raw args or unredacted clipboard) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-text-muted text-[11px] uppercase tracking-wider">
            Sanitized Event Summary
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-accent">
            <ShieldCheck className="w-3 h-3" />
            <span>Sanitized Output</span>
          </span>
        </div>

        <div className="p-4 rounded-[10px] bg-surface-2 border border-border text-text font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words min-h-[90px]">
          {sanitizedSummary}
        </div>

        <p className="text-[11px] font-mono text-text-muted leading-normal">
          Raw arguments and sensitive clipboard text are strictly stripped and redacted for privacy.
        </p>
      </div>
    </div>
  );
};
