import '@kit/env'; // Load environment variables
import { logger } from './services/logger';
import { buildApp } from './app';
import { config } from './config';
import { healthRoutes } from './routes/health.routes';
import { usersRoutes } from './routes/users.routes';
import { authRoutes } from './routes/auth.routes';
import { auth } from './services/auth';
import { healthService } from './health';

async function start() {
    // Run startup health checks
    // This will validate configuration and check connectivity
    // Application will start even if database is down (degraded mode)
    // BUT will block startup if critical configuration is invalid (e.g., wrong auth secret)
    try {
        await healthService.runStartupChecks();
    } catch (error) {
        logger.error({ err: error }, 'Critical configuration error - cannot start application');
        process.exit(1);
    }

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
            logger.error({ err: error }, 'Failed to merge Better Auth OpenAPI schema');
        }
    }

    try {
        await app.listen({ port: config.app.port, host: '0.0.0.0' });

        logger.info(
            {
                port: config.app.port,
                url: `http://localhost:${config.app.port}`,
                env: config.env,
            },
            'Server started',
        );

        logger.info(
            { url: `http://localhost:${config.app.port}/api/auth/*` },
            'Better Auth endpoints available',
        );

        if (config.openapi.enabled) {
            logger.info(
                {
                    docsUrl: `http://localhost:${config.app.port}/docs`,
                    specUrl: `http://localhost:${config.app.port}/docs/json`,
                },
                'API documentation available',
            );
        }
    } catch (err) {
        logger.error({ err }, 'Failed to start server');
        process.exit(1);
    }
}

start();
