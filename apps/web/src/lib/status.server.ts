/**
 * file: apps/web/src/lib/status.server.ts
 * owner: duksan
 * created: 2025-09-23 07:15 UTC / 2025-09-23 16:15 KST
 * updated: 2025-09-23 07:15 UTC / 2025-09-23 16:15 KST
 * purpose: admin/config/status.yaml을 단일 소스로 삼아 상태 정의를 로드하고 재사용한다
 * doc_refs: ["admin/config/status.yaml", "basesettings.md"]
 */

import { loadYaml } from './content';
import type { StatusConfig } from './status';

export async function loadStatusConfig(): Promise<StatusConfig> {
  const raw = await loadYaml<{ enum: StatusConfig }>('admin/config/status.yaml');
  return raw.enum;
}
