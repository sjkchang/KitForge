import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { jwt, openAPI } from 'better-auth/plugins';
import { createDatabase } from '@kit/database';
import * as schema from '@kit/database/schema';
import { services } from '../services/service-registry';

function createAuth() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error('DATABASE_URL environment variable is required');
    }

    const db = createDatabase(databaseUrl);

    return betterAuth({
        database: drizzleAdapter(db, {
            provider: 'pg',
            schema: {
                user: schema.user,
                session: schema.session,
                account: schema.account,
                verification: schema.verification,
                jwks: schema.jwks,
            },
        }),
        emailAndPassword: {
            enabled: true,
            autoSignIn: true,
            sendResetPassword: async ({ user, url }) => {
                await services.email.sendPasswordReset({
                    to: user.email,
                    userName: user.name || '',
                    resetUrl: url,
                });
            },
        },
        emailVerification: {
            sendOnSignUp: true,
            autoSignInAfterVerification: true,
            expiresIn: 86400,
            sendVerificationEmail: async ({ user, url }) => {
                await services.email.sendEmailVerification({
                    to: user.email,
                    userName: user.name || '',
                    verificationUrl: url,
                });
            },
        },
        plugins: [
            jwt({
                jwks: {
                    keyPairConfig: {
                        alg: 'RS256',
                    },
                },
            }),
            openAPI({
                disableDefaultReference: true,
            }),
        ],
        secret: (() => {
            const secret = process.env.BETTER_AUTH_SECRET;
            if (!secret) {
                throw new Error('BETTER_AUTH_SECRET environment variable is required');
            }
            return secret;
        })(),
        baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
        trustedOrigins: [
            process.env.FRONTEND_URL || 'http://localhost:3000',
        ],
    });
}

export const auth: ReturnType<typeof betterAuth> = createAuth();
