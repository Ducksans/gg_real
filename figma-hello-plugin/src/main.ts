import { archetypeManifest } from './lib/archetype-manifest';
import { notifyError } from './lib/notifier';
import { runHelloFrame, runSchemaBatch, runSchemaFromString } from './runtime';
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
