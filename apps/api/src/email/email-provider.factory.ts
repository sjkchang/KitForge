import type { EmailProvider } from './types/email-provider.interface';
import { ConsoleEmailProvider } from './providers/console-email-provider';
import { ResendEmailProvider } from './providers/resend-email-provider';

export type EmailProviderType = 'console' | 'resend';

export interface CreateEmailProviderOptions {
  type: EmailProviderType;
  resendApiKey?: string;
}

/**
 * Factory function to create email provider based on configuration
 */
export function createEmailProvider(
  options: CreateEmailProviderOptions
): EmailProvider {
  switch (options.type) {
    case 'console':
      return new ConsoleEmailProvider();

    case 'resend':
      if (!options.resendApiKey) {
        throw new Error('Resend API key is required for resend provider');
      }
      return new ResendEmailProvider(options.resendApiKey);

    default:
      throw new Error(`Unknown email provider type: ${options.type}`);
  }
}
