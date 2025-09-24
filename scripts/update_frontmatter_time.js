#!/usr/bin/env node
/* eslint-env node */
/* global require, process, console */
// file: scripts/update_frontmatter_time.js
// owner: duksan
// created: 2025-09-22 17:35 UTC / 2025-09-23 02:35 KST
// updated: 2025-09-22 17:35 UTC / 2025-09-23 02:35 KST
// purpose: 스테이징된 Markdown의 frontmatter updated 값을 현재 UTC/KST로 동기화
// doc_refs: ["admin/plan/improvement-rounds.md", "docs/style-guides/markdown.md", "AGENTS.md", "admin/runbooks/release.md", "admin/runbooks/editing.md"]

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let useStaged = false;
let showHelp = false;
const targets = [];

for (const arg of args) {
  if (arg === '--staged') {
    useStaged = true;
    continue;
  }
  if (arg === '--help' || arg === '-h') {
    showHelp = true;
    continue;
  }
  targets.push(arg);
}

if (showHelp) {
  printHelp();
  process.exit(0);
}

if (!useStaged && targets.length === 0) {
  useStaged = true;
}

const files = new Set();

if (useStaged) {
  const staged = listStagedMarkdown();
  staged.forEach((file) => files.add(file));
}

for (const t of targets) {
  files.add(t);
}

if (files.size === 0) {
  process.exit(0);
}

const timestamp = buildTimestamp();
const failures = [];
const updates = [];

for (const relPath of files) {
  const absolutePath = path.resolve(relPath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
    continue;
  }
  if (!absolutePath.endsWith('.md')) {
    continue;
  }
  try {
    const changed = updateFrontmatterTimestamp(absolutePath, timestamp);
    if (changed) {
      stageFile(absolutePath);
      updates.push(relPath);
    }
  } catch (err) {
    failures.push({ file: relPath, error: err });
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`[ERR] ${failure.file}: ${failure.error.message}`);
  }
  process.exit(1);
}

if (updates.length > 0) {
  updates.forEach((file) => console.error(`[stamp] updated refreshed: ${file}`));
}

function listStagedMarkdown() {
  const result = spawnSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR']);
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error('git diff --cached 호출에 실패했습니다.');
  }
  return result.stdout
    .toString('utf8')
    .split(/\r?\n/)
    .filter((line) => line.endsWith('.md'))
    .filter(Boolean);
}

function buildTimestamp() {
  const now = new Date();
  const utc = formatDate(now);
  const kst = formatDate(new Date(now.getTime() + 9 * 60 * 60 * 1000));
  return {
    line: `updated: ${utc} UTC / ${kst} KST`,
    utc,
    kst,
  };
}

function formatDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

function updateFrontmatterTimestamp(filePath, timestamp) {
  const original = fs.readFileSync(filePath, 'utf8');
  const newline = original.includes('\r\n') ? '\r\n' : '\n';
  const lines = original.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') {
    return false;
  }
  let endIndex = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === '---') {
      endIndex = i;
      break;
    }
  }
  if (endIndex === -1) {
    return false;
  }
  let replaced = false;
  for (let i = 1; i < endIndex; i += 1) {
    if (/^updated:\s/.test(lines[i])) {
      lines[i] = timestamp.line;
      replaced = true;
      break;
    }
  }
  if (!replaced) {
    return false;
  }
  const updatedContent = lines.join(newline);
  if (updatedContent === original) {
    return false;
  }
  fs.writeFileSync(filePath, updatedContent);
  return true;
}

function stageFile(filePath) {
  const rel = path.relative(process.cwd(), filePath);
  const result = spawnSync('git', ['add', rel]);
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`git add 실패: ${rel}`);
  }
}

function printHelp() {
  console.log(
    `Usage: node scripts/update_frontmatter_time.js [--staged] [files...]\n\n` +
      `옵션 없이 실행하면 --staged와 동일하게 동작하여 스테이징된 Markdown 파일의 updated 값을 최신으로 갱신합니다.`,
  );
}
