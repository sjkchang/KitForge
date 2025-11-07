import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Verification table - better-auth schema
 * Stores verification tokens for email verification and password resets
 * Reference: https://www.better-auth.com/docs/concepts/database
 */
export const verification = pgTable('verification', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expiresAt', { mode: 'date' }).notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
});
