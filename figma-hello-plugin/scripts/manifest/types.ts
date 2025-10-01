import type { BoxSpacing } from '../../src/lib/archetype-manifest';

export interface SlotDefinitionRaw {
  id: string;
  label?: string;
  parent?: string | null;
  layout?: 'VERTICAL' | 'HORIZONTAL';
  spacing?: number | null;
  padding?: Partial<BoxSpacing> | null;
  width?: number | 'hug' | 'fill';
  height?: number | 'hug';
  grow?: number | null;
  allowedSections?: string[];
}

export interface SurfaceFileRaw {
  id: string;
  label?: string;
  layout?: {
    width?: number;
    height?: number | null;
    padding?: Partial<BoxSpacing> | null;
    spacing?: number | null;
    background?: string | null;
  };
  slots?: SlotDefinitionRaw[];
  routes?: Record<
    string,
    {
      label?: string;
      slots?: Record<
        string,
        {
          label?: string;
          sections?: Array<{
            id: string;
            sectionId: string;
            order: number | null;
            label: string;
            description: string;
            raw: string;
            slot: string;
            slotLabel: string;
          }>;
        }
      >;
    }
  >;
  requiredSlots?: string[];
}

export interface RawSurfaceDefinition {
  id: string;
  label?: string;
  layout?: {
    width?: number;
    height?: number | null;
    padding?: Partial<BoxSpacing> | null;
    spacing?: number | null;
    background?: string | null;
  };
  slots?: Record<string, SlotDefinitionRaw>;
  routes?: Record<
    string,
    {
      label?: string;
      slots?: Record<
        string,
        {
          label?: string;
          sections?: Array<{
            id: string;
            sectionId: string;
            order: number | null;
            label: string;
            description: string;
            raw: string;
            slot: string;
            slotLabel: string;
          }>;
        }
      >;
    }
  >;
  requiredSlots?: string[];
}

export interface SectionFile {
  id: string;
  sectionId: string;
  order: number | null;
  label: string;
  description: string;
  raw: string;
  designSurface: string;
  designSurfaceLabel: string;
  route: string;
  routeLabel: string;
  slot: string;
  slotLabel: string;
}

export interface SectionFileRaw {
  meta?: {
    order?: number | null;
    section?: string;
    label?: string;
    description?: string;
    designSurface?: string;
    designSurfaceLabel?: string;
    route?: string;
    routeLabel?: string;
    slot?: string;
    slotLabel?: string;
  };
  [key: string]: unknown;
}

export interface ArchetypeManifestJson {
  generatedAt: string;
  surfaces: Record<string, RawSurfaceDefinition>;
  routes: Record<string, unknown>;
  pages: Record<string, unknown>;
}

export type SurfaceMap = Record<string, RawSurfaceDefinition>;

export interface PageSectionsResult {
  page: string;
  sections: SectionFile[];
}
