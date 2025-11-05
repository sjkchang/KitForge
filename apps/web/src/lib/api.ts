import { createApiClient } from '@kit/api-client';
import { authClient } from './auth-client';

/**
 * Get the API client with the current user's JWT token
 *
 * @example
 * ```ts
 * const api = await getApiClient();
 * const { data, error } = await api.GET('/api/me');
 * ```
 */
export async function getApiClient() {
  const session = await authClient.getSession();

  return createApiClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    token: session?.data?.session?.token,
  });
}

/**
 * Get an unauthenticated API client (for public endpoints)
 *
 * @example
 * ```ts
 * const api = getPublicApiClient();
 * const { data, error } = await api.GET('/health');
 * ```
 */
export function getPublicApiClient() {
  return createApiClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  });
}
