import '@kit/env'; // Load environment variables
import { serve } from '@hono/node-server';
import app from './app';

const port = parseInt(process.env.PORT || '3001', 10);

console.log(`🚀 Server starting on http://localhost:${port}`);
console.log(`📦 Better Auth endpoints available at http://localhost:${port}/api/auth/*`);
console.log(`📚 API documentation available at http://localhost:${port}/docs`);
console.log(`📄 OpenAPI spec available at http://localhost:${port}/openapi.json`);

serve({
  fetch: app.fetch,
  port,
});
