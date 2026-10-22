import React from 'react';
import { ARCHITECTURE_PRINCIPLES } from './graphData';
import { HardDrive, FolderCheck, Layers } from 'lucide-react';

const PRINCIPLE_ICONS = [HardDrive, FolderCheck, Layers];

export const ArchitectureNotes: React.FC = () => {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between text-xs font-mono text-[#F5F0E8]/45">
        <span className="uppercase tracking-[0.15em] font-semibold">
          Core Principles &amp; Architecture
        </span>
        <span className="text-[#22FF6E]">Local Execution Boundary</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {ARCHITECTURE_PRINCIPLES.map((principle, index) => {
          const IconComponent = PRINCIPLE_ICONS[index] ?? HardDrive;
          return (
            <div
              key={principle.title}
              className="bg-[#141414] border border-white/[0.06] rounded-[24px] p-6 flex flex-col justify-between hover:border-white/[0.12] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div
                    className="w-9 h-9 rounded-[12px] bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#22FF6E] shrink-0"
                    aria-hidden="true"
                  >
                    <IconComponent className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <span className="font-mono text-[11px] text-[#22FF6E] bg-[#22FF6E]/10 border border-[#22FF6E]/20 px-2.5 py-0.5 rounded-[6px]">
                    {principle.badge}
                  </span>
                </div>

                <h4 className="text-base font-bold font-['Archivo',sans-serif] text-[#F0FFE8] tracking-tight mb-2">
                  {principle.title}
                </h4>

                <p className="text-xs sm:text-sm text-[#F5F0E8] leading-relaxed font-['Space_Grotesk',sans-serif]">
                  {principle.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-white/[0.06]">
                <p className="text-[11px] font-mono text-[#F5F0E8]/45 leading-relaxed">
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
