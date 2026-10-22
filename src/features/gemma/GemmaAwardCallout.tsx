import React from 'react';
import { Award, CheckCircle2, ShieldCheck, Eye, Cpu, Terminal } from 'lucide-react';

export const GemmaAwardCallout: React.FC = () => {
  return (
    <div className="rounded-[14px] border border-border bg-surface p-6 sm:p-8 mb-10 transition-colors">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border border-border bg-surface-2 text-text-muted">
          <Award className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} aria-hidden="true" />
          Hackathon Spotlight
        </span>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-medium border border-border bg-surface-2 text-accent">
          Best Use of Gemma 4
        </span>
      </div>

      <h3 className="text-xl sm:text-2xl font-bold text-text mb-3">
        Gemma 4 in Hush
      </h3>

      <p className="text-sm sm:text-base text-text-muted mb-6 leading-relaxed max-w-4xl">
        Hush positions Gemma 4 as the autonomous control plane: serving as the workflow orchestrator, multimodal screenshot inspector, and attention gate classifier.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3 p-4 rounded-[10px] bg-surface-2 border border-border">
          <div className="p-2 rounded-[8px] bg-surface border border-border text-accent shrink-0">
            <Cpu className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text mb-1">
              Active Orchestrator via Function Calling
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Gemma drives the agent decision loop using native function calling to dispatch tasks to Claude and Gemini Deep Research.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-[10px] bg-surface-2 border border-border">
          <div className="p-2 rounded-[8px] bg-surface border border-border text-accent shrink-0">
            <Eye className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text mb-1">
              Multimodal Screenshot Verification
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Uses native vision to inspect rendered browser screenshots, checking layout structure before gate evaluations.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-[10px] bg-surface-2 border border-border">
          <div className="p-2 rounded-[8px] bg-surface border border-border text-accent shrink-0">
            <ShieldCheck className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text mb-1">
              Attention Gate Classifier
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Evaluates ambiguity, destructive commands, and missing credentials, pausing execution for human intervention only when necessary.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-[10px] bg-surface-2 border border-border">
          <div className="p-2 rounded-[8px] bg-surface border border-border text-accent shrink-0">
            <Terminal className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text mb-1">
              Local and Cloud Parity
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Runs in the cloud with the Gemini API (<code className="font-mono text-accent">gemma-4-26b-a4b-it</code>) or offline on developer hardware with Ollama and LiteRT.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-border flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-text-muted">
        <span className="flex items-center gap-1.5 text-success">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          <span>Apache 2.0 open-weights license</span>
        </span>
        <span className="flex items-center gap-1.5 text-success">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          <span>Extended context window</span>
        </span>
        <span className="flex items-center gap-1.5 text-success">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          <span>Reduced frontier token consumption</span>
        </span>
      </div>
    </div>
  );
};
