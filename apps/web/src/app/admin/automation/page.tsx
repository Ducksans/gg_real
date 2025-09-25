/**
 * file: apps/web/src/app/admin/automation/page.tsx
 * owner: duksan
 * created: 2025-09-25 12:47 UTC / 2025-09-25 21:47 KST
 * purpose: 컨텐츠 자동화 관리 화면 자리표시자
 */

export default function AutomationPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">컨텐츠 자동화</h2>
        <p className="text-sm text-slate-600">
          AI 작성, 예약 발행, 멀티 채널 배포를 관리할 수 있는 대시보드를 설계할 예정입니다.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        <p className="font-medium text-slate-700">자동화 시나리오</p>
        <p className="mt-1">
          자동화 플로우와 연결될 데이터 소스, 승인 조건을 정의한 뒤 이 화면에서 활성화할 수 있도록
          할 계획입니다.
        </p>
      </div>
    </section>
  );
}
