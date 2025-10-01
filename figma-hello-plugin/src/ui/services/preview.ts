import type { PreviewStore } from '../store/previewStore';

const postMessage = (type: string, payload: Record<string, unknown>) => {
  if (typeof window === 'undefined' || !window.parent) return;
  window.parent.postMessage(
    {
      pluginMessage: {
        type,
        ...payload,
      },
    },
    '*',
  );
};

export const createPreviewService = (previewStore: PreviewStore) => {
  return {
    focusFrame() {
      const frameName = previewStore.state.value.frameName;
      if (!frameName) return;
      postMessage('preview-focus-frame', { frameName });
    },
    highlightSection(sectionId: string) {
      if (!sectionId) return;
      postMessage('preview-highlight-section', { sectionId });
    },
    highlightSections(sectionIds: string[]) {
      if (!sectionIds.length) return;
      postMessage('preview-highlight-section', { sectionIds });
    },
  };
};
