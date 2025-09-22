/**
 * file: apps/api/src/main.ts
 * owner: duksan
 * created: 2025-09-22 19:25 UTC / 2025-09-23 04:25 KST
 * updated: 2025-09-22 19:25 UTC / 2025-09-23 04:25 KST
 * purpose: NestJS 애플리케이션 부트스트랩 및 글로벌 설정 구성
 * doc_refs: ["admin/plan/m1-kickoff.md", "basesettings.md", "apps/api/README.md"]
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const fastifyAdapter = new FastifyAdapter({ logger: false });
  configureObservability();
  const app = await NestFactory.create(AppModule, fastifyAdapter);

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');

  Logger.log(`API server running on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
