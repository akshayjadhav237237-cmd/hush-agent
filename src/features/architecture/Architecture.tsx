import React, { useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { ArchitectureNodeId, ScenarioId } from './types';
import { SCENARIOS } from './architectureData';
import { TopologyGraph } from './TopologyGraph';
import { StackedFlow } from './StackedFlow';
import { NodeInspector } from './NodeInspector';
import { FlowController } from './FlowController';
import { TrustCallout } from './TrustCallout';
import { Network, ListOrdered, Sparkles } from 'lucide-react';

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
      className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 max-w-[1120px] mx-auto w-full space-y-10"
      aria-label="Multi-Agent System Architecture"
    >
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-medium rounded-full border border-accent/30 bg-accent/10 text-accent">
          <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>System Architecture</span>
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-text tracking-tight">
          Orchestration &amp; Deterministic Safety
        </h2>

        <p className="text-sm sm:text-base text-text-muted leading-relaxed">
          Hush coordinates specialized agents through an on-device orchestrator. Google Gemma 4 manages
          screen context and task contracts while the Attention Gate deterministically intercepts privileged operations.
        </p>

        {/* View Layout Toggle */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <div className="inline-flex items-center p-1 rounded-[10px] bg-surface-2 border border-border">
            <button
              type="button"
              onClick={() => setViewMode('topology')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[8px] transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                viewMode === 'topology'
                  ? 'bg-surface text-text shadow-sm border border-border font-semibold'
                  : 'text-text-muted hover:text-text'
              }`}
              aria-pressed={viewMode === 'topology'}
              aria-label="Switch to vector topology map view"
            >
              <Network className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Vector Topology</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('stacked')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[8px] transition-all outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                viewMode === 'stacked'
                  ? 'bg-surface text-text shadow-sm border border-border font-semibold'
                  : 'text-text-muted hover:text-text'
              }`}
              aria-pressed={viewMode === 'stacked'}
              aria-label="Switch to sequential stacked pipeline view"
            >
              <ListOrdered className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Stacked Pipeline</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scenario Flow Toolbar */}
      <FlowController
        activeScenarioId={activeScenarioId}
        onSelectScenario={setActiveScenarioId}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        playbackSpeed={playbackSpeed}
        onToggleSpeed={handleToggleSpeed}
        prefersReducedMotion={prefersReducedMotion}
      />

      {/* Main Diagram Area */}
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

      {/* Active Node Detail Inspector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
            Engine Inspector &amp; Contract
          </span>
          <span className="text-[11px] text-text-muted">
            Select any node above to inspect qualitative capabilities and communication contracts
          </span>
        </div>
        <NodeInspector
          nodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
        />
      </div>

      {/* Deep-Dive Trust & Boundary Callout */}
      <TrustCallout />
    </section>
  );
};
