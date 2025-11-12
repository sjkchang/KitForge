import { OpenAPIHono } from '@hono/zod-openapi';
import { auth } from '../services/auth';

export const authRoutes = new OpenAPIHono().on(
    ['POST', 'GET'],
    '/**',
    (c) => auth.handler(c.req.raw),
);
