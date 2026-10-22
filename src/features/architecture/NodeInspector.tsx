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
  Sparkles
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
      return <User className="w-5 h-5 text-text" strokeWidth={1.5} />;
    case 'gemma':
      return <Brain className="w-5 h-5 text-accent" strokeWidth={1.5} />;
    case 'gate':
      return <ShieldAlert className="w-5 h-5 text-warning" strokeWidth={1.5} />;
    case 'claude':
      return <Layers className="w-5 h-5 text-text" strokeWidth={1.5} />;
    case 'gemini':
      return <Globe className="w-5 h-5 text-text" strokeWidth={1.5} />;
    case 'antigravity':
      return <Code2 className="w-5 h-5 text-text" strokeWidth={1.5} />;
    default:
      return <Cpu className="w-5 h-5 text-text" strokeWidth={1.5} />;
  }
};

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  nodeId,
  onSelectNode
}) => {
  const node = ARCHITECTURE_NODES[nodeId] || ARCHITECTURE_NODES.gemma;
  const isOrchestrator = node.category === 'orchestrator';
  const isGate = node.category === 'safety';

  return (
    <div
      className="w-full rounded-[14px] border border-border bg-surface p-4 md:p-6 shadow-sm"
      aria-live="polite"
    >
      {/* Inspector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-[10px] border shrink-0 ${
              isOrchestrator
                ? 'bg-accent/10 border-accent/30 text-accent'
                : isGate
                ? 'bg-warning/10 border-warning/30 text-warning'
                : 'bg-surface-2 border-border text-text'
            }`}
          >
            {getNodeIcon(node.id)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-semibold text-text">{node.name}</h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded-[4px] bg-surface-2 border border-border text-text-muted">
                {node.modelId}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
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
                className={`px-2.5 py-1 text-xs font-medium rounded-[8px] border transition-colors whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isCurrent
                    ? 'bg-accent text-accent-contrast border-accent'
                    : 'bg-surface-2 text-text-muted border-border hover:text-text hover:bg-surface'
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        {/* Execution Domain */}
        <div className="p-3 rounded-[10px] bg-surface-2/60 border border-border">
          <div className="text-[11px] font-mono text-text-muted">Execution Domain</div>
          <div className="text-xs font-medium text-text mt-1 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
            <span>{node.executionDomain}</span>
          </div>
        </div>

        {/* Privacy Tier */}
        <div className="p-3 rounded-[10px] bg-surface-2/60 border border-border">
          <div className="text-[11px] font-mono text-text-muted">Privacy Guarantee</div>
          <div className="text-xs font-medium mt-1 flex items-center gap-1.5">
            {node.privacyTier === 'local-only' ? (
              <span className="text-success flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
                {node.privacyLabel}
              </span>
            ) : node.privacyTier === 'human-gated' ? (
              <span className="text-warning flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.5} />
                {node.privacyLabel}
              </span>
            ) : (
              <span className="text-text flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
                {node.privacyLabel}
              </span>
            )}
          </div>
        </div>

        {/* Safety Stance */}
        <div className="p-3 rounded-[10px] bg-surface-2/60 border border-border">
          <div className="text-[11px] font-mono text-text-muted">Safety Category</div>
          <div className="text-xs font-medium text-text mt-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
            <span>{node.categoryLabel}</span>
          </div>
        </div>
      </div>

      {/* Deep Function Description */}
      <div className="space-y-4 text-xs">
        <div>
          <h4 className="font-medium text-text text-xs uppercase font-mono tracking-wide mb-1">
            Operational Role
          </h4>
          <p className="text-text-muted leading-relaxed">{node.detailedFunction}</p>
        </div>

        {/* Highlighted Trust/Security Boundary */}
        <div
          className={`p-3 rounded-[10px] border ${
            isOrchestrator
              ? 'bg-accent/5 border-accent/20 text-text'
              : isGate
              ? 'border-dashed border-warning/40 bg-warning/5 text-text'
              : 'bg-surface-2/40 border-border text-text'
          }`}
        >
          <div className="flex items-start gap-2">
            {isGate ? (
              <ShieldAlert className="w-4 h-4 text-warning shrink-0 mt-0.5" strokeWidth={1.5} />
            ) : isOrchestrator ? (
              <Eye className="w-4 h-4 text-accent shrink-0 mt-0.5" strokeWidth={1.5} />
            ) : (
              <Lock className="w-4 h-4 text-text-muted shrink-0 mt-0.5" strokeWidth={1.5} />
            )}
            <div>
              <span className="font-semibold text-text">Security Protocol: </span>
              <span className="text-text-muted">{node.securityProtocol}</span>
            </div>
          </div>
        </div>

        {/* Capabilities Checklist */}
        <div>
          <h4 className="font-medium text-text text-xs uppercase font-mono tracking-wide mb-2">
            Engine Responsibilities
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {node.capabilities.map((cap, i) => (
              <li
                key={i}
                className="flex items-center gap-2 p-2.5 rounded-[10px] bg-surface-2/40 border border-border text-text-muted"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={1.5} />
                <span className="text-text text-xs leading-snug">{cap}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Sample Payload Contract */}
        <div className="pt-2">
          <h4 className="font-medium text-text text-xs uppercase font-mono tracking-wide mb-2 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
            <span>Communication Contract (I/O)</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs font-mono">
            <div className="p-3 rounded-[10px] bg-surface-2/50 border border-border">
              <span className="text-text-muted block text-[10px] uppercase font-semibold mb-1">
                Inbound Payload
              </span>
              <p className="text-text text-[11px] leading-relaxed whitespace-pre-wrap">
                {node.samplePayload.input}
              </p>
            </div>
            <div className="p-3 rounded-[10px] bg-surface-2/50 border border-border">
              <span className="text-accent block text-[10px] uppercase font-semibold mb-1">
                Outbound Dispatch
              </span>
              <p className="text-text text-[11px] leading-relaxed whitespace-pre-wrap">
                {node.samplePayload.output}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
