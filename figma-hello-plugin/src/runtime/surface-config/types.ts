import type { BoxSpacing } from '../../lib/archetype-manifest';

export interface SurfaceSlotConfig {
  readonly id: string;
  readonly label: string;
  readonly parent: string | null;
  readonly layout?: 'VERTICAL' | 'HORIZONTAL';
  readonly spacing?: number;
  readonly padding: BoxSpacing;
  readonly width?: number | 'hug' | 'fill';
  readonly height?: number | 'hug';
  readonly grow?: number;
  readonly allowedSections: string[];
}

export interface SurfaceRouteSlotSummary {
  readonly label: string;
  readonly sections: Array<{
    readonly id: string;
    readonly sectionId: string;
    readonly order: number | null;
    readonly label: string;
    readonly description: string;
    readonly raw: string;
    readonly slot: string;
    readonly slotLabel: string;
  }>;
}

export interface SurfaceRouteSummary {
  readonly label: string;
  readonly slots: Record<string, SurfaceRouteSlotSummary>;
}

export interface SurfaceConfig {
  readonly id: string;
  readonly label: string;
  readonly width: number;
  readonly height: number | null;
  readonly padding: BoxSpacing;
  readonly spacing: number;
  readonly background: string | null;
  readonly slots: Record<string, SurfaceSlotConfig>;
  readonly routes: Record<string, SurfaceRouteSummary>;
  readonly requiredSlots: string[];
}

export interface SurfaceRegistry {
  readonly byId: Record<string, SurfaceConfig>;
  readonly defaultSurfaceId: string;
}
