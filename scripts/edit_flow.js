#!/usr/bin/env node
/* eslint-env node */
/* global require, process */
// file: scripts/edit_flow.js
// owner: duksan
// created: 2025-09-24 07:55 UTC / 2025-09-24 16:55 KST
// updated: 2025-09-24 07:55 UTC / 2025-09-24 16:55 KST
// purpose: 문서 편집 플로우 지원 — 브랜치 생성, frontmatter 갱신, 검증 자동화
// doc_refs: ["basesettings.md", "admin/runbooks/editing.md", "scripts/update_frontmatter_time.js"]

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);

function printUsage() {
  console.log(
    `Usage: pnpm edit:start <doc-path> [--branch name] [--dry-run]\n       pnpm edit:prepare <doc-path> [--skip-checks] [--dry-run]`,
  );
}

if (args.length === 0) {
  printUsage();
  process.exit(1);
}

let mode = null;
let docPath = null;
let branchName = null;
let skipChecks = false;
let dryRun = false;

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (!mode) {
    if (arg === 'start' || arg === 'prepare') {
      mode = arg;
      continue;
    }
    mode = 'start';
  }

  if (!docPath && arg !== '--branch' && arg !== '--skip-checks' && arg !== '--dry-run') {
    docPath = arg;
    continue;
  }

  if (arg === '--branch') {
    branchName = args[i + 1];
    i += 1;
    continue;
  }

  if (arg === '--skip-checks') {
    skipChecks = true;
    continue;
  }

  if (arg === '--dry-run') {
    dryRun = true;
    continue;
  }
}

if (!mode) mode = 'start';
if (!docPath) {
  console.error('[ERR] 문서 경로를 지정하세요');
  printUsage();
  process.exit(1);
}

const repoRoot = run('git', ['rev-parse', '--show-toplevel']).trim();
process.chdir(repoRoot);

const targetAbsolute = path.resolve(docPath);
if (!fs.existsSync(targetAbsolute)) {
  console.error(`[ERR] 파일을 찾을 수 없습니다: ${docPath}`);
  process.exit(1);
}
if (!targetAbsolute.endsWith('.md')) {
  console.error('[ERR] Markdown(.md) 파일만 지원합니다.');
  process.exit(1);
}

if (mode === 'start') {
  startFlow();
} else {
  prepareFlow();
}

function startFlow() {
  if (!dryRun && !isTreeClean()) {
    console.error('[ERR] 작업 트리가 깨끗해야 합니다. 변경 사항을 커밋하거나 스태시하세요.');
    process.exit(1);
  }
  const generatedBranch = branchName || buildBranchName(docPath);
  console.log(`⚙️  편집 브랜치 생성: ${generatedBranch}`);
  if (!dryRun) {
    run('git', ['switch', '-c', generatedBranch], true);
  }
  console.log('📄 편집 대상:', docPath);
  console.log('📝 다음 단계를 진행하세요:');
  console.log('  1. 원하는 편집을 수행합니다.');
  console.log(
    `  2. 편집이 끝나면 \`pnpm edit:prepare ${docPath}\`을 실행해 메타 갱신과 검증을 수행합니다.`,
  );
}

function prepareFlow() {
  console.log(`🔁 frontmatter updated 갱신: ${docPath}`);
  if (!dryRun) {
    run('node', ['scripts/update_frontmatter_time.js', docPath], true);
  }
  if (!skipChecks) {
    console.log('✅ 검증 실행 (validate:docs, validate:refs)');
    if (!dryRun) {
      run('pnpm', ['run', 'validate:docs'], true);
      run('pnpm', ['run', 'validate:refs'], true);
    }
  }
  console.log('📌 추천 후속 작업:');
  console.log('  - `git status`로 변경 사항 확인');
  console.log('  - `git add` 및 `git commit` 실행');
  console.log('  - 필요시 `scripts/checkpoint.sh`로 체크포인트 생성');
  console.log('  - `pnpm edit:prepare` 실행 후 PR 생성 스크립트(추후 추가 예정)를 활용');
}

function isTreeClean() {
  const status = run('git', ['status', '--porcelain']);
  return status.trim().length === 0;
}

function buildBranchName(file) {
  const base = path.basename(file, path.extname(file));
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const stamp = buildTimestampStamp();
  return `edit/${slug || 'doc'}-${stamp}`;
}

function buildTimestampStamp() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  return `${year}${month}${day}-${hours}${minutes}`;
}

function run(cmd, cmdArgs, inheritStdout = false) {
  const result = spawnSync(cmd, cmdArgs, {
    stdio: inheritStdout ? 'inherit' : 'pipe',
    encoding: 'utf8',
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    if (!inheritStdout) {
      process.stderr.write(result.stderr || '');
    }
    console.error(`[ERR] ${cmd} ${cmdArgs.join(' ')} 실행 실패 (exit ${result.status})`);
    process.exit(result.status);
  }
  return inheritStdout ? '' : (result.stdout || '').toString();
}
