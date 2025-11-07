import type {
    EmailProvider,
    SendEmailParams,
} from '../types/email-provider.interface';

/**
 * Console email provider - logs emails to console instead of sending
 * Useful for development and testing
 */
export class ConsoleEmailProvider implements EmailProvider {
    async send(params: SendEmailParams): Promise<void> {
        console.log('\n' + '='.repeat(80));
        console.log('📧 EMAIL SENT (Console Provider)');
        console.log('='.repeat(80));
        console.log(
            'To:',
            Array.isArray(params.to) ? params.to.join(', ') : params.to,
        );
        console.log('From:', params.from);
        console.log('Subject:', params.subject);
        if (params.replyTo) {
            console.log('Reply-To:', params.replyTo);
        }
        console.log('-'.repeat(80));
        console.log('TEXT VERSION:');
        console.log('-'.repeat(80));
        console.log(params.text || '(no text version)');
        console.log('-'.repeat(80));
        console.log('HTML VERSION:');
        console.log('-'.repeat(80));
        console.log(params.html);
        console.log('='.repeat(80) + '\n');
    }
}
