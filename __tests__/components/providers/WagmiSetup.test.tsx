import React from 'react';
import { render, waitFor } from '@testing-library/react';
import WagmiSetup from '../../../components/providers/WagmiSetup';
import { useAuth } from '../../../components/auth/Auth';
import { sanitizeErrorForUser } from '../../../utils/error-sanitizer';
import { AdapterError, AdapterCacheError, AdapterCleanupError } from '../../../src/errors/adapter';

// Mock dependencies
jest.mock('../../../components/auth/Auth');
jest.mock('../../../hooks/useAppWalletPasswordModal');
jest.mock('@reown/appkit/react');
jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: jest.fn(() => false)
  }
}));

describe('WagmiSetup Security Tests', () => {
  const mockSetToast = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      setToast: mockSetToast
    });
  });

  describe('Error Handling Security', () => {
    it('should not expose internal error details via alert()', () => {
      // Spy on window.alert to ensure it's never called
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(
        <WagmiSetup>
          <div>Test Child</div>
        </WagmiSetup>
      );

      // Verify alert was never called
      expect(alertSpy).not.toHaveBeenCalled();
      
      alertSpy.mockRestore();
    });

    it('should use setToast for error notifications instead of alert()', async () => {
      render(
        <WagmiSetup>
          <div>Test Child</div>
        </WagmiSetup>
      );

      // Wait for any initialization errors
      await waitFor(() => {
        // If there were any errors during initialization, they should use setToast
        if (mockSetToast.mock.calls.length > 0) {
          expect(mockSetToast).toHaveBeenCalledWith(
            expect.objectContaining({
              type: 'error',
              message: expect.any(String)
            })
          );
        }
      });
    });
  });

  describe('Error Sanitization', () => {
    it('should sanitize AdapterError messages', () => {
      const error = new AdapterError('CACHE_001: Internal cache corruption detected');
      const sanitized = sanitizeErrorForUser(error);
      
      expect(sanitized).toBe('Wallet connection data needs to be refreshed. Please try connecting again.');
      expect(sanitized).not.toContain('CACHE_001');
      expect(sanitized).not.toContain('Internal cache corruption');
    });

    it('should sanitize AdapterCacheError messages', () => {
      const error = new AdapterCacheError('Cache read failed: Permission denied');
      const sanitized = sanitizeErrorForUser(error);
      
      expect(sanitized).toBe('Wallet connection cache needs to be cleared. Please refresh the page.');
      expect(sanitized).not.toContain('Permission denied');
    });

    it('should sanitize AdapterCleanupError messages', () => {
      const error = new AdapterCleanupError('Cleanup timeout: Process still running');
      const sanitized = sanitizeErrorForUser(error);
      
      expect(sanitized).toBe('Previous wallet connection is still being cleaned up. Please wait and try again.');
      expect(sanitized).not.toContain('Process still running');
    });

    it('should never expose JWT tokens in error messages', () => {
      const errorWithToken = new Error('Authentication failed: jwt_token=eyJ...');
      const sanitized = sanitizeErrorForUser(errorWithToken);
      
      expect(sanitized).toBe('Authentication error occurred. Please try again.');
      expect(sanitized).not.toContain('eyJ');
      expect(sanitized).not.toContain('jwt_token');
    });

    it('should never expose API keys in error messages', () => {
      const errorWithKey = new Error('API call failed: api_key=sk_1234567890abcdef');
      const sanitized = sanitizeErrorForUser(errorWithKey);
      
      expect(sanitized).toBe('Authentication error occurred. Please try again.');
      expect(sanitized).not.toContain('sk_');
      expect(sanitized).not.toContain('api_key');
    });
  });

  describe('Console Logging Security', () => {
    it('should not log sensitive information to console in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <WagmiSetup>
          <div>Test Child</div>
        </WagmiSetup>
      );

      // Check that any console.error calls don't contain sensitive patterns
      consoleErrorSpy.mock.calls.forEach(call => {
        const loggedContent = call.join(' ');
        expect(loggedContent).not.toMatch(/jwt[_-]?token/i);
        expect(loggedContent).not.toMatch(/api[_-]?key/i);
        expect(loggedContent).not.toMatch(/secret/i);
        expect(loggedContent).not.toMatch(/password/i);
      });

      consoleErrorSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });
});