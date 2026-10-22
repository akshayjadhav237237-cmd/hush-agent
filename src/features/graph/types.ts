export type ToolCategory = 'pipeline' | 'inspection' | 'traversal';

export interface GraphTool {
  readonly id: string;
  readonly name: string;
  readonly signature: string;
  readonly command: string;
  readonly description: string;
  readonly details: string;
  readonly category: ToolCategory;
  readonly categoryLabel: string;
}

export interface ArchitecturePrinciple {
  readonly title: string;
  readonly badge: string;
  readonly description: string;
  readonly technicalDetail: string;
}

export type VisualizerStatus =
  | 'checking'
  | 'available'
  | 'missing'
  | 'external_blocked';
