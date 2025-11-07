import { createDatabase, type Database } from '@kit/database';
import { UserRepository } from './user.repository';
import { config } from '../config';

// Singleton database instance
let db: Database | null = null;

function getDatabase(): Database {
    if (!db) {
        db = createDatabase(config.database.url);
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
