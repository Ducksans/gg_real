/**
 * file: lint-staged.config.cjs
 * owner: duksan
 * created: 2025-09-22 15:13 UTC / 2025-09-23 00:13 KST
 * updated: 2025-09-22 15:13 UTC / 2025-09-23 00:13 KST
 * description: 프리커밋 단계에서 코드 품질 검사를 실행하기 위한 lint-staged 설정
 * doc_refs: ["AGENTS.md", "basesettings.md", "admin/plan/m1-kickoff.md"]
 */
module.exports = {
  '*.{js,jsx,ts,tsx,cjs,mjs,json}': ['prettier --check'],
  '*.{js,jsx,ts,tsx,cjs,mjs}': ['eslint --max-warnings=0'],
  '*.{md,yaml,yml}': ['prettier --check'],
};
