import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import scalarFastify from '@scalar/fastify-api-reference';
import {
    serializerCompiler,
    validatorCompiler,
    ZodTypeProvider,
    jsonSchemaTransform
} from 'fastify-type-provider-zod';
import { config, PROJECT_CONSTANTS } from './config';
import { auth } from './services/auth';

export async function buildApp() {
    const app = Fastify({
        logger: config.env === 'development',
    }).withTypeProvider<ZodTypeProvider>();

    // Set up Zod validator and serializer
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    // CORS
    await app.register(cors, {
        origin: config.clients.web.url,
        credentials: true,
    });

    // Swagger/OpenAPI
    if (config.openapi.enabled) {
        await app.register(swagger, {
            openapi: {
                info: {
                    title: `${PROJECT_CONSTANTS.name} API`,
                    version: PROJECT_CONSTANTS.version,
                    description: `A production-ready, type-safe REST API built with Fastify and TypeScript.

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
4. Use the returned session token in the Authorization header`,
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
                        description: config.env === 'production'
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
                components: {
                    securitySchemes: {
                        Bearer: {
                            type: 'http',
                            scheme: 'bearer',
                            bearerFormat: 'JWT',
                        },
                    },
                },
            },
            transform: jsonSchemaTransform,
        });

        await app.register(scalarFastify, {
            routePrefix: '/docs',
            configuration: {
                theme: 'purple',
                layout: 'modern',
                darkMode: true,
                defaultOpenAllTags: false,
                showSidebar: true,
                hideDownloadButton: false,
                searchHotKey: 'k',
            },
        });
    }

    return app;
}

export type FastifyApp = Awaited<ReturnType<typeof buildApp>>;
