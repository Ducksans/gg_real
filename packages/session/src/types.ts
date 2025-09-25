export type UserRole = 'viewer' | 'editor' | 'admin';

export interface StoredSession {
  userId: string;
  email: string;
  role: UserRole;
  /** epoch milliseconds */
  expires: number;
  metadata?: Record<string, unknown>;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
  resetIn: number;
}
