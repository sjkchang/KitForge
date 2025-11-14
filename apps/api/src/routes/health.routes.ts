import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { healthService } from '../health';
import { HealthCheckSchema } from './health.schemas';

export const healthRoutes: FastifyPluginAsync = async (app) => {
    const typedApp = app.withTypeProvider<ZodTypeProvider>();

    typedApp.get(
        '/health',
        {
            schema: {
                tags: ['System'],
                summary: 'Health check',
                description: 'Returns the health status of the API including database connectivity, auth configuration, and overall system status. Returns 200 for healthy/degraded, 503 for unhealthy.',
                response: {
                    200: HealthCheckSchema,
                    503: HealthCheckSchema,
                },
            },
        },
        async (request, reply) => {
            const health = healthService.getHealth();

            // Return 503 if system is unhealthy
            const statusCode = health.status === 'unhealthy' ? 503 : 200;

            return reply.status(statusCode).send(health);
        }
    );
};
