import { z } from 'zod';
import { UserSchema } from '../schemas';

export const GetMeResponseSchema = z.object({
    user: UserSchema.describe('Current authenticated user'),
});

export const GetUsersResponseSchema = z.object({
    users: z.array(UserSchema).describe('Array of all users in the system'),
});
