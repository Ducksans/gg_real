/**
 * file: apps/web/src/app/admin/workflows/page.tsx
 * owner: duksan
 * created: 2025-09-25 12:47 UTC / 2025-09-25 21:47 KST
 * purpose: 워크플로우·임성·관리 화면 자리표시자
 */

export default function WorkflowsPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">워크플로우 · 임성 · 관리</h2>
        <p className="text-sm text-slate-600">
          자동화 파이프라인과 승인 흐름을 정의할 수 있는 플로우 빌더 UI를 구상 중입니다.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        <p className="font-medium text-slate-700">플로우 편집기 예정</p>
        <p className="mt-1">
          업무 단계 템플릿, 상태 전이 규칙, 알림 조건 등을 설정할 수 있도록 설계할 계획입니다.
          필요한 기능을 문서에 기록해 주세요.
        </p>
      </div>
    </section>
  );
}
