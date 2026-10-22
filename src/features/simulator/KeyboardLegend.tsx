import React from 'react';
import { Keyboard } from 'lucide-react';

export const KeyboardLegend: React.FC = () => {
  return (
    <div
      aria-label="Keyboard shortcuts"
      className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border font-mono text-xs text-text-muted select-none"
    >
      <div className="flex items-center gap-1.5">
        <Keyboard className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} aria-hidden="true" />
        <span>Shortcuts</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded-[4px] border border-border bg-surface-2 text-text font-mono text-[11px]">
            Space
          </kbd>
          <span>Play / Pause</span>
        </div>

        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded-[4px] border border-border bg-surface-2 text-text font-mono text-[11px]">
            →
          </kbd>
          <span>Next</span>
        </div>

        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded-[4px] border border-border bg-surface-2 text-text font-mono text-[11px]">
            ←
          </kbd>
          <span>Prev</span>
        </div>

        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded-[4px] border border-border bg-surface-2 text-text font-mono text-[11px]">
            R
          </kbd>
          <span>Reset</span>
        </div>

        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded-[4px] border border-border bg-surface-2 text-text font-mono text-[11px]">
            Enter
          </kbd>
          <span>Resolve gate</span>
        </div>
      </div>
    </div>
  );
};
