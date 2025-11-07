import { eq } from 'drizzle-orm';
import type { Database } from '@kit/database';
import { user as userTable } from '@kit/database/schema';
import { UserEntity, type User } from '../entities/user.entity';

/**
 * User Repository - Handles all user data access
 * Follows the repository pattern from CLAUDE.md
 */
export class UserRepository {
    constructor(private db: Database) {}

    /**
     * Find a user by ID
     */
    async findById(id: string): Promise<User | null> {
        const [result] = await this.db
            .select()
            .from(userTable)
            .where(eq(userTable.id, id))
            .limit(1);

        if (!result) return null;

        // Validate against entity schema
        return UserEntity.parse(result);
    }

    /**
     * Find a user by email
     */
    async findByEmail(email: string): Promise<User | null> {
        const [result] = await this.db
            .select()
            .from(userTable)
            .where(eq(userTable.email, email))
            .limit(1);

        if (!result) return null;

        return UserEntity.parse(result);
    }

    /**
     * Get all users
     */
    async findAll(): Promise<User[]> {
        const results = await this.db.select().from(userTable);

        // Validate each result
        return results.map((r) => UserEntity.parse(r));
    }

    /**
     * Update a user's role
     */
    async updateRole(id: string, role: string): Promise<User> {
        const [result] = await this.db
            .update(userTable)
            .set({ role, updatedAt: new Date() })
            .where(eq(userTable.id, id))
            .returning();

        if (!result) {
            throw new Error(`User with id ${id} not found`);
        }

        return UserEntity.parse(result);
    }
}
