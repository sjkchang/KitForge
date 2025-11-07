/**
 * Service Registry - Centralized service management with dependency injection
 *
 * This registry pattern provides:
 * - Lazy initialization of services
 * - Type-safe service access
 * - Easy testing via service override
 * - Clear service lifecycle management
 */

export class ServiceRegistry<T extends Record<string, any>> {
    private factories = new Map<keyof T, () => any>();
    private instances = new Map<keyof T, any>();

    /**
     * Register a service factory
     * Factory functions are called lazily on first access
     */
    register<K extends keyof T>(key: K, factory: () => T[K]): void {
        this.factories.set(key, factory);
        // Clear any cached instance when re-registering
        this.instances.delete(key);
    }

    /**
     * Get a service instance (creates it on first access)
     */
    get<K extends keyof T>(key: K): T[K] {
        // Return cached instance if exists
        if (this.instances.has(key)) {
            return this.instances.get(key);
        }

        // Get factory and create instance
        const factory = this.factories.get(key);
        if (!factory) {
            throw new Error(
                `Service "${String(key)}" is not registered. ` +
                    `Did you forget to register it in registerServices()?`,
            );
        }

        const instance = factory();
        this.instances.set(key, instance);
        return instance;
    }

    /**
     * Check if a service is registered
     */
    has(key: keyof T): boolean {
        return this.factories.has(key);
    }

    /**
     * Get all registered service keys
     */
    getRegistered(): (keyof T)[] {
        return Array.from(this.factories.keys());
    }

    /**
     * Clear all cached instances (useful for testing)
     * Note: Factories remain registered
     */
    reset(): void {
        this.instances.clear();
    }

    /**
     * Clear both factories and instances (complete reset)
     */
    clear(): void {
        this.factories.clear();
        this.instances.clear();
    }
}
