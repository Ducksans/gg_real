import { signal, type Signal } from '@preact/signals';
import { getRouteTree, type RouteInfo, type SurfaceRouteTree } from '../services/schema-builder';

export interface RouteState {
  readonly surfaces: SurfaceRouteTree[];
  readonly selectedSurfaceId?: string;
  readonly selectedRouteId?: string;
  readonly selectedSlotId?: string;
}

export interface RouteExpansionSnapshot {
  readonly routes: ReadonlyArray<{ surfaceId: string; routeId: string }>;
  readonly slots: ReadonlyArray<{ surfaceId: string; routeId: string; slotId: string }>;
}

export interface RouteSelectionSnapshot {
  readonly surfaceId?: string;
  readonly routeId?: string;
  readonly slotId?: string;
  readonly expanded?: RouteExpansionSnapshot;
}

export interface RouteStore {
  readonly state: Signal<RouteState>;
  readonly expandedRoutes: Signal<Record<string, boolean>>;
  readonly expandedSlots: Signal<Record<string, boolean>>;
  load: () => void;
  selectSurface: (surfaceId: string) => void;
  selectRoute: (surfaceId: string, routeId: string) => void;
  selectSlot: (surfaceId: string, routeId: string, slotId: string) => void;
  toggleRouteExpanded: (surfaceId: string, routeId: string) => void;
  toggleSlotExpanded: (surfaceId: string, routeId: string, slotId: string) => void;
  isRouteExpanded: (surfaceId: string, routeId: string) => boolean;
  isSlotExpanded: (surfaceId: string, routeId: string, slotId: string) => boolean;
  takeSnapshot: () => RouteSelectionSnapshot;
  restoreSnapshot: (snapshot: RouteSelectionSnapshot) => void;
}

const selectInitialRoute = (surface: SurfaceRouteTree | undefined): RouteInfo | undefined =>
  surface?.routes[0];

const selectInitialSlot = (route: RouteInfo | undefined): string | undefined => route?.slots[0]?.id;

const routeKey = (surfaceId: string, routeId: string) => `${surfaceId}::${routeId}`;
const slotKey = (surfaceId: string, routeId: string, slotId: string) =>
  `${surfaceId}::${routeId}::${slotId}`;

const parseRouteKey = (key: string): { surfaceId: string; routeId: string } | undefined => {
  const [surfaceId, routeId] = key.split('::');
  if (!surfaceId || !routeId) return undefined;
  return { surfaceId, routeId };
};

const parseSlotKey = (
  key: string,
): { surfaceId: string; routeId: string; slotId: string } | undefined => {
  const [surfaceId, routeId, slotId] = key.split('::');
  if (!surfaceId || !routeId || !slotId) return undefined;
  return { surfaceId, routeId, slotId };
};

const buildSurfaceIndex = (surfaces: SurfaceRouteTree[]) => {
  const routeKeys = new Set<string>();
  const slotKeys = new Set<string>();
  surfaces.forEach((surface) => {
    surface.routes.forEach((route) => {
      routeKeys.add(routeKey(surface.id, route.id));
      route.slots.forEach((slot) => {
        slotKeys.add(slotKey(surface.id, route.id, slot.id));
      });
    });
  });
  return { routeKeys, slotKeys };
};

export const createRouteStore = (): RouteStore => {
  const state = signal<RouteState>({ surfaces: [] });
  const expandedRoutes = signal<Record<string, boolean>>({});
  const expandedSlots = signal<Record<string, boolean>>({});

  const resolveSelection = (
    surfaces: SurfaceRouteTree[],
    surfaceId?: string,
    routeId?: string,
    slotId?: string,
  ) => {
    if (!surfaces.length) {
      return { surfaceId: undefined, routeId: undefined, slotId: undefined };
    }

    const surface = (surfaceId && surfaces.find((item) => item.id === surfaceId)) ?? surfaces[0];

    const route = surface.routes.length
      ? ((routeId && surface.routes.find((item) => item.id === routeId)) ??
        selectInitialRoute(surface))
      : undefined;

    const slot = route?.slots.length
      ? ((slotId && route.slots.find((item) => item.id === slotId)) ?? route.slots[0])
      : undefined;

    return {
      surfaceId: surface.id,
      routeId: route?.id,
      slotId: slot?.id,
    };
  };

  const setRouteExpanded = (surfaceId: string, routeId: string, expanded: boolean) => {
    const key = routeKey(surfaceId, routeId);
    if (expanded) {
      expandedRoutes.value = { ...expandedRoutes.value, [key]: true };
    } else {
      const next = { ...expandedRoutes.value };
      delete next[key];
      expandedRoutes.value = next;
    }
  };

  const setSlotExpanded = (
    surfaceId: string,
    routeId: string,
    slotId: string,
    expanded: boolean,
  ) => {
    const key = slotKey(surfaceId, routeId, slotId);
    if (expanded) {
      expandedSlots.value = { ...expandedSlots.value, [key]: true };
    } else {
      const next = { ...expandedSlots.value };
      delete next[key];
      expandedSlots.value = next;
    }
  };

  const pruneExpansions = (surfaces: SurfaceRouteTree[]) => {
    if (!surfaces.length) {
      expandedRoutes.value = {};
      expandedSlots.value = {};
      return;
    }
    const { routeKeys, slotKeys } = buildSurfaceIndex(surfaces);
    const nextRoutes: Record<string, boolean> = {};
    const nextSlots: Record<string, boolean> = {};
    Object.entries(expandedRoutes.value).forEach(([key, value]) => {
      if (value && routeKeys.has(key)) {
        nextRoutes[key] = true;
      }
    });
    Object.entries(expandedSlots.value).forEach(([key, value]) => {
      if (value && slotKeys.has(key)) {
        nextSlots[key] = true;
      }
    });
    expandedRoutes.value = nextRoutes;
    expandedSlots.value = nextSlots;
  };

  const load = () => {
    const surfaces = getRouteTree();
    const selection = resolveSelection(
      surfaces,
      state.value.selectedSurfaceId,
      state.value.selectedRouteId,
      state.value.selectedSlotId,
    );

    state.value = {
      surfaces,
      selectedSurfaceId: selection.surfaceId,
      selectedRouteId: selection.routeId,
      selectedSlotId: selection.slotId,
    };

    pruneExpansions(surfaces);

    if (selection.surfaceId && selection.routeId) {
      setRouteExpanded(selection.surfaceId, selection.routeId, true);
      if (selection.slotId) {
        setSlotExpanded(selection.surfaceId, selection.routeId, selection.slotId, true);
      }
    }
  };

  const selectSurface = (surfaceId: string) => {
    const surfaces = state.value.surfaces;
    const surface = surfaces.find((item) => item.id === surfaceId);
    if (!surface) return;
    const route = selectInitialRoute(surface);
    state.value = {
      surfaces,
      selectedSurfaceId: surfaceId,
      selectedRouteId: route?.id,
      selectedSlotId: selectInitialSlot(route),
    };
    if (route?.id) {
      setRouteExpanded(surfaceId, route.id, true);
      const defaultSlot = selectInitialSlot(route);
      if (defaultSlot) {
        setSlotExpanded(surfaceId, route.id, defaultSlot, true);
      }
    }
  };

  const selectRoute = (surfaceId: string, routeId: string) => {
    const surfaces = state.value.surfaces;
    const surface = surfaces.find((item) => item.id === surfaceId);
    if (!surface) return;
    const route = surface.routes.find((item) => item.id === routeId);
    if (!route) return;
    state.value = {
      surfaces,
      selectedSurfaceId: surfaceId,
      selectedRouteId: routeId,
      selectedSlotId: selectInitialSlot(route),
    };
    setRouteExpanded(surfaceId, routeId, true);
    const initialSlot = selectInitialSlot(route);
    if (initialSlot) {
      setSlotExpanded(surfaceId, routeId, initialSlot, true);
    }
  };

  const selectSlot = (surfaceId: string, routeId: string, slotId: string) => {
    const surfaces = state.value.surfaces;
    const surface = surfaces.find((item) => item.id === surfaceId);
    if (!surface) return;
    const route = surface.routes.find((item) => item.id === routeId);
    if (!route) return;
    const slotExists = route.slots.some((slot) => slot.id === slotId);
    if (!slotExists) return;
    state.value = {
      surfaces,
      selectedSurfaceId: surfaceId,
      selectedRouteId: routeId,
      selectedSlotId: slotId,
    };
    setRouteExpanded(surfaceId, routeId, true);
    setSlotExpanded(surfaceId, routeId, slotId, true);
  };

  const takeSnapshot = (): RouteSelectionSnapshot => {
    const expandedRouteEntries = Object.entries(expandedRoutes.value)
      .filter(([, expanded]) => Boolean(expanded))
      .map(([key]) => parseRouteKey(key))
      .filter((entry): entry is { surfaceId: string; routeId: string } => Boolean(entry));

    const expandedSlotEntries = Object.entries(expandedSlots.value)
      .filter(([, expanded]) => Boolean(expanded))
      .map(([key]) => parseSlotKey(key))
      .filter((entry): entry is { surfaceId: string; routeId: string; slotId: string } =>
        Boolean(entry),
      );

    return {
      surfaceId: state.value.selectedSurfaceId,
      routeId: state.value.selectedRouteId,
      slotId: state.value.selectedSlotId,
      expanded: {
        routes: expandedRouteEntries,
        slots: expandedSlotEntries,
      },
    } satisfies RouteSelectionSnapshot;
  };

  const restoreSnapshot = (snapshot: RouteSelectionSnapshot) => {
    const surfaces = state.value.surfaces;
    if (!surfaces.length) {
      return;
    }

    const selection = resolveSelection(
      surfaces,
      snapshot.surfaceId ?? state.value.selectedSurfaceId,
      snapshot.routeId ?? state.value.selectedRouteId,
      snapshot.slotId ?? state.value.selectedSlotId,
    );

    state.value = {
      surfaces,
      selectedSurfaceId: selection.surfaceId,
      selectedRouteId: selection.routeId,
      selectedSlotId: selection.slotId,
    };

    const nextRouteExpansions: Record<string, boolean> = {};
    const nextSlotExpansions: Record<string, boolean> = {};
    const { routeKeys, slotKeys } = buildSurfaceIndex(surfaces);

    (snapshot.expanded?.routes ?? []).forEach(({ surfaceId, routeId }) => {
      const key = routeKey(surfaceId, routeId);
      if (routeKeys.has(key)) {
        nextRouteExpansions[key] = true;
      }
    });

    (snapshot.expanded?.slots ?? []).forEach(({ surfaceId, routeId, slotId }) => {
      const key = slotKey(surfaceId, routeId, slotId);
      if (slotKeys.has(key)) {
        nextSlotExpansions[key] = true;
      }
    });

    expandedRoutes.value = nextRouteExpansions;
    expandedSlots.value = nextSlotExpansions;

    if (selection.surfaceId && selection.routeId) {
      setRouteExpanded(selection.surfaceId, selection.routeId, true);
      if (selection.slotId) {
        setSlotExpanded(selection.surfaceId, selection.routeId, selection.slotId, true);
      }
    }
  };

  return {
    state,
    expandedRoutes,
    expandedSlots,
    load,
    selectSurface,
    selectRoute,
    selectSlot,
    toggleRouteExpanded(surfaceId, routeId) {
      const key = routeKey(surfaceId, routeId);
      const current = expandedRoutes.value[key] ?? false;
      setRouteExpanded(surfaceId, routeId, !current);
    },
    toggleSlotExpanded(surfaceId, routeId, slotId) {
      const key = slotKey(surfaceId, routeId, slotId);
      const current = expandedSlots.value[key] ?? false;
      setSlotExpanded(surfaceId, routeId, slotId, !current);
    },
    isRouteExpanded(surfaceId, routeId) {
      return expandedRoutes.value[routeKey(surfaceId, routeId)] ?? false;
    },
    isSlotExpanded(surfaceId, routeId, slotId) {
      return expandedSlots.value[slotKey(surfaceId, routeId, slotId)] ?? false;
    },
    takeSnapshot,
    restoreSnapshot,
  };
};
