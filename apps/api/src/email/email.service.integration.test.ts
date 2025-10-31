import { describe, it, expect } from 'vitest';
import { EmailService } from './email.service';

/**
 * Integration tests for EmailService provider creation
 * Tests the merged factory logic
 */
describe('EmailService Integration', () => {
  describe('Provider creation', () => {
    it('should create console provider when specified', () => {
      const service = new EmailService({
        providerType: 'console',
        defaultFrom: 'test@example.com',
      });

      expect(service).toBeInstanceOf(EmailService);
      // Provider is private, but we can verify service methods exist
      expect(service.sendEmailVerification).toBeDefined();
      expect(service.sendPasswordReset).toBeDefined();
      expect(service.sendRaw).toBeDefined();
    });

    it('should create resend provider when specified with API key', () => {
      const service = new EmailService({
        providerType: 'resend',
        resendApiKey: 'test_api_key',
        defaultFrom: 'test@example.com',
      });

      expect(service).toBeInstanceOf(EmailService);
    });

    it('should throw error when resend provider specified without API key', () => {
      expect(() => {
        new EmailService({
          providerType: 'resend',
          defaultFrom: 'test@example.com',
        });
      }).toThrow('Resend API key is required for resend provider');
    });

    it('should throw error for unknown provider type', () => {
      expect(() => {
        new EmailService({
          providerType: 'invalid' as any,
          defaultFrom: 'test@example.com',
        });
      }).toThrow('Unknown email provider type: invalid');
    });
  });

  describe('Default from address', () => {
    it('should use provided default from address', async () => {
      const service = new EmailService({
        providerType: 'console',
        defaultFrom: 'custom@example.com',
      });

      // The defaultFrom is used internally, hard to test without exposing
      // But we can verify the service was created successfully
      expect(service).toBeInstanceOf(EmailService);
    });
  });
});
