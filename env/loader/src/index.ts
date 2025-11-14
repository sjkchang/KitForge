import { config } from 'dotenv';
import { resolve, dirname, basename } from 'path';
import { existsSync } from 'fs';

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
 * Detect service name from current working directory
 * Maps directory names to env file names
 */
function detectServiceName(currentDir: string, workspaceRoot: string): string | null {
    const relativePath = currentDir.replace(workspaceRoot, '').replace(/^\//, '');

    // Check if we're in an app directory (apps/api, apps/web, etc.)
    if (relativePath.startsWith('apps/')) {
        const parts = relativePath.split('/');
        const appName = parts[1];
        return appName || null; // 'api', 'web', 'marketing', etc.
    }

    // Check if we're in a package directory
    if (relativePath.startsWith('packages/')) {
        return null; // Packages only get global config
    }

    return null;
}

/**
 * Load environment variables from centralized /env directory
 *
 * Loading order (later files override earlier):
 * 1. env/.env.global - Global defaults for all services
 * 2. env/.env.[service] - Service-specific configuration
 * 3. env/.env.local - Local developer overrides (gitignored)
 *
 * Each service automatically loads the appropriate files based on its directory.
 */
export function loadEnv() {
    const currentDir = process.cwd();
    const workspaceRoot = findWorkspaceRoot(currentDir);

    if (!workspaceRoot) {
        throw new Error(
            'Could not find workspace root (pnpm-workspace.yaml not found)',
        );
    }

    const envDir = resolve(workspaceRoot, 'env');
    const loadedFiles: string[] = [];

    // 1. Load global config (lowest priority)
    const globalPath = resolve(envDir, '.env.global');
    if (existsSync(globalPath)) {
        config({ path: globalPath });
        loadedFiles.push('.env.global');
    }

    // 2. Load service-specific config
    const serviceName = detectServiceName(currentDir, workspaceRoot);
    if (serviceName) {
        const servicePath = resolve(envDir, `.env.${serviceName}`);
        if (existsSync(servicePath)) {
            config({ path: servicePath, override: true });
            loadedFiles.push(`.env.${serviceName}`);
        }
    }

    // 3. Load local overrides (highest priority)
    const localPath = resolve(envDir, '.env.local');
    if (existsSync(localPath)) {
        config({ path: localPath, override: true });
        loadedFiles.push('.env.local');
    }

    // Log loaded files in development
    if (process.env.NODE_ENV !== 'production' && loadedFiles.length > 0) {
        console.log(`[env] Loaded: ${loadedFiles.join(', ')}`);
    }
}

// Auto-load when imported (convenience)
if (process.env.NODE_ENV !== 'production') {
    loadEnv();
}
