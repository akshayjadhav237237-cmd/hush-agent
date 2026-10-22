import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArchitectureNodeId, Scenario } from './types';
import { NodeCard } from './NodeCard';
import { ARCHITECTURE_NODES } from './architectureData';
import { ShieldAlert, Cpu } from 'lucide-react';

interface StackedFlowProps {
  selectedNodeId: ArchitectureNodeId;
  onSelectNode: (nodeId: ArchitectureNodeId) => void;
  activeScenario: Scenario;
  isPlaying: boolean;
  playbackSpeed: number;
}

export const StackedFlow: React.FC<StackedFlowProps> = ({
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

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-3 py-3 px-2">
      {/* 1. Origin: Operator */}
      <div className="w-full">
        <div className="text-[11px] font-mono tracking-wide text-text-muted mb-1 px-1">
          Stage 1: Intent Origin
        </div>
        <NodeCard
          node={ARCHITECTURE_NODES.user}
          isSelected={selectedNodeId === 'user'}
          isActiveInScenario={isNodeActive('user')}
          onSelect={onSelectNode}
          isCompact
        />
      </div>

      {/* Vertical Hairline Connector 1 */}
      <div className="relative w-full flex items-center justify-center h-7">
        <svg className="w-6 h-7" viewBox="0 0 24 28" role="img" aria-hidden="true">
          <line
            x1="12"
            y1="0"
            x2="12"
            y2="28"
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          {isNodeActive('user') && isNodeActive('gemma') && (
            <motion.line
              x1="12"
              y1="0"
              x2="12"
              y2="28"
              stroke="var(--accent)"
              strokeWidth="1.5"
              strokeDasharray="5 5"
              animate={
                effectiveReducedMotion || !isPlaying
                  ? undefined
                  : { strokeDashoffset: [-20, 0] }
              }
              transition={{
                duration: 1.6 / playbackSpeed,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          )}
          {isNodeActive('user') && isNodeActive('gemma') && !effectiveReducedMotion && isPlaying && (
            <circle r="3" fill="var(--accent)" stroke="var(--accent)" strokeWidth="1">
              <animateMotion
                path="M 12 0 L 12 28"
                dur={`${1.8 / playbackSpeed}s`}
                repeatCount="indefinite"
              />
            </circle>
          )}
        </svg>
      </div>

      {/* 2. Central Orchestrator: Google Gemma 4 */}
      <div className="w-full">
        <div className="text-[11px] font-mono tracking-wide text-accent font-medium mb-1 px-1 flex items-center justify-between">
          <span>Stage 2: Central Orchestrator</span>
          <span className="text-[10px] text-text-muted font-normal">Local Privacy</span>
        </div>
        <NodeCard
          node={ARCHITECTURE_NODES.gemma}
          isSelected={selectedNodeId === 'gemma'}
          isActiveInScenario={isNodeActive('gemma')}
          onSelect={onSelectNode}
          isCompact
        />
      </div>

      {/* Vertical Hairline Connector 2 */}
      <div className="relative w-full flex items-center justify-center h-7">
        <svg className="w-6 h-7" viewBox="0 0 24 28" role="img" aria-hidden="true">
          <line
            x1="12"
            y1="0"
            x2="12"
            y2="28"
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          {isNodeActive('gemma') && (
            <motion.line
              x1="12"
              y1="0"
              x2="12"
              y2="28"
              stroke="var(--accent)"
              strokeWidth="1.5"
              strokeDasharray="5 5"
              animate={
                effectiveReducedMotion || !isPlaying
                  ? undefined
                  : { strokeDashoffset: [-20, 0] }
              }
              transition={{
                duration: 1.6 / playbackSpeed,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          )}
          {isNodeActive('gemma') && !effectiveReducedMotion && isPlaying && (
            <circle r="3" fill="var(--accent)" stroke="var(--accent)" strokeWidth="1">
              <animateMotion
                path="M 12 0 L 12 28"
                dur={`${1.8 / playbackSpeed}s`}
                repeatCount="indefinite"
              />
            </circle>
          )}
        </svg>
      </div>

      {/* 3. Subagents Group */}
      <div className="w-full p-3 rounded-[14px] border border-border bg-surface-2/30">
        <div className="text-[11px] font-mono tracking-wide text-text-muted mb-2 px-1 flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
          <span>Stage 3: Subagent Execution</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <NodeCard
            node={ARCHITECTURE_NODES.claude}
            isSelected={selectedNodeId === 'claude'}
            isActiveInScenario={isNodeActive('claude')}
            onSelect={onSelectNode}
            isCompact
          />
          <NodeCard
            node={ARCHITECTURE_NODES.gemini}
            isSelected={selectedNodeId === 'gemini'}
            isActiveInScenario={isNodeActive('gemini')}
            onSelect={onSelectNode}
            isCompact
          />
          <NodeCard
            node={ARCHITECTURE_NODES.antigravity}
            isSelected={selectedNodeId === 'antigravity'}
            isActiveInScenario={isNodeActive('antigravity')}
            onSelect={onSelectNode}
            isCompact
          />
        </div>
      </div>

      {/* Vertical Hairline Connector 3 */}
      <div className="relative w-full flex items-center justify-center h-7">
        <svg className="w-6 h-7" viewBox="0 0 24 28" role="img" aria-hidden="true">
          <line
            x1="12"
            y1="0"
            x2="12"
            y2="28"
            stroke="var(--border)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          {isNodeActive('gate') && (
            <motion.line
              x1="12"
              y1="0"
              x2="12"
              y2="28"
              stroke="var(--warning)"
              strokeWidth="1.5"
              strokeDasharray="5 5"
              animate={
                effectiveReducedMotion || !isPlaying
                  ? undefined
                  : { strokeDashoffset: [-20, 0] }
              }
              transition={{
                duration: 1.6 / playbackSpeed,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          )}
          {isNodeActive('gate') && !effectiveReducedMotion && isPlaying && (
            <circle r="3" fill="var(--warning)" stroke="var(--warning)" strokeWidth="1">
              <animateMotion
                path="M 12 0 L 12 28"
                dur={`${1.8 / playbackSpeed}s`}
                repeatCount="indefinite"
              />
            </circle>
          )}
        </svg>
      </div>

      {/* 4. Safety Intercept: Attention Gate */}
      <div className="w-full">
        <div className="text-[11px] font-mono tracking-wide text-warning font-medium mb-1 px-1 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" strokeWidth={1.5} />
            Stage 4: Attention Gate Checkpoint
          </span>
          <span className="text-[10px] text-text-muted font-normal">Policy Guard</span>
        </div>
        <NodeCard
          node={ARCHITECTURE_NODES.gate}
          isSelected={selectedNodeId === 'gate'}
          isActiveInScenario={isNodeActive('gate')}
          onSelect={onSelectNode}
          isCompact
        />
      </div>
    </div>
  );
};
