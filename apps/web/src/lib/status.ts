/**
 * file: apps/web/src/lib/status.ts
 * owner: duksan
 * created: 2025-09-23 07:20 UTC / 2025-09-23 16:20 KST
 * updated: 2025-09-23 07:20 UTC / 2025-09-23 16:20 KST
 * purpose: 상태 구성을 표현하는 공용 타입과 헬퍼를 정의한다
 * doc_refs: ["admin/config/status.yaml"]
 */

export type StatusDefinition = {
  label: string;
  color: string;
  icon: string;
};

export type StatusConfig = Record<string, StatusDefinition>;

export function getStatusColor(statuses: StatusConfig, key: string, fallback = '#6b7280'): string {
  return statuses[key]?.color ?? fallback;
}

export function getStatusLabel(statuses: StatusConfig, key: string, fallback?: string): string {
  return statuses[key]?.label ?? fallback ?? key;
}
