import { archetypeManifest } from './lib/archetype-manifest';
import { notifyError } from './lib/notifier';
import { runHelloFrame, runSchemaBatch, runSchemaFromString } from './runtime';
import { normalizeSlotName, PLUGINDATA_KEYS } from './runtime/utils';
import { glossaryLayoutSample } from './samples/glossary';

const UI_WIDTH = 960;
const UI_HEIGHT = 700;

figma.on('run', () => {
  figma.showUI(__html__, { width: UI_WIDTH, height: UI_HEIGHT });
  figma.ui.postMessage({
    type: 'init',
    payload: {
      sample: JSON.stringify(createSampleForCurrentPage(), null, 2),
      pages: listPageNames(),
      currentPage: figma.currentPage.name,
      manifest: archetypeManifest,
    },
  });

  figma.ui.onmessage = async (message) => {
    if (!message) return;

    try {
      switch (message.type) {
        case 'execute-schema': {
          const payload = message.payload;
          if (payload && typeof payload === 'object' && Array.isArray(payload.documents)) {
            await runSchemaBatch(payload.documents, {
              targetPage: message.targetPage ?? payload.targetPage,
              targetMode: message.targetMode ?? payload.targetMode,
              intent: message.intent ?? payload.intent,
            });
          } else {
            await runSchemaFromString((payload as string) ?? '', {
              targetPage: message.targetPage,
              targetMode: message.targetMode ?? payload?.targetMode,
            });
          }
          break;
        }
        case 'request-sample': {
          figma.ui.postMessage({
            type: 'load-sample',
            payload: {
              sample: JSON.stringify(createSampleForCurrentPage(), null, 2),
              pages: listPageNames(),
              currentPage: figma.currentPage.name,
              manifest: archetypeManifest,
            },
          });
          break;
        }
        case 'create-hello': {
          await runHelloFrame();
          break;
        }
        case 'close-plugin': {
          figma.closePlugin();
          break;
        }
        case 'preview-focus-frame': {
          focusFrameByName(message.frameName);
          break;
        }
        case 'preview-highlight-section': {
          const sections: string[] = Array.isArray(message.sectionIds)
            ? message.sectionIds
            : message.sectionId
              ? [message.sectionId]
              : Array.isArray(message.sections)
                ? message.sections
                : [];
          highlightSections(sections);
          break;
        }
        default:
          figma.notify('Unknown action received.');
      }
    } catch (error) {
      notifyError(error, '실행 중 오류가 발생했습니다. 콘솔을 확인해 주세요.');
    }
  };
});

function createSampleForCurrentPage() {
  const cloned = JSON.parse(JSON.stringify(glossaryLayoutSample));
  if (!cloned.target) {
    cloned.target = { frameName: 'GeneratedFrame', mode: 'append' };
  }
  cloned.target.page = figma.currentPage.name;
  return cloned;
}

function listPageNames() {
  return figma.root.children
    .filter((node): node is PageNode => node.type === 'PAGE')
    .map((page) => page.name);
}

function focusFrameByName(frameName?: string) {
  if (!frameName) {
    figma.notify('포커스할 프레임 이름이 없습니다.');
    return;
  }
  const frame = figma.currentPage.findOne(
    (node): node is FrameNode => node.type === 'FRAME' && node.name === frameName,
  );
  if (!frame) {
    figma.notify(`프레임 "${frameName}"을 찾을 수 없습니다.`);
    return;
  }
  figma.currentPage.selection = [frame];
  figma.viewport.scrollAndZoomIntoView([frame]);
}

function highlightSections(sectionIds: string[]) {
  if (!sectionIds.length) {
    figma.notify('하이라이트할 섹션이 없습니다.');
    return;
  }
  const normalized = sectionIds
    .map((id) => normalizeSlotName(id))
    .filter((id): id is string => Boolean(id));
  if (!normalized.length) {
    figma.notify('유효한 섹션 식별자가 없습니다.');
    return;
  }
  const nodes = figma.currentPage.findAll((node) => {
    if ('getPluginData' in node) {
      const slotId = node.getPluginData(PLUGINDATA_KEYS.slotId);
      return normalized.includes(slotId);
    }
    return false;
  });
  if (!nodes.length) {
    figma.notify('선택할 섹션 노드를 찾지 못했습니다.');
    return;
  }
  figma.currentPage.selection = nodes;
  figma.viewport.scrollAndZoomIntoView(nodes);
}
