import { ArchitectureNodeData, ConnectionFlow, Scenario } from './types';

export const ARCHITECTURE_NODES: Record<string, ArchitectureNodeData> = {
  user: {
    id: 'user',
    name: 'Operator',
    shortRole: 'Goal Definition & Final Authority',
    modelId: 'Operator Intent',
    category: 'input',
    categoryLabel: 'Origin',
    privacyTier: 'human-gated',
    privacyLabel: 'Operator Controlled',
    executionDomain: 'Human Checkpoint',
    description:
      'The human operator provides intent, sets project criteria, and reviews deliverables.',
    detailedFunction:
      'Submits requirements in natural language. Retains decisive control over all agent mutations through interactive checkpoints.',
    implementation: 'Direct terminal and graphical interface input',
    capabilities: [
      'Natural language goal specification',
      'Contextual boundary definition',
      'Interactive review and signoff',
      'Emergency session termination'
    ],
    securityProtocol: 'Zero autonomous actions occur without an originating operator request.',
    coordinates: { x: 170, y: 150 },
    samplePayload: {
      input: '"Configure database migration from SQLite to Postgres."',
      output: 'Task dispatched to Google Gemma 4 with ambient workspace context.'
    }
  },

  gemma: {
    id: 'gemma',
    name: 'Google Gemma 4',
    shortRole: 'Cloud Orchestrator & Vision Inspection',
    modelId: 'Google Gemma 4',
    category: 'orchestrator',
    categoryLabel: 'Orchestrator',
    privacyTier: 'cloud-vetted',
    privacyLabel: 'Gemini API',
    executionDomain: 'Cloud API',
    description:
      'Central orchestrator using multimodal screen vision and function calling via the Gemini API.',
    detailedFunction:
      'In the current build, Gemma 4 is called through the Gemini API. Running the same loop on a local runtime such as Ollama is a possible next step and has not been verified. Inspects rendered visual state via multimodal vision, plans task workflows, and intercepts hazardous commands at the Attention Gate.',
    implementation: 'Gemini API client with multimodal vision and tool orchestration',
    capabilities: [
      'Screen vision and workspace state inspection',
      'Function calling and task routing via Gemini API',
      'Structured task parameter validation',
      'Hazard classification for privileged actions'
    ],
    securityProtocol:
      'In the current build, Gemma 4 is called through the Gemini API. Running the same loop on a local runtime such as Ollama is a possible next step and has not been verified.',
    coordinates: { x: 500, y: 220 },
    samplePayload: {
      input: 'Workspace state (editor, terminal output) + operator goal',
      output: 'dispatchSubtask(agent="claude", spec="schema_migration") | routeToGate(action="privileged_write")'
    }
  },

  gate: {
    id: 'gate',
    name: 'Attention Gate',
    shortRole: 'Policy Checkpoint & Kill Switch',
    modelId: 'Attention Gate',
    category: 'safety',
    categoryLabel: 'Safety Gate',
    privacyTier: 'human-gated',
    privacyLabel: 'Policy Intercept',
    executionDomain: 'Human Checkpoint',
    description:
      'Security policy checkpoint that halts autonomous execution before sensitive system operations.',
    detailedFunction:
      'Interposes between agent proposals and workstation execution. Triggers when actions touch credentials, elevated permissions, filesystem modifications, or remote pushes. Requires explicit operator confirmation or triggers the instant kill switch.',
    implementation: 'Local policy engine with fail-closed execution interception',
    capabilities: [
      'Credential and OAuth grant interception',
      'Destructive shell command freeze',
      'Ambiguity escalation to operator',
      'Immediate agent execution kill switch'
    ],
    securityProtocol:
      'Fail-closed policy guard. Execution halts indefinitely until reviewed by the operator.',
    coordinates: { x: 170, y: 480 },
    samplePayload: {
      input: 'Privileged action proposed: workspace directory modification',
      output: 'Execution paused: awaiting operator confirmation or kill switch'
    }
  },

  claude: {
    id: 'claude',
    name: 'Claude',
    shortRole: 'Architecture & Prompt Specification',
    modelId: 'Claude',
    category: 'subagent',
    categoryLabel: 'Subagent',
    privacyTier: 'cloud-vetted',
    privacyLabel: 'Sanitized API',
    executionDomain: 'External API',
    description:
      'Decomposes complex requirements into modular architecture specifications.',
    detailedFunction:
      'Receives sanitized task scopes from Google Gemma 4. Formulates architecture interfaces, data boundaries, and modular prompts for code implementation.',
    implementation: 'External model API with sanitized architectural context payloads',
    capabilities: [
      'System architecture decomposition',
      'Interface contract specification',
      'Task structuring and decomposition',
      'Static specification review'
    ],
    securityProtocol: 'Receives sanitized specifications only. Workstation access is barred.',
    coordinates: { x: 830, y: 140 },
    samplePayload: {
      input: 'Design database connection adapter with pooling and retry strategy.',
      output: 'Architecture specification and implementation steps for Antigravity'
    }
  },

  gemini: {
    id: 'gemini',
    name: 'Gemini Deep Research',
    shortRole: 'Technical Documentation & Web Research',
    modelId: 'Gemini Deep Research',
    category: 'subagent',
    categoryLabel: 'Subagent',
    privacyTier: 'cloud-vetted',
    privacyLabel: 'Research API',
    executionDomain: 'External API',
    description:
      'Investigates external documentation, release notes, and reference materials.',
    detailedFunction:
      'Performs targeted queries across documentation repositories, changelogs, and dependency matrices. Returns cited references to Google Gemma 4.',
    implementation: 'Gemini Deep Research API with source verification and grounding',
    capabilities: [
      'Technical documentation retrieval',
      'API specification verification',
      'Dependency compatibility analysis',
      'Source citation attribution'
    ],
    securityProtocol: 'Read-only external access. No workstation or local file access.',
    coordinates: { x: 830, y: 310 },
    samplePayload: {
      input: 'Verify configuration parameters and migration requirements for database adapter.',
      output: 'Documentation reference with verified configuration schema'
    }
  },

  antigravity: {
    id: 'antigravity',
    name: 'Antigravity',
    shortRole: 'Coding IDE Agent',
    modelId: 'Antigravity Runtime',
    category: 'subagent',
    categoryLabel: 'Subagent',
    privacyTier: 'sandboxed',
    privacyLabel: 'Sandboxed Workspace',
    executionDomain: 'Sandboxed Container',
    description:
      'Applies code modifications, executes tests, and stages diffs in an isolated sandbox.',
    detailedFunction:
      'Implements code changes based on specifications from Google Gemma 4 and Claude. Runs unit tests and validates builds inside the isolated workspace before requesting commits.',
    implementation: 'Sandboxed workspace runtime with isolated test execution',
    capabilities: [
      'Workspace code generation and patch application',
      'Test suite execution and error remediation',
      'Git staging preparation in isolated branch',
      'Build verification and lint checking'
    ],
    securityProtocol:
      'Confined to project sandbox. Operations outside boundaries route to the Attention Gate.',
    coordinates: { x: 830, y: 480 },
    samplePayload: {
      input: 'Implement database adapter with connection pooling.',
      output: 'Source files updated, test suite passing, staged diff prepared for review'
    }
  },

  graphify: {
    id: 'graphify',
    name: 'Graphify',
    shortRole: 'Code Graph Memory',
    modelId: 'Graphify (Graphify Labs, Apache 2.0)',
    category: 'service',
    categoryLabel: 'Code Graph Service',
    privacyTier: 'local-only',
    privacyLabel: 'Local Analysis',
    executionDomain: 'Local Process',
    description:
      'Extracts code syntax trees and manages structural graph memory on the local workstation.',
    detailedFunction:
      'Local codebase knowledge graph generator and topology query engine.',
    implementation: 'Local tree-sitter AST extraction, Louvain clustering, CLI execution',
    capabilities: [
      'Local tree-sitter AST syntax parsing',
      'Community cluster detection via Louvain algorithm',
      'Structural codebase knowledge graph generation',
      'CLI query endpoints: graph_build, graph_update, graph_report, graph_query, graph_explain, graph_path'
    ],
    securityProtocol:
      'Operates entirely on the local machine. Source code files remain local and are never transmitted to external APIs or remote servers.',
    coordinates: { x: 500, y: 480 },
    samplePayload: {
      input: 'Source code files from PROJECT_DIR',
      output: 'graph.html, GRAPH_REPORT.md, and query/explain/path symbol results'
    }
  }
};

export const CONNECTIONS: ConnectionFlow[] = [
  {
    id: 'conn-user-gemma',
    from: 'user',
    to: 'gemma',
    label: 'Intent & Screen Context',
    description: 'Task definition and screen context streamed to Google Gemma 4.',
    pathD: 'M 270 150 C 335 150, 335 220, 400 220',
    packetCount: 2,
    bidirectional: true
  },
  {
    id: 'conn-gemma-gate',
    from: 'gemma',
    to: 'gate',
    label: 'Privileged Action Routing',
    description: 'Policy routing of hazardous actions to the Attention Gate.',
    pathD: 'M 400 240 C 330 240, 330 480, 270 480',
    packetCount: 2,
    bidirectional: true
  },
  {
    id: 'conn-gate-user',
    from: 'gate',
    to: 'user',
    label: 'Signoff or Kill',
    description: 'Operator intervention loop: manual approval or session termination.',
    pathD: 'M 170 440 C 120 360, 120 270, 170 190',
    packetCount: 1,
    bidirectional: true
  },
  {
    id: 'conn-gemma-claude',
    from: 'gemma',
    to: 'claude',
    label: 'Architecture Specifications',
    description: 'Google Gemma 4 delegates system design to Claude with sanitized payloads.',
    pathD: 'M 600 200 C 665 200, 665 140, 730 140',
    packetCount: 2,
    bidirectional: true
  },
  {
    id: 'conn-gemma-gemini',
    from: 'gemma',
    to: 'gemini',
    label: 'Documentation & Citations',
    description: 'Google Gemma 4 queries Gemini Deep Research for external specifications.',
    pathD: 'M 600 220 C 665 220, 665 310, 730 310',
    packetCount: 2,
    bidirectional: true
  },
  {
    id: 'conn-gemma-antigravity',
    from: 'gemma',
    to: 'antigravity',
    label: 'Code & Workspace Diffs',
    description: 'Google Gemma 4 coordinates code modifications and test runs via Antigravity.',
    pathD: 'M 600 240 C 665 240, 665 480, 730 480',
    packetCount: 2,
    bidirectional: true
  },
  {
    id: 'conn-antigravity-graphify',
    from: 'antigravity',
    to: 'graphify',
    label: 'code in / AST extraction',
    description: 'Antigravity writes code files; Graphify parses syntax locally via tree-sitter into graphify-out/.',
    pathD: 'M 730 480 L 600 480',
    packetCount: 2,
    bidirectional: false
  },
  {
    id: 'conn-graphify-claude',
    from: 'graphify',
    to: 'claude',
    label: 'graph context out',
    description: 'Topology, community clusters and symbol paths provided to Claude as context for subsequent build prompts.',
    pathD: 'M 560 440 C 670 440, 670 160, 730 160',
    packetCount: 2,
    bidirectional: false
  },
  {
    id: 'conn-gemma-graphify',
    from: 'gemma',
    to: 'graphify',
    label: 'orchestrates graph tools',
    description: 'Gemma calls graph_build, graph_update, graph_report, graph_query, graph_explain, graph_path via CLI.',
    pathD: 'M 500 260 L 500 440',
    packetCount: 2,
    bidirectional: true
  }
];

export const SCENARIOS: Scenario[] = [
  {
    id: 'all',
    title: 'Full System Mesh',
    shortBadge: 'All Nodes',
    summary: 'Complete topology and coordination channels across all nodes including Graphify code graph memory.',
    activeNodeIds: ['user', 'gemma', 'claude', 'gemini', 'antigravity', 'graphify', 'gate'],
    activeConnectionIds: [
      'conn-user-gemma',
      'conn-gemma-gate',
      'conn-gate-user',
      'conn-gemma-claude',
      'conn-gemma-gemini',
      'conn-gemma-antigravity',
      'conn-antigravity-graphify',
      'conn-graphify-claude',
      'conn-gemma-graphify'
    ],
    pulseType: 'accent',
    narrativeSteps: [
      { step: 1, agent: 'Operator', action: 'Submits goal definition.' },
      { step: 2, agent: 'Google Gemma 4', action: 'Inspects workspace state and prepares plan.' },
      { step: 3, agent: 'Claude', action: 'Synthesizes modular architecture specification.' },
      { step: 4, agent: 'Gemini Deep Research', action: 'Retrieves verified documentation and references.' },
      { step: 5, agent: 'Antigravity', action: 'Implements code changes in sandbox.' },
      { step: 6, agent: 'Graphify', action: 'Extracts syntax trees locally and updates code graph.' },
      { step: 7, agent: 'Attention Gate', action: 'Enforces safety boundaries before system mutations.' }
    ]
  },
  {
    id: 'planning',
    title: 'Architecture Specification',
    shortBadge: 'Architecture',
    summary: 'Google Gemma 4 parses intent, queries Graphify topology, and coordinates with Claude for system structure.',
    activeNodeIds: ['user', 'gemma', 'claude', 'graphify'],
    activeConnectionIds: ['conn-user-gemma', 'conn-gemma-claude', 'conn-graphify-claude', 'conn-gemma-graphify'],
    pulseType: 'accent',
    narrativeSteps: [
      { step: 1, agent: 'Operator', action: 'Submits requirement specification.' },
      { step: 2, agent: 'Google Gemma 4', action: 'Sanitizes context locally and queries Graphify topology.' },
      { step: 3, agent: 'Graphify', action: 'Supplies codebase topology and symbol paths to Claude.' },
      { step: 4, agent: 'Claude', action: 'Decomposes system into modular components.' },
      { step: 5, agent: 'Google Gemma 4', action: 'Reviews specification and schedules implementation.' }
    ]
  },
  {
    id: 'research',
    title: 'Documentation Grounding',
    shortBadge: 'Research',
    summary: 'Google Gemma 4 delegates external reference retrieval to Gemini Deep Research.',
    activeNodeIds: ['user', 'gemma', 'gemini'],
    activeConnectionIds: ['conn-user-gemma', 'conn-gemma-gemini'],
    pulseType: 'standard',
    narrativeSteps: [
      { step: 1, agent: 'Google Gemma 4', action: 'Identifies required external API documentation.' },
      { step: 2, agent: 'Gemini Deep Research', action: 'Retrieves current reference documentation.' },
      { step: 3, agent: 'Gemini Deep Research', action: 'Returns cited specifications and patterns.' },
      { step: 4, agent: 'Google Gemma 4', action: 'Incorporates documentation into execution plan.' }
    ]
  },
  {
    id: 'coding',
    title: 'Sandboxed Implementation',
    shortBadge: 'Coding',
    summary: 'Google Gemma 4 directs Antigravity to edit files and passes diffs to Graphify for local AST extraction.',
    activeNodeIds: ['user', 'gemma', 'antigravity', 'graphify'],
    activeConnectionIds: ['conn-user-gemma', 'conn-gemma-antigravity', 'conn-antigravity-graphify', 'conn-gemma-graphify'],
    pulseType: 'accent',
    narrativeSteps: [
      { step: 1, agent: 'Google Gemma 4', action: 'Transmits task contract to Antigravity runtime.' },
      { step: 2, agent: 'Antigravity', action: 'Applies code modifications in isolated workspace.' },
      { step: 3, agent: 'Graphify', action: 'Extracts syntax trees locally via tree-sitter into graphify-out/.' },
      { step: 4, agent: 'Antigravity', action: 'Executes test runner and validates build integrity.' },
      { step: 5, agent: 'Google Gemma 4', action: 'Reviews diff output before presenting changes.' }
    ]
  },
  {
    id: 'gate',
    title: 'Attention Gate Checkpoint',
    shortBadge: 'Safety Gate',
    summary: 'Google Gemma 4 detects a privileged operation and halts execution for operator review.',
    activeNodeIds: ['gemma', 'gate', 'user'],
    activeConnectionIds: ['conn-gemma-gate', 'conn-gate-user'],
    pulseType: 'warning',
    safetyNote:
      'Execution paused. Privileged system commands and credential requests require explicit operator confirmation.',
    narrativeSteps: [
      { step: 1, agent: 'Antigravity', action: 'Proposes privileged file or system modification.' },
      { step: 2, agent: 'Google Gemma 4', action: 'Identifies safety boundary crossing and routes call to Attention Gate.' },
      { step: 3, agent: 'Attention Gate', action: 'Halts execution loop and requests operator review.' },
      { step: 4, agent: 'Operator', action: 'Reviews proposed action and selects approval or session termination.' }
    ]
  }
];
