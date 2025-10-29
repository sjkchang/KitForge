import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * JWKS table - better-auth JWT plugin schema
 * Stores JSON Web Key Sets for JWT token validation
 * Reference: https://www.better-auth.com/docs/plugins/jwt
 */
export const jwks = pgTable('jwks', {
  id: text('id').primaryKey(),
  publicKey: text('publicKey').notNull(),
  privateKey: text('privateKey').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
});
