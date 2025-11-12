import type { EmailProvider } from './types/email-provider.interface';
import { ConsoleEmailProvider } from './providers/console-email-provider';
import { ResendEmailProvider } from './providers/resend-email-provider';
import { renderEmailVerification } from './templates/email-verification.template';
import { renderPasswordReset } from './templates/password-reset.template';

export type EmailProviderType = 'console' | 'resend';

export interface EmailServiceConfig {
    providerType: EmailProviderType;
    resendApiKey?: string;
    defaultFrom: string;
}

/**
 * Email service - high-level email sending with templates
 * Automatically creates the appropriate provider based on configuration
 */
export class EmailService {
    private provider: EmailProvider;
    private defaultFrom: string;

    constructor(config: EmailServiceConfig) {
        this.defaultFrom = config.defaultFrom;
        this.provider = this.createProvider(config);
    }

    /**
     * Create email provider based on configuration
     */
    private createProvider(config: EmailServiceConfig): EmailProvider {
        switch (config.providerType) {
            case 'console':
                return new ConsoleEmailProvider();

            case 'resend':
                if (!config.resendApiKey) {
                    throw new Error(
                        'Resend API key is required for resend provider',
                    );
                }
                return new ResendEmailProvider(config.resendApiKey);

            default:
                throw new Error(
                    `Unknown email provider type: ${config.providerType}`,
                );
        }
    }

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

        await this.provider.send({
            to: params.to,
            from: this.defaultFrom,
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

        await this.provider.send({
            to: params.to,
            from: this.defaultFrom,
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
        await this.provider.send({
            ...params,
            from: this.defaultFrom,
        });
    }
}
