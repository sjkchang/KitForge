import { ConfigSchema, type Config } from './config.schema';

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
 * Application configuration singleton
 *
 * Loaded from environment variables on first import.
 * Validates with Zod and fails fast if invalid.
 */
export const config: Config = (() => {
  const env = (process.env.NODE_ENV || 'development') as 'development' | 'staging' | 'production';

  // Build email provider config
  const emailProviderType = process.env.EMAIL_PROVIDER || 'console';
  const emailProvider = emailProviderType === 'resend'
    ? { type: 'resend' as const, api_key: process.env.RESEND_API_KEY || '' }
    : { type: 'console' as const };

  const rawConfig = {
    env,

    app: {
      port: Number(process.env.PORT) || 3001,
      url: process.env.API_URL || 'http://localhost:3001',
    },

    database: {
      url: process.env.DATABASE_URL,
    },

    auth: {
      secret: process.env.BETTER_AUTH_SECRET,
      base_url: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
      trusted_origins: [process.env.FRONTEND_URL || 'http://localhost:3000'],
    },

    clients: {
      web: {
        url: process.env.FRONTEND_URL || 'http://localhost:3000',
      },
    },

    email: {
      from: process.env.EMAIL_FROM || 'noreply@localhost.com',
      provider: emailProvider,
    },

    openapi: {
      enabled: bool(process.env.OPENAPI_ENABLED, true),
      include_better_auth_routes: bool(process.env.OPENAPI_INCLUDE_BETTER_AUTH_ROUTES, true),
    },
  };

  try {
    return ConfigSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Configuration validation failed:');
      console.error(error.message);
      throw new Error(
        'Failed to load application configuration. Please check your environment variables.',
        { cause: error }
      );
    }
    throw error;
  }
})();

// Re-exports
export type { Config, EmailProvider } from './config.schema';
export { ConfigSchema } from './config.schema';
export { PROJECT_CONSTANTS } from './project.constants';
