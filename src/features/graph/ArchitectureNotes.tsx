import React from 'react';
import { ARCHITECTURE_PRINCIPLES } from './graphData';
import { HardDrive, FolderCheck, Layers } from 'lucide-react';

const PRINCIPLE_ICONS = [HardDrive, FolderCheck, Layers];

export const ArchitectureNotes: React.FC = () => {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between text-xs font-mono text-text-muted">
        <span className="uppercase tracking-wider font-semibold">
          Core Principles &amp; Architecture
        </span>
        <span>Local Execution Boundary</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ARCHITECTURE_PRINCIPLES.map((principle, index) => {
          const IconComponent = PRINCIPLE_ICONS[index] ?? HardDrive;
          return (
            <div
              key={principle.title}
              className="bg-surface border border-border rounded-[14px] p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-[8px] bg-surface-2 border border-border flex items-center justify-center text-accent shrink-0"
                    aria-hidden="true"
                  >
                    <IconComponent className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <span className="font-mono text-[11px] text-text-muted bg-surface-2 border border-border px-2 py-0.5 rounded-[6px]">
                    {principle.badge}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-text tracking-tight mb-2">
                  {principle.title}
                </h4>

                <p className="text-xs text-text leading-relaxed">
                  {principle.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-[11px] font-mono text-text-muted leading-relaxed">
                  {principle.technicalDetail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
