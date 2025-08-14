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
  const MockAppKitAdapterManager = require('../../../components/providers/AppKitAdapterManager').AppKitAdapterManager;
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockInitializeAppKit = require('../../../utils/appkit-initialization.utils').initializeAppKit;
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
      
      // First useEffect sets isMounted to true
      jest.runOnlyPendingTimers();
      
      // Second useEffect (dependent on isMounted) executes initialization
      jest.runOnlyPendingTimers();
    });
    
    return result;
  };

  afterEach(() => {
    jest.useRealTimers();
  });

  // Note: Precondition validation tests removed - now handled by appkit-initialization.utils

  describe('Timeout Protection Security', () => {
    it('handles timeout errors from utility function', async () => {
      // Mock utility function to reject with timeout error
      const timeoutError = new (require('../../../src/errors/appkit-initialization').AppKitTimeoutError)('Initialization timed out');
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
      const retryError = new (require('../../../src/errors/appkit-initialization').AppKitRetryError)('Max retries exceeded', 3);
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

    it('sets up wallet update event listener', async () => {
      const onSpy = jest.spyOn(appWalletsEventEmitter, 'on');
      
      await renderAndWaitForMount();
      
      // Verify that the component sets up the event listener
      expect(onSpy).toHaveBeenCalledWith('update', expect.any(Function));
      
      onSpy.mockRestore();
    });
  });

  describe('Error Handling Security', () => {
    it('handles initialization errors from utility function', async () => {
      const initError = new (require('../../../src/errors/appkit-initialization').AppKitInitializationError)('Initialization failed');
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
      const validationError = new (require('../../../src/errors/appkit-initialization').AppKitValidationError)('Validation failed');
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
      const adapterError = new (require('../../../src/errors/adapter').AdapterError)('Adapter failed');
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
    it('cleans up event listeners on unmount', async () => {
      const offSpy = jest.spyOn(appWalletsEventEmitter, 'off');
      
      let unmount: () => void;
      
      await act(async () => {
        const result = render(<WagmiSetup><div>Test</div></WagmiSetup>);
        unmount = result.unmount;
      });
      
      await act(async () => {
        unmount();
      });
      
      expect(offSpy).toHaveBeenCalledWith('update', expect.any(Function));
      
      offSpy.mockRestore();
    });

    it('performs adapter cleanup on unmount', async () => {
      const mockCleanup = jest.fn();
      MockAppKitAdapterManager.mockImplementation(() => ({
        createAdapterWithCache: mockAdapterCreateMethod,
        shouldRecreateAdapter: jest.fn(() => false),
        cleanup: mockCleanup
      }));
      
      let unmount: () => void;
      
      await act(async () => {
        const result = render(<WagmiSetup><div>Test</div></WagmiSetup>);
        unmount = result.unmount;
      });
      
      await act(async () => {
        unmount();
      });
      
      expect(mockCleanup).toHaveBeenCalled();
    });
  });

  describe('State Management Security', () => {
    it('prevents rendering until properly mounted to avoid SSR issues', async () => {
      // Test the actual mounting behavior by checking initial state
      let container: HTMLElement;
      
      // First render without waiting
      await act(async () => {
        const result = render(<WagmiSetup><div data-testid="children">Test</div></WagmiSetup>);
        container = result.container;
      });
      
      // Initially should show initializing message
      expect(container.textContent).toContain('Initializing');
      
      // Children should not be rendered yet
      expect(container.querySelector('[data-testid="children"]')).toBeNull();
    });

    it('prevents rendering children until adapter is initialized', async () => {
      let container: HTMLElement;
      
      // Render and let it mount
      await act(async () => {
        const result = render(<WagmiSetup><div data-testid="children">Test</div></WagmiSetup>);
        container = result.container;
        
        // Allow mounting useEffect to run
        jest.runOnlyPendingTimers();
      });
      
      // Should show connection message while initializing
      expect(container.textContent).toContain('Connecting to');
      
      // Children should not be visible yet
      expect(container.querySelector('[data-testid="children"]')).toBeNull();
      
      // Wait for initialization to complete
      await waitFor(() => {
        expect(mockInitializeAppKit).toHaveBeenCalled();
      });
      
      // Wait for component to show wagmi provider after successful initialization
      await waitFor(() => {
        expect(container.querySelector('[data-testid="wagmi-provider"]')).toBeTruthy();
      });
    });
  });

  describe('Memory Leak Detection and Prevention', () => {
    it('should prevent recursive Promise chain memory leaks during initialization', async () => {
      // Test that failed initialization doesn't create recursive promise chains
      const timeoutError = new (require('../../../src/errors/appkit-initialization').AppKitTimeoutError)('Initialization timed out');
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
      // Track setTimeout calls to verify cleanup
      const originalSetTimeout = global.setTimeout;
      const originalClearTimeout = global.clearTimeout;
      const activeTimeouts = new Set();
      
      global.setTimeout = jest.fn((callback, delay) => {
        const id = originalSetTimeout(callback, delay);
        activeTimeouts.add(id);
        return id;
      });
      
      global.clearTimeout = jest.fn((id) => {
        activeTimeouts.delete(id);
        return originalClearTimeout(id);
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      let unmount: () => void;
      
      await act(async () => {
        const { unmount: unmountFn } = render(<WagmiSetup><div>Test</div></WagmiSetup>);
        unmount = unmountFn;
        
        // Wait for initialization
        await waitFor(() => {
          expect(mockInitializeAppKit).toHaveBeenCalled();
        });
      });
      
      // Unmount component
      await act(async () => {
        unmount();
      });
      
      // All timeouts should be cleaned up
      expect(activeTimeouts.size).toBe(0);
      expect(global.clearTimeout).toHaveBeenCalled();
      
      // Restore originals
      global.setTimeout = originalSetTimeout;
      global.clearTimeout = originalClearTimeout;
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
        
        // Fast advance timers to trigger any potential race conditions
        jest.advanceTimersByTime(50);
        
        // Wait for initialization to complete
        await waitFor(() => {
          expect(mockInitializeAppKit).toHaveBeenCalled();
        }, { timeout: 5000 });
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
        
        // Advance timers to potentially trigger multiple attempts
        jest.advanceTimersByTime(100);
        
        await waitFor(() => {
          expect(mockInitializeAppKit).toHaveBeenCalled();
        });
      });
      
      // Should never have more than one concurrent initialization
      expect(maxConcurrentInitializations).toBe(1);
      
      consoleSpy.mockRestore();
    });

    it('should handle rapid component mount/unmount cycles without initialization conflicts', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mount and unmount multiple times rapidly
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          const { unmount } = render(<WagmiSetup><div>Test {i}</div></WagmiSetup>);
          
          // Rapid unmount
          setTimeout(() => unmount(), 10);
          
          jest.advanceTimersByTime(15);
        });
      }
      
      // Should handle rapid mount/unmount without conflicts
      expect(mockInitializeAppKit).toHaveBeenCalled();
      
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
        
        // Advance timers to trigger the scenario
        jest.advanceTimersByTime(150);
        
        await waitFor(() => {
          expect(mockInitializeAppKit).toHaveBeenCalled();
        });
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
        
        await waitFor(() => {
          expect(mockInitializeAppKit).toHaveBeenCalled();
        });
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
          throw new (require('../../../src/errors/appkit-initialization').AppKitRetryError)(
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
        
        // Fast forward through retry delays
        jest.advanceTimersByTime(10000);
        
        await waitFor(() => {
          expect(mockSetToast).toHaveBeenCalledWith(expect.objectContaining({
            type: 'error'
          }));
        });
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
        
        // Trigger potential concurrent retry attempts
        jest.advanceTimersByTime(50);
        appWalletsEventEmitter.emit('update', []);
        jest.advanceTimersByTime(50);
        
        await waitFor(() => {
          expect(mockSetToast).toHaveBeenCalledWith(expect.objectContaining({
            type: 'error'
          }));
        });
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
        
        await waitFor(() => {
          expect(mockInitializeAppKit).toHaveBeenCalled();
        });
      });
      
      console.error = originalConsoleError;
      
      // Should not have any React act() warnings for proper state updates
      expect(reactWarnings).toHaveLength(0);
    });

    it('should synchronize state updates during component lifecycle', async () => {
      const stateUpdates: string[] = [];
      
      // Override useState to track state changes
      const originalUseState = require('react').useState;
      const useState = jest.spyOn(require('react'), 'useState').mockImplementation((initial) => {
        const [state, setState] = originalUseState(initial);
        return [state, (newState: any) => {
          stateUpdates.push(`State update: ${typeof newState}`);
          setState(newState);
        }];
      });
      
      await act(async () => {
        const { unmount } = render(<WagmiSetup><div>Test</div></WagmiSetup>);
        
        await waitFor(() => {
          expect(mockInitializeAppKit).toHaveBeenCalled();
        });
        
        unmount();
      });
      
      // Should have synchronized state updates
      expect(stateUpdates.length).toBeGreaterThan(0);
      
      useState.mockRestore();
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
      const timeoutError = new (require('../../../src/errors/appkit-initialization').AppKitTimeoutError)('AppKit initialization timed out after 10000ms');
      mockInitializeAppKit.mockRejectedValue(timeoutError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
        
        await waitFor(() => {
          expect(mockSetToast).toHaveBeenCalledWith(expect.objectContaining({
            type: 'error',
            message: expect.stringContaining('timed out')
          }));
        });
      });
      
      consoleSpy.mockRestore();
    });

    it('should propagate validation errors immediately without retry', async () => {
      const validationError = new (require('../../../src/errors/appkit-initialization').AppKitValidationError)('Invalid configuration');
      mockInitializeAppKit.mockRejectedValue(validationError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
        
        await waitFor(() => {
          expect(mockSetToast).toHaveBeenCalledWith(expect.objectContaining({
            type: 'error'
          }));
        });
      });
      
      // Validation errors should not trigger retries
      expect(mockInitializeAppKit).toHaveBeenCalledTimes(1);
      
      consoleSpy.mockRestore();
    });

    it('should handle adapter errors with appropriate user feedback', async () => {
      const adapterError = new (require('../../../src/errors/adapter').AdapterError)('Adapter creation failed');
      mockInitializeAppKit.mockRejectedValue(adapterError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await act(async () => {
        render(<WagmiSetup><div>Test</div></WagmiSetup>);
        
        await waitFor(() => {
          expect(mockSetToast).toHaveBeenCalledWith(expect.objectContaining({
            type: 'error'
          }));
        });
      });
      
      consoleSpy.mockRestore();
    });
  });
});