import 'next-auth';
import 'next-auth/jwt';
import type { UserRole } from '@gg-real/session';

declare module 'next-auth' {
  interface Session {
    user?: {
      role?: UserRole;
    } & DefaultSession['user'];
  }

  interface User {
    role?: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole;
  }
}
