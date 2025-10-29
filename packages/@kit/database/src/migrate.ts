import '@kit/env'; // Load environment variables
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('Running migrations...');

  const migrationClient = postgres(connectionString, { max: 1 });
  const db = drizzle(migrationClient);

  await migrate(db, { migrationsFolder: './migrations' });

  await migrationClient.end();

  console.log('Migrations completed successfully!');
}

runMigrations().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
