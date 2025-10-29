import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { jwt } from 'better-auth/plugins';
import { createDatabase } from '@kit/database';
import * as schema from '@kit/database/schema';
import { getEmailService } from '../services';

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
                const emailService = getEmailService();

                // Send password reset email
                // URL points to API's reset endpoint, then redirects to frontend
                await emailService.sendPasswordReset({
                    to: user.email,
                    userName: user.name || '',
                    resetUrl: url,
                });
            },
        },
        emailVerification: {
            sendOnSignUp: true, // Send verification email immediately after sign up
            autoSignInAfterVerification: true, // Auto sign in after verification
            expiresIn: 86400, // 24 hours in seconds
            sendVerificationEmail: async ({ user, url }) => {
                const emailService = getEmailService();

                // URL is already correct - it points to API's verify endpoint
                // After verification, Better Auth will redirect to the callbackURL
                await emailService.sendEmailVerification({
                    to: user.email,
                    userName: user.name || '',
                    verificationUrl: url,
                });
            },
        },
        plugins: [
            jwt({
                // JWT tokens will be generated and can be used for API authentication
                jwks: {
                    // Use the jwks table from our schema
                    keyPairConfig: {
                        alg: 'RS256',
                    },
                },
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

// Export auth instance directly
// Environment variables are loaded before this module is imported
export const auth: ReturnType<typeof betterAuth> = createAuth();
