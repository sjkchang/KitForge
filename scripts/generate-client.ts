#!/usr/bin/env tsx
/**
 * Generate TypeScript client from OpenAPI spec
 *
 * This script:
 * 1. Starts the API server temporarily
 * 2. Fetches the OpenAPI spec from /openapi.json
 * 3. Generates TypeScript types using openapi-typescript
 * 4. Shuts down the server
 */

import { exec, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const execAsync = promisify(exec);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const API_PORT = process.env.API_PORT || 3001;
const API_URL = `http://localhost:${API_PORT}`;
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

    // Step 1: Start the API server
    console.log('📡 Starting API server...');
    const apiProcess = spawn('pnpm', ['--filter', '@kit/api', 'dev'], {
        cwd: WORKSPACE_ROOT,
        stdio: 'pipe',
    });

    // Wait for server to be ready by polling the health endpoint
    let serverReady = false;
    let attempts = 0;
    const maxAttempts = 20;

    while (!serverReady && attempts < maxAttempts) {
        attempts++;
        try {
            const response = await fetch(`${API_URL}/health`);
            if (response.ok) {
                serverReady = true;
            }
        } catch (error) {
            // Server not ready yet, wait and retry
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    }

    if (!serverReady) {
        apiProcess.kill();
        throw new Error('API server did not start within 10 seconds');
    }

    console.log('✅ API server started\n');

    try {
        // Step 2: Fetch the OpenAPI spec
        console.log('📥 Fetching OpenAPI spec...');
        const response = await fetch(`${API_URL}/openapi.json`);

        if (!response.ok) {
            throw new Error(
                `Failed to fetch OpenAPI spec: ${response.statusText}`,
            );
        }

        const spec = await response.json();
        console.log('✅ OpenAPI spec fetched\n');

        // Step 3: Save the spec to a file
        console.log('💾 Saving OpenAPI spec...');
        await fs.mkdir(path.dirname(SPEC_PATH), { recursive: true });
        await fs.writeFile(SPEC_PATH, JSON.stringify(spec, null, 2), 'utf-8');
        console.log(
            `✅ Saved to ${path.relative(WORKSPACE_ROOT, SPEC_PATH)}\n`,
        );

        // Step 4: Generate TypeScript types
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
    } finally {
        // Step 5: Stop the API server
        console.log('🛑 Stopping API server...');
        apiProcess.kill();
        console.log('✅ API server stopped\n');
    }
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
