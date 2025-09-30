export interface ExecutionResult {
  readonly createdNodes: SceneNode[];
  readonly executedSections: string[];
  readonly warnings: string[];
  readonly errors: string[];
}
