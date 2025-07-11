import { describe, it, expect } from 'vitest';
import { 
  userSchema, 
  validateThaiPhoneNumber, 
  sanitizeInput, 
  isInputSafe,
  validateEmail,
  validateName
} from '@/utils/validation';

describe('Validation Utils', () => {
  describe('validateThaiPhoneNumber', () => {
    it('should validate correct Thai phone numbers', () => {
      expect(validateThaiPhoneNumber('0812345678')).toBe(true);
      expect(validateThaiPhoneNumber('0912345678')).toBe(true);
      expect(validateThaiPhoneNumber('0612345678')).toBe(true);
      expect(validateThaiPhoneNumber('08123456789')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validateThaiPhoneNumber('1234567890')).toBe(false);
      expect(validateThaiPhoneNumber('081234567')).toBe(false);
      expect(validateThaiPhoneNumber('081234567890')).toBe(false);
      expect(validateThaiPhoneNumber('abc1234567')).toBe(false);
      expect(validateThaiPhoneNumber('')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('alert("xss")');
      expect(sanitizeInput('Hello<script>World</script>')).toBe('HelloWorld');
      expect(sanitizeInput('Normal text')).toBe('Normal text');
    });

    it('should handle empty and null inputs', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
    });
  });

  describe('isInputSafe', () => {
    it('should detect safe inputs', () => {
      expect(isInputSafe('Hello World')).toBe(true);
      expect(isInputSafe('สวัสดี')).toBe(true);
      expect(isInputSafe('123456')).toBe(true);
    });

    it('should detect dangerous inputs', () => {
      expect(isInputSafe('<script>alert("xss")</script>')).toBe(false);
      expect(isInputSafe('javascript:alert("xss")')).toBe(false);
      expect(isInputSafe('data:text/html,<script>alert("xss")</script>')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validateName', () => {
    it('should validate correct names', () => {
      expect(validateName('John')).toBe(true);
      expect(validateName('สวัสดี')).toBe(true);
      expect(validateName('Jean-Pierre')).toBe(true);
    });

    it('should reject invalid names', () => {
      expect(validateName('')).toBe(false);
      expect(validateName('A')).toBe(false);
      expect(validateName('<script>alert("xss")</script>')).toBe(false);
    });
  });

  describe('userSchema', () => {
    it('should validate correct user data', () => {
      const validUser = {
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '0812345678',
        email: 'john@example.com',
        gender: 'male' as const,
        restroomPref: 'male' as const,
        userType: 'general' as const
      };

      const result = userSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject invalid user data', () => {
      const invalidUser = {
        firstName: '',
        lastName: 'Doe',
        phoneNumber: 'invalid',
        email: 'invalid-email',
        gender: 'invalid' as any,
        restroomPref: 'invalid' as any,
        userType: 'invalid' as any
      };

      const result = userSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });
}); 