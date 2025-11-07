import { api } from '@kit/api-client';
import { authClient } from './auth-client';

/**
 * Get the session token for authenticated API calls
 *
 * @returns JWT token or null if not authenticated
 *
 * @example
 * ```ts
 * const token = await getSessionToken();
 * if (token) {
 *   const { data } = await api.GET('/api/me', {
 *     headers: { Authorization: `Bearer ${token}` }
 *   });
 * }
 * ```
 */
export async function getSessionToken(): Promise<string | null> {
    const session = await authClient.getSession();
    return session?.data?.session?.token ?? null;
}

/**
 * Re-export the singleton API client for convenience
 *
 * @example
 * ```ts
 * import { api } from '@/lib/api';
 *
 * // Public endpoint
 * const { data } = await api.GET('/health');
 *
 * // Authenticated endpoint
 * const token = await getSessionToken();
 * const { data } = await api.GET('/api/me', {
 *   headers: { Authorization: `Bearer ${token}` }
 * });
 * ```
 */
export { api };
