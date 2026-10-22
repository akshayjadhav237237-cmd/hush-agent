import React from 'react';
import type { Gate } from '@/data/types';
import {
  ShieldAlert,
  KeyRound,
  HelpCircle,
  Terminal,
  RefreshCw,
  Compass,
  AlertTriangle,
  Check,
  ArrowUpRight,
} from 'lucide-react';

interface GateCardProps {
  gate: Gate;
  index: number;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: boolean | 'true' | 'false' }>> = {
  ShieldAlert,
  KeyRound,
  HelpCircle,
  Terminal,
  RefreshCw,
  Compass,
};

const GATE_CATEGORIES: Record<string, { tag: string; layer: string }> = {
  'gate-auth-captcha': { tag: 'Identity & Auth', layer: 'Browser Automation' },
  'gate-missing-credentials': { tag: 'Secrets & Quotas', layer: 'Environment Provider' },
  'gate-ambiguous-requirement': { tag: 'Architecture', layer: 'Reasoning Engine' },
  'gate-destructive-command': { tag: 'Sandbox', layer: 'Child Process OS' },
  'gate-repeated-failure': { tag: 'Circuit Breaker', layer: 'Progress & Graph Monitor' },
  'gate-scope-drift': { tag: 'Specification', layer: 'Scope Boundary' },
};

export const GateCard: React.FC<GateCardProps> = ({ gate, index }) => {
  const IconComponent = ICON_MAP[gate.icon] ?? AlertTriangle;
  const category = GATE_CATEGORIES[gate.id] ?? { tag: 'Policy Gate', layer: 'Execution Engine' };
  const gateNumber = String(index + 1).padStart(2, '0');

  return (
    <article
      tabIndex={0}
      aria-labelledby={`gate-title-${gate.id}`}
      className="group w-full bg-[#141414] border border-[rgba(255,255,255,0.06)] rounded-[24px] p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 hover:border-[rgba(255,255,255,0.14)] hover:bg-[#181818] relative overflow-hidden focus-visible:outline-2 focus-visible:outline-[#22FF6E] focus-visible:outline-offset-2"
    >
      <div>
        {/* Top row: Small rounded thumbnail top-left with mono-style icon, enforcement pill, index top-right */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-[12px] bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#22FF6E] shrink-0 group-hover:scale-105 transition-transform"
              aria-hidden="true"
            >
              <IconComponent className="w-4 h-4" strokeWidth={1.75} />
            </div>

            {/* Enforcement pill: code vs model */}
            {gate.enforcement === 'code' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-[#22FF6E]/10 text-[#22FF6E] border border-[#22FF6E]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22FF6E]" aria-hidden="true" />
                <span>code</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-white/[0.04] text-[rgba(245,240,232,0.65)] border border-white/[0.08]">
                <span className="w-1.5 h-1.5 rounded-full bg-[rgba(245,240,232,0.4)]" aria-hidden="true" />
                <span>model</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[rgba(245,240,232,0.45)]">
              {gateNumber}
            </span>
          </div>
        </div>

        {/* Card Title - bold / serif display typography */}
        <h3
          id={`gate-title-${gate.id}`}
          title={gate.title}
          className="text-lg font-bold font-display text-[#F0FFE8] tracking-tight group-hover:text-[#22FF6E] transition-colors"
        >
          {gate.title}
        </h3>

        <div className="text-[11px] font-mono text-[rgba(245,240,232,0.45)] mt-1">
          {category.tag}
        </div>

        {/* Checklist / details with muted checkmarks */}
        <div className="mt-5 space-y-3.5 pt-4 border-t border-[rgba(255,255,255,0.06)]">
          {/* Detects checklist item */}
          <div className="flex items-start gap-2.5">
            <Check
              className="w-4 h-4 text-[rgba(245,240,232,0.35)] shrink-0 mt-0.5"
              strokeWidth={2}
              aria-hidden="true"
            />
            <div className="text-xs leading-relaxed">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[rgba(245,240,232,0.45)] block mb-0.5">
                Detects
              </span>
              <span className="text-[rgba(245,240,232,0.7)] font-sans">
                {gate.detects}
              </span>
            </div>
          </div>

          {/* Action checklist item */}
          <div className="flex items-start gap-2.5">
            <Check
              className="w-4 h-4 text-[#22FF6E]/70 shrink-0 mt-0.5"
              strokeWidth={2}
              aria-hidden="true"
            />
            <div className="text-xs leading-relaxed">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#22FF6E]/80 block mb-0.5">
                Action Taken
              </span>
              <span className="text-[#F5F0E8] font-sans font-medium">
                {gate.action}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer: Layer tag on left, "Learn more ↗" at bottom right */}
      <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs font-mono">
        <span className="text-[rgba(245,240,232,0.45)] truncate max-w-[160px]" title={category.layer}>
          {category.layer}
        </span>

        <a
          href="#safety"
          className="inline-flex items-center gap-1 text-[rgba(245,240,232,0.6)] hover:text-[#22FF6E] transition-colors group/link"
        >
          <span>Learn more</span>
          <ArrowUpRight
            className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </a>
      </div>
    </article>
  );
};

export default GateCard;
