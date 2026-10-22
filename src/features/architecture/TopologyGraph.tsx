import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArchitectureNodeId, Scenario } from './types';
import { NodeCard } from './NodeCard';
import { ARCHITECTURE_NODES, CONNECTIONS } from './architectureData';

interface TopologyGraphProps {
  selectedNodeId: ArchitectureNodeId;
  onSelectNode: (nodeId: ArchitectureNodeId) => void;
  activeScenario: Scenario;
  isPlaying: boolean;
  playbackSpeed: number;
}

export const TopologyGraph: React.FC<TopologyGraphProps> = ({
  selectedNodeId,
  onSelectNode,
  activeScenario,
  isPlaying,
  playbackSpeed
}) => {
  const systemPrefersReduced = useReducedMotion();
  const effectiveReducedMotion = !!systemPrefersReduced;

  const isNodeActive = (id: ArchitectureNodeId) =>
    activeScenario.activeNodeIds.includes(id);

  const isConnectionActive = (id: string) =>
    activeScenario.activeConnectionIds.includes(id);

  return (
    <div className="relative w-full overflow-x-auto md:overflow-x-visible pb-2 pt-1">
      {/* Topology Canvas Container */}
      <div className="relative w-full min-w-[720px] md:min-w-0 max-w-5xl mx-auto aspect-[1000/620] rounded-[14px] border border-border bg-surface p-2 overflow-hidden shadow-sm">
        {/* SVG Vector Connections Layer */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none select-none"
          viewBox="0 0 1000 620"
          role="img"
          aria-label="Multi-Agent Topology and Data Flow Diagram"
        >
          <title>Multi-Agent Architecture Topology</title>
          <desc>
            Vector diagram showing Google Gemma 4 at the center, communicating with the Operator,
            Attention Gate, Claude, Gemini Deep Research, and Antigravity.
          </desc>

          <defs>
            {/* Subtle Grid Pattern */}
            <pattern
              id="arch-grid-pattern"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1.5" cy="1.5" r="0.75" fill="var(--border)" opacity="0.6" />
            </pattern>

            {/* Subtle glow filter for active channels */}
            <filter id="glow-accent" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid */}
          <rect width="1000" height="620" fill="url(#arch-grid-pattern)" />

          {/* Center Orchestrator Aura */}
          <circle
            cx="500"
            cy="310"
            r="130"
            fill="var(--accent)"
            opacity="0.03"
            className="transition-opacity duration-300"
          />
          <circle
            cx="500"
            cy="310"
            r="80"
            fill="var(--accent)"
            opacity="0.05"
            className="transition-opacity duration-300"
          />

          {/* Render Connections */}
          {CONNECTIONS.map((conn) => {
            const active = isConnectionActive(conn.id);
            const isWarning =
              conn.id === 'conn-gemma-gate' || conn.id === 'conn-gate-user';

            const strokeColor = active
              ? isWarning
                ? 'var(--warning)'
                : 'var(--accent)'
              : 'var(--border)';

            return (
              <g key={conn.id} className="transition-opacity duration-300">
                {/* Hairline base path */}
                <path
                  d={conn.pathD}
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity={active ? 0.3 : 0.8}
                />

                {/* Active path with animated dashes */}
                {active && (
                  <motion.path
                    d={conn.pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="1.5"
                    strokeDasharray="6 8"
                    opacity={0.85}
                    filter="url(#glow-accent)"
                    animate={
                      effectiveReducedMotion || !isPlaying
                        ? undefined
                        : { strokeDashoffset: [-28, 0] }
                    }
                    transition={{
                      duration: 2 / playbackSpeed,
                      repeat: Infinity,
                      ease: 'linear'
                    }}
                  />
                )}

                {/* Animated Packet Pulse */}
                {active && !effectiveReducedMotion && isPlaying && (
                  <>
                    <circle
                      r="3.5"
                      fill={strokeColor}
                      stroke={strokeColor}
                      strokeWidth="1"
                    >
                      <animateMotion
                        path={conn.pathD}
                        dur={`${2.6 / playbackSpeed}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                    {/* Secondary delayed pulse */}
                    <circle
                      r="2.5"
                      fill={strokeColor}
                      opacity="0.65"
                    >
                      <animateMotion
                        path={conn.pathD}
                        dur={`${2.6 / playbackSpeed}s`}
                        begin={`${1.3 / playbackSpeed}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  </>
                )}

                {/* Static indicator for reduced motion or paused state */}
                {active && (effectiveReducedMotion || !isPlaying) && (
                  <circle
                    cx={conn.pathD.includes('L') ? 665 : 485}
                    cy={310}
                    r="3"
                    fill={strokeColor}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Node Cards Layer - Positioned over coordinates */}
        {/* 1. Operator Intent (Top-Left) */}
        <div
          className="absolute z-10 transition-transform duration-150"
          style={{
            left: '17%',
            top: '25%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <NodeCard
            node={ARCHITECTURE_NODES.user}
            isSelected={selectedNodeId === 'user'}
            isActiveInScenario={isNodeActive('user')}
            onSelect={onSelectNode}
          />
        </div>

        {/* 2. Attention Gate Node (Bottom-Left) */}
        <div
          className="absolute z-10 transition-transform duration-150"
          style={{
            left: '17%',
            top: '75%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <NodeCard
            node={ARCHITECTURE_NODES.gate}
            isSelected={selectedNodeId === 'gate'}
            isActiveInScenario={isNodeActive('gate')}
            onSelect={onSelectNode}
          />
        </div>

        {/* 3. Google Gemma 4 - Center Orchestrator */}
        <div
          className="absolute z-20 transition-transform duration-150"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <NodeCard
            node={ARCHITECTURE_NODES.gemma}
            isSelected={selectedNodeId === 'gemma'}
            isActiveInScenario={isNodeActive('gemma')}
            onSelect={onSelectNode}
          />
        </div>

        {/* 4. Claude Subagent (Top-Right) */}
        <div
          className="absolute z-10 transition-transform duration-150"
          style={{
            left: '83%',
            top: '22%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <NodeCard
            node={ARCHITECTURE_NODES.claude}
            isSelected={selectedNodeId === 'claude'}
            isActiveInScenario={isNodeActive('claude')}
            onSelect={onSelectNode}
          />
        </div>

        {/* 5. Gemini Deep Research Subagent (Mid-Right) */}
        <div
          className="absolute z-10 transition-transform duration-150"
          style={{
            left: '83%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <NodeCard
            node={ARCHITECTURE_NODES.gemini}
            isSelected={selectedNodeId === 'gemini'}
            isActiveInScenario={isNodeActive('gemini')}
            onSelect={onSelectNode}
          />
        </div>

        {/* 6. Antigravity Subagent (Bottom-Right) */}
        <div
          className="absolute z-10 transition-transform duration-150"
          style={{
            left: '83%',
            top: '78%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <NodeCard
            node={ARCHITECTURE_NODES.antigravity}
            isSelected={selectedNodeId === 'antigravity'}
            isActiveInScenario={isNodeActive('antigravity')}
            onSelect={onSelectNode}
          />
        </div>
      </div>

      {/* Mobile scroll cue */}
      <div className="flex md:hidden items-center justify-center gap-1.5 mt-2 text-xs font-mono text-text-muted">
        <span>Scroll horizontally to view complete topology</span>
      </div>
    </div>
  );
};
