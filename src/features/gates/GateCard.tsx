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
  ShieldCheck,
  Search,
  CheckCircle2,
  Eye,
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
  'gate-destructive-command': { tag: 'Guardrail', layer: 'Child Process OS' },
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
      className="w-full bg-surface border border-border rounded-[14px] p-5 sm:p-6 flex flex-col justify-between transition-colors duration-150 hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 relative overflow-hidden"
    >
      <div>
        {/* Top row: Gate Index, Category Tag, and Small Lucide Icon */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-text-muted bg-surface-2 px-2.5 py-1 rounded-md border border-border">
              GATE {gateNumber}
            </span>
            <span className="text-xs font-mono text-text-muted hidden sm:inline-block">
              {category.tag}
            </span>
          </div>

          <div
            className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-text shrink-0"
            aria-hidden="true"
          >
            <IconComponent className="w-4 h-4 text-accent" strokeWidth={1.5} />
          </div>
        </div>

        {/* Card Title - One line title */}
        <h3
          id={`gate-title-${gate.id}`}
          title={gate.title}
          className="text-base font-semibold text-text tracking-tight truncate"
        >
          {gate.title}
        </h3>

        {/* Enforcement Tag: text + icon (not color only) */}
        <div className="mt-2.5 flex items-center">
          {gate.enforcement === 'code' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-surface-2 border border-border text-success">
              <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span>Enforced in code</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-surface-2 border border-border text-text-muted">
              <Eye className="w-3.5 h-3.5 text-text-muted shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span>Judged by the model, guided by prompt</span>
            </span>
          )}
        </div>

        {/* Trigger Condition */}
        <div className="mt-4 pt-3 border-t border-border">
          <div className="text-[11px] uppercase tracking-wider font-mono font-medium text-text-muted mb-1 flex items-center gap-1.5">
            <Search className="w-3 h-3 text-text-muted shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span>Trigger Condition</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            {gate.detects}
          </p>
        </div>

        {/* Action Taken - Amber used ONLY for human-attention moment */}
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-[11px] uppercase tracking-wider font-mono font-semibold text-warning mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-warning shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span>Human Attention Required</span>
          </div>
          <p className="text-xs text-text font-medium leading-relaxed">
            {gate.action}
          </p>
        </div>
      </div>

      {/* Card Footer: Policy Gate Enforcement Layer */}
      <div className="mt-5 pt-3 border-t border-border/70 flex items-center justify-between text-[11px] text-text-muted font-mono">
        <span className="inline-flex items-center gap-1.5 text-text-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={1.5} aria-hidden="true" />
          <span>Policy Gate</span>
        </span>
        <span className="truncate max-w-[150px] text-right" title={category.layer}>
          {category.layer}
        </span>
      </div>
    </article>
  );
};
