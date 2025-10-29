import { describe, it, expect } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import { user, session, account, verification, jwks } from './index';

/**
 * Schema validation tests for better-auth compatibility
 * These tests verify that our Drizzle schema matches better-auth's requirements
 * Reference: https://www.better-auth.com/docs/concepts/database
 */

describe('Better Auth Schema Validation', () => {
  describe('User Table', () => {
    it('should have all required columns', () => {
      const columns = getTableColumns(user);

      expect(columns).toHaveProperty('id');
      expect(columns).toHaveProperty('name');
      expect(columns).toHaveProperty('email');
      expect(columns).toHaveProperty('emailVerified');
      expect(columns).toHaveProperty('image');
      expect(columns).toHaveProperty('createdAt');
      expect(columns).toHaveProperty('updatedAt');
    });

    it('should have id as primary key', () => {
      const columns = getTableColumns(user);
      expect(columns.id.primary).toBe(true);
    });

    it('should have email as unique', () => {
      const columns = getTableColumns(user);
      expect(columns.email.isUnique).toBe(true);
    });
  });

  describe('Session Table', () => {
    it('should have all required columns', () => {
      const columns = getTableColumns(session);

      expect(columns).toHaveProperty('id');
      expect(columns).toHaveProperty('expiresAt');
      expect(columns).toHaveProperty('token');
      expect(columns).toHaveProperty('createdAt');
      expect(columns).toHaveProperty('updatedAt');
      expect(columns).toHaveProperty('ipAddress');
      expect(columns).toHaveProperty('userAgent');
      expect(columns).toHaveProperty('userId');
    });

    it('should have id as primary key', () => {
      const columns = getTableColumns(session);
      expect(columns.id.primary).toBe(true);
    });

    it('should have token as unique', () => {
      const columns = getTableColumns(session);
      expect(columns.token.isUnique).toBe(true);
    });

    it('should have userId reference to user table', () => {
      const columns = getTableColumns(session);
      expect(columns.userId.notNull).toBe(true);
    });
  });

  describe('Account Table', () => {
    it('should have all required columns', () => {
      const columns = getTableColumns(account);

      expect(columns).toHaveProperty('id');
      expect(columns).toHaveProperty('accountId');
      expect(columns).toHaveProperty('providerId');
      expect(columns).toHaveProperty('userId');
      expect(columns).toHaveProperty('accessToken');
      expect(columns).toHaveProperty('refreshToken');
      expect(columns).toHaveProperty('idToken');
      expect(columns).toHaveProperty('accessTokenExpiresAt');
      expect(columns).toHaveProperty('refreshTokenExpiresAt');
      expect(columns).toHaveProperty('scope');
      expect(columns).toHaveProperty('password');
      expect(columns).toHaveProperty('createdAt');
      expect(columns).toHaveProperty('updatedAt');
    });

    it('should have id as primary key', () => {
      const columns = getTableColumns(account);
      expect(columns.id.primary).toBe(true);
    });

    it('should have userId reference to user table', () => {
      const columns = getTableColumns(account);
      expect(columns.userId.notNull).toBe(true);
    });
  });

  describe('Verification Table', () => {
    it('should have all required columns', () => {
      const columns = getTableColumns(verification);

      expect(columns).toHaveProperty('id');
      expect(columns).toHaveProperty('identifier');
      expect(columns).toHaveProperty('value');
      expect(columns).toHaveProperty('expiresAt');
      expect(columns).toHaveProperty('createdAt');
      expect(columns).toHaveProperty('updatedAt');
    });

    it('should have id as primary key', () => {
      const columns = getTableColumns(verification);
      expect(columns.id.primary).toBe(true);
    });

    it('should have required fields as not null', () => {
      const columns = getTableColumns(verification);
      expect(columns.identifier.notNull).toBe(true);
      expect(columns.value.notNull).toBe(true);
      expect(columns.expiresAt.notNull).toBe(true);
    });
  });

  describe('JWKS Table (JWT Plugin)', () => {
    it('should have all required columns', () => {
      const columns = getTableColumns(jwks);

      expect(columns).toHaveProperty('id');
      expect(columns).toHaveProperty('publicKey');
      expect(columns).toHaveProperty('privateKey');
      expect(columns).toHaveProperty('createdAt');
    });

    it('should have id as primary key', () => {
      const columns = getTableColumns(jwks);
      expect(columns.id.primary).toBe(true);
    });

    it('should have required key fields as not null', () => {
      const columns = getTableColumns(jwks);
      expect(columns.publicKey.notNull).toBe(true);
      expect(columns.privateKey.notNull).toBe(true);
    });
  });
});
