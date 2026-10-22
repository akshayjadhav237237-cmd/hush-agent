import React, { useState } from 'react';
import { Copy, Check, GitCommit, FileCode } from 'lucide-react';

interface DiffRow {
  category: string;
  hunkHeader: string;
  removed: string;
  added: string;
  lineNumOld: number;
  lineNumNew: number;
}

const DIFF_ROWS: DiffRow[] = [
  {
    category: '01 // RUNTIME CONFINEMENT',
    hunkHeader: '@@ -42,7 +42,8 @@ class RuntimeExecutionBoundary:',
    removed:
      '- Standard Agents: Unconstrained root shell execution, blind filesystem mutations, unmonitored commands without boundary enforcement.',
    added:
      '+ Hush with Gemma 4: Isolated Antigravity sandbox, strict allowlist guardrails, fail-closed permission checks before write operations.',
    lineNumOld: 42,
    lineNumNew: 42,
  },
  {
    category: '02 // INTERRUPT LOGIC',
    hunkHeader: '@@ -89,5 +90,6 @@ def evaluate_execution_interrupt(event):',
    removed:
      '- Standard Agents: Continuously prompt user on minor warnings, unconstrained command execution, stateless context loss.',
    added:
      '+ Hush with Gemma 4: Autonomous loop, strict allowlist guardrails, Graphify AST memory, attention gates only on hard blockers.',
    lineNumOld: 89,
    lineNumNew: 90,
  },
  {
    category: '03 // CODE MEMORY',
    hunkHeader: '@@ -134,6 +136,8 @@ class CodebaseMemoryIndex:',
    removed:
      '- Standard Agents: Stateless context window truncation, repetitive codebase re-reads, blind regex grep, no symbol topology awareness.',
    added:
      '+ Hush with Gemma 4: Graphify local AST parsing via tree-sitter, Louvain community clusters, zero cloud leakage, multi-round symbol recall.',
    lineNumOld: 134,
    lineNumNew: 136,
  },
];

export const CodeDiffComparison: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const rawDiff = DIFF_ROWS.map(
      (r) =>
        `# ${r.category}\n${r.hunkHeader}\n${r.removed}\n${r.added}`
    ).join('\n\n');
    navigator.clipboard.writeText(rawDiff).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="w-full space-y-4">
      {/* Section Sub-header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-1">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-white/[0.04] border border-white/[0.08] text-[#22FF6E] mb-2">
            <GitCommit className="w-3.5 h-3.5" />
            <span>DIFF // ARCHITECTURAL PARADIGM</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-['Archivo',sans-serif] font-bold text-[#F0FFE8] tracking-tight">
            Standard Agents vs. <span className="font-['Cormorant_Garamond',serif] italic font-normal text-[#22FF6E]">Hush Runtime.</span>
          </h3>
        </div>
        <p className="font-['Space_Grotesk',sans-serif] text-xs sm:text-sm text-[#F5F0E8]/45 max-w-md sm:text-right">
          A side-by-side terminal diff showing how Hush eliminates confirmation fatigue and secures workstation state.
        </p>
      </div>

      {/* Terminal Code Window Panel */}
      <div className="w-full bg-[#141414] rounded-[24px] border border-white/[0.06] overflow-hidden shadow-2xl">
        {/* Terminal Title Bar */}
        <div className="bg-[#0c0c0c] border-b border-white/[0.06] px-4 py-3 flex items-center justify-between gap-4">
          {/* Window control dots & filename */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56]/80 block" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E]/80 block" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F]/80 block" />
            </div>
            <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
              <FileCode className="w-3.5 h-3.5 text-[#22FF6E]" />
              <span className="font-mono text-xs font-medium text-[#F5F0E8] tracking-wide">
                agent/orchestrator.py // comparison
              </span>
            </div>
          </div>

          {/* Right badges & copy button */}
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] uppercase text-[#22FF6E] bg-[#22FF6E]/10 border border-[#22FF6E]/20 px-2 py-0.5 rounded-[6px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22FF6E] animate-pulse" />
              <span>workflow.diff</span>
            </span>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-[8px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#F5F0E8]/70 hover:text-[#F5F0E8] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#22FF6E]"
              aria-label="Copy diff to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#22FF6E]" />
                  <span className="text-[#22FF6E]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Diff</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Diff Code Rows */}
        <div className="p-4 sm:p-6 space-y-6 overflow-x-auto text-xs sm:text-sm font-mono">
          {DIFF_ROWS.map((row) => (
            <div key={row.category} className="space-y-2">
              {/* Category Header */}
              <div className="flex items-center justify-between text-xs font-mono pb-1 border-b border-white/[0.04]">
                <span className="text-[#F5F0E8]/45 font-semibold tracking-wider">
                  {row.category}
                </span>
                <span className="text-white/20 text-[11px]">
                  {row.hunkHeader}
                </span>
              </div>

              {/* Removed line (- Standard Agents) */}
              <div className="bg-[#3b1212]/40 text-[#FF7777] border-l-2 border-[#FF4444] rounded-r-[10px] p-3 sm:px-4 sm:py-3 transition-colors flex items-start gap-3">
                <span className="text-[#FF7777]/50 select-none shrink-0 font-mono text-xs w-6 text-right">
                  {row.lineNumOld}
                </span>
                <span className="text-[#FF4444] font-bold select-none shrink-0">-</span>
                <p className="leading-relaxed whitespace-pre-wrap break-words flex-1">
                  {row.removed.replace(/^- /, '')}
                </p>
              </div>

              {/* Added line (+ Hush with Gemma 4) */}
              <div className="bg-[#0c2e17]/50 text-[#22FF6E] border-l-2 border-[#22FF6E] rounded-r-[10px] p-3 sm:px-4 sm:py-3 transition-colors flex items-start gap-3">
                <span className="text-[#22FF6E]/50 select-none shrink-0 font-mono text-xs w-6 text-right">
                  {row.lineNumNew}
                </span>
                <span className="text-[#22FF6E] font-bold select-none shrink-0">+</span>
                <p className="leading-relaxed whitespace-pre-wrap break-words flex-1 font-medium">
                  {row.added.replace(/^\+ /, '')}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Diff Footer Summary */}
        <div className="bg-[#0d0d0d] border-t border-white/[0.06] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#F5F0E8]/45">
          <div className="flex items-center gap-3">
            <span className="text-[#FF7777] font-semibold">-3 paradigms superseded</span>
            <span>•</span>
            <span className="text-[#22FF6E] font-semibold">+3 autonomous guarantees active</span>
          </div>
          <span className="text-[11px] text-[#F5F0E8]/30">
            git hash: 8f2c019d // verified against gemma-4-orchestrator
          </span>
        </div>
      </div>
    </div>
  );
};
