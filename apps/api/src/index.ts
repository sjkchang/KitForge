import '@kit/env'; // Load environment variables
import { buildApp } from './app';
import { config } from './config';
import { healthRoutes } from './routes/health.routes';
import { usersRoutes } from './routes/users.routes';
import { authRoutes } from './routes/auth.routes';
import { auth } from './services/auth';

async function start() {
    const app = await buildApp();

    // Register routes
    await app.register(healthRoutes);
    await app.register(authRoutes, { prefix: '/api' });
    await app.register(usersRoutes, { prefix: '/api/v1' });

    // Merge Better Auth OpenAPI schema after all routes are registered
    if (config.openapi.enabled && config.openapi.include_better_auth_routes) {
        await app.ready();

        try {
            // @ts-ignore - Better Auth API types may not expose this correctly
            const betterAuthSchema = await auth.api.generateOpenAPISchema();

            // Get the current OpenAPI object
            const openapiObject = (app as any).swagger();

            // Merge Better Auth paths and update their tags
            if (betterAuthSchema.paths) {
                // Update all Better Auth paths to use "Better Auth" tag
                const updatedPaths: any = {};
                for (const [path, pathItem] of Object.entries(betterAuthSchema.paths)) {
                    const updatedPathItem: any = {};
                    for (const [method, operation] of Object.entries(pathItem as any)) {
                        if (typeof operation === 'object' && operation !== null) {
                            updatedPathItem[method] = {
                                ...operation,
                                tags: ['Better Auth'],
                            };
                        } else {
                            updatedPathItem[method] = operation;
                        }
                    }
                    updatedPaths[path] = updatedPathItem;
                }

                openapiObject.paths = {
                    ...openapiObject.paths,
                    ...updatedPaths,
                };
            }

            // Add Better Auth tag if not already present (don't merge Better Auth's default tags)
            const hasBetterAuthTag = openapiObject.tags?.some((tag: any) => tag.name === 'Better Auth');
            if (!hasBetterAuthTag) {
                openapiObject.tags = [
                    ...(openapiObject.tags || []),
                    {
                        name: 'Better Auth',
                        description: 'Authentication and session management endpoints provided by Better Auth. Includes sign-up, sign-in, sign-out, password reset, email verification, and session management.',
                    },
                ];
            }

            // Merge Better Auth components/schemas
            if (betterAuthSchema.components?.schemas) {
                openapiObject.components = openapiObject.components || {};
                openapiObject.components.schemas = {
                    ...(openapiObject.components.schemas || {}),
                    ...betterAuthSchema.components.schemas,
                };
            }
        } catch (error) {
            console.error('Failed to merge Better Auth OpenAPI schema:', error);
        }
    }

    try {
        await app.listen({ port: config.app.port, host: '0.0.0.0' });

        console.log(`🚀 Server started on http://localhost:${config.app.port}`);
        console.log(
            `📦 Better Auth endpoints available at http://localhost:${config.app.port}/api/auth/*`,
        );
        if (config.openapi.enabled) {
            console.log(
                `📚 API documentation available at http://localhost:${config.app.port}/docs`,
            );
            console.log(
                `📄 OpenAPI spec available at http://localhost:${config.app.port}/docs/json`,
            );
        }
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

start();
