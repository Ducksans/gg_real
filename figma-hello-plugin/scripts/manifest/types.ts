import type { BoxSpacing } from '../../src/lib/archetype-manifest';

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
  slots?: Record<
    string,
    {
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
  >;
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

export interface ArchetypeManifestJson {
  generatedAt: string;
  surfaces: Record<string, RawSurfaceDefinition>;
  routes: Record<string, unknown>;
  pages: Record<string, unknown>;
}
