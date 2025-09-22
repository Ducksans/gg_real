#!/usr/bin/env bash
# file: scripts/validate_docs.sh
# owner: duksan
# created: 2025-09-22 08:25 UTC / 2025-09-22 17:25 KST
# updated: 2025-09-22 17:22 UTC / 2025-09-23 02:22 KST
# purpose: 문서 검증(MVP) + 프런트매터 스키마/타임스탬프/번호 규칙 검사
# doc_refs: ["docs/style-guides/markdown.md", "AGENTS.md", "basesettings.md", "admin/runbooks/release.md", "admin/runbooks/rollback.md", "admin/plan/m1-kickoff.md", "admin/plan/improvement-rounds.md"]
set -euo pipefail

node <<'NODE'
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const { spawnSync } = require('child_process');

const root = process.cwd();
const errors = [];
const warnings = [];
const infoLogs = [];

const skipDirNames = new Set(['.git', 'node_modules', '.turbo', '.pnpm', 'dist', 'build', 'coverage', 'tmp', 'vendor']);

main();

function main() {
  const schemaPath = path.join(root, 'admin/schemas/frontmatter.schema.json');
  let schema;
  try {
    schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  } catch (err) {
    logError(`frontmatter 스키마를 읽지 못했습니다: admin/schemas/frontmatter.schema.json (${err.message})`);
    flushAndExit();
    return;
  }

  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  let validate;
  try {
    validate = ajv.compile(schema);
  } catch (err) {
    logError(`frontmatter 스키마 컴파일 실패: ${err.message}`);
    flushAndExit();
    return;
  }

  const markdownFiles = listMarkdownFiles();
  for (const filePath of markdownFiles) {
    const relPath = relativePath(filePath);
    if (relPath.startsWith('admin/templates/')) {
      continue;
    }
    const frontmatter = parseFrontmatter(filePath);
    if (!frontmatter) {
      continue;
    }

    if (!validate(frontmatter)) {
      reportAjvErrors(relPath, validate.errors || []);
    }

    checkFrontmatterFile(relPath, frontmatter.file);
    checkTimestamps(relPath, frontmatter.created, frontmatter.updated);
  }

  const lintStatus = runMarkdownlint();
  if (lintStatus === 'missing') {
    runNumberingHeuristic(markdownFiles);
  }
  checkSupportMatrix();
  checkHubManifests();

  flushAndExit();
}

function listMarkdownFiles() {
  const results = [];
  collectRootMarkdown(results);
  collectMarkdownFromDir(path.join(root, 'admin'), results);
  collectMarkdownFromDir(path.join(root, 'docs'), results);
  return results;
}

function collectRootMarkdown(results) {
  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(path.join(root, entry.name));
    }
  }
}

function collectMarkdownFromDir(dirPath, results) {
  if (!fs.existsSync(dirPath)) {
    return;
  }
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (skipDirNames.has(entry.name)) {
        continue;
      }
      collectMarkdownFromDir(fullPath, results);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
}

function parseFrontmatter(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    logError(`파일을 읽지 못했습니다: ${relativePath(filePath)} (${err.message})`);
    return null;
  }
  const lines = content.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') {
    logError(`frontmatter가 없습니다: ${relativePath(filePath)}`);
    return null;
  }
  let endIndex = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === '---') {
      endIndex = i;
      break;
    }
  }
  if (endIndex === -1) {
    logError(`frontmatter 종료 구분자를 찾지 못했습니다: ${relativePath(filePath)}`);
    return null;
  }
  const yamlText = lines.slice(1, endIndex).join('\n');
  try {
    const data = YAML.parse(yamlText) || {};
    return data;
  } catch (err) {
    logError(`frontmatter YAML 파싱 실패: ${relativePath(filePath)} (${err.message})`);
    return null;
  }
}

function checkFrontmatterFile(relPath, fileField) {
  if (typeof fileField !== 'string' || fileField.trim().length === 0) {
    logError(`frontmatter.file 값이 비어있습니다: ${relPath}`);
    return;
  }
  const normalized = fileField.replace(/^\.\/+/, '');
  if (normalized !== relPath) {
    logError(`frontmatter.file 경로 불일치: ${relPath} (기대: ${relPath}, 실제: ${fileField})`);
  }
}

function checkTimestamps(relPath, createdRaw, updatedRaw) {
  const created = parseDualTimestamp(createdRaw, 'created', relPath);
  const updated = parseDualTimestamp(updatedRaw, 'updated', relPath);
  if (!created || !updated) {
    return;
  }
  if (updated.utc.getTime() < created.utc.getTime()) {
    logError(`created가 updated보다 나중입니다: ${relPath}`);
  }
}

function parseDualTimestamp(rawValue, label, relPath) {
  if (typeof rawValue !== 'string') {
    logError(`${label} 필드가 문자열이 아닙니다: ${relPath}`);
    return null;
  }
  const regex = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}) UTC \/ (\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}) KST$/;
  const match = rawValue.match(regex);
  if (!match) {
    logError(`${label} 포맷이 잘못되었습니다: ${relPath} (값: ${rawValue})`);
    return null;
  }
  const [, utcDate, utcTime, kstDate, kstTime] = match;
  const utc = new Date(`${utcDate}T${utcTime}:00Z`);
  const kst = new Date(`${kstDate}T${kstTime}:00+09:00`);
  if (Number.isNaN(utc.getTime())) {
    logError(`${label} UTC 값을 Date로 변환할 수 없습니다: ${relPath}`);
    return null;
  }
  if (Number.isNaN(kst.getTime())) {
    logError(`${label} KST 값을 Date로 변환할 수 없습니다: ${relPath}`);
    return null;
  }
  return { utc, kst };
}

function runMarkdownlint() {
  try {
    const result = spawnSync('markdownlint', ['-q', '-c', '.markdownlint.json', '**/*.md'], {
      cwd: root,
      stdio: 'inherit'
    });
    if (result.error && result.error.code === 'ENOENT') {
      infoLogs.push('markdownlint 미설치: 휴리스틱 검사만 수행합니다.');
      return 'missing';
    }
    if (result.status !== 0) {
      logError('markdownlint MD029 검사 실패');
    }
    return 'ran';
  } catch (err) {
    if (err.code === 'ENOENT') {
      infoLogs.push('markdownlint 미설치: 휴리스틱 검사만 수행합니다.');
      return 'missing';
    }
    logError(`markdownlint 실행 실패: ${err.message}`);
    return 'ran';
  }
}

function runNumberingHeuristic(markdownFiles) {
  if (markdownFiles.length === 0) {
    return;
  }
  for (const filePath of markdownFiles) {
    const relPath = relativePath(filePath);
    const lines = readLines(filePath);
    if (!lines) {
      continue;
    }
    let consecutive = 0;
    for (const line of lines) {
      if (/^1[.)] /u.test(line)) {
        consecutive += 1;
        if (consecutive >= 3) {
          logWarn(`의심스러운 번호 목록(1. 반복 가능성): ${relPath}`);
          break;
        }
      } else {
        consecutive = 0;
      }
    }
  }
}

function checkSupportMatrix() {
  const target = path.join(root, 'admin/config/support-matrix.yaml');
  if (!fs.existsSync(target)) {
    logError('missing support-matrix: admin/config/support-matrix.yaml');
    return;
  }
  let body = '';
  try {
    const raw = fs.readFileSync(target, 'utf8');
    body = stripFrontmatter(raw);
  } catch (err) {
    logError(`support-matrix 파일을 읽지 못했습니다: ${err.message}`);
    return;
  }
  try {
    const parsed = body.trim().length > 0 ? YAML.parse(body) || {} : {};
    ['browsers', 'os', 'devices'].forEach((key) => {
      if (parsed[key] === undefined) {
        logError(`support-matrix missing key: ${key}`);
      }
    });
  } catch (err) {
    logError(`support-matrix YAML 파싱 실패: ${err.message}`);
  }
}

function checkHubManifests() {
  const dirPath = path.join(root, 'admin/manifests');
  let entries = [];
  try {
    entries = fs.readdirSync(dirPath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return;
    }
    logError(`hub manifests 디렉터리를 읽지 못했습니다: ${err.message}`);
    return;
  }
  for (const name of entries) {
    if (!name.endsWith('.yaml') || name.endsWith('.meta.yaml')) {
      continue;
    }
    const filePath = path.join(dirPath, name);
    const relPath = relativePath(filePath);
    let parsed;
    try {
      parsed = YAML.parse(fs.readFileSync(filePath, 'utf8')) || {};
    } catch (err) {
      logError(`hub manifest YAML 파싱 실패: ${relPath} (${err.message})`);
      continue;
    }
    ['id', 'name', 'type', 'stage', 'owner'].forEach((key) => {
      if (parsed[key] === undefined) {
        logError(`hub manifest missing key: ${key} in ${relPath}`);
      }
    });
    const validTypes = new Set(['service', 'job', 'doc', 'ui', 'data']);
    if (parsed.type && !validTypes.has(parsed.type)) {
      logError(`hub manifest type invalid: ${relPath}`);
    }
    const validStages = new Set(['design', 'proto', 'dev', 'test', 'prod']);
    if (parsed.stage && !validStages.has(parsed.stage)) {
      logError(`hub manifest stage invalid: ${relPath}`);
    }
  }
}

function reportAjvErrors(relPath, ajvErrors) {
  for (const err of ajvErrors) {
    const location = err.instancePath && err.instancePath !== '' ? err.instancePath : '/';
    let message = err.message || '스키마 위반';
    if (err.keyword === 'additionalProperties' && err.params && err.params.additionalProperty) {
      message += ` (허용되지 않는 필드: ${err.params.additionalProperty})`;
    }
    logError(`frontmatter 스키마 위반: ${relPath}${location === '/' ? '' : location} ${message}`);
  }
}

function stripFrontmatter(content) {
  const lines = content.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') {
    return content;
  }
  let endIndex = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === '---') {
      endIndex = i;
      break;
    }
  }
  if (endIndex === -1) {
    return content;
  }
  return lines.slice(endIndex + 1).join('\n');
}

function readLines(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  } catch (err) {
    logError(`파일을 읽지 못했습니다: ${relativePath(filePath)} (${err.message})`);
    return null;
  }
}

function relativePath(targetPath) {
  return path.relative(root, targetPath).replace(/\\/g, '/');
}

function logError(message) {
  errors.push(`[ERR] ${message}`);
}

function logWarn(message) {
  warnings.push(`[WARN] ${message}`);
}

function flushAndExit() {
  infoLogs.forEach((msg) => console.error(`[info] ${msg}`));
  warnings.forEach((msg) => console.warn(msg));
  errors.forEach((msg) => console.error(msg));
  if (errors.length > 0) {
    console.error('[FAIL] validate_docs: 문서 검증 오류가 있습니다.');
    process.exit(1);
  }
  console.error('[OK] validate_docs: 문서 검증 통과');
}
NODE
