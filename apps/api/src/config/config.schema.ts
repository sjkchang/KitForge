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
 * Minimal configuration schema
 * Used for build-time operations (OpenAPI generation, type checking, etc.)
 * Only requires the bare minimum to import and analyze the app
 * Database is optional since it's the only thing that prevents app startup
 */
export const MinimalConfigSchema = z.object({
    // Environment
    env: z.enum(['development', 'staging', 'production']),

    // App (this API server)
    app: z.object({
        port: z.number().int().min(1).max(65535),
        url: z.string().url(),
    }),

    // Database - OPTIONAL in build mode (fails at connection time, not startup)
    database: z
        .object({
            url: z.string().url('DATABASE_URL must be a valid URL'),
        })
        .optional(),

    // Auth - always included (Better Auth starts without DB, fails at use time)
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

    // Email - always included (console provider works without config)
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

/**
 * Full runtime configuration schema
 * Used when actually running the server - requires all fields
 */
export const RuntimeConfigSchema = z.object({
    // Environment
    env: z.enum(['development', 'staging', 'production']),

    // App (this API server)
    app: z.object({
        port: z.number().int().min(1).max(65535),
        url: z.string().url(),
    }),

    // Database - REQUIRED at runtime
    database: z.object({
        url: z.string().url('DATABASE_URL must be a valid URL'),
    }),

    // Auth - REQUIRED at runtime
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

    // Email - REQUIRED at runtime
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

export type MinimalConfig = z.infer<typeof MinimalConfigSchema>;
export type RuntimeConfig = z.infer<typeof RuntimeConfigSchema>;
export type Config = MinimalConfig | RuntimeConfig;
export type EmailProvider =
    | z.infer<typeof EmailProviderSchema>
    | undefined;
