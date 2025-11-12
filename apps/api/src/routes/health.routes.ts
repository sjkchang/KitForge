import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { HealthResponseSchema } from '../schemas';

const healthRoute = createRoute({
    method: 'get',
    path: '/health',
    operationId: 'healthCheck',
    tags: ['System'],
    summary: 'Health check',
    description: 'Check if the API is running and responding to requests.',
    responses: {
        200: {
            description: 'API is healthy and operational',
            content: {
                'application/json': {
                    schema: HealthResponseSchema,
                    example: {
                        status: 'ok',
                        timestamp: '2025-01-15T10:30:00.000Z',
                    },
                },
            },
        },
    },
    'x-codeSamples': [
        {
            lang: 'TypeScript',
            label: '@kit/api-client',
            source: `import { createApiClient } from '@kit/api-client';

const api = createApiClient();

const { data, error } = await api.GET('/health');

if (error) {
  console.error('API is down');
} else {
  console.log('Status:', data.status);
  console.log('Timestamp:', data.timestamp);
}`,
        },
        {
            lang: 'TypeScript',
            label: 'Server Component',
            source: `import { getPublicApiClient } from '@/lib/api';

export default async function HealthPage() {
  const api = getPublicApiClient();
  const { data, error } = await api.GET('/health');

  if (error || !data) {
    return <div>API is down</div>;
  }

  return (
    <div>
      <p>Status: {data.status}</p>
      <p>Last checked: {data.timestamp}</p>
    </div>
  );
}`,
        },
    ],
} as const);

export const healthRoutes = new OpenAPIHono().openapi(healthRoute, (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});
