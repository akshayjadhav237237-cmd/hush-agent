import React from 'react';
import { EventBadge } from './EventBadge';
import type { ReplayEvent } from './types';
import { Clock, ShieldCheck, Wrench, ShieldAlert } from 'lucide-react';

interface ReplaySummaryCardProps {
  event: ReplayEvent | null;
  totalEvents: number;
}

export const ReplaySummaryCard: React.FC<ReplaySummaryCardProps> = ({
  event,
  totalEvents,
}) => {
  if (!event) {
    return (
      <div className="border border-white/[0.06] rounded-[20px] bg-[#0e0e0e] p-6 flex flex-col items-center justify-center text-center text-[#F5F0E8]/45 min-h-[320px]">
        <p className="text-sm font-mono">No event selected</p>
      </div>
    );
  }

  const isGate = event.event === 'gate' || Boolean(event.gate);

  return (
    <div
      className={`border rounded-[20px] bg-[#0e0e0e] p-5 sm:p-6 flex flex-col gap-5 transition-colors duration-200 ${
        isGate ? 'border-[#E3B15C]/50 shadow-sm bg-[#E3B15C]/[0.02]' : 'border-white/[0.06]'
      }`}
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <EventBadge event={event.event} size="md" />
          {event.tool && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/[0.06] bg-white/[0.04] text-xs font-mono text-[#F0FFE8]">
              <Wrench className="w-3.5 h-3.5 text-[#22FF6E]" />
              <span>{event.tool}</span>
            </span>
          )}
          {event.gate && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#E3B15C]/40 bg-[#E3B15C]/10 text-xs font-mono text-[#E3B15C] font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-[#E3B15C]" />
              <span>{event.gate}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-[#F5F0E8]/45">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] bg-white/[0.04] border border-white/[0.06]">
            <Clock className="w-3 h-3 text-[#F5F0E8]/45" />
            <span className="text-[#F0FFE8] font-medium">{event.t.toFixed(1)}s</span>
          </span>
          <span className="px-2.5 py-0.5 rounded-[8px] bg-white/[0.04] border border-white/[0.06]">
            Event {event.step} of {totalEvents}
          </span>
        </div>
      </div>

      {/* Structured Details Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-[14px] bg-white/[0.02] border border-white/[0.06] flex flex-col gap-1">
          <span className="text-[11px] font-mono text-[#F5F0E8]/45 uppercase tracking-wider">Event Type</span>
          <span className="text-xs font-mono font-semibold text-[#F0FFE8] truncate">{event.event}</span>
        </div>

        <div className="p-3.5 rounded-[14px] bg-white/[0.02] border border-white/[0.06] flex flex-col gap-1">
          <span className="text-[11px] font-mono text-[#F5F0E8]/45 uppercase tracking-wider">Timestamp</span>
          <span className="text-xs font-mono font-semibold text-[#F0FFE8]">{event.t.toFixed(1)}s</span>
        </div>

        <div className="p-3.5 rounded-[14px] bg-white/[0.02] border border-white/[0.06] flex flex-col gap-1">
          <span className="text-[11px] font-mono text-[#F5F0E8]/45 uppercase tracking-wider">Sequence</span>
          <span className="text-xs font-mono font-semibold text-[#22FF6E]">#{event.step}</span>
        </div>

        <div className="p-3.5 rounded-[14px] bg-white/[0.02] border border-white/[0.06] flex flex-col gap-1">
          <span className="text-[11px] font-mono text-[#F5F0E8]/45 uppercase tracking-wider">Target / Tool</span>
          <span className="text-xs font-mono font-semibold text-[#F0FFE8] truncate">
            {event.tool || event.gate || '—'}
          </span>
        </div>
      </div>

      {/* Summary Box */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-[#F5F0E8]/45 text-[11px] uppercase tracking-wider">
            Sanitized Event Summary
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#22FF6E]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#22FF6E]" />
            <span>Redacted &amp; Verified</span>
          </span>
        </div>

        <div className="p-4 rounded-[14px] bg-[#050505] border border-white/[0.06] text-[#F5F0E8] font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words min-h-[90px]">
          {event.summary}
        </div>

        <p className="text-[11px] font-mono text-[#F5F0E8]/45 leading-normal">
          Raw arguments and sensitive clipboard text are automatically stripped or hashed during export.
        </p>
      </div>
    </div>
  );
};
