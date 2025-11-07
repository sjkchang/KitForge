import { z } from 'zod';

/**
 * Email provider configuration
 */
const EmailProviderSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('console') }),
    z.object({
        type: z.literal('resend'),
        api_key: z
            .string()
            .min(1, 'RESEND_API_KEY is required when EMAIL_PROVIDER=resend'),
    }),
]);

/**
 * Main configuration schema
 */
export const ConfigSchema = z.object({
    // Environment
    env: z.enum(['development', 'staging', 'production']),

    // App (this API server)
    app: z.object({
        port: z.number().int().min(1).max(65535),
        url: z.string().url(),
    }),

    // Database
    database: z.object({
        url: z.string().url('DATABASE_URL must be a valid URL'),
    }),

    // Auth
    auth: z.object({
        secret: z
            .string()
            .min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
        base_url: z.string().url(),
        trusted_origins: z.array(z.string().url()),
    }),

    // Client applications
    clients: z.object({
        web: z.object({
            url: z.string().url(),
        }),
    }),

    // Email
    email: z.object({
        from: z.string().email(),
        provider: EmailProviderSchema,
    }),

    // OpenAPI
    openapi: z.object({
        enabled: z.boolean(),
        include_better_auth_routes: z.boolean(),
    }),
});

export type Config = z.infer<typeof ConfigSchema>;
export type EmailProvider = Config['email']['provider'];
