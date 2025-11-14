import { createDatabase } from '@kit/database';
import { config } from '../config';
import { auth } from '../services/auth';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthCheck {
    status: HealthStatus;
    timestamp: string;
    checks: {
        database: {
            status: HealthStatus;
            message: string;
            connectedAt?: string;
        };
        auth: {
            status: HealthStatus;
            message: string;
            validatedAt?: string;
        };
    };
    version: string;
}

class HealthService {
    private dbStatus: HealthStatus = 'unhealthy';
    private dbMessage: string = 'Not checked';
    private dbConnectedAt?: string;

    private authStatus: HealthStatus = 'unhealthy';
    private authMessage: string = 'Not checked';
    private authValidatedAt?: string;

    /**
     * Run startup checks without failing the application
     * This allows the app to start even if DB is down
     */
    async runStartupChecks(): Promise<void> {
        console.log('[health] Running startup health checks...');

        // Check database connectivity (non-blocking)
        await this.checkDatabase();

        // Check auth configuration (non-blocking)
        await this.checkAuth();

        // Log overall status
        const overallStatus = this.getOverallStatus();
        if (overallStatus === 'healthy') {
            console.log('[health] ✅ All systems healthy');
        } else if (overallStatus === 'degraded') {
            console.warn('[health] ⚠️  System degraded - some features may be unavailable');
        } else {
            console.error('[health] ❌ System unhealthy - critical features unavailable');
        }
    }

    /**
     * Check database connectivity
     */
    private async checkDatabase(): Promise<void> {
        try {
            const db = createDatabase(config.database.url);

            // Simple connectivity check - run a basic query
            await db.execute('SELECT 1');

            this.dbStatus = 'healthy';
            this.dbMessage = 'Connected';
            this.dbConnectedAt = new Date().toISOString();

            console.log('[health] ✅ Database: Connected');
        } catch (error) {
            this.dbStatus = 'unhealthy';
            this.dbMessage = error instanceof Error ? error.message : 'Connection failed';
            this.dbConnectedAt = undefined;

            console.error('[health] ❌ Database: Connection failed -', this.dbMessage);
            console.error('[health]    Application will start in degraded mode');
            console.error('[health]    Features requiring database will be unavailable');
        }
    }

    /**
     * Check Better Auth configuration
     * This validates the secret can decrypt existing keys
     */
    private async checkAuth(): Promise<void> {
        try {
            // Try to generate OpenAPI schema - this will fail if secret is wrong
            // @ts-ignore - Better Auth may not expose this in types
            await auth.api.generateOpenAPISchema();

            this.authStatus = 'healthy';
            this.authMessage = 'Configuration valid';
            this.authValidatedAt = new Date().toISOString();

            console.log('[health] ✅ Auth: Configuration valid');
        } catch (error) {
            this.authStatus = 'unhealthy';

            // Check if it's the specific JWKS decryption error
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (errorMessage.includes('Failed to decrypt private key')) {
                this.authMessage = 'BETTER_AUTH_SECRET mismatch - cannot decrypt JWKS. Clear database JWKS table or use correct secret.';

                console.error('[health] ❌ Auth: BETTER_AUTH_SECRET mismatch');
                console.error('[health]    The current BETTER_AUTH_SECRET does not match the one used to encrypt JWKS');
                console.error('[health]    To fix:');
                console.error('[health]    1. Use the original BETTER_AUTH_SECRET, OR');
                console.error('[health]    2. Clear the JWKS table in the database');
                console.error('[health]');
                console.error('[health]    ⛔ APPLICATION STARTUP BLOCKED - Fix auth configuration to continue');

                // This is a critical error - we should not start the app
                throw new Error('Critical auth configuration error - startup blocked');
            } else {
                this.authMessage = `Configuration error: ${errorMessage}`;
                console.error('[health] ❌ Auth: Configuration error -', this.authMessage);
            }

            this.authValidatedAt = undefined;
        }
    }

    /**
     * Get current health status
     */
    getHealth(): HealthCheck {
        return {
            status: this.getOverallStatus(),
            timestamp: new Date().toISOString(),
            checks: {
                database: {
                    status: this.dbStatus,
                    message: this.dbMessage,
                    connectedAt: this.dbConnectedAt,
                },
                auth: {
                    status: this.authStatus,
                    message: this.authMessage,
                    validatedAt: this.authValidatedAt,
                },
            },
            version: process.env.npm_package_version || '1.0.0',
        };
    }

    /**
     * Calculate overall system health
     */
    private getOverallStatus(): HealthStatus {
        // Auth must be healthy - it's critical
        if (this.authStatus === 'unhealthy') {
            return 'unhealthy';
        }

        // Database can be down (degraded mode)
        if (this.dbStatus === 'unhealthy') {
            return 'degraded';
        }

        return 'healthy';
    }

    /**
     * Check if database is available
     */
    isDatabaseAvailable(): boolean {
        return this.dbStatus === 'healthy';
    }

    /**
     * Check if auth is available
     */
    isAuthAvailable(): boolean {
        return this.authStatus === 'healthy';
    }
}

export const healthService = new HealthService();
