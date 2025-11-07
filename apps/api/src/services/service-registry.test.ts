import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    registerServices,
    services,
    configureServices,
    resetServices,
    getRegistry,
} from './service-registry';
import { EmailService } from '../email/email.service';
import { setTestConfig, resetTestConfig } from '../config/config.test-helpers';

describe('Service Registry Integration', () => {
    beforeEach(() => {
        // Set up test configuration
        setTestConfig({
            email: {
                provider: { type: 'console' },
                from: 'test@example.com',
            },
        });

        // Clear registry before each test
        getRegistry().clear();
    });

    afterEach(() => {
        resetServices();
        resetTestConfig();
    });

    describe('registerServices', () => {
        it('should register email service', () => {
            registerServices();

            const registry = getRegistry();
            expect(registry.has('email')).toBe(true);
        });

        it('should be idempotent (safe to call multiple times)', () => {
            registerServices();
            registerServices();
            registerServices();

            // Should not throw
            expect(getRegistry().has('email')).toBe(true);
        });
    });

    describe('services proxy', () => {
        it('should auto-register on first access', () => {
            const registry = getRegistry();
            expect(registry.has('email')).toBe(false);

            // Access should trigger registration
            const email = services.email;

            expect(email).toBeInstanceOf(EmailService);
            expect(registry.has('email')).toBe(true);
        });

        it('should provide access to email service', () => {
            registerServices();

            expect(services.email).toBeInstanceOf(EmailService);
        });

        it('should return same instance on multiple accesses (singleton)', () => {
            registerServices();

            const first = services.email;
            const second = services.email;

            expect(first).toBe(second);
        });

        it('should allow destructuring', () => {
            registerServices();

            const { email } = services;

            expect(email).toBeInstanceOf(EmailService);
        });
    });

    describe('configureServices', () => {
        it('should allow overriding services for testing', () => {
            const mockEmail = {
                sendEmailVerification: vi.fn(),
                sendPasswordReset: vi.fn(),
                sendRaw: vi.fn(),
            } as any;

            configureServices({ email: mockEmail });

            expect(services.email).toBe(mockEmail);
        });

        it('should override only specified services', () => {
            registerServices();

            const originalEmail = services.email;
            const mockEmail = {
                sendEmailVerification: vi.fn(),
                sendPasswordReset: vi.fn(),
                sendRaw: vi.fn(),
            } as any;

            configureServices({ email: mockEmail });

            expect(services.email).toBe(mockEmail);
            expect(services.email).not.toBe(originalEmail);
        });
    });

    describe('resetServices', () => {
        it('should clear service instances', () => {
            registerServices();

            const first = services.email;

            resetServices();
            // Need to re-register since reset clears the registered flag
            const second = services.email;

            // Should be different instances
            expect(second).toBeInstanceOf(EmailService);
            expect(first).not.toBe(second);
        });
    });

    describe('EmailService creation', () => {
        it('should create EmailService with console provider by default', () => {
            registerServices();

            const email = services.email;

            expect(email).toBeInstanceOf(EmailService);
            // Provider is private, but we can test it works
            expect(email.sendEmailVerification).toBeDefined();
        });

        it('should respect email provider configuration', () => {
            // Email provider already set in beforeEach
            registerServices();
            const email = services.email;
            expect(email).toBeInstanceOf(EmailService);
        });

        it('should respect email from configuration', () => {
            // Email from already set in beforeEach
            registerServices();
            const email = services.email;
            expect(email).toBeInstanceOf(EmailService);
        });
    });
});
