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
      className="w-full bg-surface border border-border rounded-[14px] p-5 sm:p-6 flex flex-col justify-between transition-colors duration-150 hover:border-accent/40 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 relative"
    >
      <div>
        {/* Header: Tool Index & Category */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-text-muted bg-surface-2 px-2.5 py-1 rounded-[6px] border border-border">
              TOOL {toolNumber}
            </span>
            <span className="text-xs font-mono text-text-muted hidden sm:inline-block">
              {tool.categoryLabel}
            </span>
          </div>

          <div
            className="w-8 h-8 rounded-[8px] bg-surface-2 border border-border flex items-center justify-center text-accent shrink-0"
            aria-hidden="true"
          >
            <IconComponent className="w-4 h-4" strokeWidth={1.5} />
          </div>
        </div>

        {/* Tool Identifier */}
        <h3
          id={`tool-title-${tool.id}`}
          className="font-mono text-base font-semibold text-text tracking-tight"
        >
          {tool.name}
        </h3>

        {/* Signature & Command Pill */}
        <div className="mt-2.5">
          <code className="block w-full font-mono text-xs text-text-muted bg-surface-2 border border-border rounded-[8px] px-3 py-2 overflow-x-auto whitespace-pre">
            {tool.command}
          </code>
        </div>

        {/* Primary Description */}
        <p className="mt-4 text-xs sm:text-sm text-text leading-relaxed">
          {tool.description}
        </p>

        {/* Architectural Detail */}
        <p className="mt-2 text-xs text-text-muted leading-relaxed">
          {tool.details}
        </p>
      </div>

      {/* Footer / Gate badge */}
      <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-xs font-mono text-text-muted">
        <span className="inline-flex items-center gap-1.5 truncate">
          <Terminal className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={1.5} aria-hidden="true" />
          <span>{tool.signature}</span>
        </span>
        {isUpdateGate && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success bg-surface-2 px-2 py-0.5 rounded-[6px] border border-border shrink-0">
            <ShieldCheck className="w-3 h-3 text-success shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span>Stall Gate</span>
          </span>
        )}
      </div>
    </article>
  );
};
