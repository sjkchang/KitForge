import 'hono';
import type { User } from '../entities/user.entity';

declare module 'hono' {
  interface ContextVariableMap {
    user: User;
    session: {
      id: string;
      userId: string;
      token: string;
      expiresAt: Date;
    };
  }
}
