import { describe, it, expect, beforeEach } from 'vitest';
import { ServiceRegistry } from './registry';

interface TestServices {
    foo: { value: string };
    bar: { count: number };
}

describe('ServiceRegistry', () => {
    let registry: ServiceRegistry<TestServices>;

    beforeEach(() => {
        registry = new ServiceRegistry<TestServices>();
    });

    describe('register', () => {
        it('should register a service factory', () => {
            registry.register('foo', () => ({ value: 'test' }));

            expect(registry.has('foo')).toBe(true);
        });

        it('should allow re-registration of a service', () => {
            registry.register('foo', () => ({ value: 'first' }));
            registry.register('foo', () => ({ value: 'second' }));

            const service = registry.get('foo');
            expect(service.value).toBe('second');
        });

        it('should clear cached instance on re-registration', () => {
            let callCount = 0;

            registry.register('foo', () => {
                callCount++;
                return { value: 'test' };
            });

            // First access creates instance
            registry.get('foo');
            expect(callCount).toBe(1);

            // Re-register
            registry.register('foo', () => {
                callCount++;
                return { value: 'new' };
            });

            // Next access should use new factory
            registry.get('foo');
            expect(callCount).toBe(2);
        });
    });

    describe('get', () => {
        it('should return service instance', () => {
            registry.register('foo', () => ({ value: 'test' }));

            const service = registry.get('foo');
            expect(service).toEqual({ value: 'test' });
        });

        it('should throw error if service not registered', () => {
            expect(() => registry.get('foo')).toThrow(
                'Service "foo" is not registered',
            );
        });

        it('should cache service instances (singleton behavior)', () => {
            let callCount = 0;

            registry.register('foo', () => {
                callCount++;
                return { value: 'test' };
            });

            const first = registry.get('foo');
            const second = registry.get('foo');

            expect(callCount).toBe(1);
            expect(first).toBe(second); // Same reference
        });

        it('should create different instances for different services', () => {
            registry.register('foo', () => ({ value: 'foo' }));
            registry.register('bar', () => ({ count: 42 }));

            const foo = registry.get('foo');
            const bar = registry.get('bar');

            expect(foo).toEqual({ value: 'foo' });
            expect(bar).toEqual({ count: 42 });
        });
    });

    describe('has', () => {
        it('should return true for registered service', () => {
            registry.register('foo', () => ({ value: 'test' }));

            expect(registry.has('foo')).toBe(true);
        });

        it('should return false for unregistered service', () => {
            expect(registry.has('foo')).toBe(false);
        });
    });

    describe('getRegistered', () => {
        it('should return empty array when no services registered', () => {
            expect(registry.getRegistered()).toEqual([]);
        });

        it('should return all registered service keys', () => {
            registry.register('foo', () => ({ value: 'test' }));
            registry.register('bar', () => ({ count: 42 }));

            const registered = registry.getRegistered();
            expect(registered).toHaveLength(2);
            expect(registered).toContain('foo');
            expect(registered).toContain('bar');
        });
    });

    describe('reset', () => {
        it('should clear cached instances', () => {
            let callCount = 0;

            registry.register('foo', () => {
                callCount++;
                return { value: 'test' };
            });

            // Create instance
            registry.get('foo');
            expect(callCount).toBe(1);

            // Reset
            registry.reset();

            // Should create new instance
            registry.get('foo');
            expect(callCount).toBe(2);
        });

        it('should keep factories registered', () => {
            registry.register('foo', () => ({ value: 'test' }));

            registry.reset();

            expect(registry.has('foo')).toBe(true);
        });
    });

    describe('clear', () => {
        it('should clear both factories and instances', () => {
            registry.register('foo', () => ({ value: 'test' }));
            registry.get('foo'); // Create instance

            registry.clear();

            expect(registry.has('foo')).toBe(false);
            expect(registry.getRegistered()).toEqual([]);
        });
    });
});
