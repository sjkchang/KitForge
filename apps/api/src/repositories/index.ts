import { createDatabase, type Database } from '@kit/database';
import { UserRepository } from './user.repository';

// Singleton database instance
let db: Database | null = null;

function getDatabase(): Database {
  if (!db) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    db = createDatabase(databaseUrl);
  }
  return db;
}

// Lazy-loaded repository singletons
let userRepository: UserRepository | null = null;

export function getUserRepository(): UserRepository {
  if (!userRepository) {
    userRepository = new UserRepository(getDatabase());
  }
  return userRepository;
}

// Add more repository getters as needed:
// export function getPostRepository(): PostRepository { ... }
// export function getCommentRepository(): CommentRepository { ... }
