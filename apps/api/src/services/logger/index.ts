/**
 * Pino Logger Service
 *
 * Simple re-export of Pino logger configuration.
 * Fastify uses Pino by default for request logging.
 *
 * @example Basic usage
 * ```typescript
 * import { logger } from './services/logger';
 *
 * logger.info('Server started');
 * logger.info({ userId: '123' }, 'User logged in');
 * logger.error({ err }, 'Operation failed');
 * ```
 *
 * @example Child loggers (for scoped contexts)
 * ```typescript
 * const emailLogger = logger.child({ service: 'email' });
 * emailLogger.info({ to: 'user@example.com' }, 'Email sent');
 * ```
 *
 * Configuration:
 * - LOG_LEVEL: trace | debug | info | warn | error | fatal (default: debug in dev, info in prod)
 * - LOG_FORMAT: json | pretty (default: pretty in dev, json in prod)
 */

export { logger, loggerOptions } from './logger';
export type { Logger } from 'pino';
