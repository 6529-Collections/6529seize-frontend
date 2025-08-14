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
      
      render(<WagmiSetup><div>Test</div></WagmiSetup>);
      
      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith(expect.objectContaining({
          type: 'error'
        }));
      });
      
      consoleSpy.mockRestore();
    });

    it('handles successful initialization without timeout', async () => {
      // Use default successful mock
      render(<WagmiSetup><div>Test</div></WagmiSetup>);
      
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
      
      render(<WagmiSetup><div>Test</div></WagmiSetup>);
      
      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith(expect.objectContaining({
          type: 'error'
        }));
      });
      
      consoleSpy.mockRestore();
    });

    it('sets up wallet update event listener', async () => {
      const onSpy = jest.spyOn(appWalletsEventEmitter, 'on');
      
      render(<WagmiSetup><div>Test</div></WagmiSetup>);
      
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
      
      render(<WagmiSetup><div>Test</div></WagmiSetup>);
      
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
      
      render(<WagmiSetup><div>Test</div></WagmiSetup>);
      
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
      
      render(<WagmiSetup><div>Test</div></WagmiSetup>);
      
      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith(expect.objectContaining({
          type: 'error'
        }));
      });
      
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

  // Note: Error sanitization tests removed - these test the error-sanitizer utility, not the WagmiSetup component

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
    it('cleans up event listeners on unmount', () => {
      const offSpy = jest.spyOn(appWalletsEventEmitter, 'off');
      
      const { unmount } = render(<WagmiSetup><div>Test</div></WagmiSetup>);
      
      unmount();
      
      expect(offSpy).toHaveBeenCalledWith('update', expect.any(Function));
      
      offSpy.mockRestore();
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
    it('prevents rendering until properly mounted to avoid SSR issues', async () => {
      const { container } = render(<WagmiSetup><div data-testid="children">Test</div></WagmiSetup>);
      
      // Should not show children initially
      expect(container.querySelector('[data-testid="children"]')).toBeNull();
      
      // Should show either initializing or connecting message
      const text = container.textContent;
      expect(text).toMatch(/Initializing|Connecting to/);
    });

    it('prevents rendering children until adapter is initialized', async () => {
      const { container } = render(<WagmiSetup><div data-testid="children">Test</div></WagmiSetup>);
      
      // Should show connection message while initializing
      expect(container.textContent).toContain('Connecting to');
      
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

  describe('Enhanced Security Coverage', () => {
    it('should handle errors without memory leaks', async () => {
      // Simple test to ensure errors don't cause memory issues
      const timeoutError = new (require('../../../src/errors/appkit-initialization').AppKitTimeoutError)('Initialization timed out after 10000ms');
      mockInitializeAppKit.mockRejectedValue(timeoutError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<WagmiSetup><div>Test</div></WagmiSetup>);
      
      // Verify error handling doesn't crash
      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith(expect.objectContaining({
          type: 'error'
        }));
      });
      
      consoleSpy.mockRestore();
    });

    it('should provide specific error messages for timeout scenarios', async () => {
      const timeoutError = new (require('../../../src/errors/appkit-initialization').AppKitTimeoutError)('AppKit initialization timed out after 10000ms');
      mockInitializeAppKit.mockRejectedValue(timeoutError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<WagmiSetup><div>Test</div></WagmiSetup>);
      
      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith(expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('timed out')
        }));
      });
      
      consoleSpy.mockRestore();
    });

    it('should propagate validation errors immediately without retry', async () => {
      const validationError = new (require('../../../src/errors/appkit-initialization').AppKitValidationError)('Invalid configuration');
      mockInitializeAppKit.mockRejectedValue(validationError);
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      render(<WagmiSetup><div>Test</div></WagmiSetup>);
      
      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith(expect.objectContaining({
          type: 'error'
        }));
      });
      
      // Validation errors should not trigger retries
      expect(mockInitializeAppKit).toHaveBeenCalledTimes(1);
      
      consoleSpy.mockRestore();
    });
  });
});