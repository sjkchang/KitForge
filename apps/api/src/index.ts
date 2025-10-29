import '@kit/env'; // Load environment variables
import { serve } from '@hono/node-server';
import app from './app';

const port = parseInt(process.env.PORT || '3001', 10);

console.log(`🚀 Server starting on http://localhost:${port}`);
console.log(`📦 Better Auth endpoints available at http://localhost:${port}/api/auth/*`);

serve({
  fetch: app.fetch,
  port,
});
