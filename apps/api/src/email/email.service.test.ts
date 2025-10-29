import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailService } from './email.service';
import type { EmailProvider } from './types/email-provider.interface';

describe('EmailService', () => {
  let mockProvider: EmailProvider;
  let emailService: EmailService;

  beforeEach(() => {
    mockProvider = {
      send: vi.fn().mockResolvedValue(undefined),
    };

    emailService = new EmailService({
      provider: mockProvider,
      defaultFrom: 'noreply@example.com',
    });
  });

  describe('sendEmailVerification', () => {
    it('should send email verification with correct parameters', async () => {
      await emailService.sendEmailVerification({
        to: 'test@example.com',
        userName: 'Test User',
        verificationUrl: 'https://example.com/verify/token123',
      });

      expect(mockProvider.send).toHaveBeenCalledWith({
        to: 'test@example.com',
        from: 'noreply@example.com',
        subject: 'Verify your email address',
        html: expect.stringContaining('Test User'),
        text: expect.stringContaining('Test User'),
      });
    });

    it('should include verification URL in email', async () => {
      await emailService.sendEmailVerification({
        to: 'test@example.com',
        userName: 'Test User',
        verificationUrl: 'https://example.com/verify/token123',
      });

      const sendCall = (mockProvider.send as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
      expect(sendCall?.html).toContain('https://example.com/verify/token123');
      expect(sendCall?.text).toContain('https://example.com/verify/token123');
    });
  });

  describe('sendPasswordReset', () => {
    it('should send password reset email with correct parameters', async () => {
      await emailService.sendPasswordReset({
        to: 'test@example.com',
        userName: 'Test User',
        resetUrl: 'https://example.com/reset/token456',
      });

      expect(mockProvider.send).toHaveBeenCalledWith({
        to: 'test@example.com',
        from: 'noreply@example.com',
        subject: 'Reset your password',
        html: expect.stringContaining('Test User'),
        text: expect.stringContaining('Test User'),
      });
    });

    it('should include reset URL in email', async () => {
      await emailService.sendPasswordReset({
        to: 'test@example.com',
        userName: 'Test User',
        resetUrl: 'https://example.com/reset/token456',
      });

      const sendCall = (mockProvider.send as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
      expect(sendCall?.html).toContain('https://example.com/reset/token456');
      expect(sendCall?.text).toContain('https://example.com/reset/token456');
    });
  });

  describe('sendRaw', () => {
    it('should send raw email with provided parameters', async () => {
      await emailService.sendRaw({
        to: 'test@example.com',
        subject: 'Custom Subject',
        html: '<p>Custom content</p>',
        text: 'Custom content',
      });

      expect(mockProvider.send).toHaveBeenCalledWith({
        to: 'test@example.com',
        from: 'noreply@example.com',
        subject: 'Custom Subject',
        html: '<p>Custom content</p>',
        text: 'Custom content',
      });
    });

    it('should support multiple recipients', async () => {
      await emailService.sendRaw({
        to: ['test1@example.com', 'test2@example.com'],
        subject: 'Custom Subject',
        html: '<p>Custom content</p>',
      });

      expect(mockProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['test1@example.com', 'test2@example.com'],
        })
      );
    });

    it('should support replyTo parameter', async () => {
      await emailService.sendRaw({
        to: 'test@example.com',
        subject: 'Custom Subject',
        html: '<p>Custom content</p>',
        replyTo: 'reply@example.com',
      });

      expect(mockProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({
          replyTo: 'reply@example.com',
        })
      );
    });
  });
});
