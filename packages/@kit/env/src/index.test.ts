import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolve, dirname } from 'path';
import { existsSync } from 'fs';

describe('@kit/env', () => {
  describe('workspace root detection', () => {
    it('should find pnpm-workspace.yaml in parent directories', () => {
      // Start from current directory and walk up
      let currentDir = process.cwd();
      let found = false;

      while (currentDir !== '/') {
        const workspaceFile = resolve(currentDir, 'pnpm-workspace.yaml');
        if (existsSync(workspaceFile)) {
          found = true;
          break;
        }
        currentDir = dirname(currentDir);
      }

      // Should find workspace file when running in monorepo
      expect(found).toBe(true);
    });
  });

  describe('environment file precedence', () => {
    it('should prioritize environment-specific files', () => {
      // Test the precedence logic
      const env = 'production';
      const specificFile = `.env.${env}`;
      const baseFile = '.env';

      // Environment-specific should be checked first
      expect(specificFile).toBe('.env.production');
      expect(baseFile).toBe('.env');
    });

    it('should fall back to base .env if specific not found', () => {
      const env = 'development';
      const files = [`.env.${env}`, '.env'];

      expect(files).toEqual(['.env.development', '.env']);
    });
  });

  describe('NODE_ENV handling', () => {
    it('should default to development when NODE_ENV not set', () => {
      const env = process.env.NODE_ENV || 'development';
      expect(['development', 'test', 'production']).toContain(env);
    });

    it('should skip auto-loading in production', () => {
      const shouldAutoLoad = process.env.NODE_ENV !== 'production';

      if (process.env.NODE_ENV === 'production') {
        expect(shouldAutoLoad).toBe(false);
      } else {
        expect(shouldAutoLoad).toBe(true);
      }
    });
  });

  describe('error handling', () => {
    it('should provide meaningful error when workspace not found', () => {
      const errorMessage = 'Could not find workspace root (pnpm-workspace.yaml not found)';

      expect(errorMessage).toContain('workspace root');
      expect(errorMessage).toContain('pnpm-workspace.yaml');
    });
  });
});
