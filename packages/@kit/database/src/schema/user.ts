import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';

/**
 * User table - core better-auth schema
 * Reference: https://www.better-auth.com/docs/concepts/database
 */
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  role: text('role').notNull().default('user'), // Added for authorization (admin/user)
});
