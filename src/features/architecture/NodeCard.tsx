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
      return <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-[#22FF6E]" strokeWidth={1.5} aria-hidden="true" />;
    case 'gate':
      return <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFBD2E]" strokeWidth={1.5} aria-hidden="true" />;
    case 'claude':
      return <Layers className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} aria-hidden="true" />;
    case 'gemini':
      return <Globe className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} aria-hidden="true" />;
    case 'antigravity':
      return <Code2 className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} aria-hidden="true" />;
    case 'graphify':
      return <Network className="w-4 h-4 sm:w-5 sm:h-5 text-[#22FF6E]" strokeWidth={1.5} aria-hidden="true" />;
    default:
      return <Cpu className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} aria-hidden="true" />;
  }
};

const getCategoryBadgeClass = (category: ArchitectureNodeData['category']) => {
  switch (category) {
    case 'orchestrator':
      return 'bg-[#22FF6E]/10 text-[#22FF6E] border-[#22FF6E]/30 font-medium';
    case 'safety':
      return 'bg-[#FFBD2E]/10 text-[#FFBD2E] border-[#FFBD2E]/30 font-medium';
    case 'input':
      return 'bg-white/[0.04] text-[#F5F0E8] border-white/[0.08] font-medium';
    case 'service':
    case 'graphify':
      return 'bg-[#22FF6E]/10 text-[#22FF6E] border-[#22FF6E]/20 font-medium';
    case 'subagent':
      return 'bg-white/[0.04] text-[#F5F0E8]/45 border-white/[0.08] font-medium';
    default:
      return 'bg-white/[0.04] text-[#F5F0E8]/45 border-white/[0.08]';
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
    const base = 'group relative text-left transition-all duration-200 outline-none rounded-[20px]';
    const size = isCompact ? 'w-full p-3.5' : 'w-[190px] md:w-[215px] p-3.5';

    if (isOrchestrator) {
      if (isSelected) {
        return `${base} ${size} border-[#22FF6E] bg-[#141414] ring-2 ring-[#22FF6E]/40 text-[#22FF6E] shadow-[0_0_20px_rgba(34,255,110,0.1)]`;
      }
      return `${base} ${size} border border-[#22FF6E]/40 bg-[#141414] ring-1 ring-[#22FF6E]/20 text-[#22FF6E] hover:border-[#22FF6E]`;
    }

    if (isGate) {
      if (isSelected) {
        return `${base} ${size} border-dashed border-[#FFBD2E] bg-[#141414] ring-2 ring-[#FFBD2E]/40 text-[#FFBD2E] shadow-sm`;
      }
      return `${base} ${size} border border-dashed border-[#FFBD2E]/60 bg-[#141414] text-[#FFBD2E] hover:border-[#FFBD2E]`;
    }

    if (isGraphify) {
      if (isSelected) {
        return `${base} ${size} border-[#22FF6E] bg-[#141414] ring-2 ring-[#22FF6E]/40 text-[#F5F0E8] shadow-[0_0_20px_rgba(34,255,110,0.1)]`;
      }
      if (isActiveInScenario) {
        return `${base} ${size} border border-[#22FF6E]/40 bg-[#141414] text-[#F5F0E8] hover:border-[#22FF6E]`;
      }
      return `${base} ${size} border border-white/[0.06] bg-[#141414] text-[#F5F0E8] opacity-75 hover:opacity-100 hover:border-white/[0.15]`;
    }

    if (isSelected) {
      return `${base} ${size} border border-[#22FF6E] bg-[#141414] ring-2 ring-[#22FF6E]/40 text-[#F5F0E8] shadow-[0_0_20px_rgba(34,255,110,0.1)]`;
    }

    if (isActiveInScenario) {
      return `${base} ${size} border border-white/[0.15] bg-[#141414] text-[#F5F0E8] hover:border-[#22FF6E]/40`;
    }

    return `${base} ${size} border border-white/[0.06] bg-[#141414] text-[#F5F0E8] opacity-75 hover:opacity-100 hover:border-white/[0.15]`;
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
                {isOrchestrator && <Sparkles className="w-2.5 h-2.5 text-[#22FF6E]" strokeWidth={1.5} />}
                {isGate && <Lock className="w-2.5 h-2.5 text-[#FFBD2E]" strokeWidth={1.5} />}
                {isGraphify && <Network className="w-2.5 h-2.5 text-[#22FF6E]" strokeWidth={1.5} />}
                {node.categoryLabel}
              </span>

              {/* Status Indicator */}
              {isActiveInScenario && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-[#F5F0E8]/45">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      isGate ? 'bg-[#FFBD2E] animate-pulse' : 'bg-[#22FF6E] animate-pulse'
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
                    ? 'bg-[#22FF6E]/15 border-[#22FF6E]/30 text-[#22FF6E]'
                    : isGate
                    ? 'bg-[#FFBD2E]/15 border-[#FFBD2E]/30 text-[#FFBD2E]'
                    : isGraphify
                    ? 'bg-[#22FF6E]/10 border-[#22FF6E]/20 text-[#22FF6E]'
                    : isSelected
                    ? 'bg-[#22FF6E]/10 border-[#22FF6E]/30 text-[#22FF6E]'
                    : 'bg-white/[0.04] border-white/[0.08] text-[#F5F0E8]'
                }`}
              >
                {getNodeIcon(node.id)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-sm font-semibold text-[#F0FFE8] truncate">
                  {node.name}
                </h3>
                <p className="text-[10px] font-mono text-[#F5F0E8]/45 truncate">{node.modelId}</p>
              </div>
            </div>

            {/* Role Snippet */}
            <p className="mt-2 text-[11px] text-[#F5F0E8]/45 line-clamp-2 leading-relaxed">
              {node.shortRole}
            </p>

            {/* Privacy Badge */}
            <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px]">
              <span className="text-[#F5F0E8]/45 font-mono truncate max-w-[110px]">
                {node.executionDomain}
              </span>
              <span
                className={`font-medium px-1.5 py-0.5 rounded-[4px] border ${
                  node.privacyTier === 'local-only'
                    ? 'bg-[#22FF6E]/10 text-[#22FF6E] border-[#22FF6E]/30'
                    : node.privacyTier === 'human-gated'
                    ? 'bg-[#FFBD2E]/10 text-[#FFBD2E] border-[#FFBD2E]/30'
                    : 'bg-white/[0.04] text-[#F5F0E8]/45 border-white/[0.08]'
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
            className="z-50 max-w-xs rounded-[16px] border border-white/[0.08] bg-[#141414] p-3 text-xs shadow-2xl text-[#F5F0E8] animate-in fade-in-0"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-[#F0FFE8] text-xs">{node.name}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.04] border border-white/[0.08] text-[#F5F0E8]/45">
                {node.modelId}
              </span>
            </div>
            <p className="text-[#F5F0E8]/60 text-[11px] leading-relaxed mb-2">
              {node.description}
            </p>
            <div className="text-[10px] font-mono border-t border-white/[0.06] pt-1.5 text-[#F5F0E8]/45 flex items-center justify-between">
              <span>{node.executionDomain}</span>
              <span className="text-[#22FF6E] font-sans font-medium">Click to inspect</span>
            </div>
            <Tooltip.Arrow className="fill-[#141414]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};
