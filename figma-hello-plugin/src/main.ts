import { bootstrap } from './controller';

figma.on('run', () => {
  bootstrap();
});

figma.ui?.onmessage = (message) => {
  if (message?.type === 'execute-schema') {
    // TODO: schema 실행 로직 연결
    figma.notify('Schema execution is not implemented yet.');
  }
};
