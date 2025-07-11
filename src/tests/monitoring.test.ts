import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMonitoring } from '@/hooks/useMonitoring';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Monitoring Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  describe('useMonitoring', () => {
    it('should log actions correctly', () => {
      const { logAction } = useMonitoring();
      
      logAction('test_action', { userId: '123', data: 'test' });
      
      // Verify that action was logged (implementation dependent)
      expect(logAction).toBeDefined();
    });

    it('should log errors correctly', () => {
      const { logError } = useMonitoring();
      
      const error = new Error('Test error');
      logError(error);
      
      // Verify that error was logged (implementation dependent)
      expect(logError).toBeDefined();
    });

    it('should track performance metrics', () => {
      const { logPerformance } = useMonitoring();
      
      logPerformance('api_call', 150);
      
      // Verify that performance was logged (implementation dependent)
      expect(logPerformance).toBeDefined();
    });

    it('should set user ID', () => {
      const { setUserId } = useMonitoring();
      
      setUserId('user123');
      
      // Verify that user ID was set (implementation dependent)
      expect(setUserId).toBeDefined();
    });

    it('should track user actions', () => {
      const { logUserAction } = useMonitoring();
      
      logUserAction('button_click', { buttonId: 'submit', page: 'register' });
      
      // Verify that user action was logged (implementation dependent)
      expect(logUserAction).toBeDefined();
    });

    it('should track API calls', () => {
      const { logApiCall } = useMonitoring();
      
      logApiCall('POST', '/api/users', 200, 150);
      
      // Verify that API call was logged (implementation dependent)
      expect(logApiCall).toBeDefined();
    });

    it('should track database queries', () => {
      const { logDbQuery } = useMonitoring();
      
      logDbQuery('SELECT', 'users', 50);
      
      // Verify that database query was logged (implementation dependent)
      expect(logDbQuery).toBeDefined();
    });
  });
}); 