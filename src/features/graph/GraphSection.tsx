import React from 'react';
import { GRAPH_TOOLS } from './graphData';
import { ToolCard } from './ToolCard';
import { ArchitectureNotes } from './ArchitectureNotes';
import { GraphVisualizer } from './GraphVisualizer';
import { AttributionCallout } from './AttributionCallout';
import { Network, Terminal } from 'lucide-react';

export const GraphSection: React.FC = () => {
  return (
    <section
      id="code-graph"
      aria-labelledby="code-graph-heading"
      className="py-20 lg:py-32 border-t border-border bg-bg text-text"
    >
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-surface-2 border border-border text-text-muted">
            <Network className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} aria-hidden="true" />
            <span>Codebase Memory</span>
          </div>

          <h2
            id="code-graph-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-serif tracking-tight text-text"
          >
            Codebase memory with Graphify
          </h2>

          <p className="text-base sm:text-lg text-text-muted leading-relaxed">
            Hush builds an AST-level graph of the generated code to give Claude spatial memory of symbol declarations, file dependencies and call paths across build rounds.
          </p>
        </div>

        {/* Interactive Viewer / Sandbox */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-text-muted">
            <span className="uppercase tracking-wider font-semibold">
              Spatial Graph Visualization
            </span>
            <span>HTML Export Sandbox</span>
          </div>
          <GraphVisualizer />
        </div>

        {/* Core Principles & Architecture */}
        <ArchitectureNotes />

        {/* Agent Tools Grid */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-text-muted">
            <span className="uppercase tracking-wider font-semibold">
              Agent Graph Tools ({GRAPH_TOOLS.length} Total)
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Terminal className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} aria-hidden="true" />
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
