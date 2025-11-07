import { createAuthClient } from 'better-auth/react';
import type { User as BetterAuthUser } from 'better-auth';

// Extend Better Auth User type to include role
export interface User extends BetterAuthUser {
    role: string;
}

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

export const { signIn, signUp, signOut, useSession } = authClient;
