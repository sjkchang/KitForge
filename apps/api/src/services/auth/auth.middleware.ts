import { FastifyRequest, FastifyReply } from 'fastify';
import { auth } from './auth.lib';
import { getUserRepository } from '../../domains/users';
import type { User } from '../../domains/users';

/**
 * Middleware to validate JWT tokens and attach user to request
 * Uses lazy-loaded singleton repository pattern for better performance
 */
export async function jwtAuth(request: FastifyRequest, reply: FastifyReply) {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({
            error: 'Unauthorized - No token provided',
        });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
        // Verify the JWT token using better-auth
        const session = await auth.api.getSession({
            headers: {
                authorization: `Bearer ${token}`,
            },
        });

        if (!session) {
            return reply.status(401).send({
                error: 'Unauthorized - Invalid token',
            });
        }

        // Fetch full user from database to get role using lazy-loaded repository
        const dbUser = await getUserRepository().findById(session.user.id);

        if (!dbUser) {
            return reply.status(401).send({
                error: 'User not found',
            });
        }

        // Attach full user with role to request
        request.user = dbUser;
        request.session = session.session;
    } catch (error) {
        console.error('JWT validation error:', error);
        return reply.status(401).send({
            error: 'Unauthorized - Token validation failed',
        });
    }
}

/**
 * Middleware to check if user has admin role
 */
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;

    if (!user || user.role !== 'admin') {
        return reply.status(403).send({
            error: 'Forbidden - Admin access required',
        });
    }
}

// Augment Fastify types
declare module 'fastify' {
    interface FastifyRequest {
        user?: User;
        session?: any;
    }
}
