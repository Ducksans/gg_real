#!/usr/bin/env bash
# file: scripts/validate_refs.sh
# owner: duksan
# created: 2025-09-22 08:26 UTC / 2025-09-22 17:26 KST
# updated: 2025-09-22 17:22 UTC / 2025-09-23 02:22 KST
# purpose: 문서↔코드 상호 참조 검증(R9) — 경로 존재/패턴/쌍방 매칭/데드 링크 리포트
# doc_refs: ["admin/plan/improvement-rounds.md", "AGENTS.md", "admin/runbooks/release.md", "admin/plan/m1-kickoff.md"]
set -euo pipefail

node <<'NODE'
const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const root = process.cwd();
const errors = [];
const warnings = [];
const docData = new Map(); // key -> { path, relPath, frontmatter, codeSet }
const docToCodes = new Map(); // key -> Set of code paths
const codeToDocs = new Map(); // key -> Set of doc paths

const skipDirNames = new Set(['.git', 'node_modules', '.turbo', '.pnpm', 'dist', 'build', 'coverage', 'tmp', 'vendor']);
const codeExtensions = new Set(['.sh', '.ts', '.tsx', '.js', '.jsx']);

main();

function main() {
  const markdownFiles = listFiles((filePath) => filePath.endsWith('.md'));
  for (const filePath of markdownFiles) {
    const relPath = relativePath(filePath);
    if (relPath.startsWith('admin/templates/')) {
      continue;
    }
    const frontmatter = parseFrontmatter(filePath);
    if (!frontmatter) {
      continue;
    }
    const docKey = normalizePath(filePath);
    const codeSet = new Set();
    docToCodes.set(docKey, codeSet);
    docData.set(docKey, { path: filePath, relPath, frontmatter, codeSet });

    const codeRefs = frontmatter.code_refs;
    if (codeRefs === undefined || codeRefs === null) {
      continue;
    }
    if (!Array.isArray(codeRefs)) {
      logError(`code_refs가 배열이 아닙니다: ${relPath}`);
      continue;
    }

    codeRefs.forEach((ref, index) => {
      if (typeof ref !== 'string' || ref.trim().length === 0) {
        logError(`code_refs[${index}]가 올바른 문자열이 아닙니다: ${relPath}`);
        return;
      }
      const targetPath = path.resolve(root, ref);
      if (!fs.existsSync(targetPath)) {
        logError(`missing code file (from doc): ${relPath} -> ${ref}`);
        return;
      }
      const normalizedCode = normalizePath(targetPath);
      if (!isTypicalCodePath(normalizedCode)) {
        logWarn(`code_ref atypical path: ${relPath} -> ${ref}`);
      }
      codeSet.add(normalizedCode);
    });
  }

  const codeFiles = listFiles((filePath) => codeExtensions.has(path.extname(filePath)));
  for (const codePath of codeFiles) {
    const header = readFirstLines(codePath, 100);
    const docRefs = parseDocRefs(header);
    if (docRefs.length === 0) {
      continue;
    }
    const codeKey = normalizePath(codePath);
    const docSet = new Set();

    docRefs.forEach((ref, index) => {
      if (typeof ref !== 'string' || ref.trim().length === 0) {
        logError(`doc_refs[${index}]가 올바른 문자열이 아닙니다: ${relativePath(codePath)}`);
        return;
      }
      const targetPath = path.resolve(root, ref);
      if (!fs.existsSync(targetPath)) {
        logError(`missing doc file (from code): ${relativePath(codePath)} -> ${ref}`);
        return;
      }
      docSet.add(normalizePath(targetPath));
    });

    if (docSet.size > 0) {
      codeToDocs.set(codeKey, docSet);
    }
  }

  // Reciprocal checks: doc -> code
  for (const [docKey, codeSet] of docToCodes.entries()) {
    for (const codeKey of codeSet) {
      const linkedDocs = codeToDocs.get(codeKey);
      if (!linkedDocs || linkedDocs.size === 0) {
        if (mustHaveDocRefs(codeKey)) {
          logError(`missing doc_refs in code header: ${trimPrefix(codeKey)}`);
        }
        continue;
      }
      if (!linkedDocs.has(docKey)) {
        logError(`missing reciprocal doc_ref: ${trimPrefix(codeKey)} -> ${trimPrefix(docKey)}`);
      }
    }
  }

  // Reciprocal checks: code -> doc
  for (const [codeKey, docSet] of codeToDocs.entries()) {
    for (const docKey of docSet) {
      if (!docKey.endsWith('.md')) {
        continue;
      }
      const docInfo = docData.get(docKey);
      if (docInfo) {
        if (!docInfo.codeSet.has(codeKey)) {
          logError(`missing reciprocal code_ref: ${trimPrefix(docKey)} -> ${trimPrefix(codeKey)}`);
        }
        continue;
      }
      const hasCodeRef = checkDocCodeRef(docKey, codeKey);
      if (hasCodeRef === null) {
        logError(`문서 frontmatter를 찾을 수 없습니다: ${trimPrefix(codeKey)} -> ${trimPrefix(docKey)}`);
      } else if (!hasCodeRef) {
        logError(`missing reciprocal code_ref: ${trimPrefix(docKey)} -> ${trimPrefix(codeKey)}`);
      }
    }
  }

  flushAndExit();
}

function listFiles(filterFn) {
  const results = [];
  walkDir(root, (fullPath) => {
    if (filterFn(fullPath)) {
      results.push(fullPath);
    }
  });
  return results;
}

function walkDir(dirPath, fileCallback) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (skipDirNames.has(entry.name)) {
        continue;
      }
      walkDir(fullPath, fileCallback);
    } else if (entry.isFile()) {
      fileCallback(fullPath);
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
  if (!content.startsWith('---')) {
    logError(`frontmatter가 없습니다: ${relativePath(filePath)}`);
    return null;
  }
  const lines = content.split(/\r?\n/);
  if (lines[0].trim() !== '---') {
    logError(`frontmatter 시작 구분자가 잘못되었습니다: ${relativePath(filePath)}`);
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
    return YAML.parse(yamlText) || {};
  } catch (err) {
    logError(`frontmatter YAML 파싱 실패: ${relativePath(filePath)} (${err.message})`);
    return null;
  }
}

function parseDocRefs(headerText) {
  const lines = headerText.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const match = line.match(/doc_refs:\s*(.*)$/);
    if (!match) {
      continue;
    }
    const remainder = match[1].trim();
    if (remainder.startsWith('[')) {
      const snippet = `doc_refs: ${remainder}`;
      const parsed = safeYamlParse(snippet);
      if (parsed) {
        return parsed;
      }
      continue;
    }
    if (remainder.length > 0 && !remainder.startsWith('#')) {
      const snippet = `doc_refs: [${remainder}]`;
      const parsed = safeYamlParse(snippet);
      if (parsed) {
        return parsed;
      }
      continue;
    }
    const blockLines = [];
    let j = i + 1;
    for (; j < lines.length; j += 1) {
      const blockLine = lines[j];
      if (/^\s*[-*]\s+/.test(blockLine)) {
        blockLines.push(blockLine);
        continue;
      }
      if (/^\s*(#.*)?$/.test(blockLine)) {
        blockLines.push(blockLine);
        continue;
      }
      break;
    }
    if (blockLines.length > 0) {
      const snippet = ['doc_refs:'].concat(blockLines).join('\n');
      const parsed = safeYamlParse(snippet);
      if (parsed) {
        return parsed;
      }
    }
  }
  return [];
}

function safeYamlParse(snippet) {
  try {
    const data = YAML.parse(snippet);
    if (data && Array.isArray(data.doc_refs)) {
      return data.doc_refs.map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0);
    }
  } catch (err) {
    // ignore malformed snippet
  }
  return null;
}

function readFirstLines(filePath, limit) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split(/\r?\n/).slice(0, limit).join('\n');
  } catch (err) {
    logError(`코드 파일을 읽지 못했습니다: ${relativePath(filePath)} (${err.message})`);
    return '';
  }
}

function checkDocCodeRef(docKey, codeKey) {
  const absoluteDocPath = resolveNormalizedPath(docKey);
  if (!fs.existsSync(absoluteDocPath)) {
    return null;
  }
  const frontmatter = parseFrontmatter(absoluteDocPath);
  if (!frontmatter) {
    return null;
  }
  const rawRefs = Array.isArray(frontmatter.code_refs) ? frontmatter.code_refs : [];
  for (const ref of rawRefs) {
    if (typeof ref !== 'string') {
      continue;
    }
    const normalizedRef = normalizePath(path.resolve(root, ref));
    if (normalizedRef === codeKey) {
      return true;
    }
  }
  return false;
}

function resolveNormalizedPath(normalizedPath) {
  const trimmed = normalizedPath.startsWith('./') ? normalizedPath.slice(2) : normalizedPath;
  return path.join(root, trimmed);
}

function normalizePath(targetPath) {
  const absolutePath = path.resolve(targetPath);
  const rel = path.relative(root, absolutePath).replace(/\\/g, '/');
  if (rel === '' || rel === '.') {
    return '.';
  }
  return rel.startsWith('.') ? `./${rel.replace(/^\.\//, '')}` : `./${rel}`;
}

function relativePath(targetPath) {
  return path.relative(root, targetPath).replace(/\\/g, '/');
}

function trimPrefix(normalizedPath) {
  return normalizedPath.startsWith('./') ? normalizedPath : normalizedPath;
}

function isTypicalCodePath(normalizedPath) {
  const pathWithoutPrefix = normalizedPath.replace(/^\.\//, '');
  if (/^scripts\//.test(pathWithoutPrefix) || /^apps\//.test(pathWithoutPrefix) || /^packages\//.test(pathWithoutPrefix)) {
    return true;
  }
  return /\.(ts|tsx|js|jsx|sh)$/.test(pathWithoutPrefix);
}

function mustHaveDocRefs(normalizedPath) {
  const pathWithoutPrefix = normalizedPath.replace(/^\.\//, '');
  if (/\.tmpl$/.test(pathWithoutPrefix) || /\.sample\./.test(pathWithoutPrefix)) {
    return false;
  }
  return /^scripts\//.test(pathWithoutPrefix) || /^apps\//.test(pathWithoutPrefix);
}

function logError(message) {
  errors.push(`[ERR] ${message}`);
}

function logWarn(message) {
  warnings.push(`[WARN] ${message}`);
}

function flushAndExit() {
  warnings.forEach((msg) => console.warn(msg));
  errors.forEach((msg) => console.error(msg));
  if (errors.length > 0) {
    console.error('[FAIL] validate_refs: 상호 참조 오류가 있습니다.');
    process.exit(1);
  }
  console.error('[OK] validate_refs: 상호 참조/경로 검증 통과');
}
NODE
