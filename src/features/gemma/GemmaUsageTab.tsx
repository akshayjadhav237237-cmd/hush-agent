import React from 'react';
import { GEMMA_USAGES } from '@/data/gemma';
import { Workflow, Eye, ShieldAlert, Cpu, ArrowRight, CheckCircle2 } from 'lucide-react';

const USAGE_DETAILS = [
  {
    icon: <Cpu className="w-5 h-5 text-accent" strokeWidth={1.5} aria-hidden="true" />,
    role: 'Autonomous Coordinator',
    metrics: ['Structured schema validation', 'Direct tool dispatch', 'Typed parameter checking'],
  },
  {
    icon: <Eye className="w-5 h-5 text-accent" strokeWidth={1.5} aria-hidden="true" />,
    role: 'Visual QA Inspector',
    metrics: ['Native image tokens', 'Responsive layout checks', 'Visual alignment review'],
  },
  {
    icon: <ShieldAlert className="w-5 h-5 text-accent" strokeWidth={1.5} aria-hidden="true" />,
    role: 'Attention Gatekeeper',
    metrics: ['Ambiguity detection', 'Sandbox rule verification', 'Human handoff triaging'],
  },
];

export const GemmaUsageTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="rounded-[14px] bg-surface border border-border p-5 sm:p-6">
        <h4 className="text-base sm:text-lg font-semibold text-text mb-2 flex items-center gap-2">
          <Workflow className="w-5 h-5 text-accent" strokeWidth={1.5} aria-hidden="true" />
          Gemma 4 Control Plane
        </h4>
        <p className="text-sm text-text-muted leading-relaxed">
          Rather than routing routine coordination through expensive frontier endpoints, Hush places Gemma 4 at the center of the execution loop. Gemma inspects goals, dispatches tool calls, evaluates visual output, and acts as the gatekeeper before changes apply.
        </p>
      </div>

      {/* 3 Core Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {GEMMA_USAGES.map((usage, idx) => {
          const detail = USAGE_DETAILS[idx] || USAGE_DETAILS[0];
          return (
            <div
              key={usage.title}
              className="rounded-[14px] bg-surface border border-border p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-[8px] bg-surface-2 border border-border">
                    {detail.icon}
                  </div>
                  <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-surface-2 text-accent border border-border">
                    {detail.role}
                  </span>
                </div>

                <h5 className="text-base font-semibold text-text mb-2">
                  {usage.title}
                </h5>

                <p className="text-xs sm:text-sm text-text-muted leading-relaxed mb-4">
                  {usage.description}
                </p>
              </div>

              <div className="pt-4 border-t border-border mt-auto">
                <span className="text-xs font-mono uppercase tracking-wider text-text-muted block mb-2">
                  Technical Guarantees
                </span>
                <ul className="space-y-1.5">
                  {detail.metrics.map((metric) => (
                    <li key={metric} className="flex items-center gap-2 text-xs text-text">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" strokeWidth={1.5} aria-hidden="true" />
                      <span>{metric}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Flow Architecture Diagram */}
      <div className="rounded-[14px] bg-surface border border-border p-5 sm:p-6">
        <h4 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-4">
          Lifecycle Flow: Coordination Steps
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="p-4 rounded-[10px] bg-surface-2 border border-border flex flex-col justify-between">
            <span className="text-xs font-mono text-accent mb-1">01. INGESTION</span>
            <p className="text-xs font-semibold text-text mb-1">User Intent</p>
            <p className="text-xs text-text-muted">High-level task delivered to the pipeline.</p>
          </div>

          <div className="p-4 rounded-[10px] bg-surface-2 border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-accent">02. GEMMA ROUTER</span>
              <Cpu className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold text-text mb-1">Function Calling</p>
            <p className="text-xs text-text-muted">Gemma dispatches tasks to Claude or Gemini Deep Research.</p>
          </div>

          <div className="p-4 rounded-[10px] bg-surface-2 border border-border flex flex-col justify-between">
            <span className="text-xs font-mono text-text-muted mb-1">03. EXECUTION</span>
            <p className="text-xs font-semibold text-text mb-1">Tool Execution</p>
            <p className="text-xs text-text-muted">Research compiled or code synthesized in sandbox.</p>
          </div>

          <div className="p-4 rounded-[10px] bg-surface-2 border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-accent">04. GEMMA VISION</span>
              <Eye className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold text-text mb-1">Visual Verification</p>
            <p className="text-xs text-text-muted">Inspects rendered UI screenshot to verify layout structure.</p>
          </div>

          <div className="p-4 rounded-[10px] bg-surface-2 border border-border flex flex-col justify-between">
            <span className="text-xs font-mono text-warning mb-1">05. ATTENTION GATE</span>
            <p className="text-xs font-semibold text-text mb-1">Pass or Pause</p>
            <p className="text-xs text-text-muted">Pauses for human confirmation if ambiguous or blocked.</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-text-muted">
          <span>Continuous feedback loop maintains verified state across each step.</span>
          <ArrowRight className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};
