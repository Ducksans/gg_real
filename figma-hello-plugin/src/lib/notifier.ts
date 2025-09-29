export function notifySuccess(message: string) {
  figma.notify(message, { timeout: 1500 });
  postMessageToUI({ type: 'dry-run-success', message });
}

export function notifyError(error: unknown, fallback = '오류가 발생했습니다.') {
  const detail = error instanceof Error ? error.message : String(error);
  console.error('[plugin:error]', detail);
  figma.notify(fallback, { error: true, timeout: 5000 });
  postMessageToUI({ type: 'dry-run-error', message: detail });
}

export function notifyWarning(message: string) {
  figma.notify(`경고: ${message}`, { timeout: 4000 });
  postMessageToUI({ type: 'dry-run-warning', message });
}

export function sendDryRunResult(payload: unknown) {
  postMessageToUI({ type: 'dry-run-result', payload });
}

function postMessageToUI(payload: unknown) {
  try {
    figma.ui.postMessage(payload);
  } catch (error) {
    console.error('[plugin:error] UI postMessage 실패', error);
  }
}
