import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRateLimit } from '@/utils/rateLimiter';

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllTimers();
  });

  describe('useRateLimit', () => {
    it('should allow requests within rate limit', () => {
      const { checkRateLimit } = useRateLimit('test');
      
      const result1 = checkRateLimit('user1');
      expect(result1.allowed).toBe(true);
      
      const result2 = checkRateLimit('user1');
      expect(result2.allowed).toBe(true);
    });

    it('should block requests exceeding rate limit', () => {
      const { checkRateLimit } = useRateLimit('test', { maxRequests: 2, windowMs: 60000 });
      
      // First two requests should be allowed
      expect(checkRateLimit('user1').allowed).toBe(true);
      expect(checkRateLimit('user1').allowed).toBe(true);
      
      // Third request should be blocked
      const result = checkRateLimit('user1');
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should reset after window expires', () => {
      vi.useFakeTimers();
      
      const { checkRateLimit } = useRateLimit('test', { maxRequests: 1, windowMs: 1000 });
      
      // First request allowed
      expect(checkRateLimit('user1').allowed).toBe(true);
      
      // Second request blocked
      expect(checkRateLimit('user1').allowed).toBe(false);
      
      // Advance time by 1 second
      vi.advanceTimersByTime(1000);
      
      // Should be allowed again
      expect(checkRateLimit('user1').allowed).toBe(true);
      
      vi.useRealTimers();
    });

    it('should handle different users separately', () => {
      const { checkRateLimit } = useRateLimit('test', { maxRequests: 1, windowMs: 60000 });
      
      // User1 should be blocked after first request
      expect(checkRateLimit('user1').allowed).toBe(true);
      expect(checkRateLimit('user1').allowed).toBe(false);
      
      // User2 should still be allowed
      expect(checkRateLimit('user2').allowed).toBe(true);
    });

    it('should handle different contexts separately', () => {
      const { checkRateLimit: check1 } = useRateLimit('context1', { maxRequests: 1, windowMs: 60000 });
      const { checkRateLimit: check2 } = useRateLimit('context2', { maxRequests: 1, windowMs: 60000 });
      
      // Both contexts should allow first request
      expect(check1('user1').allowed).toBe(true);
      expect(check2('user1').allowed).toBe(true);
      
      // Both contexts should block second request
      expect(check1('user1').allowed).toBe(false);
      expect(check2('user1').allowed).toBe(false);
    });
  });
}); 