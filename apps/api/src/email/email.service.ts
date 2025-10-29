import type { EmailProvider } from './types/email-provider.interface';
import { renderEmailVerification } from './templates/email-verification.template';
import { renderPasswordReset } from './templates/password-reset.template';

export interface EmailServiceConfig {
  provider: EmailProvider;
  defaultFrom: string;
}

/**
 * Email service - high-level email sending with templates
 * Uses email providers to actually send emails
 */
export class EmailService {
  constructor(private config: EmailServiceConfig) {}

  /**
   * Send email verification email
   */
  async sendEmailVerification(params: {
    to: string;
    userName: string;
    verificationUrl: string;
  }): Promise<void> {
    const { html, text } = renderEmailVerification({
      userName: params.userName,
      verificationUrl: params.verificationUrl,
    });

    await this.config.provider.send({
      to: params.to,
      from: this.config.defaultFrom,
      subject: 'Verify your email address',
      html,
      text,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(params: {
    to: string;
    userName: string;
    resetUrl: string;
  }): Promise<void> {
    const { html, text } = renderPasswordReset({
      userName: params.userName,
      resetUrl: params.resetUrl,
    });

    await this.config.provider.send({
      to: params.to,
      from: this.config.defaultFrom,
      subject: 'Reset your password',
      html,
      text,
    });
  }

  /**
   * Send a raw email (for custom use cases)
   */
  async sendRaw(params: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
  }): Promise<void> {
    await this.config.provider.send({
      ...params,
      from: this.config.defaultFrom,
    });
  }
}
