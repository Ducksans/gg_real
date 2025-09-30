#!/usr/bin/env tsx
import path from 'node:path';

import { buildManifest } from './builder';
import { emitManifest } from './emitter';

try {
  const manifest = buildManifest();
  const output = emitManifest(manifest);
  console.log(`[manifest] Generated manifest at ${path.relative(process.cwd(), output)}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('[manifest] Error:', message);
  process.exit(1);
}
