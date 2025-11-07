import type { Config } from './config.schema';
import { config } from './index';

// Store original config for restoration
let originalConfig: Config | null = null;

/**
 * Override config for testing
 *
 * @example
 * ```typescript
 * beforeEach(() => {
 *   setTestConfig({
 *     email: {
 *       provider: { type: 'console' },
 *       from: 'test@example.com',
 *     },
 *   });
 * });
 *
 * afterEach(() => {
 *   resetTestConfig();
 * });
 * ```
 */
export function setTestConfig(overrides?: Partial<Config>): void {
    // Store original config on first call
    if (!originalConfig) {
        originalConfig = { ...config };
    }

    const defaults: Config = {
        env: 'development',
        app: {
            port: 3001,
            url: 'http://localhost:3001',
        },
        database: {
            url: 'postgresql://localhost:5432/test',
        },
        auth: {
            secret: 'a'.repeat(32),
            base_url: 'http://localhost:3001',
            trusted_origins: ['http://localhost:3000'],
        },
        clients: {
            web: {
                url: 'http://localhost:3000',
            },
        },
        email: {
            from: 'test@example.com',
            provider: { type: 'console' },
        },
        openapi: {
            enabled: true,
            include_better_auth_routes: true,
        },
    };

    const newConfig = { ...defaults, ...overrides };

    // Mutate the config object
    Object.assign(config, newConfig);
}

/**
 * Restore original config after testing
 */
export function resetTestConfig(): void {
    if (originalConfig) {
        Object.assign(config, originalConfig);
    }
}
