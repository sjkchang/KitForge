import { ServiceRegistry } from './registry';
import type { Services } from './types';
import { EmailService } from './email/email.service';
import { config } from '../config';

// Global registry instance
const registry = new ServiceRegistry<Services>();

// Auto-register flag
let registered = false;

/**
 * Register all application services
 *
 * This function is called automatically on first service access,
 * but can also be called explicitly at application startup.
 *
 * Services are lazily instantiated on first access based on configuration.
 */
export function registerServices(): void {
    if (registered) return;

    // Register email service based on config
    registry.register('email', () => {
        return new EmailService({
            providerType: config.email.provider.type,
            resendApiKey:
                config.email.provider.type === 'resend'
                    ? config.email.provider.api_key
                    : undefined,
            defaultFrom: config.email.from,
        });
    });

    // Future services registered here...

    registered = true;
}

/**
 * Create a proxy that auto-registers services on first access
 */
const servicesProxy = new Proxy(registry, {
    get(target, prop) {
        // Auto-register on first access
        if (!registered) {
            registerServices();
        }

        if (typeof prop === 'string') {
            // Allow access to registry methods
            if (prop in target && typeof (target as any)[prop] === 'function') {
                return (target as any)[prop].bind(target);
            }

            // Treat as service key
            return target.get(prop as keyof Services);
        }
        return undefined;
    },
}) as unknown as Services;

/**
 * Services instance - auto-registers on first access
 *
 * Usage:
 * ```typescript
 * import { services } from './services/service-registry';
 *
 * await services.email.sendEmailVerification(...);
 * ```
 *
 * Or destructure for convenience:
 * ```typescript
 * import { services } from './services/service-registry';
 * const { email } = services;
 *
 * await email.sendEmailVerification(...);
 * ```
 */
export const services = servicesProxy;

/**
 * Configure services with custom implementations (primarily for testing)
 *
 * Usage:
 * ```typescript
 * configureServices({
 *   email: mockEmailService,
 * });
 * ```
 */
export function configureServices(overrides: Partial<Services>): void {
    for (const [key, value] of Object.entries(overrides)) {
        registry.register(key as keyof Services, () => value);
    }
    registered = true;
}

/**
 * Reset all service instances (useful for testing)
 * Factories remain registered, but instances are cleared and will be recreated on next access
 */
export function resetServices(): void {
    registry.reset();
    registered = false;
}

/**
 * Get access to the underlying registry (for advanced use cases)
 */
export function getRegistry(): ServiceRegistry<Services> {
    return registry;
}
