/**
 * file: apps/web/src/app/global-error.tsx
 * owner: duksan
 * created: 2025-09-23 12:25 UTC / 2025-09-23 21:25 KST
 * updated: 2025-09-23 12:25 UTC / 2025-09-23 21:25 KST
 * purpose: Next.js 전역 오류 화면을 제공하고 Sentry/로깅과 함께 사용자 메시지를 보여준다
 * doc_refs: ["apps/web/README.md", "basesettings.md"]
 */

'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Next.js에서 전역 에러 로깅(서버/클라이언트 환경에 따라 Sentry가 후킹)
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="m-6 rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          <h2 className="mb-2 text-base font-semibold">문제가 발생했습니다</h2>
          <p className="mb-4">일시적인 오류일 수 있습니다. 다시 시도해 주세요.</p>
          <button
            className="rounded border border-red-300 bg-white px-3 py-1 font-medium text-red-700 hover:bg-red-100"
            onClick={() => reset()}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
