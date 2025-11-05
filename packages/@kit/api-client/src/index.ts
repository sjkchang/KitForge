import createClient from 'openapi-fetch';
import type { paths } from './generated/openapi';

/**
 * Options for creating an API client
 */
export interface ApiClientOptions {
  /**
   * Base URL for the API
   * @default process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
   */
  baseUrl?: string;

  /**
   * JWT token for authentication
   * If provided, will be included in Authorization header
   */
  token?: string;

  /**
   * Custom headers to include in all requests
   */
  headers?: HeadersInit;
}

/**
 * Create a type-safe API client
 *
 * @example
 * ```ts
 * // Without auth
 * const api = createApiClient();
 * const { data, error } = await api.GET('/health');
 *
 * // With auth
 * const api = createApiClient({ token: 'jwt-token' });
 * const { data, error } = await api.GET('/api/me');
 * ```
 */
export function createApiClient(options: ApiClientOptions = {}) {
  const {
    baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    token,
    headers = {},
  } = options;

  const client = createClient<paths>({
    baseUrl,
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return client;
}

/**
 * Re-export the paths type for convenience
 */
export type { paths } from './generated/openapi';
