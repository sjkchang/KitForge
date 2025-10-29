import { describe, it, expect } from 'vitest';
import { renderEmailVerification } from './email-verification.template';

describe('renderEmailVerification', () => {
  it('should render HTML and text versions', () => {
    const result = renderEmailVerification({
      userName: 'Test User',
      verificationUrl: 'https://example.com/verify/token123',
    });

    expect(result.html).toBeDefined();
    expect(result.text).toBeDefined();
    expect(typeof result.html).toBe('string');
    expect(typeof result.text).toBe('string');
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

  it('should handle empty user name gracefully', () => {
    const result = renderEmailVerification({
      userName: '',
      verificationUrl: 'https://example.com/verify/token123',
    });

    expect(result.html).toBeDefined();
    expect(result.text).toBeDefined();
    expect(result.html).toContain('Welcome');
    expect(result.text).toContain('Welcome');
  });

  it('should have proper HTML structure', () => {
    const result = renderEmailVerification({
      userName: 'Test User',
      verificationUrl: 'https://example.com/verify/token123',
    });

    expect(result.html).toContain('<!DOCTYPE html>');
    expect(result.html).toContain('<html');
    expect(result.html).toContain('</html>');
  });

  it('should mention expiration time', () => {
    const result = renderEmailVerification({
      userName: 'Test User',
      verificationUrl: 'https://example.com/verify/token123',
    });

    expect(result.html).toContain('24 hours');
    expect(result.text).toContain('24 hours');
  });
});
