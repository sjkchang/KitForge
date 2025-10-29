import { Context, Next } from 'hono';
import { auth } from '../lib/auth';
import { getUserRepository } from '../repositories';

/**
 * Middleware to validate JWT tokens and attach user to context
 * Uses lazy-loaded singleton repository pattern for better performance
 */
export async function jwtAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
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
      return c.json({ error: 'Unauthorized - Invalid token' }, 401);
    }

    // Fetch full user from database to get role using lazy-loaded repository
    const dbUser = await getUserRepository().findById(session.user.id);

    if (!dbUser) {
      return c.json({ error: 'User not found' }, 401);
    }

    // Attach full user with role to context
    c.set('user', dbUser);
    c.set('session', session.session);

    await next();
  } catch (error) {
    console.error('JWT validation error:', error);
    return c.json({ error: 'Unauthorized - Token validation failed' }, 401);
  }
}

/**
 * Middleware to check if user has admin role
 */
export async function requireAdmin(c: Context, next: Next) {
  const user = c.get('user');

  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Forbidden - Admin access required' }, 403);
  }

  await next();
}
