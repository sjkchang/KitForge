// Types
export type { EmailProvider, SendEmailParams } from './types/email-provider.interface';

// Providers
export { ConsoleEmailProvider } from './providers/console-email-provider';
export { ResendEmailProvider } from './providers/resend-email-provider';

// Service
export { EmailService, type EmailServiceConfig, type EmailProviderType } from './email.service';

// Templates
export {
  renderEmailVerification,
  type EmailVerificationTemplateParams,
  type RenderedEmail,
} from './templates/email-verification.template';
