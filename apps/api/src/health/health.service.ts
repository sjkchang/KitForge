import { createDatabase } from '@kit/database';
import { logger } from '../services/logger';
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
        logger.info('Running startup health checks');

        // Check database connectivity (non-blocking)
        await this.checkDatabase();

        // Check auth configuration (non-blocking)
        await this.checkAuth();

        // Log overall status
        const overallStatus = this.getOverallStatus();
        if (overallStatus === 'healthy') {
            logger.info('All systems healthy');
        } else if (overallStatus === 'degraded') {
            logger.warn('System degraded - some features may be unavailable');
        } else {
            logger.error('System unhealthy - critical features unavailable');
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

            logger.info('Database connected');
        } catch (error) {
            this.dbStatus = 'unhealthy';
            this.dbMessage = error instanceof Error ? error.message : 'Connection failed';
            this.dbConnectedAt = undefined;

            logger.error(
                { dbMessage: this.dbMessage },
                'Database connection failed - application will start in degraded mode',
            );
            logger.warn('Features requiring database will be unavailable');
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

            logger.info('Auth configuration valid');
        } catch (error) {
            this.authStatus = 'unhealthy';

            // Check if it's the specific JWKS decryption error
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (errorMessage.includes('Failed to decrypt private key')) {
                this.authMessage = 'BETTER_AUTH_SECRET mismatch - cannot decrypt JWKS. Clear database JWKS table or use correct secret.';

                logger.error('BETTER_AUTH_SECRET mismatch - APPLICATION STARTUP BLOCKED');
                logger.error(
                    'The current BETTER_AUTH_SECRET does not match the one used to encrypt JWKS',
                );
                logger.info(
                    'To fix: 1) Use the original BETTER_AUTH_SECRET, OR 2) Clear the JWKS table in the database',
                );

                // This is a critical error - we should not start the app
                throw new Error('Critical auth configuration error - startup blocked');
            } else {
                this.authMessage = `Configuration error: ${errorMessage}`;
                logger.error({ authMessage: this.authMessage }, 'Auth configuration error');
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
