import React from 'react';
import { ExternalLink, Info } from 'lucide-react';

export const AttributionCallout: React.FC = () => {
  return (
    <aside
      aria-label="Open-source project attribution"
      className="w-full bg-surface border border-border rounded-[14px] p-5 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-[8px] bg-surface-2 border border-border flex items-center justify-center text-text-muted shrink-0 mt-0.5"
            aria-hidden="true"
          >
            <Info className="w-4 h-4" strokeWidth={1.5} />
          </div>

          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-text leading-relaxed">
              Graphify is a separate open-source project by Graphify Labs, used under its Apache 2.0 license.
            </p>
            <p className="text-xs text-text-muted leading-relaxed">
              The graph models code syntax and dependency links. It operates entirely as an offline AST structural index.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 pl-11 sm:pl-0">
          <a
            href="https://graphify.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-mono text-text bg-surface-2 hover:bg-border border border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span>graphify.com</span>
            <ExternalLink className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} aria-hidden="true" />
          </a>

          <a
            href="https://github.com/Graphify-Labs/graphify"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-xs font-mono text-text bg-surface-2 hover:bg-border border border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span>GitHub</span>
            <ExternalLink className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} aria-hidden="true" />
          </a>
        </div>
      </div>
    </aside>
  );
};
