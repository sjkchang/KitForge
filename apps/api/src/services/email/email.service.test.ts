import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailService } from './email.service';
import type {
    EmailProvider,
    SendEmailParams,
} from './types/email-provider.interface';

// Mock the provider classes to avoid actual email sending
vi.mock('./providers/console-email-provider', () => ({
    ConsoleEmailProvider: class MockConsoleProvider implements EmailProvider {
        send = vi.fn().mockResolvedValue(undefined);
    },
}));

describe('EmailService', () => {
    let emailService: EmailService;
    let mockSend: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Create service with console provider (which is mocked above)
        emailService = new EmailService({
            providerType: 'console',
            defaultFrom: 'noreply@example.com',
        });

        // Access the mocked send function
        // Since we're mocking the class itself, this is type-safe
        mockSend = (emailService as any).provider.send;
    });

    describe('sendEmailVerification', () => {
        it('should send email verification with correct parameters', async () => {
            await emailService.sendEmailVerification({
                to: 'test@example.com',
                userName: 'Test User',
                verificationUrl: 'https://example.com/verify/token123',
            });

            expect(mockSend).toHaveBeenCalledWith({
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

            const sendCall = mockSend.mock.calls[0]?.[0] as SendEmailParams;
            expect(sendCall?.html).toContain(
                'https://example.com/verify/token123',
            );
            expect(sendCall?.text).toContain(
                'https://example.com/verify/token123',
            );
        });
    });

    describe('sendPasswordReset', () => {
        it('should send password reset email with correct parameters', async () => {
            await emailService.sendPasswordReset({
                to: 'test@example.com',
                userName: 'Test User',
                resetUrl: 'https://example.com/reset/token456',
            });

            expect(mockSend).toHaveBeenCalledWith({
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

            const sendCall = mockSend.mock.calls[0]?.[0] as SendEmailParams;
            expect(sendCall?.html).toContain(
                'https://example.com/reset/token456',
            );
            expect(sendCall?.text).toContain(
                'https://example.com/reset/token456',
            );
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

            expect(mockSend).toHaveBeenCalledWith({
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

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: ['test1@example.com', 'test2@example.com'],
                }),
            );
        });

        it('should support replyTo parameter', async () => {
            await emailService.sendRaw({
                to: 'test@example.com',
                subject: 'Custom Subject',
                html: '<p>Custom content</p>',
                replyTo: 'reply@example.com',
            });

            expect(mockSend).toHaveBeenCalledWith(
                expect.objectContaining({
                    replyTo: 'reply@example.com',
                }),
            );
        });
    });
});
