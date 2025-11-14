import { Resend } from 'resend';
import type {
    EmailProvider,
    SendEmailParams,
} from '../types/email-provider.interface';

/**
 * Resend email provider - sends emails via Resend API
 * @see https://resend.com/docs
 */
export class ResendEmailProvider implements EmailProvider {
    private resend: Resend;

    constructor(apiKey: string) {
        this.resend = new Resend(apiKey);
    }

    async send(params: SendEmailParams): Promise<void> {
        try {
            await this.resend.emails.send({
                to: params.to,
                from: params.from,
                subject: params.subject,
                html: params.html,
                text: params.text,
                replyTo: params.replyTo,
            });
        } catch (error) {
            console.error('Failed to send email via Resend:', error);
            throw new Error('Failed to send email');
        }
    }
}
