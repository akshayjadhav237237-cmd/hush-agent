import React from 'react';
import type { GraphTool } from './types';
import {
  Boxes,
  RefreshCw,
  FileText,
  Search,
  FileCode,
  GitMerge,
  ShieldCheck,
  Terminal,
} from 'lucide-react';

interface ToolCardProps {
  readonly tool: GraphTool;
  readonly index: number;
}

const TOOL_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: boolean }>> = {
  'graph-build': Boxes,
  'graph-update': RefreshCw,
  'graph-report': FileText,
  'graph-query': Search,
  'graph-explain': FileCode,
  'graph-path': GitMerge,
};

export const ToolCard: React.FC<ToolCardProps> = ({ tool, index }) => {
  const IconComponent = TOOL_ICONS[tool.id] ?? Terminal;
  const toolNumber = String(index + 1).padStart(2, '0');
  const isUpdateGate = tool.id === 'graph-update';

  return (
    <article
      tabIndex={0}
      aria-labelledby={`tool-title-${tool.id}`}
      className="w-full bg-[#141414] border border-white/[0.06] rounded-[24px] p-6 flex flex-col justify-between transition-all duration-200 hover:border-[#22FF6E]/40 hover:shadow-[0_0_24px_rgba(34,255,110,0.06)] focus-visible:outline-2 focus-visible:outline-[#22FF6E] focus-visible:outline-offset-2 relative"
    >
      <div>
        {/* Header: Green Tool Index Pill, Category & Icon */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-semibold text-[#22FF6E] bg-[#22FF6E]/10 px-2.5 py-1 rounded-[8px] border border-[#22FF6E]/30">
              TOOL {toolNumber}
            </span>
            <span className="text-xs font-mono uppercase tracking-wider text-[#F5F0E8]/45 hidden sm:inline-block">
              {tool.categoryLabel}
            </span>
          </div>

          <div
            className="w-9 h-9 rounded-[12px] bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#22FF6E] shrink-0"
            aria-hidden="true"
          >
            <IconComponent className="w-4 h-4" strokeWidth={1.5} />
          </div>
        </div>

        {/* Mint Tool Identifier */}
        <h3
          id={`tool-title-${tool.id}`}
          className="font-mono text-base sm:text-lg font-bold text-[#F0FFE8] tracking-tight"
        >
          {tool.name}
        </h3>

        {/* Command Code Block */}
        <div className="mt-3">
          <code className="block w-full font-mono text-xs text-[#22FF6E] bg-black/60 border border-white/[0.08] rounded-[12px] px-3.5 py-2.5 overflow-x-auto whitespace-pre">
            {tool.command}
          </code>
        </div>

        {/* Primary Description */}
        <p className="mt-4 text-xs sm:text-sm text-[#F5F0E8] leading-relaxed font-['Space_Grotesk',sans-serif]">
          {tool.description}
        </p>

        {/* Architectural Detail */}
        <p className="mt-2 text-xs text-[#F5F0E8]/45 leading-relaxed font-['Space_Grotesk',sans-serif]">
          {tool.details}
        </p>
      </div>

      {/* Footer / Gate badge */}
      <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-[#F5F0E8]/45">
        <span className="inline-flex items-center gap-1.5 truncate">
          <Terminal className="w-3.5 h-3.5 text-[#22FF6E] shrink-0" strokeWidth={1.5} aria-hidden="true" />
          <span className="text-[#F5F0E8]/70 truncate">{tool.signature}</span>
        </span>
        {isUpdateGate && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#22FF6E] bg-[#22FF6E]/10 px-2 py-0.5 rounded-[6px] border border-[#22FF6E]/20 shrink-0">
            <ShieldCheck className="w-3 h-3 text-[#22FF6E] shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span>Stall Gate</span>
          </span>
        )}
      </div>
    </article>
  );
};
