import React from 'react';
import {
  Brain,
  Cpu,
  User,
  ShieldAlert,
  Layers,
  Globe,
  Code2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  ShieldCheck,
  Eye,
  Sparkles,
  Network
} from 'lucide-react';
import { ArchitectureNodeId } from './types';
import { ARCHITECTURE_NODES } from './architectureData';

interface NodeInspectorProps {
  nodeId: ArchitectureNodeId;
  onSelectNode: (id: ArchitectureNodeId) => void;
}

const getNodeIcon = (id: ArchitectureNodeId) => {
  switch (id) {
    case 'user':
      return <User className="w-5 h-5 text-[#F5F0E8]" strokeWidth={1.5} />;
    case 'gemma':
      return <Brain className="w-5 h-5 text-[#22FF6E]" strokeWidth={1.5} />;
    case 'gate':
      return <ShieldAlert className="w-5 h-5 text-[#FFBD2E]" strokeWidth={1.5} />;
    case 'claude':
      return <Layers className="w-5 h-5 text-[#F5F0E8]" strokeWidth={1.5} />;
    case 'gemini':
      return <Globe className="w-5 h-5 text-[#F5F0E8]" strokeWidth={1.5} />;
    case 'antigravity':
      return <Code2 className="w-5 h-5 text-[#F5F0E8]" strokeWidth={1.5} />;
    case 'graphify':
      return <Network className="w-5 h-5 text-[#22FF6E]" strokeWidth={1.5} />;
    default:
      return <Cpu className="w-5 h-5 text-[#F5F0E8]" strokeWidth={1.5} />;
  }
};

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  nodeId,
  onSelectNode
}) => {
  const node = ARCHITECTURE_NODES[nodeId] || ARCHITECTURE_NODES.gemma;
  const isOrchestrator = node.category === 'orchestrator';
  const isGate = node.category === 'safety';
  const isGraphify = node.id === 'graphify';

  return (
    <div
      className="w-full rounded-[24px] border border-white/[0.06] bg-[#141414] p-5 sm:p-7 shadow-2xl"
      aria-live="polite"
    >
      {/* Inspector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-[16px] border shrink-0 ${
              isOrchestrator
                ? 'bg-[#22FF6E]/10 border-[#22FF6E]/30 text-[#22FF6E]'
                : isGate
                ? 'bg-[#FFBD2E]/10 border-[#FFBD2E]/30 text-[#FFBD2E]'
                : isGraphify
                ? 'bg-[#22FF6E]/10 border-[#22FF6E]/20 text-[#22FF6E]'
                : 'bg-white/[0.04] border-white/[0.08] text-[#F5F0E8]'
            }`}
          >
            {getNodeIcon(node.id)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold font-['Archivo',sans-serif] text-[#F0FFE8]">{node.name}</h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded-[6px] bg-white/[0.04] border border-white/[0.08] text-[#F5F0E8]/45">
                {node.modelId}
              </span>
            </div>
            <p className="text-xs text-[#F5F0E8]/45 mt-0.5">
              {node.shortRole}
            </p>
          </div>
        </div>

        {/* Quick Node Switcher Pill Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {(Object.keys(ARCHITECTURE_NODES) as ArchitectureNodeId[]).map((key) => {
            const item = ARCHITECTURE_NODES[key];
            const isCurrent = item.id === node.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectNode(item.id)}
                className={`px-3 py-1.5 text-xs font-mono font-medium rounded-[10px] border transition-colors whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-[#22FF6E] ${
                  isCurrent
                    ? 'bg-[#22FF6E] text-black border-[#22FF6E] shadow-sm font-semibold'
                    : 'bg-white/[0.04] text-[#F5F0E8]/60 border-white/[0.08] hover:text-[#F5F0E8] hover:bg-white/[0.08]'
                }`}
                aria-label={`Inspect ${item.name}`}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Qualitative Attributes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
        {/* Execution Domain */}
        <div className="p-3.5 rounded-[16px] bg-white/[0.02] border border-white/[0.06]">
          <div className="text-[11px] font-mono text-[#F5F0E8]/45 uppercase tracking-wider">Execution Domain</div>
          <div className="text-xs font-medium text-[#F0FFE8] mt-1.5 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#22FF6E]" strokeWidth={1.5} />
            <span>{node.executionDomain}</span>
          </div>
        </div>

        {/* Privacy Tier */}
        <div className="p-3.5 rounded-[16px] bg-white/[0.02] border border-white/[0.06]">
          <div className="text-[11px] font-mono text-[#F5F0E8]/45 uppercase tracking-wider">Privacy Guarantee</div>
          <div className="text-xs font-medium mt-1.5 flex items-center gap-1.5">
            {node.privacyTier === 'local-only' ? (
              <span className="text-[#22FF6E] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
                {node.privacyLabel}
              </span>
            ) : node.privacyTier === 'human-gated' ? (
              <span className="text-[#FFBD2E] flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.5} />
                {node.privacyLabel}
              </span>
            ) : (
              <span className="text-[#F5F0E8] flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-[#F5F0E8]/45" strokeWidth={1.5} />
                {node.privacyLabel}
              </span>
            )}
          </div>
        </div>

        {/* Safety Stance */}
        <div className="p-3.5 rounded-[16px] bg-white/[0.02] border border-white/[0.06]">
          <div className="text-[11px] font-mono text-[#F5F0E8]/45 uppercase tracking-wider">Safety Category</div>
          <div className="text-xs font-medium text-[#F0FFE8] mt-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#22FF6E]" strokeWidth={1.5} />
            <span>{node.categoryLabel}</span>
          </div>
        </div>
      </div>

      {/* Deep Function Description */}
      <div className="space-y-4 text-xs">
        <div>
          <h4 className="font-semibold text-[#F0FFE8] text-xs uppercase font-mono tracking-wider mb-1.5">
            Operational Role
          </h4>
          <p className="text-[#F5F0E8]/70 leading-relaxed font-['Space_Grotesk',sans-serif]">{node.detailedFunction}</p>
        </div>

        {/* Implementation Details */}
        {node.implementation && (
          <div>
            <h4 className="font-semibold text-[#F0FFE8] text-xs uppercase font-mono tracking-wider mb-1.5">
              Implementation
            </h4>
            <p className="text-[#F5F0E8]/60 leading-relaxed font-mono text-[11px] p-3 rounded-[16px] bg-white/[0.02] border border-white/[0.06]">
              {node.implementation}
            </p>
          </div>
        )}

        {/* Highlighted Trust/Security Boundary */}
        <div
          className={`p-3.5 rounded-[16px] border ${
            isOrchestrator
              ? 'bg-[#22FF6E]/5 border-[#22FF6E]/20 text-[#F5F0E8]'
              : isGate
              ? 'border-dashed border-[#FFBD2E]/40 bg-[#FFBD2E]/5 text-[#F5F0E8]'
              : isGraphify
              ? 'bg-[#22FF6E]/5 border-[#22FF6E]/20 text-[#F5F0E8]'
              : 'bg-white/[0.02] border-white/[0.06] text-[#F5F0E8]'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {isGate ? (
              <ShieldAlert className="w-4 h-4 text-[#FFBD2E] shrink-0 mt-0.5" strokeWidth={1.5} />
            ) : isOrchestrator ? (
              <Eye className="w-4 h-4 text-[#22FF6E] shrink-0 mt-0.5" strokeWidth={1.5} />
            ) : isGraphify ? (
              <ShieldCheck className="w-4 h-4 text-[#22FF6E] shrink-0 mt-0.5" strokeWidth={1.5} />
            ) : (
              <Lock className="w-4 h-4 text-[#F5F0E8]/45 shrink-0 mt-0.5" strokeWidth={1.5} />
            )}
            <div>
              <span className="font-semibold text-[#F0FFE8]">Security Protocol: </span>
              <span className="text-[#F5F0E8]/70">{node.securityProtocol}</span>
            </div>
          </div>
        </div>

        {/* Capabilities Checklist */}
        <div>
          <h4 className="font-semibold text-[#F0FFE8] text-xs uppercase font-mono tracking-wider mb-2">
            Engine Responsibilities
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {node.capabilities.map((cap, i) => (
              <li
                key={i}
                className="flex items-center gap-2 p-3 rounded-[16px] bg-white/[0.02] border border-white/[0.06] text-[#F5F0E8]/70"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22FF6E] shrink-0" strokeWidth={1.5} />
                <span className="text-[#F5F0E8] text-xs leading-snug">{cap}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Sample Payload Contract */}
        <div className="pt-2">
          <h4 className="font-semibold text-[#F0FFE8] text-xs uppercase font-mono tracking-wider mb-2 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-[#22FF6E]" />
            <span>Communication Contract (I/O)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-[16px] bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[#F5F0E8]/45 block text-[10px] uppercase font-semibold mb-1.5">
                Inbound Payload
              </span>
              <p className="text-[#F5F0E8]/80 text-[11px] leading-relaxed whitespace-pre-wrap">
                {node.samplePayload.input}
              </p>
            </div>
            <div className="p-3.5 rounded-[16px] bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[#22FF6E] block text-[10px] uppercase font-semibold mb-1.5">
                Outbound Dispatch
              </span>
              <p className="text-[#F5F0E8]/80 text-[11px] leading-relaxed whitespace-pre-wrap">
                {node.samplePayload.output}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
