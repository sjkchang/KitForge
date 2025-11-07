import {
    MinimalConfigSchema,
    RuntimeConfigSchema,
    type Config,
} from './config.schema';

/**
 * Parse boolean from string environment variable
 */
function bool(value: string | undefined, defaultValue: boolean): boolean {
    if (!value) return defaultValue;
    const v = value.toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(v)) return true;
    if (['false', '0', 'no', 'off'].includes(v)) return false;
    return defaultValue;
}

/**
 * Determine if we're in build mode (OpenAPI generation, etc.)
 * Build mode allows the app to be imported without full runtime config
 */
function isBuildMode(): boolean {
    return bool(process.env.BUILD_MODE, false);
}

/**
 * Load configuration from environment variables
 */
function loadConfig(): Config {
    const env = (process.env.NODE_ENV || 'development') as
        | 'development'
        | 'staging'
        | 'production';

    // Build email provider config
    const emailProviderType = process.env.EMAIL_PROVIDER || 'console';
    const emailProvider =
        emailProviderType === 'resend'
            ? {
                  type: 'resend' as const,
                  api_key: process.env.RESEND_API_KEY,
              }
            : { type: 'console' as const };

    // Build config from env vars - let Zod validate what's required
    const rawConfig = {
        env,

        app: {
            port: Number(process.env.PORT) || 3001,
            url: process.env.API_URL || 'http://localhost:3001',
        },

        // Database - only include if DATABASE_URL is set (optional in build mode)
        ...(process.env.DATABASE_URL && {
            database: {
                url: process.env.DATABASE_URL,
            },
        }),

        // Auth - always included with defaults
        auth: {
            secret:
                process.env.BETTER_AUTH_SECRET ||
                'dev-secret-min-32-chars-long-12345',
            base_url: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
            trusted_origins: [
                process.env.FRONTEND_URL || 'http://localhost:3000',
            ],
        },

        clients: {
            web: {
                url: process.env.FRONTEND_URL || 'http://localhost:3000',
            },
        },

        // Email - always included with defaults (console provider works)
        email: {
            from: process.env.EMAIL_FROM || 'noreply@localhost.com',
            provider: emailProvider,
        },

        openapi: {
            enabled: bool(process.env.OPENAPI_ENABLED, true),
            include_better_auth_routes: bool(
                process.env.OPENAPI_INCLUDE_BETTER_AUTH_ROUTES,
                true,
            ),
        },
    };

    try {
        // Use appropriate schema based on mode
        const schema = isBuildMode()
            ? MinimalConfigSchema
            : RuntimeConfigSchema;

        return schema.parse(rawConfig);
    } catch (error) {
        if (error instanceof Error) {
            console.error('❌ Configuration validation failed:');
            console.error(error.message);
            const mode = isBuildMode() ? 'build' : 'runtime';
            throw new Error(
                `Failed to load ${mode} configuration. Please check your environment variables.`,
                { cause: error },
            );
        }
        throw error;
    }
}

/**
 * Application configuration singleton
 *
 * Loaded from environment variables on first import.
 * In runtime mode: Validates with full schema and fails fast if invalid.
 * In build mode (BUILD_MODE=true): Uses minimal schema, allowing import without database/auth.
 */
export const config: Config = loadConfig();

// Re-exports
export type {
    Config,
    EmailProvider,
    MinimalConfig,
    RuntimeConfig,
} from './config.schema';
export {
    MinimalConfigSchema,
    RuntimeConfigSchema,
} from './config.schema';
export { PROJECT_CONSTANTS } from './project.constants';
