// Types
export type { EmailProvider, SendEmailParams } from './types/email-provider.interface';

// Providers
export { ConsoleEmailProvider } from './providers/console-email-provider';
export { ResendEmailProvider } from './providers/resend-email-provider';

// Factory
export {
  createEmailProvider,
  type EmailProviderType,
  type CreateEmailProviderOptions,
} from './email-provider.factory';

// Service
export { EmailService, type EmailServiceConfig } from './email.service';

// Templates
export {
  renderEmailVerification,
  type EmailVerificationTemplateParams,
  type RenderedEmail,
} from './templates/email-verification.template';
