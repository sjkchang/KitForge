import { FastifyPluginAsync } from 'fastify';
import { auth } from '../services/auth';
import { config } from '../config';

export const authRoutes: FastifyPluginAsync = async (app) => {
    // Better Auth handles all /auth/** routes
    // Hide this wildcard route from OpenAPI docs since Better Auth provides detailed routes
    app.all('/auth/*', {
        schema: {
            hide: true,
        },
    }, async (request, reply) => {
        // Convert Fastify request to Web API Request
        const url = new URL(request.url, config.app.url);
        const webRequest = new Request(url, {
            method: request.method,
            headers: request.headers as HeadersInit,
            body: request.method !== 'GET' && request.method !== 'HEAD'
                ? JSON.stringify(request.body)
                : undefined,
        });

        const response = await auth.handler(webRequest);

        // Convert Web API Response to Fastify reply
        const body = await response.text();
        response.headers.forEach((value, key) => {
            reply.header(key, value);
        });

        return reply.status(response.status).send(body);
    });
};
