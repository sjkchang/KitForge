import { z } from 'zod';

/**
 * User Entity - Source of truth for user data
 * All user data from the database should be validated against this schema
 */
export const UserEntity = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    emailVerified: z.boolean(),
    image: z.string().nullable(),
    role: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type User = z.infer<typeof UserEntity>;
