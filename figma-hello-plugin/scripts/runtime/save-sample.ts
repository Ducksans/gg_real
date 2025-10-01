// doc_refs: ["admin/plan/figmaplugin-runtime-investigation.md"]

import { promises as fs } from 'fs';
import path from 'path';

interface CliOptions {
  id?: string;
  note?: string;
}

const parseArgs = (argv: string[]): CliOptions => {
  const options: CliOptions = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--id' && argv[index + 1]) {
      options.id = argv[index + 1];
      index += 1;
    } else if (arg === '--note' && argv[index + 1]) {
      options.note = argv[index + 1];
      index += 1;
    }
  }
  return options;
};

const readStdin = async () =>
  new Promise<string>((resolve) => {
    const chunks: string[] = [];
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(chunks.join('')));
    process.stdin.resume();
  });

const sanitizeId = (value: string | undefined) =>
  value?.trim().replace(/[^a-zA-Z0-9_-]/g, '-') ?? '';

const main = async () => {
  const input = await readStdin();
  if (!input.trim()) {
    console.error('[save-sample] 표준 입력으로 JSON 내용을 전달해 주세요.');
    process.exitCode = 1;
    return;
  }

  const options = parseArgs(process.argv.slice(2));
  const sanitizedId = sanitizeId(options.id);
  const utc = new Date();
  const pad = (value: number) => value.toString().padStart(2, '0');
  const timestamp = `${utc.getUTCFullYear()}${pad(utc.getUTCMonth() + 1)}${pad(utc.getUTCDate())}-${pad(utc.getUTCHours())}${pad(utc.getUTCMinutes())}${pad(utc.getUTCSeconds())}`;
  const fileStem = sanitizedId ? `${timestamp}_${sanitizedId}` : `${timestamp}`;

  const repoRoot = path.resolve(__dirname, '../../..');
  const samplesDir = path.join(repoRoot, 'admin', 'samples', 'runtime');
  await fs.mkdir(samplesDir, { recursive: true });

  const samplePath = path.join(samplesDir, `${fileStem}.json`);
  await fs.writeFile(samplePath, input.trim(), 'utf8');

  if (options.note) {
    const notePath = path.join(samplesDir, `${fileStem}.note.txt`);
    await fs.writeFile(notePath, options.note.trim(), 'utf8');
  }

  console.log(`[save-sample] JSON을 ${path.relative(repoRoot, samplePath)} 에 저장했습니다.`);
};

main().catch((error) => {
  console.error('[save-sample] 샘플 저장 중 오류가 발생했습니다.', error);
  process.exitCode = 1;
});
