/**
 * Vitest setup file
 * Runs before any tests to configure the test environment
 */

// Set required environment variables for tests
process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
process.env.BETTER_AUTH_SECRET = 'a'.repeat(32);
process.env.NODE_ENV = 'development'; // Use development for tests since we removed 'test' from enum
