export function notifySuccess(message: string) {
  figma.notify(message, { timeout: 1500 });
}

export function notifyError(error: unknown, fallback = '오류가 발생했습니다.') {
  const detail = error instanceof Error ? error.message : String(error);
  console.error('[plugin:error]', detail);
  figma.notify(fallback, { error: true, timeout: 3000 });
}
