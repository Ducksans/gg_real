---
file: admin/runbooks/auth.md
title: 인증 및 RBAC 운영 절차
owner: duksan
created: 2025-09-25 05:45 UTC / 2025-09-25 14:45 KST
updated: 2025-09-25 12:37 UTC / 2025-09-25 21:37 KST
status: draft
tags: [runbook, auth, rbac]
schemaVersion: 1
description: 이메일 기반 Auth.js 로그인과 Redis 세션, 역할 변경 절차를 담당하는 운영 가이드
code_refs:
  [
    'admin/config/roles.yaml',
    'apps/web/src/lib/auth.ts',
    'apps/web/src/lib/redis-adapter.ts',
    'apps/web/src/middleware.ts',
    'apps/api/src/common/guards/roles.guard.ts',
  ]
---

## 사전 조건

- `REDIS_URL`, `AUTH_SECRET`, `AUTH_EMAIL_SERVER`, `AUTH_EMAIL_FROM` 환경 변수가 설정되어 있어야 합니다. 로컬 개발은 `apps/web/.env.local`에 기입하고, 배포 환경은 플랫폼 비밀 변수로 주입합니다.
- `admin/config/roles.yaml`에서 역할 계층과 이메일 할당을 최신 상태로 유지합니다. 다중 워크스페이스에서 실행할 때는 `ROLE_CONFIG_PATH` 환경 변수로 명시적으로 경로를 지정할 수 있습니다.

## 신규 관리자 계정 발급

1. `admin/config/roles.yaml`의 `assignments` 목록에 이메일과 역할을 추가합니다.
2. 변경 사항을 커밋/배포하여 Next.js 서버가 새 구성을 읽도록 합니다. (로컬 개발에서는 `pnpm --filter @gg-real/session build` 후 `pnpm --filter web dev` 재시작)
3. 사용자가 `/api/auth/signin`에서 Magic Link를 요청하면 이메일로 로그인 링크가 발송됩니다.
4. 최초 로그인 후 Redis 세션이 생성되며, `packages/session` 모듈에서 TTL(기본 24h)을 관리합니다.

## 권한 회수

1. `admin/config/roles.yaml`에서 대상 이메일을 제거하거나 역할을 낮춥니다.
2. `pnpm --filter @gg-real/session build` 후 배포하여 구성을 반영합니다.
3. Redis에서 해당 세션 키를 제거하려면 `packages/session`의 `clearSession` 함수를 사용하거나 `pnpm exec redis-cli --scan --pattern "session:*" | xargs -r pnpm exec redis-cli DEL`로 전체 세션을 정리합니다.

## 이상 징후 대응

- Magic Link 요청이 급증하면 `packages/session`의 `consumeRateLimit`를 통해 IP/이메일별 호출을 제한합니다.
- Redis 연결 실패 시 `apps/web` 로그에 `[session] Redis client error`가 기록되므로, 인프라 상태를 확인하고 재시작합니다.
- 긴급 차단이 필요할 경우 `REDIS_SESSION_TTL` 값을 낮춰 전체 만료 시간을 줄인 뒤, 배포 완료 후 복원합니다.

## 참고

- NextAuth 기본 로그인 페이지: `/api/auth/signin`
- 세션 확인: `pnpm exec node -e "(async () => { const { getSession } = await import('@gg-real/session'); console.log(await getSession('SUB')); })();"`
- API 보호: `apps/api`의 `RolesGuard`는 `X-User-Role` 헤더와 `roles` 메타데이터를 비교하여 접근을 허용합니다.
