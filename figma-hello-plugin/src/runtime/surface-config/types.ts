export interface SurfaceSlotConfig {
  readonly id: string;
}

export interface SurfaceConfig {
  readonly id: string;
  readonly slots: SurfaceSlotConfig[];
}
