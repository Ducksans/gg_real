/**
 * file: eslint.config.js
 * owner: duksan
 * created: 2025-09-22 15:13 UTC / 2025-09-23 00:13 KST
 * updated: 2025-09-30 10:01 UTC / 2025-09-30 19:01 KST
 * description: 모노레포 전역 ESLint 기본 설정(표준 규칙)
 * doc_refs: ["basesettings.md", "admin/plan/m1-kickoff.md"]
 */
import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';

const figmaPluginFiles = [
  'figma-hello-plugin/src/runtime/**/*.{ts,tsx}',
  'figma-hello-plugin/src/schema/**/*.{ts,tsx}',
  'figma-hello-plugin/src/token/**/*.{ts,tsx}',
  'figma-hello-plugin/src/notifier/**/*.{ts,tsx}',
  'figma-hello-plugin/src/ui/**/*.{ts,tsx}',
];

const boundaryElements = [
  { type: 'runtime-root', pattern: 'figma-hello-plugin/src/runtime/index.ts' },
  { type: 'runtime-surface-config', pattern: 'figma-hello-plugin/src/runtime/surface-config/**' },
  { type: 'runtime-slot-manager', pattern: 'figma-hello-plugin/src/runtime/slot-manager/**' },
  { type: 'runtime-guardrails', pattern: 'figma-hello-plugin/src/runtime/guardrails/**' },
  { type: 'runtime-executor', pattern: 'figma-hello-plugin/src/runtime/executor/**' },
  { type: 'runtime-io-channel', pattern: 'figma-hello-plugin/src/runtime/io-channel/**' },
  { type: 'runtime-utils', pattern: 'figma-hello-plugin/src/runtime/utils/**' },
  { type: 'runtime-instrumentation', pattern: 'figma-hello-plugin/src/runtime/instrumentation/**' },
  { type: 'runtime-diagnostics', pattern: 'figma-hello-plugin/src/runtime/diagnostics/**' },
  { type: 'schema', pattern: 'figma-hello-plugin/src/schema/**' },
  { type: 'token', pattern: 'figma-hello-plugin/src/token/**' },
  { type: 'notifier', pattern: 'figma-hello-plugin/src/notifier/**' },
  { type: 'ui-root', pattern: 'figma-hello-plugin/src/ui/index.ts' },
  { type: 'ui-store', pattern: 'figma-hello-plugin/src/ui/store/**' },
  { type: 'ui-services', pattern: 'figma-hello-plugin/src/ui/services/**' },
  { type: 'ui-components', pattern: 'figma-hello-plugin/src/ui/components/**' },
  { type: 'ui-selectors', pattern: 'figma-hello-plugin/src/ui/store/selectors/**' },
  { type: 'ui-history', pattern: 'figma-hello-plugin/src/ui/history/**' },
  { type: 'ui-services-steps', pattern: 'figma-hello-plugin/src/ui/services/steps/**' },
  { type: 'ui-services-facade', pattern: 'figma-hello-plugin/src/ui/services/facade/**' },
];

const boundaryRules = [
  {
    from: ['runtime-root'],
    allow: [
      'runtime-root',
      'runtime-surface-config',
      'runtime-slot-manager',
      'runtime-guardrails',
      'runtime-executor',
      'runtime-io-channel',
      'runtime-utils',
      'schema',
      'token',
      'notifier',
    ],
  },
  {
    from: ['runtime-surface-config'],
    allow: ['runtime-surface-config', 'runtime-utils', 'schema', 'token'],
  },
  {
    from: ['runtime-slot-manager'],
    allow: [
      'runtime-slot-manager',
      'runtime-utils',
      'runtime-instrumentation',
      'runtime-diagnostics',
      'schema',
      'token',
      'notifier',
    ],
  },
  {
    from: ['runtime-guardrails'],
    allow: [
      'runtime-guardrails',
      'runtime-utils',
      'runtime-instrumentation',
      'runtime-diagnostics',
      'schema',
      'token',
    ],
  },
  {
    from: ['runtime-executor'],
    allow: [
      'runtime-executor',
      'runtime-utils',
      'runtime-instrumentation',
      'runtime-diagnostics',
      'runtime-surface-config',
      'runtime-slot-manager',
      'runtime-guardrails',
      'runtime-io-channel',
      'schema',
      'token',
      'notifier',
    ],
  },
  {
    from: ['runtime-io-channel'],
    allow: ['runtime-io-channel', 'runtime-utils', 'runtime-instrumentation'],
  },
  { from: ['runtime-utils'], allow: ['runtime-utils', 'schema', 'token'] },
  { from: ['runtime-instrumentation'], allow: ['runtime-instrumentation', 'runtime-utils'] },
  { from: ['runtime-diagnostics'], allow: ['runtime-diagnostics', 'runtime-utils'] },
  { from: ['schema'], allow: ['schema', 'token'] },
  { from: ['token'], allow: ['token'] },
  { from: ['notifier'], allow: ['notifier', 'runtime-utils'] },
  {
    from: ['ui-root'],
    allow: [
      'ui-root',
      'ui-store',
      'ui-selectors',
      'ui-history',
      'ui-services',
      'ui-services-facade',
      'ui-components',
      'schema',
      'token',
      'notifier',
      'runtime-io-channel',
    ],
  },
  { from: ['ui-store'], allow: ['ui-store', 'schema'] },
  { from: ['ui-selectors'], allow: ['ui-selectors', 'ui-store'] },
  { from: ['ui-history'], allow: ['ui-history', 'ui-store'] },
  {
    from: ['ui-services'],
    allow: [
      'ui-services',
      'ui-store',
      'ui-services-steps',
      'schema',
      'token',
      'notifier',
      'runtime-io-channel',
    ],
  },
  { from: ['ui-services-steps'], allow: ['ui-services-steps', 'ui-store'] },
  { from: ['ui-services-facade'], allow: ['ui-services-facade', 'ui-services'] },
  { from: ['ui-components'], allow: ['ui-components', 'ui-services', 'ui-store', 'ui-selectors'] },
];

export default [
  {
    name: 'gg-real/ignores',
    ignores: ['**/node_modules/**', '**/.turbo/**', '**/dist/**', '**/build/**', '**/coverage/**'],
  },
  {
    ...js.configs.recommended,
    files: ['**/*.{js,jsx,ts,tsx,cjs,mjs}'],
  },
  {
    name: 'gg-real/figma-plugin-boundaries',
    files: figmaPluginFiles,
    plugins: { boundaries },
    settings: {
      'boundaries/elements': boundaryElements,
      'boundaries/ignore': ['**/*.test.ts', '**/*.test.tsx'],
    },
    rules: {
      'boundaries/element-types': ['error', { default: 'disallow', rules: boundaryRules }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../*', '../../*', '../../../*'],
              message:
                '상위 디렉터리로 이동하는 상대 경로 대신 TS 경로 별칭(@runtime/*, @ui/* 등)을 사용하세요.',
            },
          ],
        },
      ],
    },
  },
];
