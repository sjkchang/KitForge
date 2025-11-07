import { z } from 'zod';

export const UserSchema = z.object({
    id: z.string().describe('Unique identifier for the user (UUID v4)'),
    name: z.string().describe("User's full name"),
    // BREAKING CHANGE: Removed email field
    emailVerified: z
        .boolean()
        .describe('Whether the user has verified their email address'),
    image: z
        .string()
        .nullable()
        .describe("URL to the user's profile image (null if not set)"),
    role: z.string().describe("User's role in the system (user, admin)"),
    createdAt: z
        .string()
        .datetime()
        .describe('ISO 8601 timestamp of when the user was created'),
    updatedAt: z
        .string()
        .datetime()
        .describe('ISO 8601 timestamp of when the user was last updated'),
});

export type User = z.infer<typeof UserSchema>;

export const GetMeResponseSchema = z.object({
    user: UserSchema.describe('Current authenticated user'),
});

export const GetUsersResponseSchema = z.object({
    users: z.array(UserSchema).describe('Array of all users in the system'),
});
