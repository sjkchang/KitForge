import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Creates a database client with Drizzle ORM
 * @param connectionString - PostgreSQL connection string
 * @returns Drizzle database client
 */
export function createDatabase(connectionString: string) {
  const client = postgres(connectionString);
  return drizzle(client, { schema });
}

/**
 * Type alias for the database client
 */
export type Database = ReturnType<typeof createDatabase>;
