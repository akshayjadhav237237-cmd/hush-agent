import React from 'react';
import {
  Brain,
  ShieldAlert,
  Eye,
  Lock,
  Zap,
  AlertOctagon,
  ShieldCheck,
  Cpu
} from 'lucide-react';

export const TrustCallout: React.FC = () => {
  return (
    <div className="w-full space-y-6 pt-2">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-1.5">
        <h3 className="text-lg sm:text-xl font-semibold text-text">
          Trust Architecture &amp; Boundary Enforcement
        </h3>
        <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
          Hush coordinates agents on your workstation. It interrupts only when an operation requires operator judgment.
        </p>
      </div>

      {/* Two Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pillar 1: Google Gemma 4 */}
        <div className="p-5 rounded-[14px] bg-surface border border-border space-y-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[10px] bg-accent/10 text-accent border border-accent/20">
              <Brain className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text">
                Google Gemma 4: Local Orchestrator
              </h4>
              <p className="text-xs text-text-muted font-mono">
                On-Device Screen Vision &amp; Privacy Sentry
              </p>
            </div>
          </div>

          <p className="text-xs text-text-muted leading-relaxed">
            Running locally on the workstation, Google Gemma 4 acts as the central coordinator. It inspects local
            screen state using multimodal vision to verify editor output without streaming desktop frames or credentials to external services.
          </p>

          <div className="space-y-2.5 pt-3 border-t border-border">
            <div className="flex items-start gap-2.5 text-xs">
              <Eye className="w-4 h-4 text-accent shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <span className="font-medium text-text">Zero-leakage screen vision: </span>
                <span className="text-text-muted">
                  Visual frame analysis executes locally. Proprietary source code and credentials never leave workstation memory.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <Cpu className="w-4 h-4 text-accent shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <span className="font-medium text-text">Bounded task delegation: </span>
                <span className="text-text-muted">
                  Routes structured task contracts to Claude for architecture, Gemini Deep Research for references, and Antigravity for code.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <span className="font-medium text-text">On-device secret redaction: </span>
                <span className="text-text-muted">
                  Scrubs API keys, environment tokens, and internal paths prior to subagent dispatch.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 2: Attention Gate */}
        <div className="p-5 rounded-[14px] bg-surface border border-border space-y-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-[10px] bg-warning/10 text-warning border border-warning/30">
              <ShieldAlert className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text">
                Attention Gate: Deterministic Checkpoint
              </h4>
              <p className="text-xs text-text-muted font-mono">
                Zero-Trust Break-Glass Intercept &amp; Kill Switch
              </p>
            </div>
          </div>

          <p className="text-xs text-text-muted leading-relaxed">
            Autonomous agent operations are restrained from irreversible mutations. The Attention Gate serves
            as a deterministic checkpoint between agent proposals and workstation execution.
          </p>

          <div className="space-y-2.5 pt-3 border-t border-border">
            <div className="flex items-start gap-2.5 text-xs">
              <AlertOctagon className="w-4 h-4 text-warning shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <span className="font-medium text-text">Privileged command intercept: </span>
                <span className="text-text-muted">
                  Freezes execution on sudo requests, filesystem deletions, package installations, or schema drops until explicit confirmation.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <Lock className="w-4 h-4 text-warning shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <span className="font-medium text-text">Credential authorization guard: </span>
                <span className="text-text-muted">
                  Agents cannot autonomously authorize OAuth scopes or accept security waivers without direct human presence.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <Zap className="w-4 h-4 text-warning shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <span className="font-medium text-text">Immediate kill switch: </span>
                <span className="text-text-muted">
                  Instantly terminates spawned subagent processes, rolls back uncommitted workspace changes, and revokes active session credentials.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
