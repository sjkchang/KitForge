import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { auth } from './lib/auth';
import { jwtAuth, requireAdmin } from './middleware/auth';
import { getUserRepository } from './repositories';

const app = new Hono();

// Enable CORS for the frontend
app.use(
  '*',
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Better Auth routes - handles /api/auth/*
app.on(['POST', 'GET'], '/api/auth/**', (c) => {
  return auth.handler(c.req.raw);
});

// Protected route - requires valid JWT
app.get('/api/me', jwtAuth, (c) => {
  const user = c.get('user');
  return c.json({ user });
});

// Admin-only route - get all users
app.get('/api/users', jwtAuth, requireAdmin, async (c) => {
  try {
    const users = await getUserRepository().findAll();

    // Return only safe fields (exclude sensitive data)
    const sanitizedUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      emailVerified: u.emailVerified,
      role: u.role,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return c.json({ users: sanitizedUsers });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

export default app;
