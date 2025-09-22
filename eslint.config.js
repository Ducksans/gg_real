/**
 * file: eslint.config.js
 * owner: duksan
 * created: 2025-09-22 15:13 UTC / 2025-09-23 00:13 KST
 * updated: 2025-09-22 15:29 UTC / 2025-09-23 00:29 KST
 * description: 모노레포 전역 ESLint 기본 설정(표준 규칙)
 * doc_refs: ["basesettings.md", "admin/plan/m1-kickoff.md"]
 */
import js from '@eslint/js';

export default [
  {
    name: 'gg-real/ignores',
    ignores: ['**/node_modules/**', '**/.turbo/**', '**/dist/**', '**/build/**', '**/coverage/**'],
  },
  {
    ...js.configs.recommended,
    files: ['**/*.{js,jsx,ts,tsx,cjs,mjs}'],
  },
];
