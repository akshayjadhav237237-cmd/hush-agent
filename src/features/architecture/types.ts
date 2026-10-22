export type ArchitectureNodeId =
  | 'user'
  | 'gemma'
  | 'claude'
  | 'gemini'
  | 'antigravity'
  | 'gate';

export type NodeCategory = 'input' | 'orchestrator' | 'safety' | 'subagent';

export type PrivacyTier = 'local-only' | 'sandboxed' | 'cloud-vetted' | 'human-gated';

export interface ArchitectureNodeData {
  id: ArchitectureNodeId;
  name: string;
  shortRole: string;
  modelId: string;
  category: NodeCategory;
  categoryLabel: string;
  privacyTier: PrivacyTier;
  privacyLabel: string;
  executionDomain: 'Local On-Device' | 'Human Checkpoint' | 'External API' | 'Sandboxed Container';
  description: string;
  detailedFunction: string;
  capabilities: string[];
  securityProtocol: string;
  coordinates: {
    x: number;
    y: number;
  };
  samplePayload: {
    input: string;
    output: string;
  };
}

export interface ConnectionFlow {
  id: string;
  from: ArchitectureNodeId;
  to: ArchitectureNodeId;
  label: string;
  description: string;
  pathD: string;
  packetCount: number;
  bidirectional?: boolean;
}

export type ScenarioId = 'all' | 'planning' | 'research' | 'coding' | 'gate';

export interface Scenario {
  id: ScenarioId;
  title: string;
  shortBadge: string;
  summary: string;
  activeNodeIds: ArchitectureNodeId[];
  activeConnectionIds: string[];
  pulseType: 'standard' | 'warning' | 'danger' | 'accent';
  safetyNote?: string;
  narrativeSteps: Array<{
    step: number;
    agent: string;
    action: string;
  }>;
}
