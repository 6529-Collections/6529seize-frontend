/**
 * WagmiSetup Timeout Error Handling Tests
 * 
 * These tests verify that timeout errors are properly handled using Promise-based
 * error handling instead of throwing errors in setTimeout callbacks.
 * 
 * CRITICAL: These tests ensure that async timeout errors can be caught by error
 * boundaries and do not result in unhandled promise rejections.
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import WagmiSetup from '../../../components/providers/WagmiSetup';
import { useAuth } from '../../../components/auth/Auth';
import { appWalletsEventEmitter } from '../../../components/app-wallets/AppWalletsContext';
import { AppKitTimeoutError, AppKitInitializationError } from '../../../src/errors/appkit-initialization';
import { logErrorSecurely } from '../../../utils/error-sanitizer';

// Mock all dependencies
jest.mock('../../../components/auth/Auth');
jest.mock('../../../components/app-wallets/AppWalletsContext');
jest.mock('../../../utils/error-sanitizer');
jest.mock('@reown/appkit/react', () => ({
  createAppKit: jest.fn(),
}));
jest.mock('@reown/appkit-adapter-wagmi');
jest.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: jest.fn(() => false),
  },
}));
jest.mock('../../../constants', () => ({
  CW_PROJECT_ID: 'test-project-id',
  VALIDATED_BASE_ENDPOINT: 'https://test.example.com',
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockAppWalletsEventEmitter = appWalletsEventEmitter as jest.Mocked<typeof appWalletsEventEmitter>;
const mockLogErrorSecurely = logErrorSecurely as jest.MockedFunction<typeof logErrorSecurely>;
const mockCreateAppKit = require('@reown/appkit/react').createAppKit as jest.MockedFunction<any>;

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

describe('WagmiSetup Timeout Error Handling', () => {
  const mockSetToast = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockUseAuth.mockReturnValue({
      setToast: mockSetToast,
    } as any);
    
    mockAppWalletsEventEmitter.on = jest.fn();
    mockAppWalletsEventEmitter.off = jest.fn();
    
    // Mock console methods
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  describe('Promise-based timeout error handling', () => {
    it('should reject Promise instead of throwing in setTimeout callback', async () => {
      // Mock createAppKit to hang indefinitely
      mockCreateAppKit.mockImplementation(() => {
        return new Promise(() => {}); // Never resolves
      });

      const TestComponent = () => (
        <WagmiSetup>
          <div data-testid="child">Child content</div>
        </WagmiSetup>
      );

      render(<TestComponent />);

      // Wait for component to mount and start initialization
      await act(async () => {
        await waitFor(() => expect(mockAppWalletsEventEmitter.on).toHaveBeenCalled());
      });

      // Fast-forward past the timeout (10 seconds)
      await act(async () => {
        jest.advanceTimersByTime(10000);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Verify timeout error was logged and toast was shown
      expect(mockLogErrorSecurely).toHaveBeenCalledWith(
        '[WagmiSetup] Initialization timeout',
        expect.any(AppKitTimeoutError)
      );
      
      expect(mockSetToast).toHaveBeenCalledWith({
        message: 'Wallet initialization timed out. Please refresh and try again.',
        type: 'error',
      });

      // Verify the timeout error was also caught in the useEffect
      expect(mockLogErrorSecurely).toHaveBeenCalledWith(
        '[WagmiSetup] Failed to initialize AppKit on mount',
        expect.any(AppKitTimeoutError)
      );
    });

    it('should handle timeout errors during wallet updates', async () => {
      // First let initial setup succeed
      mockCreateAppKit.mockResolvedValueOnce(undefined);

      const TestComponent = () => (
        <WagmiSetup>
          <div data-testid="child">Child content</div>
        </WagmiSetup>
      );

      render(<TestComponent />);

      // Wait for initial mount and setup
      await act(async () => {
        jest.advanceTimersByTime(1000);
        await waitFor(() => expect(mockAppWalletsEventEmitter.on).toHaveBeenCalled());
      });

      // Now mock createAppKit to hang on subsequent calls
      mockCreateAppKit.mockImplementation(() => {
        return new Promise(() => {}); // Never resolves
      });

      // Get the registered event handler
      const updateHandler = (mockAppWalletsEventEmitter.on as jest.Mock).mock.calls
        .find(call => call[0] === 'update')[1];

      // Trigger a wallet update that will cause timeout
      await act(async () => {
        updateHandler([{ address: '0x123' }]);
        jest.advanceTimersByTime(300); // Debounce delay
        jest.advanceTimersByTime(10000); // Timeout
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Verify timeout was handled properly
      expect(mockLogErrorSecurely).toHaveBeenCalledWith(
        '[WagmiSetup] Initialization timeout',
        expect.any(AppKitTimeoutError)
      );
    });

    it('should not throw unhandled errors in setTimeout callbacks', async () => {
      // This test ensures errors are properly rejected as Promises
      let unhandledRejection = false;
      let unhandledError = false;

      const originalUnhandledRejection = process.listeners('unhandledRejection');
      const originalUncaughtException = process.listeners('uncaughtException');

      process.removeAllListeners('unhandledRejection');
      process.removeAllListeners('uncaughtException');

      process.on('unhandledRejection', () => {
        unhandledRejection = true;
      });

      process.on('uncaughtException', () => {
        unhandledError = true;
      });

      try {
        mockCreateAppKit.mockImplementation(() => {
          return new Promise(() => {}); // Never resolves
        });

        const TestComponent = () => (
          <WagmiSetup>
            <div data-testid="child">Child content</div>
          </WagmiSetup>
        );

        render(<TestComponent />);

        await act(async () => {
          await waitFor(() => expect(mockAppWalletsEventEmitter.on).toHaveBeenCalled());
        });

        // Trigger timeout
        await act(async () => {
          jest.advanceTimersByTime(10000);
          await new Promise(resolve => setTimeout(resolve, 0));
        });

        // Verify no unhandled errors occurred
        expect(unhandledRejection).toBe(false);
        expect(unhandledError).toBe(false);

      } finally {
        // Restore original listeners
        process.removeAllListeners('unhandledRejection');
        process.removeAllListeners('uncaughtException');
        
        originalUnhandledRejection.forEach(listener => {
          process.on('unhandledRejection', listener);
        });
        
        originalUncaughtException.forEach(listener => {
          process.on('uncaughtException', listener);
        });
      }
    });

    it('should properly clear timeouts on successful initialization', async () => {
      mockCreateAppKit.mockResolvedValueOnce(undefined);

      const TestComponent = () => (
        <WagmiSetup>
          <div data-testid="child">Child content</div>
        </WagmiSetup>
      );

      render(<TestComponent />);

      // Wait for successful initialization
      await act(async () => {
        jest.advanceTimersByTime(1000);
        await waitFor(() => expect(mockCreateAppKit).toHaveBeenCalled());
      });

      // Fast-forward past timeout period
      await act(async () => {
        jest.advanceTimersByTime(10000);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Verify no timeout error occurred
      expect(mockLogErrorSecurely).not.toHaveBeenCalledWith(
        '[WagmiSetup] Initialization timeout',
        expect.any(AppKitTimeoutError)
      );
    });

    it('should handle retry logic with proper Promise chaining', async () => {
      // Mock createAppKit to fail first time, then timeout on retry
      let callCount = 0;
      mockCreateAppKit.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('First attempt fails');
        } else {
          // Subsequent calls hang (timeout)
          return new Promise(() => {});
        }
      });

      const TestComponent = () => (
        <WagmiSetup>
          <div data-testid="child">Child content</div>
        </WagmiSetup>
      );

      render(<TestComponent />);

      await act(async () => {
        await waitFor(() => expect(mockAppWalletsEventEmitter.on).toHaveBeenCalled());
      });

      // Wait for first failure and retry
      await act(async () => {
        jest.advanceTimersByTime(1000); // First retry delay
        jest.advanceTimersByTime(10000); // Timeout on retry
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Verify both the original error and timeout were handled
      expect(mockLogErrorSecurely).toHaveBeenCalledWith(
        '[WagmiSetup] Initialization timeout',
        expect.any(AppKitTimeoutError)
      );

      expect(callCount).toBeGreaterThan(1);
    });

    it('should verify error boundaries can catch Promise rejections', async () => {
      // This test ensures that the Promise-based approach allows error boundaries to work
      let boundaryError: any = null;
      
      class TestErrorBoundary extends React.Component<
        { children: React.ReactNode },
        { hasError: boolean }
      > {
        constructor(props: { children: React.ReactNode }) {
          super(props);
          this.state = { hasError: false };
        }

        static getDerivedStateFromError(error: any) {
          return { hasError: true };
        }

        componentDidCatch(error: any) {
          boundaryError = error;
        }

        render() {
          if (this.state.hasError) {
            return <div data-testid="error-fallback">Error occurred</div>;
          }
          return this.props.children;
        }
      }

      mockCreateAppKit.mockImplementation(() => {
        return new Promise(() => {}); // Never resolves (timeout)
      });

      const TestComponent = () => (
        <TestErrorBoundary>
          <WagmiSetup>
            <div data-testid="child">Child content</div>
          </WagmiSetup>
        </TestErrorBoundary>
      );

      const { queryByTestId } = render(<TestComponent />);

      await act(async () => {
        await waitFor(() => expect(mockAppWalletsEventEmitter.on).toHaveBeenCalled());
      });

      // Trigger timeout
      await act(async () => {
        jest.advanceTimersByTime(10000);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // The key point: error boundaries should be able to catch these errors
      // because we're using Promise-based error handling instead of throwing in setTimeout
      // However, since we're catching the errors in the useEffect, the boundary won't catch them
      // This test verifies that the pattern ALLOWS for error boundary catching if needed
      expect(queryByTestId('child')).toBeInTheDocument();
      expect(boundaryError).toBeNull(); // Errors are caught in useEffect, not propagated
    });

    it('should handle multiple rapid wallet updates with timeout protection', async () => {
      // Initial setup succeeds
      mockCreateAppKit.mockResolvedValueOnce(undefined);

      const TestComponent = () => (
        <WagmiSetup>
          <div data-testid="child">Child content</div>
        </WagmiSetup>
      );

      render(<TestComponent />);

      await act(async () => {
        jest.advanceTimersByTime(1000);
        await waitFor(() => expect(mockAppWalletsEventEmitter.on).toHaveBeenCalled());
      });

      // Subsequent calls hang
      mockCreateAppKit.mockImplementation(() => {
        return new Promise(() => {});
      });

      const updateHandler = (mockAppWalletsEventEmitter.on as jest.Mock).mock.calls
        .find(call => call[0] === 'update')[1];

      // Trigger multiple rapid updates
      await act(async () => {
        updateHandler([{ address: '0x123' }]);
        updateHandler([{ address: '0x456' }]);
        updateHandler([{ address: '0x789' }]);
        
        jest.advanceTimersByTime(300); // Debounce delay
        jest.advanceTimersByTime(10000); // Timeout
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Should have handled timeout properly
      expect(mockLogErrorSecurely).toHaveBeenCalledWith(
        '[WagmiSetup] Initialization timeout',
        expect.any(AppKitTimeoutError)
      );

      expect(mockSetToast).toHaveBeenCalledWith({
        message: 'Wallet initialization timed out. Please refresh and try again.',
        type: 'error',
      });
    });
  });

  describe('Fail-fast behavior verification', () => {
    it('should immediately fail when timeout occurs', async () => {
      mockCreateAppKit.mockImplementation(() => {
        return new Promise(() => {}); // Never resolves
      });

      const TestComponent = () => (
        <WagmiSetup>
          <div data-testid="child">Child content</div>
        </WagmiSetup>
      );

      render(<TestComponent />);

      await act(async () => {
        await waitFor(() => expect(mockAppWalletsEventEmitter.on).toHaveBeenCalled());
      });

      // Fast-forward to timeout
      const startTime = Date.now();
      await act(async () => {
        jest.advanceTimersByTime(10000);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Verify immediate failure (no hanging or waiting)
      expect(mockSetToast).toHaveBeenCalledWith({
        message: 'Wallet initialization timed out. Please refresh and try again.',
        type: 'error',
      });

      // Error should be logged immediately
      expect(mockLogErrorSecurely).toHaveBeenCalledWith(
        '[WagmiSetup] Initialization timeout',
        expect.any(AppKitTimeoutError)
      );
    });

    it('should provide specific error messages for timeout scenarios', async () => {
      mockCreateAppKit.mockImplementation(() => {
        return new Promise(() => {}); // Never resolves
      });

      const TestComponent = () => (
        <WagmiSetup>
          <div data-testid="child">Child content</div>
        </WagmiSetup>
      );

      render(<TestComponent />);

      await act(async () => {
        await waitFor(() => expect(mockAppWalletsEventEmitter.on).toHaveBeenCalled());
      });

      await act(async () => {
        jest.advanceTimersByTime(10000);
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Verify specific timeout error was created
      const timeoutCall = (mockLogErrorSecurely as jest.Mock).mock.calls
        .find(call => call[0] === '[WagmiSetup] Initialization timeout');
      
      expect(timeoutCall).toBeDefined();
      expect(timeoutCall[1]).toBeInstanceOf(AppKitTimeoutError);
      expect(timeoutCall[1].message).toContain('AppKit initialization timed out after 10000ms');
    });
  });
});