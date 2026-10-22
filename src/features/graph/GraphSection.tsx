import React from 'react';
import { GRAPH_TOOLS } from './graphData';
import { ToolCard } from './ToolCard';
import { ArchitectureNotes } from './ArchitectureNotes';
import { GraphVisualizer } from './GraphVisualizer';
import { AttributionCallout } from './AttributionCallout';
import { Terminal } from 'lucide-react';

export const GraphSection: React.FC = () => {
  return (
    <section
      id="code-graph"
      aria-labelledby="code-graph-heading"
      className="py-20 lg:py-32 border-t border-white/[0.06] bg-black text-[#F5F0E8]"
    >
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-[#F5F0E8]/45">
            [ CODEBASE GRAPH ]
          </div>

          <h2
            id="code-graph-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-['Archivo',sans-serif] font-bold tracking-tight text-[#F0FFE8]"
          >
            Spatial AST <span className="font-['Cormorant_Garamond',serif] italic font-normal text-[#22FF6E]">Code Memory.</span>
          </h2>

          <p className="font-['Space_Grotesk',sans-serif] text-base sm:text-lg text-[#F5F0E8]/45 leading-relaxed">
            Hush builds an AST-level graph of the generated code to give Claude spatial memory of symbol declarations, file dependencies and call paths across build rounds.
          </p>
        </div>

        {/* Interactive Viewer / Sandbox */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#F5F0E8]/45">
            <span className="uppercase tracking-[0.15em] font-semibold">
              Spatial Graph Visualization
            </span>
            <span className="text-[#22FF6E]">HTML Export Sandbox</span>
          </div>
          <GraphVisualizer />
        </div>

        {/* Core Principles & Architecture */}
        <ArchitectureNotes />

        {/* Agent Tools Grid */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#F5F0E8]/45">
            <span className="uppercase tracking-[0.15em] font-semibold">
              Agent Graph Tools ({GRAPH_TOOLS.length} Total)
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-[#22FF6E]">
              <Terminal className="w-3.5 h-3.5 text-[#22FF6E]" strokeWidth={1.5} aria-hidden="true" />
              agent/orchestrator.py Tool Bindings
            </span>
          </div>

          <ul
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 list-none p-0 m-0"
            role="list"
            aria-label="Agent Graph Tools List"
          >
            {GRAPH_TOOLS.map((tool, index) => (
              <li key={tool.id} className="flex">
                <ToolCard tool={tool} index={index} />
              </li>
            ))}
          </ul>
        </div>

        {/* Project Attribution Callout */}
        <AttributionCallout />
      </div>
    </section>
  );
};

export default GraphSection;
