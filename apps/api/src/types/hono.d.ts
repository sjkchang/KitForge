import 'hono';
import type { User } from '../domains/users';

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
