import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { config } from './config';
import { healthRoutes, usersRoutes, authRoutes, openapiRoutes } from './routes';

const app = new OpenAPIHono();

app.use(
    '*',
    cors({
        origin: config.clients.web.url,
        credentials: true,
    }),
);

// Mount routes
app.route('', healthRoutes);
app.route('/api/auth', authRoutes);
app.route('/api/v1', usersRoutes);
app.route('', openapiRoutes);

export default app;
