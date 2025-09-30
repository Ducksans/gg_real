import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

const tsconfig = JSON.parse(readFileSync(new URL('./tsconfig.json', import.meta.url), 'utf-8')) as {
  compilerOptions?: {
    baseUrl?: string;
    paths?: Record<string, string[]>;
  };
};

const baseUrl = tsconfig.compilerOptions?.baseUrl ?? '.';
const alias: Record<string, string> = {};

for (const [key, values] of Object.entries(tsconfig.compilerOptions?.paths ?? {})) {
  if (values.length === 0) continue;
  const aliasKey = key.replace(/\*$/, '');
  const target = values[0].replace(/\*$/, '');
  const absolute = fileURLToPath(new URL(path.join(baseUrl, target), import.meta.url));
  alias[aliasKey] = absolute;
}

export default defineConfig({
  resolve: {
    alias,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
