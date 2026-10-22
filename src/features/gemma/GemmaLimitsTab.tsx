import React from 'react';
import { Terminal, Eye, Crosshair, HardDrive, AlertTriangle, CheckCircle2, Shield } from 'lucide-react';

interface CapabilityLimitItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  capability: string;
  limitation: string;
  mitigation: string;
}

const ITEMS: CapabilityLimitItem[] = [
  {
    id: 'tool-calling',
    title: 'Native Function Calling',
    icon: <Terminal className="w-5 h-5 text-accent" strokeWidth={1.5} aria-hidden="true" />,
    capability:
      'Gemma 4 provides native function calling. It generates structured JSON arguments conforming to provided schemas without custom regex parsing.',
    limitation:
      'Deeply nested schemas with optional arguments can lead to schema drift or improper type coercion under edge conditions.',
    mitigation:
      'Hush uses flat tool signatures validated with strict schemas before execution. Malformed payloads are rejected prior to execution.',
  },
  {
    id: 'multimodality',
    title: 'Multimodal Vision and Screenshot Analysis',
    icon: <Eye className="w-5 h-5 text-accent" strokeWidth={1.5} aria-hidden="true" />,
    capability:
      'Gemma processes image tokens to evaluate page layout, alignment, and basic visual structure from rendered frames.',
    limitation:
      'High-resolution screenshots consume substantial context token budgets and increase response latency.',
    mitigation:
      'Hush captures standardized 1080p frames and crops regions around modified sections to conserve context.',
  },
  {
    id: 'coordinate-accuracy',
    title: 'UI Interaction and Coordinate Accuracy',
    icon: <Crosshair className="w-5 h-5 text-accent" strokeWidth={1.5} aria-hidden="true" />,
    capability:
      'The current agent uses keyboard shortcuts, clipboard, and CLI commands where possible.',
    limitation:
      "Gemma's direct UI click coordinate accuracy is unverified. Hush does not claim any spatial grounding capability.",
    mitigation:
      'Desktop workflows avoid raw pixel clicks entirely. Automation relies on terminal execution, key combinations, and system clipboard transfer.',
  },
  {
    id: 'offline-execution',
    title: 'Offline and Local Execution',
    icon: <HardDrive className="w-5 h-5 text-accent" strokeWidth={1.5} aria-hidden="true" />,
    capability:
      'Open weights permit offline execution through Ollama, vLLM, or LiteRT on local hardware.',
    limitation:
      'Larger model weights require sufficient unified memory and compute bandwidth.',
    mitigation:
      'Hush supports running smaller model sizes locally for rapid gating, or routing to the Gemini API for cloud orchestration.',
  },
];

export const GemmaLimitsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Intro header */}
      <div className="rounded-[14px] bg-surface border border-border p-5 sm:p-6">
        <h4 className="text-base sm:text-lg font-semibold text-text mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5 text-accent" strokeWidth={1.5} aria-hidden="true" />
          Capabilities, Limitations, and Mitigations
        </h4>
        <p className="text-sm text-text-muted leading-relaxed">
          An honest overview of where Gemma operates effectively, where boundaries exist, and how Hush addresses each constraint.
        </p>
      </div>

      {/* Grid of 4 deep-dive items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {ITEMS.map((item) => (
          <div
            key={item.id}
            className="rounded-[14px] bg-surface border border-border p-5 sm:p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-[8px] bg-surface-2 border border-border">
                  {item.icon}
                </div>
                <h5 className="text-base font-semibold text-text">
                  {item.title}
                </h5>
              </div>

              {/* Capability */}
              <div className="mb-4">
                <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-success mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  <span>Capability</span>
                </div>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed pl-5">
                  {item.capability}
                </p>
              </div>

              {/* Limitation */}
              <div className="mb-4">
                <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-warning mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  <span>Limitation</span>
                </div>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed pl-5">
                  {item.limitation}
                </p>
              </div>
            </div>

            {/* Mitigation */}
            <div className="pt-3 border-t border-border mt-2 bg-surface-2 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 sm:p-5 rounded-b-[14px]">
              <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-accent mb-1">
                <Shield className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <span>Hush Mitigation</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed pl-5">
                {item.mitigation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
