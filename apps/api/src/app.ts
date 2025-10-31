import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { auth } from './lib/auth';
import { jwtAuth, requireAdmin } from './middleware/auth';
import { getUserRepository } from './repositories';
import {
  HealthResponseSchema,
  GetMeResponseSchema,
  GetUsersResponseSchema,
  ErrorResponseSchema,
  UserSchema,
} from '@kit/validation';

const app = new OpenAPIHono();

// Enable CORS for the frontend
app.use(
  '*',
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Health check endpoint with OpenAPI
const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['System'],
  summary: 'Health check',
  description: 'Check if the API is running',
  responses: {
    200: {
      description: 'API is healthy',
      content: {
        'application/json': {
          schema: HealthResponseSchema,
        },
      },
    },
  },
});

app.openapi(healthRoute, (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Better Auth routes - handles /api/auth/*
app.on(['POST', 'GET'], '/api/auth/**', (c) => {
  return auth.handler(c.req.raw);
});

// Protected route - requires valid JWT
const getMeRoute = createRoute({
  method: 'get',
  path: '/api/me',
  tags: ['User'],
  summary: 'Get current user',
  description: 'Get the currently authenticated user',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: 'Current user',
      content: {
        'application/json': {
          schema: GetMeResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// Apply auth middleware to /api/me endpoint
app.use('/api/me', jwtAuth);

app.openapi(getMeRoute, (c) => {
  const user = c.get('user') as { id: string; name: string; email: string; emailVerified: boolean; image: string | null; role: string; createdAt: Date; updatedAt: Date };
  return c.json({ user }, 200);
});

// Admin-only route - get all users
const getUsersRoute = createRoute({
  method: 'get',
  path: '/api/users',
  tags: ['Admin'],
  summary: 'Get all users',
  description: 'Get all users (admin only)',
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: 'List of all users',
      content: {
        'application/json': {
          schema: GetUsersResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden - Admin access required',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

// Apply auth and admin middleware to /api/users endpoint
app.use('/api/users', jwtAuth, requireAdmin);

app.openapi(getUsersRoute, async (c) => {
  try {
    const users = await getUserRepository().findAll();

    // Return only safe fields (exclude sensitive data)
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

    return c.json({ users: sanitizedUsers }, 200);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Register OpenAPI documentation endpoints
app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'SaaS Starter Kit API',
    version: '1.0.0',
    description: 'Type-safe API for the SaaS starter kit',
  },
  servers: [
    {
      url: process.env.API_URL || 'http://localhost:3001',
      description: 'Development server',
    },
  ],
  security: [{ Bearer: [] }],
});

export default app;
