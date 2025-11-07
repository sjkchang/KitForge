import { describe, it, expect } from 'vitest';
import { renderEmailVerification } from './email-verification.template';

describe('renderEmailVerification', () => {
    it('should render both HTML and text versions', () => {
        const result = renderEmailVerification({
            userName: 'Test User',
            verificationUrl: 'https://example.com/verify/token123',
        });

        expect(result.html).toBeDefined();
        expect(result.text).toBeDefined();
        expect(result.html.length).toBeGreaterThan(0);
        expect(result.text.length).toBeGreaterThan(0);
    });

    it('should include user name in both versions', () => {
        const result = renderEmailVerification({
            userName: 'John Doe',
            verificationUrl: 'https://example.com/verify/token123',
        });

        expect(result.html).toContain('John Doe');
        expect(result.text).toContain('John Doe');
    });

    it('should include verification URL in both versions', () => {
        const result = renderEmailVerification({
            userName: 'Test User',
            verificationUrl: 'https://example.com/verify/abc123',
        });

        expect(result.html).toContain('https://example.com/verify/abc123');
        expect(result.text).toContain('https://example.com/verify/abc123');
    });

    it('should handle empty user name', () => {
        const result = renderEmailVerification({
            userName: '',
            verificationUrl: 'https://example.com/verify/token123',
        });

        // Should still render valid content
        expect(result.html.length).toBeGreaterThan(0);
        expect(result.text.length).toBeGreaterThan(0);
        // Should still include the URL
        expect(result.html).toContain('https://example.com/verify/token123');
        expect(result.text).toContain('https://example.com/verify/token123');
    });
});
