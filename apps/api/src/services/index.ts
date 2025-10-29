import { EmailService } from '../email/email.service';
import { createEmailProvider, type EmailProviderType } from '../email/email-provider.factory';

let emailServiceInstance: EmailService | null = null;

/**
 * Get or create the email service singleton
 */
export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    const providerType = (process.env.EMAIL_PROVIDER || 'console') as EmailProviderType;
    const defaultFrom = process.env.EMAIL_FROM || 'noreply@localhost.com';

    const provider = createEmailProvider({
      type: providerType,
      resendApiKey: process.env.RESEND_API_KEY,
    });

    emailServiceInstance = new EmailService({
      provider,
      defaultFrom,
    });
  }

  return emailServiceInstance;
}

/**
 * Reset email service instance (for testing)
 */
export function resetEmailService(): void {
  emailServiceInstance = null;
}
