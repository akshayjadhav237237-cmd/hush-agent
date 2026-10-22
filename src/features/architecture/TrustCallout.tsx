import React from 'react';
import {
  Brain,
  ShieldAlert,
  Eye,
  Lock,
  Zap,
  AlertOctagon,
  ShieldCheck,
  Cpu,
  Network,
  Terminal
} from 'lucide-react';

export const TrustCallout: React.FC = () => {
  return (
    <div className="w-full space-y-6 pt-4">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h3 className="text-xl sm:text-2xl font-['Archivo',sans-serif] font-bold text-[#F0FFE8]">
          Trust Architecture &amp; <span className="font-['Cormorant_Garamond',serif] italic font-normal text-[#22FF6E]">Boundary Enforcement.</span>
        </h3>
        <p className="text-xs sm:text-sm font-['Space_Grotesk',sans-serif] text-[#F5F0E8]/45 leading-relaxed">
          Hush coordinates agents on your workstation. It interrupts only when an operation strictly requires operator judgment.
        </p>
      </div>

      {/* Three Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Pillar 1: Google Gemma 4 */}
        <div className="p-6 rounded-[24px] bg-[#141414] border border-white/[0.06] space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[14px] bg-[#22FF6E]/10 text-[#22FF6E] border border-[#22FF6E]/20">
              <Brain className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-sm font-bold font-['Archivo',sans-serif] text-[#F0FFE8]">
                Google Gemma 4: Cloud Orchestrator
              </h4>
              <p className="text-[11px] text-[#22FF6E] font-mono">
                Gemini API Function Calling &amp; Vision
              </p>
            </div>
          </div>

          <p className="text-xs font-['Space_Grotesk',sans-serif] text-[#F5F0E8]/60 leading-relaxed">
            In the current build, Gemma 4 is called through the Gemini API. Running the same loop on a local runtime such as Ollama is a possible next step and has not been verified. Screenshots are transmitted to the Gemma API for layout inspection.
          </p>

          <div className="space-y-3 pt-3 border-t border-white/[0.06]">
            <div className="flex items-start gap-2.5 text-xs">
              <Eye className="w-4 h-4 text-[#22FF6E] shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <span className="font-semibold text-[#F0FFE8]">Screen vision inspection: </span>
                <span className="text-[#F5F0E8]/45">
                  Screenshots are transmitted to the Gemma API for layout and responsive element verification.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <Cpu className="w-4 h-4 text-[#22FF6E] shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <span className="font-semibold text-[#F0FFE8]">Bounded task delegation: </span>
                <span className="text-[#F5F0E8]/45">
                  Routes structured task contracts to Claude for architecture, Gemini Deep Research for references, and Antigravity for code.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-[#22FF6E] shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <span className="font-semibold text-[#F0FFE8]">Secret redaction: </span>
                <span className="text-[#F5F0E8]/45">
                  Scrubs API keys, environment tokens, and internal paths prior to subagent dispatch.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 2: Graphify: Local Code Analysis */}
        <div className="p-6 rounded-[24px] bg-[#141414] border border-white/[0.06] space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[14px] bg-[#22FF6E]/10 text-[#22FF6E] border border-[#22FF6E]/20">
              <Network className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-sm font-bold font-['Archivo',sans-serif] text-[#F0FFE8]">
                Graphify: Local Code Analysis
              </h4>
              <p className="text-[11px] text-[#22FF6E] font-mono">
                Tree-Sitter AST &amp; Graph Memory
              </p>
            </div>
          </div>

          <p className="text-xs font-['Space_Grotesk',sans-serif] text-[#F5F0E8]/60 leading-relaxed">
            Graphify extracts AST structure locally using tree-sitter without uploading source code to external servers. It maps file and symbol relationships into graph memory.
          </p>

          <div className="space-y-3 pt-3 border-t border-white/[0.06]">
            <div className="flex items-start gap-2.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-[#22FF6E] shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <span className="font-semibold text-[#F0FFE8]">Local AST parsing: </span>
                <span className="text-[#F5F0E8]/45">
                  Tree-sitter extracts source syntax trees directly on the workstation into graphify-out/.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <Network className="w-4 h-4 text-[#22FF6E] shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <span className="font-semibold text-[#F0FFE8]">Community clustering: </span>
                <span className="text-[#F5F0E8]/45">
                  Detects modular codebase topology and symbol relationships via Louvain community clustering.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <Terminal className="w-4 h-4 text-[#22FF6E] shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <span className="font-semibold text-[#F0FFE8]">CLI tool endpoints: </span>
                <span className="text-[#F5F0E8]/45">
                  Gemma orchestrates graph_build, graph_update, graph_report, graph_query, graph_explain, and graph_path.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 3: Attention Gate */}
        <div className="p-6 rounded-[24px] bg-[#141414] border border-white/[0.06] space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[14px] bg-[#FFBD2E]/10 text-[#FFBD2E] border border-[#FFBD2E]/30">
              <ShieldAlert className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-sm font-bold font-['Archivo',sans-serif] text-[#F0FFE8]">
                Attention Gate: Policy Checkpoint
              </h4>
              <p className="text-[11px] text-[#FFBD2E] font-mono">
                Zero-Trust Break-Glass &amp; Kill Switch
              </p>
            </div>
          </div>

          <p className="text-xs font-['Space_Grotesk',sans-serif] text-[#F5F0E8]/60 leading-relaxed">
            Autonomous agent operations are restrained from irreversible mutations. The Attention Gate serves
            as a policy checkpoint between agent proposals and workstation execution.
          </p>

          <div className="space-y-3 pt-3 border-t border-white/[0.06]">
            <div className="flex items-start gap-2.5 text-xs">
              <AlertOctagon className="w-4 h-4 text-[#FFBD2E] shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <span className="font-semibold text-[#F0FFE8]">Privileged command intercept: </span>
                <span className="text-[#F5F0E8]/45">
                  Freezes execution on sudo requests, filesystem deletions, package installations, or schema drops until explicit confirmation.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <Lock className="w-4 h-4 text-[#FFBD2E] shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <span className="font-semibold text-[#F0FFE8]">Credential authorization guard: </span>
                <span className="text-[#F5F0E8]/45">
                  Agents cannot autonomously authorize OAuth scopes or accept security waivers without direct human presence.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs">
              <Zap className="w-4 h-4 text-[#FFBD2E] shrink-0 mt-0.5" strokeWidth={1.5} />
              <div>
                <span className="font-semibold text-[#F0FFE8]">Immediate kill switch: </span>
                <span className="text-[#F5F0E8]/45">
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
