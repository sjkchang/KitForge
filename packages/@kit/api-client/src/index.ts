import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from './generated/openapi';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const client = createClient<paths>({ baseUrl });

// Internal token storage
let authToken: string | null = null;

// Auth middleware to automatically add Bearer token to requests
const authMiddleware: Middleware = {
    async onRequest({ request }) {
        if (authToken) {
            request.headers.set('Authorization', `Bearer ${authToken}`);
        }
        return request;
    },
};

// Register middleware
client.use(authMiddleware);

/**
 * Default API client singleton
 *
 * Import and use directly - no need to call createApiClient()
 *
 * @example
 * ```ts
 * import { api } from '@kit/api-client';
 *
 * // Public endpoint
 * const { data, error } = await api.GET('/health');
 *
 * // Authenticated endpoint - pass token per request
 * const { data, error } = await api.GET('/api/me', {
 *   headers: { Authorization: `Bearer ${token}` }
 * });
 *
 * // Or set auth globally
 * api.setAuth(token);
 * const { data, error } = await api.GET('/api/me');
 * ```
 */
export const api = Object.assign(client, {
    /**
     * Set authentication token for all subsequent requests
     *
     * @param token - JWT token (or null to clear)
     */
    setAuth(token: string | null) {
        authToken = token;
    },

    /**
     * Clear authentication token
     */
    clearAuth() {
        authToken = null;
    },
});

/**
 * Create a new API client instance with custom configuration
 *
 * Only use this if you need multiple client instances or custom config.
 * For most cases, use the default `api` export instead.
 *
 * @example
 * ```ts
 * import { createApiClient } from '@kit/api-client';
 *
 * const prodApi = createApiClient({
 *   baseUrl: 'https://api.production.com',
 *   token: 'jwt-token'
 * });
 * ```
 */
export function createApiClient(
    options: {
        baseUrl?: string;
        token?: string;
        headers?: HeadersInit;
    } = {},
) {
    const {
        baseUrl: customBaseUrl = process.env.NEXT_PUBLIC_API_URL ||
            'http://localhost:3001',
        token,
        headers = {},
    } = options;

    return createClient<paths>({
        baseUrl: customBaseUrl,
        headers: {
            ...headers,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
}

/**
 * Re-export the paths type for convenience
 */
export type { paths } from './generated/openapi';
