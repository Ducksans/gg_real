export interface SlotExecutionReport {
  readonly createdNodes: SceneNode[];
  readonly executedSections: string[];
  readonly warnings: string[];
}

export const buildSlotReport = (
  createdNodes: SceneNode[],
  executedSections: string[],
  warnings: string[] = [],
): SlotExecutionReport => ({ createdNodes, executedSections, warnings });
