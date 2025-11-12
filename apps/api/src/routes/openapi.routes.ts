import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { auth } from '../services/auth';
import { config, PROJECT_CONSTANTS } from '../config';

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
function hasOpenAPIPlugin(
    api: any,
): api is { generateOpenAPISchema: () => Promise<OpenAPISpec> } {
    return typeof api?.generateOpenAPISchema === 'function';
}

export const openapiRoutes = new OpenAPIHono()
    .doc('/openapi.json', {
        openapi: '3.1.0',
        info: {
            title: `${PROJECT_CONSTANTS.name} API`,
            version: PROJECT_CONSTANTS.version,
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
                url: config.app.url,
                description:
                    config.env === 'production'
                        ? 'Production server'
                        : 'Development server',
            },
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
    })
    .get('/api/openapi-combined', async (c) => {
        try {
            // Fetch the main API OpenAPI spec
            const apiResponse = await fetch(`${config.app.url}/openapi.json`);

            if (!apiResponse.ok) {
                console.error(
                    'Failed to fetch API spec:',
                    apiResponse.statusText,
                );
                return c.json(
                    {
                        error: 'Failed to fetch API specification',
                        details:
                            'Could not retrieve the OpenAPI specification from the API server',
                    },
                    500,
                );
            }

            const apiSpec = (await apiResponse.json()) as OpenAPISpec;

            // Check if Better Auth routes should be included
            if (!config.openapi.include_better_auth_routes) {
                // Return only the main API spec without auth routes
                return c.json(apiSpec);
            }

            // Generate Better Auth OpenAPI spec if plugin is enabled
            if (!hasOpenAPIPlugin(auth.api)) {
                console.error('Better Auth OpenAPI plugin not enabled');
                return c.json(
                    {
                        error: 'OpenAPI plugin not configured',
                        details:
                            'The Better Auth OpenAPI plugin must be enabled in auth configuration',
                    },
                    500,
                );
            }

            const authSpec = await auth.api.generateOpenAPISchema();
            const authPaths: Record<string, unknown> = {};
            for (const [path, value] of Object.entries(authSpec.paths || {})) {
                const fixedPath = path.startsWith('/')
                    ? `/api/auth${path}`
                    : `/api/auth/${path}`;
                const pathItem = value as Record<string, unknown>;
                const fixedPathItem: Record<string, unknown> = {};

                for (const [method, operation] of Object.entries(pathItem)) {
                    const op = operation as Record<string, unknown>;
                    fixedPathItem[method] = {
                        ...op,
                        tags: ((op.tags as string[]) || []).map((tag) =>
                            tag === 'Default' ? 'Authentication' : tag,
                        ),
                    };
                }

                authPaths[fixedPath] = fixedPathItem;
            }

            const authTags = (authSpec.tags || []).map((tag) =>
                tag.name === 'Default'
                    ? {
                          name: 'Authentication',
                          description:
                              'Better Auth endpoints for user authentication and management',
                      }
                    : tag,
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
                tags: [...(apiSpec.tags || []), ...authTags],
            };

            return c.json(combined);
        } catch (error) {
            console.error('Error generating combined OpenAPI spec:', error);

            // Provide more detailed error information
            const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;

            // Log full details for debugging
            if (errorStack) {
                console.error('Stack trace:', errorStack);
            }

            return c.json(
                {
                    error: 'Failed to generate combined OpenAPI specification',
                    details:
                        config.env === 'development' ? errorMessage : undefined,
                },
                500,
            );
        }
    });

// Only expose OpenAPI documentation if enabled in config
if (config.openapi.enabled) {
    openapiRoutes.get(
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
                title: `${PROJECT_CONSTANTS.name} API Documentation`,
                description: `Type-safe REST API for ${PROJECT_CONSTANTS.name} with authentication, user management, and more.`,
                ogDescription: `Complete API reference for ${PROJECT_CONSTANTS.name}`,
                ogTitle: `${PROJECT_CONSTANTS.name} API`,
            },
        } as Parameters<typeof Scalar>[0]),
    );
}
