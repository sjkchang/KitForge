import { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { HealthResponseSchema } from '../schemas';

export const healthRoutes: FastifyPluginAsync = async (app) => {
    const typedApp = app.withTypeProvider<ZodTypeProvider>();

    typedApp.get(
        '/health',
        {
            schema: {
                tags: ['System'],
                summary: 'Health check',
                description: 'Check if the API is running and responding to requests.',
                response: {
                    200: HealthResponseSchema,
                },
            },
        },
        async (request, reply) => {
            return reply.send({
                status: 'ok',
                timestamp: new Date().toISOString(),
            });
        }
    );
};
