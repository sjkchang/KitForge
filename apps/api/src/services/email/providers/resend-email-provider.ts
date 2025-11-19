import { Resend } from 'resend';
import { logger } from '../../logger';
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

            logger.info({ to: params.to, subject: params.subject }, 'Email sent successfully');
        } catch (error) {
            logger.error({ err: error }, 'Failed to send email via Resend');
            throw new Error('Failed to send email');
        }
    }
}
