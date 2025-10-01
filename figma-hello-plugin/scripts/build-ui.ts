// doc_refs: ["admin/plan/figmapluginmake.md"]

import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
      target: 'es2017',
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

    const jsPath = path.join(distDir, 'ui.js');
    const cssPath = path.join(distDir, 'ui.css');
    const script = readFileSync(jsPath, 'utf8');
    let styles = '';
    try {
      styles = readFileSync(cssPath, 'utf8');
    } catch (readError) {
      styles = '';
    }

    const html = `<!doctype html>
<!-- doc_refs: ["admin/plan/figmapluginmake.md"] -->
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <title>GG Plugin UI</title>
    <style>${styles}</style>
  </head>
  <body>
    <div id="root"></div>
    <script>${script}\n//# sourceURL=ui.bundle.js</script>
  </body>
</html>`;

    writeFileSync(path.join(distDir, 'ui.html'), html, 'utf8');
  } catch (error) {
    console.error('[build:ui] 번들 생성에 실패했습니다.', error);
    process.exit(1);
  }
})();
