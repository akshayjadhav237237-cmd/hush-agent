import type { GraphTool, ArchitecturePrinciple } from './types';

export const GRAPH_TOOLS: readonly GraphTool[] = [
  {
    id: 'graph-build',
    name: 'graph_build',
    signature: 'graph_build() -> str',
    command: 'graphify extract . --code-only',
    description:
      'Extracts AST code structure, clusters communities, and exports graph.html.',
    details:
      'Runs Tree-sitter AST extraction across the workspace with graphify extract . --code-only and cluster-only . --no-label, then exports the interactive visualization.',
    category: 'pipeline',
    categoryLabel: 'Build Pipeline',
  },
  {
    id: 'graph-update',
    name: 'graph_update',
    signature: 'graph_update() -> str',
    command: 'graphify update .',
    description:
      'Refreshes graph after each build round (update . and export html). Includes a code-enforced gate alerting the human if GRAPH_REPORT.md is unchanged for two consecutive rounds.',
    details:
      'Recomputes AST deltas after edits with graphify update . and export html. Calculates SHA-256 hash of GRAPH_REPORT.md. If the report hash matches across two consecutive rounds, the orchestrator triggers an attention alert for stalled progress.',
    category: 'pipeline',
    categoryLabel: 'Build Pipeline',
  },
  {
    id: 'graph-report',
    name: 'graph_report',
    signature: 'graph_report() -> str',
    command: 'read graphify-out/GRAPH_REPORT.md',
    description:
      'Reads GRAPH_REPORT.md summarizing community clusters and central symbols.',
    details:
      'Loads the generated Markdown summary into Claude. Identifies structural hubs, file clusters, and graph diameter across build rounds.',
    category: 'inspection',
    categoryLabel: 'Structure Inspection',
  },
  {
    id: 'graph-query',
    name: 'graph_query',
    signature: 'graph_query(question: str) -> str',
    command: 'graphify query <question>',
    description:
      'Breadth-first search traversing the graph for a specific query about symbol dependencies.',
    details:
      'Performs structured graph traversal across nodes and edges to answer questions about imports, callers, and interface implementations.',
    category: 'traversal',
    categoryLabel: 'Graph Traversal',
  },
  {
    id: 'graph-explain',
    name: 'graph_explain',
    signature: 'graph_explain(symbol: str) -> str',
    command: 'graphify explain <symbol>',
    description:
      'Generates a plain-language explanation of a symbol and its immediate structural neighbors.',
    details:
      'Inspects declaration AST nodes and returns immediate incoming calls, outgoing references, and containing module boundaries.',
    category: 'inspection',
    categoryLabel: 'Structure Inspection',
  },
  {
    id: 'graph-path',
    name: 'graph_path',
    signature: 'graph_path(source: str, target: str) -> str',
    command: 'graphify path <source> <target>',
    description:
      'Finds the shortest structural connection path between two symbols in the code graph.',
    details:
      'Computes the minimum path between any two symbols. Returns the exact sequence of imports, calls, or declarations linking them.',
    category: 'traversal',
    categoryLabel: 'Graph Traversal',
  },
];

export const ARCHITECTURE_PRINCIPLES: readonly ArchitecturePrinciple[] = [
  {
    title: 'Local parsing',
    badge: 'Tree-sitter',
    description:
      'Tree-sitter runs on the local machine. Source code is not uploaded to external servers.',
    technicalDetail:
      'Syntactic analysis executes inside the local environment. Parsing and clustering operate entirely offline.',
  },
  {
    title: 'Filesystem output',
    badge: 'graphify-out/',
    description:
      'Artifacts written to graphify-out/ (graph.html, GRAPH_REPORT.md, graph.json).',
    technicalDetail:
      'All graph states persist as discrete filesystem files. The orchestrator reads reports and exports without maintaining daemon state.',
  },
  {
    title: 'Structural boundary',
    badge: 'AST Scope',
    description:
      'Graphify models code structure and topology. It does not validate application runtime correctness.',
    technicalDetail:
      'The graph documents symbols, calls, and dependencies. Execution validation remains the responsibility of tests and build compilers.',
  },
];
