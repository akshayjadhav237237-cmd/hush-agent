import React from 'react';
import { ExternalLink, Info } from 'lucide-react';

export const AttributionCallout: React.FC = () => {
  return (
    <aside
      aria-label="Open-source project attribution"
      className="w-full bg-[#141414] border border-white/[0.06] rounded-[24px] p-6 sm:p-7 shadow-xl"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-start gap-3.5">
          <div
            className="w-9 h-9 rounded-[12px] bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#22FF6E] shrink-0 mt-0.5"
            aria-hidden="true"
          >
            <Info className="w-4 h-4" strokeWidth={1.5} />
          </div>

          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-[#F5F0E8] font-['Space_Grotesk',sans-serif] leading-relaxed">
              Graphify is an open-source project by Graphify Labs, distributed under the Apache 2.0 license.
            </p>
            <p className="text-xs text-[#F5F0E8]/45 font-['Space_Grotesk',sans-serif] leading-relaxed">
              The graph models code syntax and dependency links. It operates entirely as an offline AST structural index without remote telemetry.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 pl-12 sm:pl-0">
          <a
            href="https://graphify.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] text-xs font-mono text-[#F5F0E8] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-[#22FF6E]/40 hover:text-[#22FF6E] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22FF6E]"
          >
            <span>graphify.com</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#F5F0E8]/45" strokeWidth={1.5} aria-hidden="true" />
          </a>

          <a
            href="https://github.com/Graphify-Labs/graphify"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] text-xs font-mono text-[#F5F0E8] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-[#22FF6E]/40 hover:text-[#22FF6E] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22FF6E]"
          >
            <span>GitHub</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#F5F0E8]/45" strokeWidth={1.5} aria-hidden="true" />
          </a>
        </div>
      </div>
    </aside>
  );
};
