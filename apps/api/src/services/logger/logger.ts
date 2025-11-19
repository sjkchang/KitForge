/**
 * Pino Logger Configuration
 *
 * Fastify uses Pino by default. This module provides:
 * - Centralized logger configuration
 * - Environment-aware formatting (pretty in dev, JSON in prod)
 */

import pino from 'pino';
import type { LoggerOptions } from 'pino';
import { config } from '../../config';

/**
 * Pino logger options for Fastify
 */
export const loggerOptions: LoggerOptions = {
    level: config.logging.level,
    transport:
        config.logging.format === 'pretty'
            ? {
                  target: 'pino-pretty',
                  options: {
                      colorize: true,
                      translateTime: 'HH:MM:ss',
                      ignore: 'pid,hostname',
                  },
              }
            : undefined,
};

/**
 * Default logger instance
 */
export const logger = pino(loggerOptions);
