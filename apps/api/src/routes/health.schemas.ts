import { z } from 'zod';

export const HealthStatusSchema = z.enum(['healthy', 'degraded', 'unhealthy']);

export const HealthCheckSchema = z.object({
    status: HealthStatusSchema.describe('Overall health status of the system'),
    timestamp: z.string().describe('ISO 8601 timestamp of the health check'),
    checks: z.object({
        database: z.object({
            status: HealthStatusSchema,
            message: z.string(),
            connectedAt: z.string().optional(),
        }),
        auth: z.object({
            status: HealthStatusSchema,
            message: z.string(),
            validatedAt: z.string().optional(),
        }),
    }),
    version: z.string().describe('API version'),
});

// Legacy schema for backwards compatibility
export const HealthResponseSchema = z.object({
    status: z.literal('ok').describe('Health status of the API'),
    timestamp: z
        .string()
        .datetime()
        .describe('ISO 8601 timestamp of the health check'),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type HealthCheck = z.infer<typeof HealthCheckSchema>;
