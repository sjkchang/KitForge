import { describe, it, expect } from 'vitest';
import { UserEntity } from './user.entity';

describe('UserEntity', () => {
  describe('valid user data', () => {
    it('should parse valid user object', () => {
      const validUser = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        emailVerified: true,
        image: 'https://example.com/avatar.jpg',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = UserEntity.safeParse(validUser);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validUser);
      }
    });

    it('should reject null name (name is required)', () => {
      const user = {
        id: 'user-123',
        name: null,
        email: 'john@example.com',
        emailVerified: false,
        image: null,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = UserEntity.safeParse(user);
      expect(result.success).toBe(false);
    });

    it('should accept null image', () => {
      const user = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        emailVerified: false,
        image: null,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = UserEntity.safeParse(user);
      expect(result.success).toBe(true);
    });

    it('should accept admin role', () => {
      const user = {
        id: 'user-123',
        name: 'Admin User',
        email: 'admin@example.com',
        emailVerified: true,
        image: null,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = UserEntity.safeParse(user);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid user data', () => {
    it('should reject missing required fields', () => {
      const invalidUser = {
        id: 'user-123',
        email: 'john@example.com',
        // Missing other required fields
      };

      const result = UserEntity.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const user = {
        id: 'user-123',
        name: 'John Doe',
        email: 'not-an-email',
        emailVerified: false,
        image: null,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = UserEntity.safeParse(user);
      expect(result.success).toBe(false);
    });

    it('should reject non-string id', () => {
      const user = {
        id: 123, // Should be string
        name: 'John Doe',
        email: 'john@example.com',
        emailVerified: false,
        image: null,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = UserEntity.safeParse(user);
      expect(result.success).toBe(false);
    });

    it('should reject non-boolean emailVerified', () => {
      const user = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        emailVerified: 'true', // Should be boolean
        image: null,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = UserEntity.safeParse(user);
      expect(result.success).toBe(false);
    });

    it('should reject invalid date types', () => {
      const user = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        emailVerified: false,
        image: null,
        role: 'user',
        createdAt: '2024-01-01', // Should be Date object
        updatedAt: new Date(),
      };

      const result = UserEntity.safeParse(user);
      expect(result.success).toBe(false);
    });
  });

  describe('type coercion', () => {
    it('should handle string dates if coercion is needed', () => {
      // Note: By default, Zod doesn't coerce strings to dates
      // This test documents current behavior
      const user = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        emailVerified: false,
        image: null,
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = UserEntity.safeParse(user);
      // Should fail without coercion
      expect(result.success).toBe(false);
    });
  });
});
