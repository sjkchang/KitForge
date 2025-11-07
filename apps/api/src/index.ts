import '@kit/env'; // Load environment variables
import { serve } from '@hono/node-server';
import app from './app';
import { config } from './config';

console.log(`🚀 Server starting on http://localhost:${config.app.port}`);
console.log(
    `📦 Better Auth endpoints available at http://localhost:${config.app.port}/api/auth/*`,
);
console.log(
    `📚 API documentation available at http://localhost:${config.app.port}/docs`,
);
console.log(
    `📄 OpenAPI spec available at http://localhost:${config.app.port}/openapi.json`,
);

serve({
    fetch: app.fetch,
    port: config.app.port,
});
