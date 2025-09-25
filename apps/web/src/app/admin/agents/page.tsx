/**
 * file: apps/web/src/app/admin/agents/page.tsx
 * owner: duksan
 * created: 2025-09-25 12:46 UTC / 2025-09-25 21:46 KST
 * purpose: 에이전트/세션/폼 관리 대시보드를 위한 자리표시자 페이지
 */

export default function AgentsPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">에이전트 · 세션 · 폼 관리</h2>
        <p className="text-sm text-slate-600">
          로그인 에이전트, 세션 상태, 신청 폼 현황을 한 눈에 볼 수 있도록 설계 중입니다.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <PlaceholderCard
          title="에이전트 상태"
          description="활성/비활성 에이전트 목록과 최근 활동 로그"
        />
        <PlaceholderCard title="세션 통계" description="일일 로그인 수, Magic Link 발송 성공률" />
        <PlaceholderCard title="폼 제출 현황" description="주요 폼별 제출량과 검토 상태" />
        <PlaceholderCard title="운영 작업" description="승인/차단/재전송 등 빠른 액션 영역" />
      </div>
    </section>
  );
}

function PlaceholderCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
      <p className="font-medium text-slate-700">{title}</p>
      <p className="mt-1">{description}</p>
      <p className="mt-4 text-xs text-slate-400">UI 구성과 데이터 소스를 정의하는 단계입니다.</p>
    </div>
  );
}
