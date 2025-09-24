/**
 * file: apps/api/src/filters/sentry.filter.ts
 * owner: duksan
 * created: 2025-09-23 05:57 UTC / 2025-09-23 14:57 KST
 * updated: 2025-09-23 05:57 UTC / 2025-09-23 14:57 KST
 * purpose: NestJS 예외를 Sentry로 전송하고 기본 처리 흐름을 유지하는 필터
 * doc_refs: ["apps/api/README.md", "basesettings.md", "admin/plan/m1-kickoff.md"]
 */

import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { HttpAdapterHost } from '@nestjs/core';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  constructor(httpAdapter: HttpAdapterHost['httpAdapter']) {
    super(httpAdapter);
  }

  override catch(exception: unknown, host: ArgumentsHost) {
    if (Sentry.getCurrentHub().getClient()) {
      Sentry.captureException(exception);
    }
    super.catch(exception, host);
  }
}
