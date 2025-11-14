import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { jwtAuth, requireAdmin } from '../services/auth';
import { getUserRepository } from '../domains/users';
import {
    UnauthorizedErrorSchema,
    ForbiddenErrorSchema,
    ErrorResponseSchema,
} from '../schemas';
import {
    GetMeResponseSchema,
    GetUsersResponseSchema,
} from './users.schemas';

export const usersRoutes: FastifyPluginAsync = async (app) => {
    const typedApp = app.withTypeProvider<ZodTypeProvider>();

    // GET /me - Get current user
    typedApp.get(
        '/me',
        {
            onRequest: [jwtAuth],
            schema: {
                tags: ['User'],
                summary: 'Get current user',
                description: 'Returns the currently authenticated user\'s profile information including role and email verification status.',
                security: [{ Bearer: [] }],
                response: {
                    200: GetMeResponseSchema,
                    401: UnauthorizedErrorSchema,
                },
            },
        },
        async (request, reply) => {
            const user = request.user!;
            return reply.send({
                user: {
                    ...user,
                    createdAt: user.createdAt.toISOString(),
                    updatedAt: user.updatedAt.toISOString(),
                },
            });
        }
    );

    // GET /users - Get all users (admin only)
    typedApp.get(
        '/users',
        {
            onRequest: [jwtAuth, requireAdmin],
            schema: {
                tags: ['Admin'],
                summary: 'List all users',
                description: 'Retrieve a list of all registered users in the system. Admin role required.',
                security: [{ Bearer: [] }],
                response: {
                    200: GetUsersResponseSchema,
                    401: UnauthorizedErrorSchema,
                    403: ForbiddenErrorSchema,
                    500: ErrorResponseSchema,
                },
            },
        },
        async (request, reply) => {
            try {
                const users = await getUserRepository().findAll();
                const sanitizedUsers = users.map((u) => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    emailVerified: u.emailVerified,
                    image: u.image,
                    role: u.role,
                    createdAt: u.createdAt.toISOString(),
                    updatedAt: u.updatedAt.toISOString(),
                }));

                return reply.send({ users: sanitizedUsers });
            } catch (error) {
                console.error('Failed to fetch users:', error);
                return reply.status(500).send({
                    error: 'Failed to fetch users',
                    code: 'INTERNAL_ERROR',
                });
            }
        }
    );
};
