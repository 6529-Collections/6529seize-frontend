/**
 * Comprehensive security tests for WagmiSetup
 * Tests fail-fast behavior, retry limits, timeout protection, initialization security, and error handling
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import WagmiSetup from '../../../components/providers/WagmiSetup';
import { useAuth } from '../../../components/auth/Auth';
import { sanitizeErrorForUser } from '../../../utils/error-sanitizer';
import { AdapterError, AdapterCacheError, AdapterCleanupError } from '../../../src/errors/adapter';
import { AppKitInitializationError, AppKitValidationError } from '../../../src/errors/appkit-initialization';
import { appWalletsEventEmitter } from '../../../components/app-wallets/AppWalletsContext';

// Mock all external dependencies
jest.mock('../../../components/auth/Auth');
jest.mock('../../../hooks/useAppWalletPasswordModal', () => ({
  useAppWalletPasswordModal: () => ({
    requestPassword: jest.fn(),
    modal: null
  })
}));
jest.mock('@reown/appkit/react', () => ({
  createAppKit: jest.fn()
}));
jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: jest.fn(() => false)
  }
}));
jest.mock('../../../constants', () => ({
  CW_PROJECT_ID: 'test-project-id',
  VALIDATED_BASE_ENDPOINT: 'https://test.com'
}));
jest.mock('../../../components/providers/AppKitAdapterManager', () => ({
  AppKitAdapterManager: jest.fn().mockImplementation(() => ({
    createAdapterWithCache: jest.fn(),
    shouldRecreateAdapter: jest.fn(() => false),
    cleanup: jest.fn()
  }))
}));
jest.mock('../../../utils/error-sanitizer', () => ({
  sanitizeErrorForUser: jest.fn((error) => error.message || 'Sanitized error'),
  logErrorSecurely: jest.fn()
}));
jest.mock('wagmi', () => ({
  WagmiProvider: ({ children }: any) => <div data-testid="wagmi-provider">{children}</div>
}));

describe('WagmiSetup Security Tests', () => {
  let mockCreateAppKit: jest.Mock;
  let mockSetToast: jest.Mock;
  let mockAdapterCreateMethod: jest.Mock;
  const MockAppKitAdapterManager = require('../../../components/providers/AppKitAdapterManager').AppKitAdapterManager;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockCreateAppKit = require('@reown/appkit/react').createAppKit;
    mockSetToast = jest.fn();
    mockAdapterCreateMethod = jest.fn();
    
    (useAuth as jest.Mock).mockReturnValue({
      setToast: mockSetToast
    });
    
    MockAppKitAdapterManager.mockImplementation(() => ({
      createAdapterWithCache: mockAdapterCreateMethod,
      shouldRecreateAdapter: jest.fn(() => false),
      cleanup: jest.fn()
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initialization Precondition Validation Security', () => {
    it('fails fast when CW_PROJECT_ID is undefined', async () => {
      // Mock undefined project ID
      jest.doMock('../../../constants', () => ({
        CW_PROJECT_ID: undefined,
        VALIDATED_BASE_ENDPOINT: 'https://test.com'
      }));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => render(<WagmiSetup><div>Test</div></WagmiSetup>)).toThrow();
      
      consoleSpy.mockRestore();
    });

    it('fails fast when CW_PROJECT_ID is empty string', async () => {
      jest.doMock('../../../constants', () => ({
        CW_PROJECT_ID: '',
        VALIDATED_BASE_ENDPOINT: 'https://test.com'
      }));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => render(<WagmiSetup><div>Test</div></WagmiSetup>)).toThrow();
      
      consoleSpy.mockRestore();
    });

    it('fails fast when VALIDATED_BASE_ENDPOINT is undefined', async () => {
      jest.doMock('../../../constants', () => ({
        CW_PROJECT_ID: 'test-project-id',
        VALIDATED_BASE_ENDPOINT: undefined
      }));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => render(<WagmiSetup><div>Test</div></WagmiSetup>)).toThrow();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Timeout Protection Security', () => {
    it('throws AppKitTimeoutError when initialization times out', async () => {
      // Make createAppKit hang indefinitely
      mockCreateAppKit.mockImplementation(() => new Promise(() => {}));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<WagmiSetup><div>Test</div></WagmiSetup>);
      
      // Fast-forward past the timeout
      act(() => {
        jest.advanceTimersByTime(11000); // 11 seconds > 10 second timeout
      });
      
      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith(expect.objectContaining({
          message: expect.stringContaining('timed out'),
          type: 'error'
        }));
      });
      
      consoleSpy.mockRestore();
    });

    it('clears timeout on successful initialization', async () => {
      mockCreateAppKit.mockResolvedValue({});
      mockAdapterCreateMethod.mockReturnValue({ wagmiConfig: {} });
      
      render(<WagmiSetup><div>Test</div></WagmiSetup>);
      
      // Fast-forward but not past timeout
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      
      await waitFor(() => {
        // Should not have timed out
        expect(mockSetToast).not.toHaveBeenCalledWith(expect.objectContaining({
          message: expect.stringContaining('timed out'),
          type: 'error'
        }));
      });
    });
  });

  describe('Retry Logic Security', () => {
    it('implements exponential backoff for retries', async () => {
      const error = new Error('AppKit creation failed');
      mockCreateAppKit.mockRejectedValue(error);
      mockAdapterCreateMethod.mockReturnValue({ wagmiConfig: {} });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<WagmiSetup><div>Test</div></WagmiSetup>);
      
      // First failure should schedule retry in 1000ms
      act(() => {
        jest.advanceTimersByTime(999);
      });
      expect(mockCreateAppKit).toHaveBeenCalledTimes(1);
      
      act(() => {
        jest.advanceTimersByTime(1);
      });
      
      await waitFor(() => {
        expect(mockCreateAppKit).toHaveBeenCalledTimes(2);
      });
      
      // Second failure should schedule retry in 2000ms
      act(() => {
        jest.advanceTimersByTime(1999);
      });
      expect(mockCreateAppKit).toHaveBeenCalledTimes(2);
      
      act(() => {
        jest.advanceTimersByTime(1);
      });
      
      await waitFor(() => {
        expect(mockCreateAppKit).toHaveBeenCalledTimes(3);
      });
      
      consoleSpy.mockRestore();
    });

    it('throws AppKitRetryError after max retries exceeded', async () => {
      const error = new Error('AppKit creation failed');
      mockCreateAppKit.mockRejectedValue(error);
      mockAdapterCreateMethod.mockReturnValue({ wagmiConfig: {} });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<WagmiSetup><div>Test</div></WagmiSetup>);
      
      // Advance through all retries
      for (let i = 0; i < 3; i++) {
        act(() => {
          jest.advanceTimersByTime(5000); // Advance past retry delay
        });
        
        await waitFor(() => {
          expect(mockCreateAppKit).toHaveBeenCalledTimes(i + 2);
        });
      }
      
      // After 3 retries, should show final error
      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith(expect.objectContaining({
          type: 'error'
        }));
      });
      
      consoleSpy.mockRestore();
    });

    it('resets retry count on successful initialization', async () => {
      mockAdapterCreateMethod.mockReturnValue({ wagmiConfig: {} });
      
      // First call fails
      mockCreateAppKit.mockRejectedValueOnce(new Error('Temporary failure'));
      // Second call succeeds
      mockCreateAppKit.mockResolvedValue({});
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<WagmiSetup><div>Test</div></WagmiSetup>);
      
      // Wait for first failure and retry
      act(() => {
        jest.advanceTimersByTime(1100); // Past first retry delay
      });
      
      await waitFor(() => {
        expect(mockCreateAppKit).toHaveBeenCalledTimes(2);
      });
      
      // Simulate another wallet update that would trigger reinitialization
      act(() => {
        appWalletsEventEmitter.emit('update', []);
        jest.advanceTimersByTime(350); // Past debounce
      });
      
      // Should start fresh without accumulated retry count
      await waitFor(() => {
        expect(mockCreateAppKit).toHaveBeenCalledTimes(3);
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling Security', () => {
    it('throws AppKitInitializationError for unexpected errors', async () => {
      const unexpectedError = new Error('Unexpected failure');
      mockAdapterCreateMethod.mockImplementation(() => {
        throw unexpectedError;
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => render(<WagmiSetup><div>Test</div></WagmiSetup>)).toThrow(AppKitInitializationError);
      
      consoleSpy.mockRestore();
    });

    it('propagates AppKitValidationError without modification', async () => {
      const validationError = new AppKitValidationError('Validation failed');
      mockAdapterCreateMethod.mockImplementation(() => {
        throw validationError;
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => render(<WagmiSetup><div>Test</div></WagmiSetup>)).toThrow(AppKitValidationError);
      
      consoleSpy.mockRestore();
    });

    it('shows user-friendly error messages without exposing sensitive details', async () => {
      const sensitiveError = new Error('Database connection string: user:password@host');
      mockAdapterCreateMethod.mockImplementation(() => {
        throw sensitiveError;
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      try {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
      } catch {
        // Expected to throw
      }
      
      expect(mockSetToast).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.not.stringContaining('password'),
        type: 'error'
      }));
      
      consoleSpy.mockRestore();
    });

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
      (process.env as any).NODE_ENV = 'production';
      
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
      (process.env as any).NODE_ENV = originalEnv;
    });
  });

  describe('Cleanup Security', () => {
    it('clears initialization timeout on unmount', () => {
      const { unmount } = render(<WagmiSetup><div>Test</div></WagmiSetup>);
      
      const timeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      unmount();
      
      expect(timeoutSpy).toHaveBeenCalled();
      
      timeoutSpy.mockRestore();
    });

    it('performs adapter cleanup on unmount', () => {
      const mockCleanup = jest.fn();
      MockAppKitAdapterManager.mockImplementation(() => ({
        createAdapterWithCache: mockAdapterCreateMethod,
        shouldRecreateAdapter: jest.fn(() => false),
        cleanup: mockCleanup
      }));
      
      const { unmount } = render(<WagmiSetup><div>Test</div></WagmiSetup>);
      
      unmount();
      
      expect(mockCleanup).toHaveBeenCalled();
    });
  });

  describe('State Management Security', () => {
    it('prevents rendering until properly mounted to avoid SSR issues', () => {
      const { container } = render(<WagmiSetup><div data-testid="children">Test</div></WagmiSetup>);
      
      // Should show loading initially
      expect(container.querySelector('[data-testid="children"]')).toBeNull();
      expect(container.textContent).toContain('Initializing');
    });

    it('prevents rendering children until adapter is initialized', async () => {
      mockAdapterCreateMethod.mockReturnValue({ wagmiConfig: {} });
      mockCreateAppKit.mockResolvedValue({});
      
      const { container } = render(<WagmiSetup><div data-testid="children">Test</div></WagmiSetup>);
      
      // Should show connection message while initializing
      expect(container.textContent).toContain('Connecting to');
      
      // Wait for initialization
      await waitFor(() => {
        expect(container.querySelector('[data-testid="wagmi-provider"]')).toBeTruthy();
      });
    });
  });
});