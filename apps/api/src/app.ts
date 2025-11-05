import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { Scalar } from '@scalar/hono-api-reference';
import { auth } from './lib/auth';
import { jwtAuth, requireAdmin } from './middleware/auth';
import { getUserRepository } from './repositories';
import {
    HealthResponseSchema,
    GetMeResponseSchema,
    GetUsersResponseSchema,
    ErrorResponseSchema,
    UnauthorizedErrorSchema,
    ForbiddenErrorSchema,
    UserSchema,
} from './schemas';

interface OpenAPISpec {
    openapi: string;
    info: { title: string; version: string; description: string };
    servers: Array<{ url: string; description: string }>;
    paths: Record<string, unknown>;
    components?: {
        schemas?: Record<string, unknown>;
        parameters?: Record<string, unknown>;
        securitySchemes?: Record<string, unknown>;
    };
    tags?: Array<{ name: string; description?: string }>;
    security?: Array<Record<string, string[]>>;
}

/**
 * Type guard to check if Better Auth API has OpenAPI plugin enabled
 */
function hasOpenAPIPlugin(api: any): api is { generateOpenAPISchema: () => Promise<OpenAPISpec> } {
    return typeof api?.generateOpenAPISchema === 'function';
}

const app = new OpenAPIHono();

app.use('*', cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));

const healthRoute = createRoute({
    method: 'get',
    path: '/health',
    operationId: 'healthCheck',
    tags: ['System'],
    summary: 'Health check',
    description: 'Check if the API is running and responding to requests.',
    responses: {
        200: {
            description: 'API is healthy and operational',
            content: {
                'application/json': {
                    schema: HealthResponseSchema,
                    example: {
                        status: 'ok',
                        timestamp: '2025-01-15T10:30:00.000Z',
                    },
                },
            },
        },
    },
});

app.openapi(healthRoute, (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.on(['POST', 'GET'], '/api/auth/**', (c) => auth.handler(c.req.raw));

const getMeRoute = createRoute({
    method: 'get',
    path: '/api/me',
    operationId: 'getCurrentUser',
    tags: ['User'],
    summary: 'Get current user',
    description: `Returns the currently authenticated user's profile information including role and email verification status.

**Use Cases:**
- Display user profile in UI
- Check user role for client-side authorization
- Verify email verification status

**Authentication:**
Requires a valid Bearer token in the Authorization header.`,
    security: [{ Bearer: [] }],
    responses: {
        200: {
            description: 'Successfully retrieved current user',
            content: {
                'application/json': {
                    schema: GetMeResponseSchema,
                    example: {
                        user: {
                            id: '550e8400-e29b-41d4-a716-446655440000',
                            name: 'John Doe',
                            email: 'john.doe@example.com',
                            emailVerified: true,
                            image: 'https://api.example.com/avatars/john.jpg',
                            role: 'user',
                            createdAt: '2025-01-15T10:30:00.000Z',
                            updatedAt: '2025-01-15T10:30:00.000Z',
                        },
                    },
                },
            },
        },
        401: {
            description: 'Authentication required - No valid session or token provided',
            content: {
                'application/json': {
                    schema: UnauthorizedErrorSchema,
                    example: {
                        error: 'Authentication required',
                        code: 'UNAUTHORIZED',
                    },
                },
            },
        },
    },
});

app.use('/api/me', jwtAuth);

app.openapi(getMeRoute, (c) => {
    const user = c.get('user') as { id: string; name: string; email: string; emailVerified: boolean; image: string | null; role: string; createdAt: Date; updatedAt: Date };
    return c.json({ user }, 200);
});

const getUsersRoute = createRoute({
    method: 'get',
    path: '/api/users',
    operationId: 'getAllUsers',
    tags: ['Admin'],
    summary: 'Get all users',
    description: `Retrieve a list of all registered users in the system.

**Requirements:**
- Admin role required
- Valid authentication token

**Use Cases:**
- User management dashboard
- System administration
- Analytics and reporting`,
    security: [{ Bearer: [] }],
    responses: {
        200: {
            description: 'Successfully retrieved list of all users',
            content: {
                'application/json': {
                    schema: GetUsersResponseSchema,
                    example: {
                        users: [
                            {
                                id: '550e8400-e29b-41d4-a716-446655440000',
                                name: 'John Doe',
                                email: 'john.doe@example.com',
                                emailVerified: true,
                                image: 'https://api.example.com/avatars/john.jpg',
                                role: 'user',
                                createdAt: '2025-01-15T10:30:00.000Z',
                                updatedAt: '2025-01-15T10:30:00.000Z',
                            },
                            {
                                id: '123e4567-e89b-12d3-a456-426614174000',
                                name: 'Jane Admin',
                                email: 'jane.admin@example.com',
                                emailVerified: true,
                                image: null,
                                role: 'admin',
                                createdAt: '2025-01-10T08:15:00.000Z',
                                updatedAt: '2025-01-14T16:20:00.000Z',
                            },
                        ],
                    },
                },
            },
        },
        401: {
            description: 'Authentication required - No valid session or token provided',
            content: {
                'application/json': {
                    schema: UnauthorizedErrorSchema,
                    example: {
                        error: 'Authentication required',
                        code: 'UNAUTHORIZED',
                    },
                },
            },
        },
        403: {
            description: 'Forbidden - Admin role required to access this endpoint',
            content: {
                'application/json': {
                    schema: ForbiddenErrorSchema,
                    example: {
                        error: 'Admin access required',
                        code: 'FORBIDDEN',
                    },
                },
            },
        },
        500: {
            description: 'Internal server error - Failed to fetch users from database',
            content: {
                'application/json': {
                    schema: ErrorResponseSchema,
                    example: {
                        error: 'Failed to fetch users',
                        code: 'INTERNAL_ERROR',
                    },
                },
            },
        },
    },
});

app.use('/api/users', jwtAuth, requireAdmin);

app.openapi(getUsersRoute, async (c) => {
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

        return c.json({ users: sanitizedUsers }, 200);
    } catch (error) {
        console.error('Failed to fetch users:', error);
        return c.json({ error: 'Failed to fetch users' }, 500);
    }
});

app.doc('/openapi.json', {
    openapi: '3.1.0',
    info: {
        title: 'SaaS Starter Kit API',
        version: '1.0.0',
        description: `A production-ready, type-safe REST API built with Hono and TypeScript.

## Features
- 🔐 JWT-based authentication with Better Auth
- 👤 User management and profiles
- 🔑 Role-based access control (RBAC)
- ✉️ Email verification and password reset
- 📝 Comprehensive OpenAPI documentation
- 🎯 End-to-end type safety with Zod validation

## Authentication

Most endpoints require authentication via Bearer token:

\`\`\`
Authorization: Bearer YOUR_JWT_TOKEN
\`\`\`

To obtain a token:
1. Sign up via POST /api/auth/sign-up/email
2. Verify your email via the verification link
3. Sign in via POST /api/auth/sign-in/email
4. Use the returned session token in the Authorization header

## Rate Limiting

API requests are rate-limited to 100 requests per minute per IP address.`,
        contact: {
            name: 'API Support',
            email: 'support@example.com',
        },
        license: {
            name: 'MIT',
        },
    },
    servers: [
        {
            url: process.env.API_URL || 'http://localhost:3001',
            description: 'Development server',
        },
        ...(process.env.PRODUCTION_API_URL
            ? [
                {
                    url: process.env.PRODUCTION_API_URL,
                    description: 'Production server',
                },
            ]
            : []),
    ],
    tags: [
        {
            name: 'System',
            description: 'System health and status endpoints',
        },
        {
            name: 'User',
            description: 'User profile and account management',
        },
        {
            name: 'Admin',
            description: 'Administrative endpoints (requires admin role)',
        },
    ],
    security: [{ Bearer: [] }],
});

app.get('/api/openapi-combined', async (c) => {
    try {
        // Fetch the main API OpenAPI spec
        const apiResponse = await fetch(`${process.env.API_URL || 'http://localhost:3001'}/openapi.json`);

        if (!apiResponse.ok) {
            console.error('Failed to fetch API spec:', apiResponse.statusText);
            return c.json({
                error: 'Failed to fetch API specification',
                details: 'Could not retrieve the OpenAPI specification from the API server'
            }, 500);
        }

        const apiSpec = await apiResponse.json() as OpenAPISpec;

        // Generate Better Auth OpenAPI spec if plugin is enabled
        if (!hasOpenAPIPlugin(auth.api)) {
            console.error('Better Auth OpenAPI plugin not enabled');
            return c.json({
                error: 'OpenAPI plugin not configured',
                details: 'The Better Auth OpenAPI plugin must be enabled in auth configuration'
            }, 500);
        }

        const authSpec = await auth.api.generateOpenAPISchema();
        const authPaths: Record<string, unknown> = {};
        for (const [path, value] of Object.entries(authSpec.paths || {})) {
            const fixedPath = path.startsWith('/') ? `/api/auth${path}` : `/api/auth/${path}`;
            const pathItem = value as Record<string, unknown>;
            const fixedPathItem: Record<string, unknown> = {};

            for (const [method, operation] of Object.entries(pathItem)) {
                const op = operation as Record<string, unknown>;
                fixedPathItem[method] = {
                    ...op,
                    tags: (op.tags as string[] || []).map(tag =>
                        tag === 'Default' ? 'Authentication' : tag
                    ),
                };
            }

            authPaths[fixedPath] = fixedPathItem;
        }

        const authTags = (authSpec.tags || []).map(tag =>
            tag.name === 'Default'
                ? { name: 'Authentication', description: 'Better Auth endpoints for user authentication and management' }
                : tag
        );
        const combined: OpenAPISpec = {
            ...apiSpec,
            paths: {
                ...apiSpec.paths,
                ...authPaths,
            },
            components: {
                schemas: {
                    ...(apiSpec.components?.schemas || {}),
                    ...(authSpec.components?.schemas || {}),
                },
                parameters: {
                    ...(apiSpec.components?.parameters || {}),
                    ...(authSpec.components?.parameters || {}),
                },
                securitySchemes: {
                    ...(apiSpec.components?.securitySchemes || {}),
                    ...(authSpec.components?.securitySchemes || {}),
                },
            },
            tags: [
                ...(apiSpec.tags || []),
                ...authTags,
            ],
        };

        return c.json(combined);
    } catch (error) {
        console.error('Error generating combined OpenAPI spec:', error);

        // Provide more detailed error information
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;

        // Log full details for debugging
        if (errorStack) {
            console.error('Stack trace:', errorStack);
        }

        return c.json({
            error: 'Failed to generate combined OpenAPI specification',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        }, 500);
    }
});

app.get(
    '/docs',
    Scalar({
        spec: {
            url: '/api/openapi-combined',
        },
        theme: 'purple',
        layout: 'modern',
        darkMode: true,
        showSidebar: true,
        authentication: {
            preferredSecurityScheme: 'Bearer',
        },
        defaultHttpClient: {
            targetKey: 'js',
            clientKey: 'fetch',
        },
        defaultOpenAllTags: false,
        hideModels: false,
        searchHotKey: 'k',
        metaData: {
            title: 'SaaS Starter Kit API Documentation',
            description: 'Type-safe REST API for the SaaS starter kit with authentication, user management, and more.',
            ogDescription: 'Complete API reference for the SaaS Starter Kit',
            ogTitle: 'SaaS Starter Kit API',
        },
    } as Parameters<typeof Scalar>[0])
);

export default app;
