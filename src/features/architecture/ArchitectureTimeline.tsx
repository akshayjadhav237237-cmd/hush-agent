import React, { useState } from 'react';
import { GitBranch, Workflow, ArrowRight, ShieldCheck, Layers, Globe, Code2, Network } from 'lucide-react';
import { ArchitectureNodeId } from './types';

interface TimelinePhase {
  id: string;
  phaseNumber: string;
  stageName: string;
  tag: string;
  title: string;
  description: string;
  targetNodeId: ArchitectureNodeId;
  icon: React.ComponentType<{ className?: string }>;
}

const TIMELINE_PHASES: TimelinePhase[] = [
  {
    id: 'phase-01',
    phaseNumber: 'PHASE 01',
    stageName: 'Claude AI',
    tag: 'INTENT DISPATCH',
    title: 'Goal Ingestion & Architecture Spec',
    description: 'Operator submits the natural language goal. Claude decomposes complex requirements into modular component designs, interface schemas, and sanitized task contracts.',
    targetNodeId: 'claude',
    icon: Layers,
  },
  {
    id: 'phase-02',
    phaseNumber: 'PHASE 02',
    stageName: 'Gemini Deep Research',
    tag: 'DOC GROUNDING',
    title: 'Verified Reference Grounding',
    description: 'Gemini Deep Research queries authoritative external documentation, live API specifications, and validated patterns to prevent hallucinated interface calls.',
    targetNodeId: 'gemini',
    icon: Globe,
  },
  {
    id: 'phase-03',
    phaseNumber: 'PHASE 03',
    stageName: 'Antigravity IDE',
    tag: 'ISOLATED RUNTIME',
    title: 'Sandboxed Code Implementation',
    description: 'Antigravity applies code modifications inside an isolated workspace, running compilers, linters, and unit test suites autonomously before presenting diffs.',
    targetNodeId: 'antigravity',
    icon: Code2,
  },
  {
    id: 'phase-04',
    phaseNumber: 'PHASE 04',
    stageName: 'Graphify',
    tag: 'AST MEMORY',
    title: 'Local Code Graph Indexing',
    description: 'Tree-sitter extracts source syntax trees directly on the workstation, detecting community clusters via Louvain without external code leakage.',
    targetNodeId: 'graphify',
    icon: Network,
  },
  {
    id: 'phase-05',
    phaseNumber: 'PHASE 05',
    stageName: 'Attention Gate',
    tag: 'POLICY INTERCEPT',
    title: 'Policy Safety & Escalation Gate',
    description: 'Zero-trust gate freezes autonomous execution on privileged actions, schema alterations, or credential touches until explicit operator review.',
    targetNodeId: 'gate',
    icon: ShieldCheck,
  },
];

interface ArchitectureTimelineProps {
  selectedNodeId: ArchitectureNodeId;
  onSelectNode: (nodeId: ArchitectureNodeId) => void;
}

export const ArchitectureTimeline: React.FC<ArchitectureTimelineProps> = ({
  selectedNodeId,
  onSelectNode,
}) => {
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);

  const handleSelectPhase = (index: number, nodeId: ArchitectureNodeId) => {
    setActivePhaseIndex(index);
    onSelectNode(nodeId);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header bar for timeline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <Workflow className="w-4 h-4 text-[#22FF6E]" />
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-[#F5F0E8]/45">
            Sequential Execution Pipeline
          </span>
        </div>
        <span className="font-mono text-[11px] text-[#F5F0E8]/45">
          Click any phase to navigate engine inspector
        </span>
      </div>

      {/* Progress Track & Cards */}
      <div className="relative">
        {/* Horizontal connecting track line behind node circles (hidden on small mobile, visible sm+) */}
        <div
          className="hidden sm:block absolute top-[11px] left-[6%] right-[6%] h-[2px] bg-white/[0.08] -z-0 pointer-events-none"
          aria-hidden="true"
        />

        {/* Phase Nodes & Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
          {TIMELINE_PHASES.map((phase, index) => {
            const isFirst = index === 0;
            const isActive = activePhaseIndex === index || selectedNodeId === phase.targetNodeId;
            const Icon = phase.icon;

            return (
              <div
                key={phase.id}
                className="flex flex-col items-center text-center space-y-3 cursor-pointer group"
                onClick={() => handleSelectPhase(index, phase.targetNodeId)}
              >
                {/* Circular Progress Node */}
                <div className="flex items-center justify-center h-6 relative">
                  {isFirst ? (
                    // First node: filled green ring
                    <div
                      className={`w-5 h-5 rounded-full bg-[#22FF6E] ring-4 ${
                        isActive ? 'ring-[#22FF6E]/40' : 'ring-[#22FF6E]/20'
                      } flex items-center justify-center transition-all duration-200`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-black" />
                    </div>
                  ) : isActive ? (
                    // Subsequent active node: outlined with pulse
                    <div className="relative flex items-center justify-center">
                      <span className="w-5 h-5 rounded-full bg-[#22FF6E]/20 animate-ping absolute" />
                      <div className="w-5 h-5 rounded-full border-2 border-[#22FF6E] bg-black ring-4 ring-[#22FF6E]/20 flex items-center justify-center relative">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22FF6E]" />
                      </div>
                    </div>
                  ) : (
                    // Subsequent inactive node: outlined
                    <div className="w-5 h-5 rounded-full border border-white/20 bg-[#141414] group-hover:border-[#22FF6E]/60 transition-colors flex items-center justify-center">
                      <span className="w-1 h-1 rounded-full bg-white/30 group-hover:bg-[#22FF6E]" />
                    </div>
                  )}
                </div>

                {/* Mono pill tag with GitBranch / workflow icon */}
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider transition-all duration-150 border ${
                    isActive
                      ? 'bg-[#22FF6E]/10 border-[#22FF6E]/40 text-[#22FF6E]'
                      : 'bg-white/[0.04] border-white/[0.08] text-[#F5F0E8]/70 group-hover:border-white/20'
                  }`}
                >
                  <GitBranch className="w-3 h-3 text-[#22FF6E] shrink-0" />
                  <span>{phase.tag}</span>
                </div>

                {/* Dark #141414 card with 24px radius & 1px border rgba(255,255,255,0.06) */}
                <div
                  className={`w-full h-full text-left bg-[#141414] rounded-[24px] border p-5 flex flex-col justify-between transition-all duration-200 ${
                    isActive
                      ? 'border-[#22FF6E]/50 shadow-[0_0_24px_rgba(34,255,110,0.08)] ring-1 ring-[#22FF6E]/20'
                      : 'border-white/[0.06] hover:border-white/[0.16] hover:bg-[#181818]'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Phase number & Stage Name */}
                    <div className="flex items-center justify-between gap-1 text-xs font-mono">
                      <span className="uppercase text-[#F5F0E8]/45">
                        {phase.phaseNumber}
                      </span>
                      <span className="text-[#22FF6E] text-[11px] truncate font-medium">
                        {phase.stageName}
                      </span>
                    </div>

                    {/* Bold title in mint/cream */}
                    <h4 className="font-['Archivo',sans-serif] font-bold text-sm sm:text-base text-[#F0FFE8] leading-snug">
                      {phase.title}
                    </h4>

                    {/* Muted body description */}
                    <p className="font-['Space_Grotesk',sans-serif] text-xs text-[#F5F0E8]/45 leading-relaxed">
                      {phase.description}
                    </p>
                  </div>

                  {/* Card footer indicator */}
                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[#F5F0E8]/45">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className="w-3 h-3 text-[#22FF6E]" />
                      <span>{phase.targetNodeId}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#22FF6E] opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Inspect</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
