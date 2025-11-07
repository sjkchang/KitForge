import { z } from 'zod';

export const HealthResponseSchema = z.object({
    status: z.literal('ok').describe('Health status of the API'),
    timestamp: z
        .string()
        .datetime()
        .describe('ISO 8601 timestamp of the health check'),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
