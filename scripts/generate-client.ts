#!/usr/bin/env tsx
/**
 * Generate TypeScript client from OpenAPI spec
 *
 * This script:
 * 1. Imports the Hono app directly (no server needed!)
 * 2. Extracts the OpenAPI spec from the app definition
 * 3. Generates TypeScript types using openapi-typescript
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const execAsync = promisify(exec);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const SPEC_PATH = path.join(
    WORKSPACE_ROOT,
    'packages/@kit/api-client/src/generated/openapi.json',
);
const TYPES_PATH = path.join(
    WORKSPACE_ROOT,
    'packages/@kit/api-client/src/generated/openapi.ts',
);

async function main() {
    console.log('🚀 Starting OpenAPI client generation...\n');

    try {
        // Step 1: Set up stub env vars for OpenAPI generation
        // Config validation requires these, but no actual connections are made
        process.env.DATABASE_URL =
            process.env.DATABASE_URL || 'postgresql://localhost:5432/stub_db';
        process.env.BETTER_AUTH_SECRET =
            process.env.BETTER_AUTH_SECRET ||
            'stub-secret-for-openapi-generation-min-32-chars';

        // Step 2: Import the app and extract the OpenAPI spec
        console.log('📖 Extracting OpenAPI spec from app definition...');

        // Import the Hono app
        const appModule = await import('../apps/api/src/app.ts');
        const app = appModule.default;

        // Extract the OpenAPI spec by making a mock request
        // This is necessary because app.doc() metadata is only available via the endpoint
        const mockRequest = new Request('http://localhost/openapi.json');
        const response = await app.fetch(mockRequest);

        if (!response.ok) {
            throw new Error(
                `Failed to extract OpenAPI spec: ${response.statusText}`,
            );
        }

        const spec = await response.json();

        console.log('✅ OpenAPI spec extracted\n');

        // Step 2: Save the spec to a file
        console.log('💾 Saving OpenAPI spec...');
        await fs.mkdir(path.dirname(SPEC_PATH), { recursive: true });
        await fs.writeFile(SPEC_PATH, JSON.stringify(spec, null, 2), 'utf-8');
        console.log(
            `✅ Saved to ${path.relative(WORKSPACE_ROOT, SPEC_PATH)}\n`,
        );

        // Step 3: Generate TypeScript types
        console.log('🔨 Generating TypeScript types...');
        await execAsync(
            `pnpm openapi-typescript ${SPEC_PATH} -o ${TYPES_PATH}`,
            {
                cwd: WORKSPACE_ROOT,
            },
        );
        console.log(
            `✅ Types generated at ${path.relative(WORKSPACE_ROOT, TYPES_PATH)}\n`,
        );

        console.log('🎉 Client generation complete!\n');
    } catch (error) {
        console.error('❌ Error generating client:', error);
        process.exit(1);
    }
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
