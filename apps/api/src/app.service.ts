/**
 * file: apps/api/src/app.service.ts
 * owner: duksan
 * created: 2025-09-22 19:25 UTC / 2025-09-23 04:25 KST
 * updated: 2025-09-22 19:25 UTC / 2025-09-23 04:25 KST
 * purpose: API의 버전/상태 정보를 제공하는 서비스
 * doc_refs: ["admin/plan/m1-kickoff.md", "basesettings.md", "apps/api/README.md"]
 */

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getVersion(): string {
    return process.env.VERSION ?? '0.1.0';
  }
}
