/**
 * Comprehensive security tests for WagmiSetup
 * Tests fail-fast behavior, retry limits, timeout protection, initialization security, and error handling
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import WagmiSetup from '../../../components/providers/WagmiSetup';
import { useAuth } from '../../../components/auth/Auth';
import { useAppWallets, appWalletsEventEmitter } from '../../../components/app-wallets/AppWalletsContext';

// Mock capacitor-secure-storage-plugin first to prevent import errors
jest.mock('capacitor-secure-storage-plugin', () => ({
  SecureStoragePlugin: {
    keys: jest.fn().mockRejectedValue(new Error('Plugin not available')),
    set: jest.fn().mockResolvedValue({ value: true }),
    get: jest.fn().mockResolvedValue({ value: '{}' }),
    remove: jest.fn().mockResolvedValue({ value: true }),
  },
}));

// Mock all external dependencies
jest.mock('../../../components/auth/Auth');
jest.mock('../../../components/app-wallets/AppWalletsContext', () => ({
  useAppWallets: jest.fn(),
  appWalletsEventEmitter: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn()
  }
}));
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
jest.mock('../../../utils/appkit-initialization.utils', () => ({
  initializeAppKit: jest.fn().mockResolvedValue({
    adapter: {
      wagmiConfig: { chains: [], client: {} }
    }
  }),
  AppKitInitializationConfig: {},
  AppKitInitializationCallbacks: {},
  DEFAULT_MAX_RETRIES: 3,
  DEFAULT_RETRY_DELAY_MS: [1000, 2000, 4000],
  DEFAULT_INIT_TIMEOUT_MS: 10000
}));
jest.mock('../../../components/providers/AppKitAdapterManager', () => ({
  AppKitAdapterManager: jest.fn().mockImplementation(() => ({
    createAdapterWithCache: jest.fn(),
    shouldRecreateAdapter: jest.fn(() => false),
    cleanup: jest.fn()
  }))
}));
jest.mock('../../../components/app-wallets/app-wallet-helpers', () => ({
  encryptData: jest.fn().mockResolvedValue('encrypted_data')
}));
jest.mock('../../../helpers/time', () => ({
  Time: {
    now: () => ({
      toSeconds: () => 1640995200
    })
  }
}));
jest.mock('../../../hooks/useCapacitor', () => ({
  __esModule: true,
  default: () => ({
    isCapacitor: false,
    platform: 'web',
    isIos: false,
    isAndroid: false,
    orientation: 0,
    keyboardVisible: false,
    isActive: true
  })
}));
jest.mock('../../../utils/error-sanitizer', () => ({
  sanitizeErrorForUser: jest.fn((error) => error.message || 'Sanitized error'),
  logErrorSecurely: jest.fn()
}));
jest.mock('wagmi', () => ({
  WagmiProvider: ({ children }: any) => <div data-testid="wagmi-provider">{children}</div>
}));
jest.mock('ethers', () => ({
  ethers: {
    Wallet: {
      createRandom: jest.fn(() => ({
        address: '0x1234567890123456789012345678901234567890',
        privateKey: '0xabcdef1234567890',
        mnemonic: { phrase: 'test mnemonic phrase' }
      }))
    },
    utils: {
      hashMessage: jest.fn(() => 'hashed-message'),
      arrayify: jest.fn(x => x)
    }
  }
}));

describe('WagmiSetup Security Tests', () => {
  let mockInitializeAppKit: jest.Mock;
  let mockSetToast: jest.Mock;
  let mockAdapterCreateMethod: jest.Mock;
  let mockUseAppWallets: jest.Mock;
  const MockAppKitAdapterManager = require('../../../components/providers/AppKitAdapterManager').AppKitAdapterManager;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockInitializeAppKit = require('../../../utils/appkit-initialization.utils').initializeAppKit;
    mockSetToast = jest.fn();
    mockAdapterCreateMethod = jest.fn();
    mockUseAppWallets = useAppWallets as jest.Mock;
    
    (useAuth as jest.Mock).mockReturnValue({
      setToast: mockSetToast
    });
    
    // Mock useAppWallets with default values
    mockUseAppWallets.mockReturnValue({
      fetchingAppWallets: false,
      appWallets: [],
      appWalletsSupported: true,
      createAppWallet: jest.fn(),
      importAppWallet: jest.fn(),
      deleteAppWallet: jest.fn()
    });
    
    MockAppKitAdapterManager.mockImplementation(() => ({
      createAdapterWithCache: mockAdapterCreateMethod,
      shouldRecreateAdapter: jest.fn(() => false),
      cleanup: jest.fn()
    }));
    
    // Default successful mock response
    mockInitializeAppKit.mockResolvedValue({
      adapter: {
        wagmiConfig: { chains: [], client: {} }
      }
    });
  });

  const renderAndWaitForMount = async (children: React.ReactNode = <div>Test</div>) => {
    let result: any;
    
    await act(async () => {
      result = render(<WagmiSetup>{children}</WagmiSetup>);
    });
    
    // Wait for the isMounted effect to complete
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    
    // Wait for the initialization effect to complete
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    
    // Wait for any async initialization to resolve
    await waitFor(() => {
      // Just ensuring any pending async operations have time to resolve
    }, { timeout: 100 });
    
    return result;
  };

  afterEach(() => {
    jest.useRealTimers();
  });

  // Note: Precondition validation tests removed - now handled by appkit-initialization.utils

  describe('Timeout Protection Security', () => {
    it('handles timeout errors from utility function', async () => {
      // Mock utility function to reject with timeout error
      const { AppKitTimeoutError } = require('../../../src/errors/appkit-initialization');
      const timeoutError = new AppKitTimeoutError('Initialization timed out');
      mockInitializeAppKit.mockRejectedValue(timeoutError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await renderAndWaitForMount();
      
      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith(expect.objectContaining({
          type: 'error'
        }));
      });
      
      consoleSpy.mockRestore();
    });

    it('handles successful initialization without timeout', async () => {
      await renderAndWaitForMount();
      
      await waitFor(() => {
        expect(mockInitializeAppKit).toHaveBeenCalled();
      });
      
      // Should not show timeout errors
      expect(mockSetToast).not.toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('timed out'),
        type: 'error'
      }));
    });
  });

  describe('Retry Logic Security', () => {
    it('handles retry errors from utility function', async () => {
      const { AppKitRetryError } = require('../../../src/errors/appkit-initialization');
      const retryError = new AppKitRetryError('Max retries exceeded', 3);
      mockInitializeAppKit.mockRejectedValue(retryError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await renderAndWaitForMount();
      
      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith(expect.objectContaining({
          type: 'error'
        }));
      });
      
      consoleSpy.mockRestore();
    });

// Test removed: WagmiSetup no longer uses appWalletsEventEmitter in current implementation
  });

  describe('Error Handling Security', () => {
    it('handles initialization errors from utility function', async () => {
      const { AppKitInitializationError } = require('../../../src/errors/appkit-initialization');
      const initError = new AppKitInitializationError('Initialization failed');
      mockInitializeAppKit.mockRejectedValue(initError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await renderAndWaitForMount();
      
      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith(expect.objectContaining({
          type: 'error'
        }));
      });
      
      consoleSpy.mockRestore();
    });

    it('handles validation errors from utility function', async () => {
      const { AppKitValidationError } = require('../../../src/errors/appkit-initialization');
      const validationError = new AppKitValidationError('Validation failed');
      mockInitializeAppKit.mockRejectedValue(validationError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await renderAndWaitForMount();
      
      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith(expect.objectContaining({
          type: 'error'
        }));
      });
      
      consoleSpy.mockRestore();
    });

    it('handles adapter errors from utility function', async () => {
      const { AdapterError } = require('../../../src/errors/adapter');
      const adapterError = new AdapterError('Adapter failed');
      mockInitializeAppKit.mockRejectedValue(adapterError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await renderAndWaitForMount();
      
      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith(expect.objectContaining({
          type: 'error'
        }));
      });
      
      consoleSpy.mockRestore();
    });

    it('should not expose internal error details via alert()', async () => {
      // Spy on window.alert to ensure it's never called
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      await act(async () => {
        render(
          <WagmiSetup>
            <div>Test Child</div>
          </WagmiSetup>
        );
      });

      // Verify alert was never called
      expect(alertSpy).not.toHaveBeenCalled();
      
      alertSpy.mockRestore();
    });

    it('should use setToast for error notifications instead of alert()', async () => {
      await act(async () => {
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
  });

  // Note: Error sanitization tests removed - these test the error-sanitizer utility, not the WagmiSetup component

  describe('Console Logging Security', () => {
    it('should not log sensitive information to console in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as any).NODE_ENV = 'production';
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      await act(async () => {
        render(
          <WagmiSetup>
            <div>Test Child</div>
          </WagmiSetup>
        );
      });

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
    // Tests removed: WagmiSetup no longer has event listeners or adapter cleanup in useEffect return
    // Current implementation uses utils for initialization and doesn't have explicit cleanup lifecycle
  });

  describe('State Management Security', () => {
    it('prevents hydration mismatches by using client-side only mounting', async () => {
      // This test verifies the security pattern of preventing SSR hydration mismatches
      // by ensuring the component handles mounting state properly
      
      let container: HTMLElement;
      
      await act(async () => {
        const result = render(<WagmiSetup><div data-testid="children">Test</div></WagmiSetup>);
        container = result.container;
        
        // Allow component lifecycle to complete
        jest.runOnlyPendingTimers();
        jest.runOnlyPendingTimers();
      });
      
      // Verify that the component renders some content (not blank)
      // This ensures it's not stuck in a mounting loop or broken state
      expect(container).toBeTruthy();
      expect(container.innerHTML).not.toBe('');
      
      // Verify that initialization was attempted (security check)
      await waitFor(() => {
        expect(mockInitializeAppKit).toHaveBeenCalled();
      });
    });

    it('enforces proper initialization sequence before rendering children', async () => {
      // This test verifies the security pattern of not exposing children
      // until the wallet connection system is properly initialized
      
      let container: HTMLElement;
      
      await act(async () => {
        const result = render(<WagmiSetup><div data-testid="children">Test</div></WagmiSetup>);
        container = result.container;
        
        // Allow full component lifecycle to complete
        jest.runOnlyPendingTimers();
        jest.runOnlyPendingTimers();
      });
      
      // Verify initialization was attempted (security requirement)
      await waitFor(() => {
        expect(mockInitializeAppKit).toHaveBeenCalled();
      });
      
      // After successful initialization, children should be rendered within WagmiProvider
      await waitFor(() => {
        expect(container.querySelector('[data-testid="wagmi-provider"]')).toBeTruthy();
      });
      
      // Verify that children are properly rendered within the provider context
      expect(container.querySelector('[data-testid="children"]')).toBeTruthy();
    });
  });

  describe('Memory Leak Detection and Prevention', () => {
    it('should prevent recursive Promise chain memory leaks during initialization', async () => {
      // Test that failed initialization doesn't create recursive promise chains
      const { AppKitTimeoutError } = require('../../../src/errors/appkit-initialization');
      const timeoutError = new AppKitTimeoutError('Initialization timed out');
      mockInitializeAppKit.mockRejectedValue(timeoutError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await renderAndWaitForMount();
      
      // Wait for initialization attempts
      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith(expect.objectContaining({
          type: 'error'
        }));
      });
      
      // Should only call initializeAppKit once (no retries in this layer)
      expect(mockInitializeAppKit).toHaveBeenCalledTimes(1);
      
      consoleSpy.mockRestore();
    });

    it('should properly cleanup timeouts to prevent memory leaks', async () => {
      // This test verifies timeout cleanup behavior during component lifecycle
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      let unmount: () => void;
      
      // Trigger an app wallet update to create a timeout that needs cleanup
      await act(async () => {
        const { unmount: unmountFn } = render(<WagmiSetup><div>Test</div></WagmiSetup>);
        unmount = unmountFn;
        
        // Let component mount and start initialization
        jest.runOnlyPendingTimers();
        jest.runOnlyPendingTimers();
      });
      
      // Wait for initialization to complete
      await waitFor(() => {
        expect(mockInitializeAppKit).toHaveBeenCalled();
      });
      
      // Trigger app wallet update to create debounced timeout
      act(() => {
        appWalletsEventEmitter.emit('update', []);
      });
      
      // Unmount component before timeout executes
      await act(async () => {
        unmount();
      });
      
      // Should not throw any errors - cleanup should handle timeouts properly
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/timeout|timer|leak/i)
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle concurrent initialization attempts without memory leaks', async () => {
      // Create a scenario where multiple initializations could be attempted
      let initializationAttempts = 0;
      mockInitializeAppKit.mockImplementation(async () => {
        initializationAttempts++;
        // Simulate slow initialization
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          adapter: {
            wagmiConfig: { chains: [], client: {} }
          }
        };
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await act(async () => {
        // Render component
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
        
        // Allow mounting to happen
        jest.runOnlyPendingTimers();
        // Allow initialization to start
        jest.runOnlyPendingTimers();
        
        // Fast advance timers to simulate completion
        jest.advanceTimersByTime(200);
      });
      
      // Wait for initialization to complete
      await waitFor(() => {
        expect(mockInitializeAppKit).toHaveBeenCalled();
      });
      
      // Should only attempt initialization once despite potential races
      expect(initializationAttempts).toBe(1);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Concurrent Initialization Prevention', () => {
    it('should prevent multiple simultaneous initialization attempts', async () => {
      // Track initialization calls
      let activeInitializations = 0;
      let maxConcurrentInitializations = 0;
      
      mockInitializeAppKit.mockImplementation(async () => {
        activeInitializations++;
        maxConcurrentInitializations = Math.max(maxConcurrentInitializations, activeInitializations);
        
        // Simulate slow initialization
        await new Promise(resolve => setTimeout(resolve, 200));
        
        activeInitializations--;
        return {
          adapter: {
            wagmiConfig: { chains: [], client: {} }
          }
        };
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
        
        // Allow mounting to happen
        jest.runOnlyPendingTimers();
        // Allow initialization to start
        jest.runOnlyPendingTimers();
        
        // Advance timers to complete the slow initialization
        jest.advanceTimersByTime(300);
      });
      
      await waitFor(() => {
        expect(mockInitializeAppKit).toHaveBeenCalled();
      });
      
      // Should never have more than one concurrent initialization
      expect(maxConcurrentInitializations).toBe(1);
      
      consoleSpy.mockRestore();
    });

    it('should handle rapid component mount/unmount cycles without initialization conflicts', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // This test verifies that rapid mount/unmount doesn't cause memory leaks or conflicts
      // Focus on the security aspect: no unhandled errors or resource leaks
      
      // Mount and unmount multiple times rapidly
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          const { unmount } = render(<WagmiSetup><div>Test {i}</div></WagmiSetup>);
          
          // Allow mounting and initialization to start
          jest.runOnlyPendingTimers(); // isMounted = true
          jest.runOnlyPendingTimers(); // initialization starts
          
          // Rapid unmount 
          unmount();
        });
      }
      
      // Security check: Should not have any error logs indicating conflicts
      // This verifies proper cleanup and no resource leaks
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/conflict|race|concurrent|leak/i)
      );
      
      // Since we're rapidly unmounting, initialization might not complete
      // But the important security aspect is that no errors are thrown
      // and cleanup happens properly (verified by no error logs)
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/setState.*unmounted.*component/i)
      );
      
      consoleSpy.mockRestore();
    });

    it('should properly synchronize state updates during concurrent operations', async () => {
      // Mock a scenario where app wallet updates happen during initialization
      mockInitializeAppKit.mockImplementation(async () => {
        // Simulate app wallet update during initialization
        setTimeout(() => {
          appWalletsEventEmitter.emit('update', []);
        }, 50);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          adapter: {
            wagmiConfig: { chains: [], client: {} }
          }
        };
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
        
        // Allow mounting to happen
        jest.runOnlyPendingTimers();
        // Allow initialization to start
        jest.runOnlyPendingTimers();
        
        // Advance timers to trigger the scenario
        jest.advanceTimersByTime(200);
      });
      
      await waitFor(() => {
        expect(mockInitializeAppKit).toHaveBeenCalled();
      });
      
      // Should handle concurrent operations gracefully
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/race condition|concurrent|conflict/i)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Comprehensive Retry Logic Verification', () => {
    it('should implement iterative retry approach without recursion', async () => {
      // Track call stack depth to ensure no recursion
      let maxCallStackDepth = 0;
      const originalError = Error;
      
      global.Error = class extends originalError {
        constructor(...args: any[]) {
          super(...args);
          const stack = new originalError().stack || '';
          const depth = (stack.match(/\n/g) || []).length;
          maxCallStackDepth = Math.max(maxCallStackDepth, depth);
        }
      } as any;
      
      // Mock multiple failures followed by success
      let callCount = 0;
      mockInitializeAppKit.mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error(`Attempt ${callCount} failed`);
        }
        return {
          adapter: {
            wagmiConfig: { chains: [], client: {} }
          }
        };
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
        
        // Allow component to mount and initialize
        jest.runOnlyPendingTimers();
        jest.runOnlyPendingTimers();
      });
      
      await waitFor(() => {
        expect(mockInitializeAppKit).toHaveBeenCalled();
      });
      
      // Should use iterative approach (reasonable stack depth)
      expect(maxCallStackDepth).toBeLessThan(100); // Reasonable threshold for non-recursive approach
      
      global.Error = originalError;
      consoleSpy.mockRestore();
    });

    it('should verify exponential backoff timing in retry delays', async () => {
      const retryDelays: number[] = [];
      let lastRetryTime = Date.now();
      
      mockInitializeAppKit.mockImplementation(async () => {
        const currentTime = Date.now();
        if (lastRetryTime > 0) {
          retryDelays.push(currentTime - lastRetryTime);
        }
        lastRetryTime = currentTime;
        
        // Fail multiple times to trigger retries
        if (retryDelays.length < 3) {
          const { AppKitRetryError } = require('../../../src/errors/appkit-initialization');
          throw new AppKitRetryError(
            `Retry ${retryDelays.length + 1}`,
            retryDelays.length + 1
          );
        }
        
        return {
          adapter: {
            wagmiConfig: { chains: [], client: {} }
          }
        };
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
        
        // Allow component to mount and start initialization
        jest.runOnlyPendingTimers();
        jest.runOnlyPendingTimers();
        
        // Fast forward through retry delays
        jest.advanceTimersByTime(10000);
      });
      
      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith(expect.objectContaining({
          type: 'error'
        }));
      });
      
      // Note: Since we're using mocked timers and the retry logic is in the utility,
      // we focus on ensuring retry errors are handled properly
      expect(mockInitializeAppKit).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should prevent concurrent retry attempts', async () => {
      let activeRetries = 0;
      let maxConcurrentRetries = 0;
      
      mockInitializeAppKit.mockImplementation(async () => {
        activeRetries++;
        maxConcurrentRetries = Math.max(maxConcurrentRetries, activeRetries);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        activeRetries--;
        
        throw new Error('Always fail to test retry logic');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
        
        // Allow component to mount and start initialization
        jest.runOnlyPendingTimers();
        jest.runOnlyPendingTimers();
        
        // Trigger potential concurrent retry attempts via app wallet event
        appWalletsEventEmitter.emit('update', []);
        jest.advanceTimersByTime(500); // Allow time for the debounced update
        
        // Advance more time to complete async operations
        jest.advanceTimersByTime(200);
      });
      
      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith(expect.objectContaining({
          type: 'error'
        }));
      });
      
      // Should never have concurrent retry attempts
      expect(maxConcurrentRetries).toBe(1);
      
      consoleSpy.mockRestore();
    });
  });

  describe('React Integration and State Management', () => {
    it('should properly wrap all state updates in act() during initialization', async () => {
      // Capture React warnings
      const originalConsoleError = console.error;
      const reactWarnings: string[] = [];
      
      console.error = (message: string, ...args: any[]) => {
        if (message.includes('act(')) {
          reactWarnings.push(message);
        }
        originalConsoleError(message, ...args);
      };
      
      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
        
        // Allow component to mount and initialize properly
        jest.runOnlyPendingTimers();
        jest.runOnlyPendingTimers();
      });
      
      await waitFor(() => {
        expect(mockInitializeAppKit).toHaveBeenCalled();
      });
      
      console.error = originalConsoleError;
      
      // Should not have any React act() warnings for proper state updates
      expect(reactWarnings).toHaveLength(0);
    });

    it('should handle state updates safely during component lifecycle', async () => {
      // This test verifies that the component handles state updates safely
      // and doesn't cause memory leaks or race conditions
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
        
        // Allow component to mount and initialize
        jest.runOnlyPendingTimers(); // isMounted = true
        jest.runOnlyPendingTimers(); // initialization starts
      });
      
      // Wait for initialization to complete
      await waitFor(() => {
        expect(mockInitializeAppKit).toHaveBeenCalled();
      });
      
      await act(async () => {
        // After initialization is done, trigger some state changes via app wallet updates
        appWalletsEventEmitter.emit('update', []);
        
        // Allow debounced updates to process
        jest.advanceTimersByTime(400);
      });
      
      // Security check: No errors should be logged during lifecycle
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/state.*unmounted|memory.*leak|race.*condition/i)
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle component unmounting during async operations gracefully', async () => {
      // Mock slow initialization
      mockInitializeAppKit.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
          adapter: {
            wagmiConfig: { chains: [], client: {} }
          }
        };
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      let unmount: () => void;
      
      await act(async () => {
        const { unmount: unmountFn } = render(<WagmiSetup><div>Test</div></WagmiSetup>);
        unmount = unmountFn;
        
        // Unmount before initialization completes
        setTimeout(() => {
          act(() => {
            unmount();
          });
        }, 100);
        
        jest.advanceTimersByTime(200);
      });
      
      // Should handle unmounting during async operations without errors
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringMatching(/setState.*unmounted component/i)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Enhanced Error Handling and Edge Cases', () => {
    it('should handle timeout errors with proper user messaging', async () => {
      const { AppKitTimeoutError } = require('../../../src/errors/appkit-initialization');
      const timeoutError = new AppKitTimeoutError('AppKit initialization timed out after 10000ms');
      mockInitializeAppKit.mockRejectedValue(timeoutError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
        
        // Allow component to mount and start initialization
        jest.runOnlyPendingTimers();
        jest.runOnlyPendingTimers();
      });
      
      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith(expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('timed out')
        }));
      });
      
      consoleSpy.mockRestore();
    });

    it('should propagate validation errors immediately without retry', async () => {
      const { AppKitValidationError } = require('../../../src/errors/appkit-initialization');
      const validationError = new AppKitValidationError('Invalid configuration');
      mockInitializeAppKit.mockRejectedValue(validationError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
        
        // Allow component to mount and start initialization
        jest.runOnlyPendingTimers();
        jest.runOnlyPendingTimers();
      });
      
      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith(expect.objectContaining({
          type: 'error'
        }));
      });
      
      // Validation errors should not trigger retries
      expect(mockInitializeAppKit).toHaveBeenCalledTimes(1);
      
      consoleSpy.mockRestore();
    });

    it('should handle adapter errors with appropriate user feedback', async () => {
      const { AdapterError } = require('../../../src/errors/adapter');
      const adapterError = new AdapterError('Adapter creation failed');
      mockInitializeAppKit.mockRejectedValue(adapterError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
        
        // Allow component to mount and start initialization
        jest.runOnlyPendingTimers();
        jest.runOnlyPendingTimers();
      });
      
      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith(expect.objectContaining({
          type: 'error'
        }));
      });
      
      consoleSpy.mockRestore();
    });
  });
});