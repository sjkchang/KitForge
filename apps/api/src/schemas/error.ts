import { z } from 'zod';

export const ErrorResponseSchema = z.object({
  error: z.string().describe('Human-readable error message'),
  code: z.string().optional().describe('Machine-readable error code'),
  details: z.any().optional().describe('Additional error details'),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export const ValidationErrorSchema = z.object({
  error: z.string().describe('Error message indicating validation failure'),
  code: z.string().describe('Error code'),
  details: z.array(z.object({
    field: z.string().describe('Field name that failed validation'),
    message: z.string().describe('Validation error message'),
    code: z.string().describe('Validation error code'),
  })).describe('Array of validation errors'),
});

export type ValidationError = z.infer<typeof ValidationErrorSchema>;

export const UnauthorizedErrorSchema = z.object({
  error: z.string().describe('Error message'),
  code: z.string().describe('Error code'),
});

export type UnauthorizedError = z.infer<typeof UnauthorizedErrorSchema>;

export const ForbiddenErrorSchema = z.object({
  error: z.string().describe('Error message'),
  code: z.string().describe('Error code'),
});

export type ForbiddenError = z.infer<typeof ForbiddenErrorSchema>;
