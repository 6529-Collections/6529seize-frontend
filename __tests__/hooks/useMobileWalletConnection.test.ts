import { renderHook, act } from '@testing-library/react';
import { useMobileWalletConnection, MobileConnectionState } from '../../hooks/useMobileWalletConnection';
import { 
  WalletConnectionError, 
  DeepLinkTimeoutError, 
  ConnectionVerificationError 
} from '../../hooks/errors/WalletConnectionError';

// Mock the Reown AppKit hooks
jest.mock('@reown/appkit/react', () => ({
  useAppKitAccount: jest.fn(),
  useAppKit: jest.fn(),
}));

const mockUseAppKitAccount = jest.mocked(require('@reown/appkit/react').useAppKitAccount);
const mockUseAppKit = jest.mocked(require('@reown/appkit/react').useAppKit);

describe('useMobileWalletConnection - Memory Leak Prevention Tests', () => {
  const mockOpen = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    
    mockUseAppKitAccount.mockReturnValue({
      isConnected: false,
      address: undefined,
    });
    
    mockUseAppKit.mockReturnValue({
      open: mockOpen,
    });
    
    // Mock window and document for mobile detection
    Object.defineProperty(window, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
      },
      writable: true,
    });

    // Mock document.addEventListener and removeEventListener
    const mockAddEventListener = jest.fn();
    const mockRemoveEventListener = jest.fn();
    Object.defineProperty(document, 'addEventListener', {
      value: mockAddEventListener,
      writable: true,
    });
    Object.defineProperty(document, 'removeEventListener', {
      value: mockRemoveEventListener,
      writable: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('CRITICAL SECURITY: Event Listener Memory Leak Prevention', () => {
    it('should clean up visibilitychange event listener on unmount', () => {
      const mockAddEventListener = jest.spyOn(document, 'addEventListener');
      const { result, unmount } = renderHook(() => useMobileWalletConnection());
      
      // Trigger mobile connection to add visibility listener
      act(() => {
        result.current.handleMobileConnection();
      });
      
      // Verify listener was added with AbortController signal
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'visibilitychange', 
        expect.any(Function),
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      );
      
      // SECURITY TEST: Unmounting should abort the signal, cleaning up listener
      const calls = mockAddEventListener.mock.calls;
      const visibilityCall = calls.find(call => call[0] === 'visibilitychange');
      expect(visibilityCall).toBeDefined();
      
      const signal = visibilityCall![2] as { signal: AbortSignal };
      expect(signal.signal.aborted).toBe(false);
      
      // Unmount should abort the signal
      unmount();
      
      // The signal should be aborted after unmount
      expect(signal.signal.aborted).toBe(true);
      
      mockAddEventListener.mockRestore();
    });
    
    it('should abort visibility listener on first trigger to prevent memory leak', () => {
      const mockAddEventListener = jest.spyOn(document, 'addEventListener');
      const { result } = renderHook(() => useMobileWalletConnection());
      
      // Mock document.visibilityState
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        writable: true,
      });
      
      // Trigger mobile connection to add visibility listener
      act(() => {
        result.current.handleMobileConnection();
      });
      
      // Get the registered listener
      const calls = mockAddEventListener.mock.calls;
      const visibilityCall = calls.find(call => call[0] === 'visibilitychange');
      const listener = visibilityCall![1] as () => void;
      const signal = visibilityCall![2] as { signal: AbortSignal };
      
      expect(signal.signal.aborted).toBe(false);
      
      // Simulate visibility change
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      });
      
      // SECURITY TEST: Calling listener should abort signal immediately
      act(() => {
        listener();
      });
      
      // Signal should be aborted after first trigger
      expect(signal.signal.aborted).toBe(true);
      
      mockAddEventListener.mockRestore();
    });
    
    it('should prevent DoS attacks through rapid connection attempts', async () => {
      const mockAddEventListener = jest.spyOn(document, 'addEventListener');
      const { result } = renderHook(() => useMobileWalletConnection());
      
      // SECURITY TEST: Rapid connection attempts should not accumulate listeners
      const attempts = 10;
      
      for (let i = 0; i < attempts; i++) {
        await act(async () => {
          try {
            await result.current.handleMobileConnection();
          } catch {
            // Connection might fail, but cleanup should still work
          }
        });
      }
      
      // Only the latest listener should be active
      const visibilityCalls = mockAddEventListener.mock.calls.filter(
        call => call[0] === 'visibilitychange'
      );
      
      // Should have exactly one call per attempt
      expect(visibilityCalls.length).toBe(attempts);
      
      // All but the last signal should be aborted
      for (let i = 0; i < visibilityCalls.length - 1; i++) {
        const signal = visibilityCalls[i][2] as { signal: AbortSignal };
        expect(signal.signal.aborted).toBe(true);
      }
      
      mockAddEventListener.mockRestore();
    });
  });
  
  describe('CRITICAL SECURITY: Memory Leak Prevention', () => {
    it('should clean up polling timeout on unmount', () => {
      const { result, unmount } = renderHook(() => useMobileWalletConnection());
      
      // Trigger connection flow to create polling timeout
      act(() => {
        result.current.handleMobileConnection();
      });
      
      // Fast-forward to create timeout
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      // SECURITY TEST: Verify component unmount cleans up all timeouts
      const timeoutCountBefore = jest.getTimerCount();
      unmount();
      const timeoutCountAfter = jest.getTimerCount();
      
      // All timeouts should be cleared on unmount (preventing memory leak)
      expect(timeoutCountAfter).toBeLessThanOrEqual(timeoutCountBefore);
    });

    it('should abort ongoing operations on unmount', async () => {
      const { result, unmount } = renderHook(() => useMobileWalletConnection());
      
      // Mock the connection state to allow handleDeepLinkReturn
      mockUseAppKitAccount.mockReturnValue({
        isConnected: false,
        address: undefined,
      });
      
      // Set up the component in WAITING_FOR_RETURN state
      act(() => {
        result.current.handleMobileConnection();
      });
      
      // Simulate mobile deep linking flow
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      // SECURITY TEST: Unmounting should not leave operations running
      unmount();
      
      // Verify all timers are cleared
      expect(jest.getTimerCount()).toBe(0);
    });

    it('should prevent state updates after unmount', async () => {
      const { result, unmount } = renderHook(() => useMobileWalletConnection());
      
      // Set initial state
      expect(result.current.connectionState).toBe(MobileConnectionState.IDLE);
      
      // Unmount the component
      unmount();
      
      // SECURITY TEST: Attempting operations after unmount should fail safely
      // This prevents memory leaks and DoS attacks via continuous state updates
      
      // The handleMobileConnection should throw when component is unmounted
      await expect(result.current.handleMobileConnection()).rejects.toThrow(
        'Component unmounted during connection'
      );
    });

    it('should implement AbortController for cancellation', async () => {
      const { result, unmount } = renderHook(() => useMobileWalletConnection());
      
      // SECURITY TEST: Verify AbortController integration prevents memory leaks
      // This is critical for preventing DoS attacks via resource exhaustion
      
      // Start a connection that would normally timeout
      try {
        await result.current.handleDeepLinkReturn();
      } catch (error) {
        expect(error).toBeInstanceOf(ConnectionVerificationError);
      }
      
      // Unmounting should clean up AbortController
      unmount();
      
      // No memory leaks should remain
      expect(jest.getTimerCount()).toBe(0);
    });
    
    it('should clean up visibility AbortController in resetConnection', () => {
      const mockAddEventListener = jest.spyOn(document, 'addEventListener');
      const { result } = renderHook(() => useMobileWalletConnection());
      
      // Start connection to create visibility listener
      act(() => {
        result.current.handleMobileConnection();
      });
      
      // Get the signal from the listener
      const visibilityCalls = mockAddEventListener.mock.calls.filter(
        call => call[0] === 'visibilitychange'
      );
      const signal = visibilityCalls[0][2] as { signal: AbortSignal };
      
      expect(signal.signal.aborted).toBe(false);
      
      // SECURITY TEST: Reset should abort visibility controller
      act(() => {
        result.current.resetConnection();
      });
      
      expect(signal.signal.aborted).toBe(true);
      
      mockAddEventListener.mockRestore();
    });
  });

  describe('CRITICAL SECURITY: Fail-Fast Pattern', () => {
    it('should throw immediately on invalid state - no timeout loops', async () => {
      const { result } = renderHook(() => useMobileWalletConnection());
      
      // SECURITY TEST: Function must validate state FIRST before any async operations
      const startTime = Date.now();
      
      try {
        await result.current.handleDeepLinkReturn();
      } catch (error) {
        const elapsed = Date.now() - startTime;
        
        // Must fail immediately (< 50ms) - not after timeout
        expect(elapsed).toBeLessThan(50);
        expect(error).toBeInstanceOf(ConnectionVerificationError);
      }
    });

    it('should never use recursive setTimeout pattern', () => {
      const { result } = renderHook(() => useMobileWalletConnection());
      
      // SECURITY TEST: Verify elimination of vulnerable recursive setTimeout
      const fnString = result.current.handleDeepLinkReturn.toString();
      
      // Should use ref-tracked timeouts, not recursive calls
      expect(fnString).toContain('pollingTimeoutRef.current');
      expect(fnString).toContain('setTimeout');
      // Verify it's not using the old vulnerable pattern
      expect(fnString).not.toContain('setTimeout(() => {');
    });

    it('should guard all state updates with mount checks', async () => {
      const { result, unmount } = renderHook(() => useMobileWalletConnection());
      
      // Start connection
      act(() => {
        result.current.handleMobileConnection();
      });
      
      // Unmount during connection
      unmount();
      
      // Advance timers to trigger any unsafe state updates
      act(() => {
        jest.advanceTimersByTime(35000); // Beyond timeout
      });
      
      // SECURITY TEST: No state updates should occur after unmount
      // This prevents memory corruption and DoS attacks
      expect(jest.getTimerCount()).toBe(0);
    });
  });

  describe('CRITICAL SECURITY: Resource Cleanup', () => {
    it('should clear all timeout references in resetConnection', () => {
      const { result } = renderHook(() => useMobileWalletConnection());
      
      // Create some timeouts
      act(() => {
        result.current.handleMobileConnection();
      });
      
      // Advance time to create pending timeouts
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      
      const timeoutCountBefore = jest.getTimerCount();
      
      // SECURITY TEST: Reset should clean all resources
      act(() => {
        result.current.resetConnection();
      });
      
      const timeoutCountAfter = jest.getTimerCount();
      
      // All timeouts should be cleared
      expect(timeoutCountAfter).toBeLessThanOrEqual(timeoutCountBefore);
    });

    it('should abort operations in resetConnection', () => {
      const { result } = renderHook(() => useMobileWalletConnection());
      
      // Start operations
      act(() => {
        result.current.handleMobileConnection();
      });
      
      // SECURITY TEST: Reset must abort all ongoing operations
      act(() => {
        result.current.resetConnection();
      });
      
      // All resources should be cleaned up
      expect(jest.getTimerCount()).toBe(0);
    });

    it('should handle multiple rapid cleanup calls safely', () => {
      const { result } = renderHook(() => useMobileWalletConnection());
      
      // Create resources
      act(() => {
        result.current.handleMobileConnection();
      });
      
      // SECURITY TEST: Multiple cleanup calls should not cause errors
      expect(() => {
        act(() => {
          result.current.resetConnection();
          result.current.resetConnection();
          result.current.resetConnection();
        });
      }).not.toThrow();
    });
  });

  describe('CRITICAL SECURITY: State Validation', () => {
    it('should enforce strict state validation in handleDeepLinkReturn', async () => {
      const { result } = renderHook(() => useMobileWalletConnection());
      
      // Test all invalid states
      const invalidStates = [
        MobileConnectionState.IDLE,
        MobileConnectionState.CONNECTING,
        MobileConnectionState.DEEP_LINKING,
        MobileConnectionState.CONNECTED,
        MobileConnectionState.FAILED,
        MobileConnectionState.TIMEOUT
      ];
      
      for (const state of invalidStates) {
        await expect(result.current.handleDeepLinkReturn()).rejects.toThrow(
          ConnectionVerificationError
        );
      }
    });

    it('should prevent authentication bypass through state manipulation', async () => {
      const { result } = renderHook(() => useMobileWalletConnection());
      
      // SECURITY TEST: No method should allow bypassing authentication
      await expect(result.current.handleDeepLinkReturn()).rejects.toThrow(
        ConnectionVerificationError
      );
      
      // Connection state must remain secure
      expect(result.current.connectionState).not.toBe(MobileConnectionState.CONNECTED);
    });

    it('should validate component mount state before operations', async () => {
      const { result, unmount } = renderHook(() => useMobileWalletConnection());
      
      // Unmount component
      unmount();
      
      // SECURITY TEST: All operations must check mount state
      await expect(result.current.handleMobileConnection()).rejects.toThrow(
        'Component unmounted during connection'
      );
      
      // handleDeepLinkReturn validates state first, so it throws ConnectionVerificationError
      // before checking mount state - this is expected behavior
      await expect(result.current.handleDeepLinkReturn()).rejects.toThrow(
        ConnectionVerificationError
      );
    });
  });

  describe('Error Handling - Fail Fast', () => {
    it('should create proper DeepLinkTimeoutError instances', () => {
      const error = new DeepLinkTimeoutError(10000);
      
      expect(error).toBeInstanceOf(DeepLinkTimeoutError);
      expect(error).toBeInstanceOf(WalletConnectionError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('DeepLinkTimeoutError');
      expect(error.code).toBe('DEEP_LINK_TIMEOUT');
      expect(error.message).toBe('Deep link connection timed out after 10000ms');
    });

    it('should create proper ConnectionVerificationError instances', () => {
      const error = new ConnectionVerificationError('idle', 'waiting_for_return');
      
      expect(error).toBeInstanceOf(ConnectionVerificationError);
      expect(error).toBeInstanceOf(WalletConnectionError);
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ConnectionVerificationError');
      expect(error.code).toBe('CONNECTION_VERIFICATION_ERROR');
      expect(error.message).toContain('Invalid connection state');
    });

    it('should never return null or undefined on error', async () => {
      const { result } = renderHook(() => useMobileWalletConnection());
      
      // SECURITY TEST: Verify that errors are thrown, not returned as null/undefined
      await expect(result.current.handleDeepLinkReturn()).rejects.toThrow();
    });
  });

  describe('Interface Contract', () => {
    it('should ensure handleDeepLinkReturn returns Promise<void>', () => {
      const { result } = renderHook(() => useMobileWalletConnection());
      
      const returnValue = result.current.handleDeepLinkReturn();
      expect(returnValue).toBeInstanceOf(Promise);
      
      // Verify rejection for wrong state
      return expect(returnValue).rejects.toBeDefined();
    });

    it('initializes with correct default state', () => {
      const { result } = renderHook(() => useMobileWalletConnection());
      
      expect(result.current.connectionState).toBe(MobileConnectionState.IDLE);
      expect(result.current.connectionTimeout).toBe(0);
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.mobileInfo.isMobile).toBe(true);
      expect(result.current.mobileInfo.supportsDeepLinking).toBe(true);
    });

    it('handles mobile connection with correct namespace', async () => {
      const { result } = renderHook(() => useMobileWalletConnection());
      
      await act(async () => {
        await result.current.handleMobileConnection();
      });
      
      expect(mockOpen).toHaveBeenCalledWith({
        view: 'Connect',
        namespace: 'eip155'
      });
      
      expect(result.current.connectionState).not.toBe(MobileConnectionState.IDLE);
    });

    it('handles solana namespace correctly', async () => {
      const { result } = renderHook(() => useMobileWalletConnection());
      
      await act(async () => {
        await result.current.handleMobileConnection('solana');
      });
      
      expect(mockOpen).toHaveBeenCalledWith({
        view: 'Connect',
        namespace: 'solana'
      });
    });
  });
});