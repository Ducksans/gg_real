import { notifyError } from './lib/notifier';
import { runHelloFrame, runSchemaFromString, SAMPLE_SCHEMA } from './runtime';

const UI_WIDTH = 380;
const UI_HEIGHT = 420;

figma.on('run', () => {
  figma.showUI(__html__, { width: UI_WIDTH, height: UI_HEIGHT });
  figma.ui.postMessage({
    type: 'load-sample',
    payload: JSON.stringify(createSampleForCurrentPage(), null, 2),
  });

  figma.ui.onmessage = async (message) => {
    if (!message) return;

    try {
      switch (message.type) {
        case 'execute-schema': {
          await runSchemaFromString(message.payload ?? '');
          break;
        }
        case 'request-sample': {
          figma.ui.postMessage({
            type: 'load-sample',
            payload: JSON.stringify(createSampleForCurrentPage(), null, 2),
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
  const cloned = JSON.parse(JSON.stringify(SAMPLE_SCHEMA));
  if (!cloned.target) {
    cloned.target = { frameName: 'GeneratedFrame', mode: 'append' };
  }
  cloned.target.page = figma.currentPage.name;
  return cloned;
}
