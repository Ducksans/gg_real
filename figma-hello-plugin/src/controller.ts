import { createHelloFrame } from './lib/hello';
import { notifyError, notifySuccess } from './lib/notifier';

export async function runHelloDemo() {
  const frame = await createHelloFrame();
  notifySuccess(`프레임 '${frame.name}' 생성 완료`);
}

export async function bootstrap() {
  try {
    await runHelloDemo();
  } catch (error) {
    notifyError(error);
  } finally {
    figma.closePlugin();
  }
}
