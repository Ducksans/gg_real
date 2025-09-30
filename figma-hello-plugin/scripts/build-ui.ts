// doc_refs: ["admin/plan/figmaplugin-refactor.md"]

import { build } from 'esbuild';
import { copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src', 'ui');
const distDir = path.join(rootDir, 'dist');

(async () => {
  try {
    mkdirSync(distDir, { recursive: true });

    await build({
      entryPoints: [path.join(srcDir, 'main.tsx')],
      bundle: true,
      format: 'iife',
      target: 'es2018',
      outdir: distDir,
      entryNames: 'ui',
      loader: {
        '.ts': 'ts',
        '.tsx': 'tsx',
        '.css': 'css',
      },
      jsx: 'automatic',
      jsxImportSource: 'preact',
      define: {
        global: 'window',
      },
      logLevel: 'info',
    });

    copyFileSync(path.join(srcDir, 'index.html'), path.join(distDir, 'ui.html'));
  } catch (error) {
    console.error('[build:ui] 번들 생성에 실패했습니다.', error);
    process.exit(1);
  }
})();
