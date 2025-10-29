import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConsoleEmailProvider } from './console-email-provider';

describe('ConsoleEmailProvider', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should log email details to console', async () => {
    const provider = new ConsoleEmailProvider();

    await provider.send({
      to: 'test@example.com',
      from: 'sender@example.com',
      subject: 'Test Subject',
      html: '<p>Test HTML content</p>',
      text: 'Test plain text content',
    });

    expect(consoleLogSpy).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Would send email'));
  });

  it('should handle multiple recipients', async () => {
    const provider = new ConsoleEmailProvider();

    await provider.send({
      to: ['test1@example.com', 'test2@example.com'],
      from: 'sender@example.com',
      subject: 'Test Subject',
      html: '<p>Test HTML content</p>',
    });

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should handle optional replyTo parameter', async () => {
    const provider = new ConsoleEmailProvider();

    await provider.send({
      to: 'test@example.com',
      from: 'sender@example.com',
      subject: 'Test Subject',
      html: '<p>Test HTML content</p>',
      replyTo: 'reply@example.com',
    });

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('should not throw errors', async () => {
    const provider = new ConsoleEmailProvider();

    await expect(
      provider.send({
        to: 'test@example.com',
        from: 'sender@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
      })
    ).resolves.not.toThrow();
  });
});
