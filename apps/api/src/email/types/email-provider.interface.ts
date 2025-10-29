/**
 * Email provider interface - abstraction for different email sending services
 */
export interface EmailProvider {
  /**
   * Send an email
   * @param params Email parameters
   * @returns Promise that resolves when email is sent
   */
  send(params: SendEmailParams): Promise<void>;
}

/**
 * Parameters for sending an email
 */
export interface SendEmailParams {
  to: string | string[];
  from: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}
