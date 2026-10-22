import React, { useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { ArchitectureNodeId, ScenarioId } from './types';
import { SCENARIOS } from './architectureData';
import { TopologyGraph } from './TopologyGraph';
import { StackedFlow } from './StackedFlow';
import { NodeInspector } from './NodeInspector';
import { FlowController } from './FlowController';
import { TrustCallout } from './TrustCallout';
import { ArchitectureTimeline } from './ArchitectureTimeline';
import { CodeDiffComparison } from './CodeDiffComparison';
import { Network, ListOrdered } from 'lucide-react';

export const Architecture: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<ArchitectureNodeId>('gemma');
  const [activeScenarioId, setActiveScenarioId] = useState<ScenarioId>('all');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'topology' | 'stacked'>('topology');

  const systemPrefersReduced = useReducedMotion();
  const prefersReducedMotion = !!systemPrefersReduced;

  const currentScenario =
    SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0];

  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleToggleSpeed = () => {
    setPlaybackSpeed((prev) => (prev === 1 ? 2 : 1));
  };

  return (
    <section
      id="architecture"
      className="py-20 lg:py-32 bg-black text-[#F5F0E8] border-t border-white/[0.06] w-full"
      aria-label="Multi-Agent System Architecture"
    >
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-[#F5F0E8]/45">
            [ ARCHITECTURE ]
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-['Archivo',sans-serif] font-bold text-[#F0FFE8] tracking-tight">
            How Hush <span className="font-['Cormorant_Garamond',serif] italic font-normal text-[#22FF6E]">Orchestrates.</span>
          </h2>

          <p className="font-['Space_Grotesk',sans-serif] text-base sm:text-lg text-[#F5F0E8]/45 leading-relaxed">
            Hush coordinates specialized agents through the Gemma 4 orchestrator. Google Gemma 4 manages
            screen context and task contracts while the Attention Gate intercepts privileged operations.
          </p>

          {/* View Layout Toggle */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className="inline-flex items-center p-1 rounded-[14px] bg-[#141414] border border-white/[0.06]">
              <button
                type="button"
                onClick={() => setViewMode('topology')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-[10px] transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#22FF6E] ${
                  viewMode === 'topology'
                    ? 'bg-white/[0.08] text-[#F0FFE8] shadow-sm border border-white/[0.1] font-semibold'
                    : 'text-[#F5F0E8]/45 hover:text-[#F5F0E8]'
                }`}
                aria-pressed={viewMode === 'topology'}
                aria-label="Switch to vector topology map view"
              >
                <Network className="w-3.5 h-3.5 text-[#22FF6E]" strokeWidth={1.5} />
                <span>Vector Topology</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('stacked')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-[10px] transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#22FF6E] ${
                  viewMode === 'stacked'
                    ? 'bg-white/[0.08] text-[#F0FFE8] shadow-sm border border-white/[0.1] font-semibold'
                    : 'text-[#F5F0E8]/45 hover:text-[#F5F0E8]'
                }`}
                aria-pressed={viewMode === 'stacked'}
                aria-label="Switch to sequential stacked pipeline view"
              >
                <ListOrdered className="w-3.5 h-3.5 text-[#22FF6E]" strokeWidth={1.5} />
                <span>Stacked Pipeline</span>
              </button>
            </div>
          </div>
        </div>

        {/* 1. Horizontal Timeline Component */}
        <ArchitectureTimeline
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
        />

        {/* 2. Scenario Flow Toolbar */}
        <FlowController
          activeScenarioId={activeScenarioId}
          onSelectScenario={setActiveScenarioId}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          playbackSpeed={playbackSpeed}
          onToggleSpeed={handleToggleSpeed}
          prefersReducedMotion={prefersReducedMotion}
        />

        {/* 3. Main Topology / Stacked Diagram Area */}
        <div className="relative w-full">
          {viewMode === 'topology' ? (
            <TopologyGraph
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              activeScenario={currentScenario}
              isPlaying={isPlaying}
              playbackSpeed={playbackSpeed}
            />
          ) : (
            <StackedFlow
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              activeScenario={currentScenario}
              isPlaying={isPlaying}
              playbackSpeed={playbackSpeed}
            />
          )}
        </div>

        {/* 4. Code-Diff Comparison Terminal Window */}
        <CodeDiffComparison />

        {/* 5. Active Node Detail Inspector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono uppercase tracking-[0.15em] text-[#F5F0E8]/45">
              Engine Inspector &amp; Contract
            </span>
            <span className="text-[11px] font-mono text-[#F5F0E8]/45 hidden sm:inline">
              Select any node above to inspect qualitative capabilities and communication contracts
            </span>
          </div>
          <NodeInspector
            nodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        </div>

        {/* 6. Deep-Dive Trust & Boundary Callout */}
        <TrustCallout />
      </div>
    </section>
  );
};

export default Architecture;
