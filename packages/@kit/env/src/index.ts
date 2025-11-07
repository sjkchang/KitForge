import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

/**
 * Find the workspace root by looking for pnpm-workspace.yaml
 */
function findWorkspaceRoot(startDir: string): string | null {
    let currentDir = startDir;

    while (currentDir !== '/') {
        const workspaceFile = resolve(currentDir, 'pnpm-workspace.yaml');
        if (existsSync(workspaceFile)) {
            return currentDir;
        }
        currentDir = dirname(currentDir);
    }

    return null;
}

/**
 * Load environment variables from .env file at workspace root
 * Supports different environments via NODE_ENV
 */
export function loadEnv() {
    // Get the current file's directory
    const currentDir = process.cwd();

    // Find workspace root
    const workspaceRoot = findWorkspaceRoot(currentDir);

    if (!workspaceRoot) {
        throw new Error(
            'Could not find workspace root (pnpm-workspace.yaml not found)',
        );
    }

    const env = process.env.NODE_ENV || 'development';

    // Load environment-specific .env file first (e.g., .env.production)
    const envSpecificPath = resolve(workspaceRoot, `.env.${env}`);
    if (existsSync(envSpecificPath)) {
        config({ path: envSpecificPath });
    }

    // Then load base .env file (won't override existing vars)
    const envPath = resolve(workspaceRoot, '.env');
    if (existsSync(envPath)) {
        config({ path: envPath, override: false });
    }
}

// Auto-load when imported (convenience)
if (process.env.NODE_ENV !== 'production') {
    loadEnv();
}
