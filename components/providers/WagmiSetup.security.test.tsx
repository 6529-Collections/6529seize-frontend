/**
 * Security-focused tests for WagmiSetup
 * Tests fail-fast behavior, retry limits, timeout protection, and initialization security
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import WagmiSetup from './WagmiSetup';
import { AppKitInitializationError, AppKitValidationError, AppKitTimeoutError, AppKitRetryError } from '@/src/errors/appkit-initialization';
import { appWalletsEventEmitter } from '../app-wallets/AppWalletsContext';

// Mock all external dependencies
jest.mock('@reown/appkit/react', () => ({
  createAppKit: jest.fn()
}));

jest.mock('@/constants', () => ({
  CW_PROJECT_ID: 'test-project-id',
  VALIDATED_BASE_ENDPOINT: 'https://test.com'
}));

jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => false
  }
}));

jest.mock('../auth/Auth', () => ({
  useAuth: () => ({
    setToast: jest.fn()
  })
}));

jest.mock('@/hooks/useAppWalletPasswordModal', () => ({
  useAppWalletPasswordModal: () => ({
    requestPassword: jest.fn(),
    modal: null
  })
}));

jest.mock('./AppKitAdapterManager', () => ({
  AppKitAdapterManager: jest.fn().mockImplementation(() => ({
    createAdapterWithCache: jest.fn(),
    shouldRecreateAdapter: jest.fn(() => false),
    cleanup: jest.fn()
  }))
}));

// AppKitAdapterCapacitor has been removed - using AppKitAdapterManager for both mobile and desktop

jest.mock('@/utils/error-sanitizer', () => ({
  sanitizeErrorForUser: jest.fn((error) => error.message || 'Sanitized error'),
  logErrorSecurely: jest.fn()
}));

// Mock wagmi
jest.mock('wagmi', () => ({
  WagmiProvider: ({ children }: any) => <div data-testid="wagmi-provider">{children}</div>
}));

describe('WagmiSetup Security Tests', () => {
  let mockCreateAppKit: jest.Mock;
  let mockSetToast: jest.Mock;
  let mockAdapterCreateMethod: jest.Mock;
  const MockAppKitAdapterManager = require('./AppKitAdapterManager').AppKitAdapterManager;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockCreateAppKit = require('@reown/appkit/react').createAppKit;
    mockSetToast = require('../auth/Auth').useAuth().setToast;
    mockAdapterCreateMethod = jest.fn();
    
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
      jest.doMock('@/constants', () => ({
        CW_PROJECT_ID: undefined,
        VALIDATED_BASE_ENDPOINT: 'https://test.com'
      }));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => render(<WagmiSetup><div>Test</div></WagmiSetup>)).toThrow();
      
      consoleSpy.mockRestore();
    });

    it('fails fast when CW_PROJECT_ID is empty string', async () => {
      jest.doMock('@/constants', () => ({
        CW_PROJECT_ID: '',
        VALIDATED_BASE_ENDPOINT: 'https://test.com'
      }));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => render(<WagmiSetup><div>Test</div></WagmiSetup>)).toThrow();
      
      consoleSpy.mockRestore();
    });

    it('fails fast when VALIDATED_BASE_ENDPOINT is undefined', async () => {
      jest.doMock('@/constants', () => ({
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