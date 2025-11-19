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
 * Application configuration schema
 *
 * Philosophy:
 * - Validates that config values are well-formed (fail fast on invalid config)
 * - Does NOT attempt connections (fail lazy when features are actually used)
 * - Allows app to start even if database is unreachable (graceful degradation)
 */
export const ConfigSchema = z.object({
    // Environment
    env: z.enum(['development', 'staging', 'production']),

    // App (this API server)
    app: z.object({
        port: z.number().int().min(1).max(65535),
        url: z.string().url(),
    }),

    // Database - URL validated but connection NOT attempted at startup
    database: z.object({
        url: z.string().url('DATABASE_URL must be a valid URL'),
    }),

    // Auth - Config validated but auth system starts even if DB is down
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

    // Logging
    logging: z.object({
        level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']),
        format: z.enum(['json', 'pretty']),
    }),

    // Email - Works offline with console provider
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
export type EmailProvider = z.infer<typeof EmailProviderSchema>;
