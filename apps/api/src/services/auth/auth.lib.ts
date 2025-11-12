import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { jwt, openAPI } from 'better-auth/plugins';
import { createDatabase } from '@kit/database';
import * as schema from '@kit/database/schema';
import { services } from '../service-registry';
import { config } from '../../config';

function createAuth() {
    const db = createDatabase(config.database.url);

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
        secret: config.auth.secret,
        baseURL: config.auth.base_url,
        trustedOrigins: config.auth.trusted_origins,
    });
}

export const auth: ReturnType<typeof betterAuth> = createAuth();
