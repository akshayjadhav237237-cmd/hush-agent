import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  Brain,
  Cpu,
  User,
  ShieldAlert,
  Layers,
  Globe,
  Code2,
  Lock,
  Sparkles,
  Network
} from 'lucide-react';
import { ArchitectureNodeData } from './types';

interface NodeCardProps {
  node: ArchitectureNodeData;
  isSelected: boolean;
  isActiveInScenario: boolean;
  onSelect: (nodeId: ArchitectureNodeData['id']) => void;
  isCompact?: boolean;
}

const getNodeIcon = (id: ArchitectureNodeData['id']) => {
  switch (id) {
    case 'user':
      return <User className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} aria-hidden="true" />;
    case 'gemma':
      return <Brain className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} aria-hidden="true" />;
    case 'gate':
      return <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} aria-hidden="true" />;
    case 'claude':
      return <Layers className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} aria-hidden="true" />;
    case 'gemini':
      return <Globe className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} aria-hidden="true" />;
    case 'antigravity':
      return <Code2 className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} aria-hidden="true" />;
    case 'graphify':
      return <Network className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} aria-hidden="true" />;
    default:
      return <Cpu className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} aria-hidden="true" />;
  }
};

const getCategoryBadgeClass = (category: ArchitectureNodeData['category']) => {
  switch (category) {
    case 'orchestrator':
      return 'bg-accent/10 text-accent border-accent/30 font-medium';
    case 'safety':
      return 'bg-warning/10 text-warning border-warning/30 font-medium';
    case 'input':
      return 'bg-surface-2 text-text border-border font-medium';
    case 'service':
    case 'graphify':
      return 'bg-accent/10 text-accent border-accent/20 font-medium';
    case 'subagent':
      return 'bg-surface-2 text-text-muted border-border font-medium';
    default:
      return 'bg-surface-2 text-text-muted border-border';
  }
};

export const NodeCard: React.FC<NodeCardProps> = ({
  node,
  isSelected,
  isActiveInScenario,
  onSelect,
  isCompact = false
}) => {
  const isOrchestrator = node.category === 'orchestrator';
  const isGate = node.category === 'safety';
  const isGraphify = node.id === 'graphify';

  const getNodeCardClasses = () => {
    const base = 'group relative text-left transition-all duration-150 outline-none rounded-[14px]';
    const size = isCompact ? 'w-full p-3' : 'w-[190px] md:w-[210px] p-3';

    if (isOrchestrator) {
      if (isSelected) {
        return `${base} ${size} border-accent bg-accent/10 ring-2 ring-accent text-accent shadow-sm`;
      }
      return `${base} ${size} border border-accent bg-accent/5 ring-1 ring-accent/20 text-accent hover:bg-accent/10`;
    }

    if (isGate) {
      if (isSelected) {
        return `${base} ${size} border-dashed border-warning bg-warning/10 ring-2 ring-warning text-warning shadow-sm`;
      }
      return `${base} ${size} border border-dashed border-warning/60 bg-warning/5 text-warning hover:border-warning hover:bg-warning/10`;
    }

    if (isGraphify) {
      if (isSelected) {
        return `${base} ${size} border border-accent bg-accent/10 ring-2 ring-accent text-accent shadow-sm`;
      }
      if (isActiveInScenario) {
        return `${base} ${size} border border-accent/40 bg-surface text-text hover:border-accent`;
      }
      return `${base} ${size} border border-border/60 bg-surface/80 text-text opacity-70 hover:opacity-100 hover:border-border`;
    }

    if (isSelected) {
      return `${base} ${size} border border-accent bg-surface ring-2 ring-accent text-text shadow-sm`;
    }

    if (isActiveInScenario) {
      return `${base} ${size} border border-border bg-surface text-text hover:border-accent/40`;
    }

    return `${base} ${size} border border-border/60 bg-surface/80 text-text opacity-70 hover:opacity-100 hover:border-border`;
  };

  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            onClick={() => onSelect(node.id)}
            aria-pressed={isSelected}
            aria-label={`${node.name}: ${node.shortRole}. Click to inspect details.`}
            className={getNodeCardClasses()}
          >
            {/* Top Indicator Row */}
            <div className="flex items-center justify-between gap-1.5 mb-2">
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono tracking-wide rounded-[6px] border ${getCategoryBadgeClass(
                  node.category
                )}`}
              >
                {isOrchestrator && <Sparkles className="w-2.5 h-2.5 text-accent" strokeWidth={1.5} />}
                {isGate && <Lock className="w-2.5 h-2.5 text-warning" strokeWidth={1.5} />}
                {isGraphify && <Network className="w-2.5 h-2.5 text-accent" strokeWidth={1.5} />}
                {node.categoryLabel}
              </span>

              {/* Status Indicator */}
              {isActiveInScenario && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-text-muted">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      isGate ? 'bg-warning animate-pulse' : 'bg-accent animate-pulse'
                    }`}
                  />
                  <span>Active</span>
                </span>
              )}
            </div>

            {/* Node Title & Icon */}
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-[8px] border transition-colors shrink-0 ${
                  isOrchestrator
                    ? 'bg-accent/15 border-accent/30 text-accent'
                    : isGate
                    ? 'bg-warning/15 border-warning/30 text-warning'
                    : isGraphify
                    ? 'bg-accent/10 border-accent/20 text-accent'
                    : isSelected
                    ? 'bg-accent/10 border-accent/30 text-accent'
                    : 'bg-surface-2 border-border text-text'
                }`}
              >
                {getNodeIcon(node.id)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-sm font-semibold text-text truncate">
                  {node.name}
                </h3>
                <p className="text-[10px] font-mono text-text-muted truncate">{node.modelId}</p>
              </div>
            </div>

            {/* Role Snippet */}
            <p className="mt-2 text-[11px] text-text-muted line-clamp-2 leading-relaxed">
              {node.shortRole}
            </p>

            {/* Privacy Badge */}
            <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-between text-[10px]">
              <span className="text-text-muted font-mono truncate max-w-[110px]">
                {node.executionDomain}
              </span>
              <span
                className={`font-medium px-1.5 py-0.5 rounded-[4px] border ${
                  node.privacyTier === 'local-only'
                    ? 'bg-success/10 text-success border-success/30'
                    : node.privacyTier === 'human-gated'
                    ? 'bg-warning/10 text-warning border-warning/30'
                    : 'bg-surface-2 text-text-muted border-border'
                }`}
              >
                {node.privacyLabel}
              </span>
            </div>
          </button>
        </Tooltip.Trigger>

        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            align="center"
            sideOffset={6}
            className="z-50 max-w-xs rounded-[14px] border border-border bg-surface p-3 text-xs shadow-md text-text animate-in fade-in-0"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-text text-xs">{node.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-2 border border-border text-text-muted">
                {node.modelId}
              </span>
            </div>
            <p className="text-text-muted text-[11px] leading-relaxed mb-2">
              {node.description}
            </p>
            <div className="text-[10px] font-mono border-t border-border pt-1.5 text-text-muted flex items-center justify-between">
              <span>{node.executionDomain}</span>
              <span className="text-accent font-sans font-medium">Click to inspect</span>
            </div>
            <Tooltip.Arrow className="fill-surface" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};
