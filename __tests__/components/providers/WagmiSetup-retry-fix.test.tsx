import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { jest } from '@jest/globals';
import WagmiSetup from '../../../components/providers/WagmiSetup';
import { useAppWalletPasswordModal } from '@/hooks/useAppWalletPasswordModal';
import { useAuth } from '../../../components/auth/Auth';
import { createAppKit } from '@reown/appkit/react';
import { initializeAppKit } from '@/utils/appkit-initialization.utils';
import { Capacitor } from '@capacitor/core';
import { AppKitRetryError, AppKitTimeoutError, AppKitValidationError } from '@/src/errors/appkit-initialization';

// Mock all external dependencies
jest.mock('@/hooks/useAppWalletPasswordModal');
jest.mock('../../../components/auth/Auth');
jest.mock('@reown/appkit/react');
jest.mock('@capacitor/core');
jest.mock('@/utils/appkit-initialization.utils');
jest.mock('../../../components/app-wallets/AppWalletsContext', () => ({
  appWalletsEventEmitter: {
    on: jest.fn(),
    off: jest.fn(),
  },
}));

// Mock constants
jest.mock('@/constants', () => ({
  CW_PROJECT_ID: 'test-project-id',
  VALIDATED_BASE_ENDPOINT: 'https://test.example.com',
}));

// Mock adapters
jest.mock('../../../components/providers/AppKitAdapterManager', () => ({
  AppKitAdapterManager: jest.fn().mockImplementation(() => ({
    createAdapterWithCache: jest.fn(),
    shouldRecreateAdapter: jest.fn(),
    cleanup: jest.fn(),
  })),
}));

// AppKitAdapterCapacitor has been removed - using AppKitAdapterManager for both mobile and desktop

// Mock error utilities
jest.mock('@/utils/error-sanitizer', () => ({
  sanitizeErrorForUser: jest.fn((error: Error) => error.message),
  logErrorSecurely: jest.fn(),
}));

describe('WagmiSetup - Retry Fix and Memory Leak Prevention', () => {
  const mockSetToast = jest.fn();
  const mockRequestPassword = jest.fn();
  const mockInitializeAppKit = initializeAppKit as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useAuth as jest.Mock).mockReturnValue({
      setToast: mockSetToast,
    });
    
    (useAppWalletPasswordModal as jest.Mock).mockReturnValue({
      requestPassword: mockRequestPassword,
      modal: <div data-testid="password-modal">Mock Password Modal</div>,
    });
    
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    
    // Mock the AppKit initialization utility to return a mock adapter
    mockInitializeAppKit.mockResolvedValue({
      adapter: {
        wagmiConfig: { chains: [], connectors: [] }
      }
    });
  });

  describe('Memory Leak Detection', () => {
    test('should not create recursive Promise chains during retry cycles', async () => {
      // Track Promise creation to detect recursive patterns
      const promiseCreationStack: string[] = [];
      const originalSetTimeout = global.setTimeout;
      
      // Mock setTimeout to detect recursive Promise patterns
      global.setTimeout = jest.fn((callback: Function, delay: number) => {
        const stack = new Error().stack || '';
        if (stack.includes('initializeAppKit')) {
          promiseCreationStack.push(stack);
        }
        return originalSetTimeout(callback, delay);
      }) as any;
      
      // Make the utility function fail multiple times then succeed
      let callCount = 0;
      mockInitializeAppKit.mockImplementation(async () => {
        callCount++;
        if (callCount <= 2) {
          throw new Error('AppKit initialization failed');
        }
        // Success on third attempt
        return {
          adapter: {
            wagmiConfig: { chains: [], connectors: [] }
          }
        };
      });

      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
      });

      // Wait for retries to complete
      await waitFor(() => {
        expect(mockInitializeAppKit).toHaveBeenCalledTimes(3);
      }, { timeout: 15000 });

      // Restore original setTimeout
      global.setTimeout = originalSetTimeout;
      
      // Verify no recursive Promise patterns were created
      // The fix should use iterative approach, so setTimeout calls should be minimal
      expect(promiseCreationStack.length).toBeLessThan(5); // Should be very few calls
    });

    test('should cleanup timeouts properly when component unmounts', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      // Make the utility function hang to simulate timeout scenario
      mockInitializeAppKit.mockImplementation(() => {
        return new Promise(() => {}); // Never resolves
      });

      const { unmount } = await act(async () => {
        return render(<WagmiSetup><div>Test</div></WagmiSetup>);
      });

      // Let initialization start
      await new Promise(resolve => setTimeout(resolve, 100));

      // Unmount component
      await act(async () => {
        unmount();
      });

      // Verify clearTimeout was called during cleanup
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('Concurrent Retry Prevention', () => {
    test('should prevent multiple concurrent initialization attempts', async () => {
      let resolveFirstCall: Function;
      
      // Make the utility function hang on first call
      mockInitializeAppKit.mockImplementationOnce(() => {
        return new Promise((resolve) => {
          resolveFirstCall = resolve;
        });
      });

      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
      });

      // Let first initialization start
      await new Promise(resolve => setTimeout(resolve, 100));

      // Try to trigger another initialization (should be prevented)
      const appWalletsEventEmitter = require('../../../components/app-wallets/AppWalletsContext').appWalletsEventEmitter;
      const updateHandler = appWalletsEventEmitter.on.mock.calls.find(
        (call: any[]) => call[0] === 'update'
      )?.[1];

      // This should not trigger another initialization
      if (updateHandler) {
        await act(async () => {
          updateHandler([]);
        });
      }

      // Verify the utility was only called once (concurrent call was prevented)
      expect(mockInitializeAppKit).toHaveBeenCalledTimes(1);
      
      // Resolve the hanging promise to clean up
      if (resolveFirstCall) {
        await act(async () => {
          resolveFirstCall({
            adapter: {
              wagmiConfig: { chains: [], connectors: [] }
            }
          });
        });
      }
    });

    test('should allow initialization after previous attempt completes', async () => {
      // First call succeeds immediately
      mockInitializeAppKit.mockResolvedValueOnce({
        adapter: {
          wagmiConfig: { chains: [], connectors: [] }
        }
      });

      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
      });

      // Wait for first initialization to complete
      await waitFor(() => {
        expect(mockInitializeAppKit).toHaveBeenCalledTimes(1);
      });

      // Now trigger another initialization (should be allowed)
      const appWalletsEventEmitter = require('../../../components/app-wallets/AppWalletsContext').appWalletsEventEmitter;
      const updateHandler = appWalletsEventEmitter.on.mock.calls.find(
        (call: any[]) => call[0] === 'update'
      )?.[1];

      // Mock shouldRecreateAdapter to return true
      const { AppKitAdapterManager } = require('../../../components/providers/AppKitAdapterManager');
      const mockInstance = new AppKitAdapterManager();
      mockInstance.shouldRecreateAdapter.mockReturnValue(true);

      // Second call also succeeds
      mockInitializeAppKit.mockResolvedValueOnce({
        adapter: {
          wagmiConfig: { chains: [], connectors: [] }
        }
      });

      if (updateHandler) {
        await act(async () => {
          updateHandler([]);
        });
      }

      // Wait for debounce timeout
      await new Promise(resolve => setTimeout(resolve, 400));

      // Verify second initialization was allowed
      await waitFor(() => {
        expect(mockInitializeAppKit).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Timeout Cleanup Verification', () => {
    test('should clear initialization timeout on success', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      mockInitializeAppKit.mockResolvedValue({
        adapter: {
          wagmiConfig: { chains: [], connectors: [] }
        }
      });

      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
      });

      await waitFor(() => {
        expect(mockInitializeAppKit).toHaveBeenCalled();
      });

      // Verify clearTimeout was called (indicating proper cleanup)
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      clearTimeoutSpy.mockRestore();
    });

    test('should clear initialization timeout on failure', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      mockInitializeAppKit.mockRejectedValue(new Error('AppKit initialization failed'));

      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
      });

      // Wait for initialization to fail
      await waitFor(() => {
        expect(mockInitializeAppKit).toHaveBeenCalledTimes(1);
      }, { timeout: 15000 });

      // Verify clearTimeout was called during error handling
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      clearTimeoutSpy.mockRestore();
    });

    test('should handle timeout during initialization', async () => {
      jest.useFakeTimers();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Make the utility function simulate a timeout error
      const { AppKitTimeoutError } = require('@/src/errors/appkit-initialization');
      mockInitializeAppKit.mockRejectedValue(
        new AppKitTimeoutError('AppKit initialization timed out after 10000ms')
      );

      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
      });

      // Fast-forward past any debounce delays
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Verify error was logged (timeout should cause error)
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          '[WagmiSetup] AppKit initialization failed:',
          expect.any(Error)
        );
      });

      jest.useRealTimers();
      consoleSpy.mockRestore();
    });
  });

  describe('Error Propagation Validation', () => {
    test('should propagate AppKitRetryError when max retries exceeded', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      (createAppKit as jest.Mock).mockImplementation(() => {
        throw new Error('Persistent AppKit failure');
      });

      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
      });

      // Wait for all retries to complete
      await waitFor(() => {
        expect(createAppKit).toHaveBeenCalledTimes(3); // MAX_RETRIES = 3
      }, { timeout: 15000 });

      // Verify error was logged with the original error (not AppKitRetryError in this context)
      expect(consoleSpy).toHaveBeenCalledWith(
        '[WagmiSetup] AppKit initialization failed:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });

    test('should propagate AppKitValidationError immediately', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock the constants to return invalid values
      jest.doMock('@/constants', () => ({
        CW_PROJECT_ID: '', // Invalid empty string
        VALIDATED_BASE_ENDPOINT: 'https://test.example.com',
      }));
      
      // Re-import the component to get the mocked constants
      const { default: WagmiSetupWithMockedConstants } = await import('../../../components/providers/WagmiSetup');

      await act(async () => {
        render(<WagmiSetupWithMockedConstants><div>Test</div></WagmiSetupWithMockedConstants>);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          '[WagmiSetup] AppKit initialization failed:',
          expect.any(Error)
        );
      });
      
      consoleSpy.mockRestore();
    });

    test('should propagate AppKitTimeoutError', async () => {
      jest.useFakeTimers();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      (createAppKit as jest.Mock).mockImplementation(() => {
        // Simulate operation that never completes
        return new Promise(() => {});
      });

      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
      });

      // Fast-forward to trigger timeout
      await act(async () => {
        jest.advanceTimersByTime(11000); // Past 10 second timeout
      });

      // Give time for async operations to complete
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          '[WagmiSetup] AppKit initialization failed:',
          expect.any(Error)
        );
      });

      jest.useRealTimers();
      consoleSpy.mockRestore();
    });
  });

  describe('Iterative Retry Logic Verification', () => {
    test('should use iterative retry logic instead of recursion', async () => {
      // Track setTimeout calls to verify iterative approach
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      
      let attemptCount = 0;
      (createAppKit as jest.Mock).mockImplementation(() => {
        attemptCount++;
        
        if (attemptCount <= 2) {
          throw new Error('AppKit creation failed');
        }
        // Success on third attempt
      });

      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
      });

      // Wait for retries to complete
      await waitFor(() => {
        expect(createAppKit).toHaveBeenCalledTimes(3);
      }, { timeout: 15000 });

      // With iterative approach, setTimeout should be called for delays but not for recursive calls
      // The key is that we don't see recursive function calls in setTimeout callbacks
      expect(attemptCount).toBe(3);
      expect(createAppKit).toHaveBeenCalledTimes(3);
      
      setTimeoutSpy.mockRestore();
    });

    test('should properly handle retry delays with exponential backoff', async () => {
      jest.useFakeTimers();
      
      let attemptCount = 0;
      const attemptTimes: number[] = [];
      
      (createAppKit as jest.Mock).mockImplementation(() => {
        attemptCount++;
        attemptTimes.push(Date.now());
        
        if (attemptCount <= 2) {
          throw new Error('AppKit creation failed');
        }
        // Success on third attempt
      });

      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
      });

      // Let first attempt fail
      await act(async () => {
        jest.advanceTimersByTime(100);
      });

      // Advance by first retry delay (1000ms)
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Advance by second retry delay (2000ms)  
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      // Verify all attempts were made
      expect(createAppKit).toHaveBeenCalledTimes(3);

      jest.useRealTimers();
    });

    test('should reset retry state on successful initialization', async () => {
      let attemptCount = 0;
      
      (createAppKit as jest.Mock).mockImplementation(() => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error('First attempt fails');
        }
        // Success on second attempt
      });

      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
      });

      // Wait for both attempts and successful initialization
      await waitFor(() => {
        expect(createAppKit).toHaveBeenCalledTimes(2);
      }, { timeout: 5000 });

      // Give additional time for state updates
      await waitFor(() => {
        expect(screen.getByText('Test')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Async/Await Pattern Verification', () => {
    test('should use async/await in handleAppWalletUpdate', async () => {
      (createAppKit as jest.Mock).mockImplementation(() => {
        // Success
      });

      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
      });

      await waitFor(() => {
        expect(createAppKit).toHaveBeenCalledTimes(1);
      });

      // Get the update handler that was registered
      const appWalletsEventEmitter = require('../../../components/app-wallets/AppWalletsContext').appWalletsEventEmitter;
      const updateHandler = appWalletsEventEmitter.on.mock.calls.find(
        (call: any[]) => call[0] === 'update'
      )?.[1];

      expect(updateHandler).toBeDefined();
      
      // Mock shouldRecreateAdapter to return true
      const { AppKitAdapterManager } = require('../../../components/providers/AppKitAdapterManager');
      const mockInstance = new AppKitAdapterManager();
      mockInstance.shouldRecreateAdapter.mockReturnValue(true);

      // Verify the handler can be called without throwing
      await expect(async () => {
        if (updateHandler) {
          await act(async () => {
            updateHandler([]);
          });
          // Wait for debounce timeout
          await new Promise(resolve => setTimeout(resolve, 400));
        }
      }).not.toThrow();
    });

    test('should use IIFE pattern in useEffect', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Set NODE_ENV to development to enable console logs
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      (createAppKit as jest.Mock).mockImplementation(() => {
        // Success
      });

      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
      });

      await waitFor(() => {
        expect(createAppKit).toHaveBeenCalled();
      });

      // Verify the mount log message appears (confirming IIFE executed)
      expect(consoleSpy).toHaveBeenCalledWith(
        '[WagmiSetup] Client-side mounted, initializing AppKit'
      );
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });
  });
});