#!/usr/bin/env node
/*
 * file: scripts/validate_glossary_refs.js
 * owner: duksan
 * created: 2025-09-26 02:49 UTC / 2025-09-26 11:49 KST
 * purpose: 문서 frontmatter에 선언된 glossary_refs가 글로서리 데이터에 존재하는지 검증
 * doc_refs: ['admin/data/wiki-glossary.json', 'basesettings.md']
 */

const fs = require('fs');
const path = require('path');
const fg = require('fast-glob');
const matter = require('gray-matter');

const repoRoot = process.cwd();
const glossaryPath = path.join(repoRoot, 'admin/data/wiki-glossary.json');

function loadGlossaryKeys() {
  try {
    const raw = fs.readFileSync(glossaryPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.terms)) {
      throw new Error('glossary terms 필드가 배열이 아닙니다.');
    }
    return new Set(parsed.terms.map((term) => term.id));
  } catch (error) {
    console.error(`[glossary] ${error.message}`);
    process.exit(1);
  }
}

function scanMarkdownFiles() {
  return fg.sync(['**/*.md'], {
    cwd: repoRoot,
    ignore: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'admin/templates/**',
      'admin/migrations/templates/**',
    ],
  });
}

function validateGlossaryRefs() {
  const glossaryKeys = loadGlossaryKeys();
  const files = scanMarkdownFiles();
  const errors = [];

  files.forEach((relativePath) => {
    const fullPath = path.join(repoRoot, relativePath);
    let frontmatter;
    try {
      const raw = fs.readFileSync(fullPath, 'utf8');
      const parsed = matter(raw);
      frontmatter = parsed.data || {};
    } catch (error) {
      errors.push(`[파싱 실패] ${relativePath}: ${error.message}`);
      return;
    }

    const refs = frontmatter?.glossary_refs;
    if (!refs) {
      return;
    }
    if (!Array.isArray(refs)) {
      errors.push(`[형식 오류] ${relativePath}: glossary_refs는 배열이어야 합니다.`);
      return;
    }

    refs.forEach((ref) => {
      if (typeof ref !== 'string' || ref.trim().length === 0) {
        errors.push(
          `[값 오류] ${relativePath}: glossary_refs 항목이 비어 있거나 문자열이 아닙니다.`,
        );
        return;
      }
      if (!glossaryKeys.has(ref)) {
        errors.push(`[미등록 용어] ${relativePath}: '${ref}' 이 글로서리에 없습니다.`);
      }
    });
  });

  if (errors.length > 0) {
    console.error('glossary_refs 검증 실패:');
    errors.forEach((message) => console.error(` - ${message}`));
    process.exit(1);
  }

  console.log('glossary_refs 검증 완료: 이상 없음');
}

validateGlossaryRefs();
