import type { EmailService } from '../email/email.service';

/**
 * Services interface - defines all available services
 *
 * Add new services here as they are created.
 * This provides type safety and autocomplete for getServices()
 */
export interface Services {
  email: EmailService;
  // Future services will be added here:
  // sms: SmsService;
  // storage: StorageService;
  // payment: PaymentService;
}
