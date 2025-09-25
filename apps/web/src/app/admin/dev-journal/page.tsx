/**
 * file: apps/web/src/app/admin/dev-journal/page.tsx
 * owner: duksan
 * created: 2025-09-25 12:46 UTC / 2025-09-25 21:46 KST
 * purpose: 사이트 개발 중 기술 일지를 모아볼 수 있는 자리표시자 페이지
 */

export default function DevJournalPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">사이트 개발 중 기술일지</h2>
        <p className="text-sm text-slate-600">
          릴리즈 노트, 결정 기록(ADR), 회의 메모 등을 모으는 공간입니다. 추후 문서 편집과 태깅
          기능이 추가될 예정입니다.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
        <p className="font-medium text-slate-700">준비 중입니다</p>
        <p className="mt-1">
          개발 일지를 업로드하고 검색·필터링할 수 있는 UI를 설계하는 단계입니다. 필요한 메타데이터나
          편집 흐름에 대한 의견이 있다면 문서에 기록해 주세요.
        </p>
      </div>
    </section>
  );
}
