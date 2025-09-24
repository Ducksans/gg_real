/**
 * file: apps/web/src/app/admin/wiki/editable-docs.ts
 * owner: duksan
 * created: 2025-09-24 08:22 UTC / 2025-09-24 17:22 KST
 * updated: 2025-09-24 08:22 UTC / 2025-09-24 17:22 KST
 * purpose: 위키 편집 UI에서 선택 가능한 문서 목록을 정의
 * doc_refs: ["apps/web/src/app/admin/wiki/actions.ts", "apps/web/src/app/admin/wiki/document-editor.tsx", "basesettings.md"]
 */

export type EditableDocOption = {
  path: string;
  label: string;
};

export const editableDocs: EditableDocOption[] = [
  {
    path: 'admin/data/README.md',
    label: '샘플 데이터 안내',
  },
  {
    path: 'admin/runbooks/editing.md',
    label: '문서 편집/PR 런북',
  },
  {
    path: 'admin/plan/m1-kickoff.md',
    label: '관리자 페이지 MVP 착수 계획',
  },
  {
    path: 'AGENTS.md',
    label: '에이전트 운영 규칙',
  },
  {
    path: 'basesettings.md',
    label: '관리자 베이스 설정 계획',
  },
];
