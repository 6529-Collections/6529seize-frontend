import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { SeizeConnectProvider, useSeizeConnectContext, AuthenticationError, WalletDisconnectionError } from '../../../components/auth/SeizeConnectContext';
import { useAppKit, useAppKitAccount, useAppKitState, useDisconnect, useWalletInfo } from '@reown/appkit/react';
import { getWalletAddress, removeAuthJwt, migrateCookiesToLocalStorage } from '../../../services/auth/auth.utils';

jest.mock('@reown/appkit/react');
jest.mock('../../../services/auth/auth.utils');

const disconnect = jest.fn().mockResolvedValue(undefined);
const open = jest.fn();

(useDisconnect as jest.Mock).mockReturnValue({ disconnect });
(useAppKit as jest.Mock).mockReturnValue({ open });
(useAppKitState as jest.Mock).mockReturnValue({ open: false });
(useAppKitAccount as jest.Mock).mockReturnValue({ address: '0x1', isConnected: true });
(useWalletInfo as jest.Mock).mockReturnValue({ walletInfo: { name: 'MetaMask', icon: 'metamask-icon.svg' } });
(getWalletAddress as jest.Mock).mockReturnValue('0x1');
(migrateCookiesToLocalStorage as jest.Mock).mockImplementation(() => {});

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('SeizeConnectContext', () => {
  it('throws when used outside provider', () => {
    const { result } = renderHook(() => () => useSeizeConnectContext());
    expect(() => result.current()).toThrow();
  });

  it('provides connect and disconnect logic', async () => {
    const { result } = renderHook(() => useSeizeConnectContext(), {
      wrapper: ({ children }) => <SeizeConnectProvider>{children}</SeizeConnectProvider>,
    });

    act(() => {
      result.current.seizeConnect();
    });
    expect(open).toHaveBeenCalledWith({ view: 'Connect' });

    await act(async () => {
      await result.current.seizeDisconnect();
    });
    expect(disconnect).toHaveBeenCalled();
  });

  it('disconnects and logs out then reconnects', async () => {
    const { result } = renderHook(() => useSeizeConnectContext(), {
      wrapper: ({ children }) => <SeizeConnectProvider>{children}</SeizeConnectProvider>,
    });

    await act(async () => {
      await result.current.seizeDisconnectAndLogout(true);
    });

    expect(removeAuthJwt).toHaveBeenCalled();
    expect(disconnect).toHaveBeenCalled();
    
    // Fast-forward timers to trigger delayed reconnection
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    expect(open).toHaveBeenCalledWith({ view: 'Connect' });
  });

  // CRITICAL SECURITY TESTS: Fail-fast authentication bypass prevention
  describe('seizeDisconnectAndLogout fail-fast security', () => {
    it('throws AuthenticationError when wallet disconnect fails', async () => {
      const disconnectError = new Error('Wallet disconnect failed');
      disconnect.mockRejectedValueOnce(disconnectError);
      
      const { result } = renderHook(() => useSeizeConnectContext(), {
        wrapper: ({ children }) => <SeizeConnectProvider>{children}</SeizeConnectProvider>,
      });

      try {
        await act(async () => {
          await result.current.seizeDisconnectAndLogout();
        });
        fail('Should have thrown AuthenticationError');
      } catch (error) {
        expect((error as any).name).toBe('AuthenticationError');
        expect((error as any).message).toBe('Cannot complete logout: wallet disconnection failed. User may still have active wallet connection.');
      }
      
      // Verify auth cleanup was NOT called after disconnect failure
      expect(removeAuthJwt).not.toHaveBeenCalled();
    });

    it('completes logout only after successful disconnect', async () => {
      const { result } = renderHook(() => useSeizeConnectContext(), {
        wrapper: ({ children }) => <SeizeConnectProvider>{children}</SeizeConnectProvider>,
      });

      await act(async () => {
        await result.current.seizeDisconnectAndLogout();
      });

      // Verify disconnect was called first
      expect(disconnect).toHaveBeenCalled();
      // Verify auth cleanup happens after successful disconnect
      expect(removeAuthJwt).toHaveBeenCalled();
    });

    it('throws when auth cleanup fails after successful disconnect', async () => {
      const authError = new Error('Auth cleanup failed');
      (removeAuthJwt as jest.Mock).mockImplementationOnce(() => {
        throw authError;
      });
      
      const { result } = renderHook(() => useSeizeConnectContext(), {
        wrapper: ({ children }) => <SeizeConnectProvider>{children}</SeizeConnectProvider>,
      });

      try {
        await act(async () => {
          await result.current.seizeDisconnectAndLogout();
        });
        fail('Should have thrown AuthenticationError');
      } catch (error) {
        expect((error as any).name).toBe('AuthenticationError');
        expect((error as any).message).toBe('Failed to clear authentication state after successful wallet disconnect');
      }
      
      // Verify disconnect was successful before auth cleanup failure
      expect(disconnect).toHaveBeenCalled();
    });

    it('never calls seizeConnect when reconnect=true and disconnect fails', async () => {
      const disconnectError = new Error('Wallet disconnect failed');
      disconnect.mockRejectedValueOnce(disconnectError);
      
      const { result } = renderHook(() => useSeizeConnectContext(), {
        wrapper: ({ children }) => <SeizeConnectProvider>{children}</SeizeConnectProvider>,
      });

      try {
        await act(async () => {
          await result.current.seizeDisconnectAndLogout(true);
        });
        fail('Should have thrown AuthenticationError');
      } catch (error) {
        expect((error as any).name).toBe('AuthenticationError');
      }
      
      // Fast-forward timers
      act(() => {
        jest.advanceTimersByTime(200);
      });
      
      // Verify seizeConnect was NEVER called due to disconnect failure
      expect(open).not.toHaveBeenCalled();
      expect(removeAuthJwt).not.toHaveBeenCalled();
    });

    it('delays reconnection after successful logout when reconnect=true', async () => {
      const { result } = renderHook(() => useSeizeConnectContext(), {
        wrapper: ({ children }) => <SeizeConnectProvider>{children}</SeizeConnectProvider>,
      });

      await act(async () => {
        await result.current.seizeDisconnectAndLogout(true);
      });

      // Verify auth cleanup completed
      expect(disconnect).toHaveBeenCalled();
      expect(removeAuthJwt).toHaveBeenCalled();
      
      // Before timer advance - no reconnection yet
      expect(open).not.toHaveBeenCalled();
      
      // After 100ms delay - reconnection triggers
      act(() => {
        jest.advanceTimersByTime(100);
      });
      
      expect(open).toHaveBeenCalledWith({ view: 'Connect' });
    });
  });

  // CRITICAL: Infinite loop prevention tests
  describe('infinite loop prevention', () => {
    it('does not cause infinite re-renders when connectionState changes', async () => {
      const mockAccount = { address: '0x1234567890123456789012345678901234567890', isConnected: true, status: 'connected' };
      (useAppKitAccount as jest.Mock).mockReturnValue(mockAccount);
      
      const { result } = renderHook(() => useSeizeConnectContext(), {
        wrapper: ({ children }) => <SeizeConnectProvider>{children}</SeizeConnectProvider>,
      });

      // Let initial effects run
      act(() => {
        jest.advanceTimersByTime(100);
      });

      const initialConnectionState = result.current.connectionState;
      
      // Trigger multiple rapid account changes that would previously cause infinite loops
      act(() => {
        (useAppKitAccount as jest.Mock).mockReturnValue({
          ...mockAccount,
          address: '0x9876543210987654321098765432109876543210'
        });
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Verify state stabilizes and doesn't keep changing
      const finalConnectionState = result.current.connectionState;
      expect(finalConnectionState).toBe('connected');
      expect(finalConnectionState).toBe(initialConnectionState); // Should be stable
    });

    it('prevents memory leaks from uncleared timeouts', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      const { unmount } = renderHook(() => useSeizeConnectContext(), {
        wrapper: ({ children }) => <SeizeConnectProvider>{children}</SeizeConnectProvider>,
      });

      // Trigger timeout creation
      act(() => {
        (useAppKitAccount as jest.Mock).mockReturnValue({ 
          address: '0x1234567890123456789012345678901234567890', 
          isConnected: true, 
          status: 'connected' 
        });
      });

      // Unmount component before timeout completes
      unmount();

      // Verify timeout was properly cleared on unmount
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      clearTimeoutSpy.mockRestore();
    });

    it('maintains stable connectionState when no actual state change occurs', async () => {
      const mockAccount = { address: '0x1234567890123456789012345678901234567890', isConnected: true, status: 'connected' };
      (useAppKitAccount as jest.Mock).mockReturnValue(mockAccount);
      
      const { result } = renderHook(() => useSeizeConnectContext(), {
        wrapper: ({ children }) => <SeizeConnectProvider>{children}</SeizeConnectProvider>,
      });

      // Let initial effects run
      act(() => {
        jest.advanceTimersByTime(100);
      });

      const initialConnectionState = result.current.connectionState;
      const initialAddress = result.current.address;

      // Trigger same state multiple times (should not cause re-renders)
      act(() => {
        (useAppKitAccount as jest.Mock).mockReturnValue(mockAccount);
      });

      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Verify state remains exactly the same (no unnecessary updates)
      expect(result.current.connectionState).toBe(initialConnectionState);
      expect(result.current.address).toBe(initialAddress);
    });

    it('handles rapid state changes without causing infinite loops', async () => {
      const { result } = renderHook(() => useSeizeConnectContext(), {
        wrapper: ({ children }) => <SeizeConnectProvider>{children}</SeizeConnectProvider>,
      });

      // Simulate rapid state changes that previously caused infinite loops
      const rapidChanges = [
        { address: undefined, isConnected: false, status: 'disconnected' },
        { address: '0x1234567890123456789012345678901234567890', isConnected: false, status: 'connecting' },
        { address: '0x1234567890123456789012345678901234567890', isConnected: true, status: 'connected' },
        { address: undefined, isConnected: false, status: 'disconnected' },
        { address: '0x9876543210987654321098765432109876543210', isConnected: true, status: 'connected' }
      ];

      // Apply all changes rapidly
      rapidChanges.forEach((change, index) => {
        act(() => {
          (useAppKitAccount as jest.Mock).mockReturnValue(change);
          jest.advanceTimersByTime(10); // Small delays to simulate rapid changes
        });
      });

      // Let final state settle
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Verify final state is correct and stable
      expect(result.current.connectionState).toBe('connected');
      expect(result.current.address).toBe('0x9876543210987654321098765432109876543210');
      expect(result.current.isConnected).toBe(true);
    });

    it('functional state updates prevent unnecessary re-renders with same state', async () => {
      const mockAccount = { address: '0x1234567890123456789012345678901234567890', isConnected: true, status: 'connected' };
      (useAppKitAccount as jest.Mock).mockReturnValue(mockAccount);
      
      const { result, rerender } = renderHook(() => useSeizeConnectContext(), {
        wrapper: ({ children }) => <SeizeConnectProvider>{children}</SeizeConnectProvider>,
      });

      // Let initial effects run
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current.connectionState).toBe('connected');

      // Force multiple re-renders with same account state
      for (let i = 0; i < 5; i++) {
        act(() => {
          rerender();
          jest.advanceTimersByTime(60); // Let debounce complete
        });
      }

      // State should remain stable throughout
      expect(result.current.connectionState).toBe('connected');
    });
  });

  // Type safety verification tests
  describe('type safety', () => {
    it('throws AuthenticationError with proper type and cause', async () => {
      const disconnectError = new Error('Wallet disconnect failed');
      disconnect.mockRejectedValueOnce(disconnectError);
      
      const { result } = renderHook(() => useSeizeConnectContext(), {
        wrapper: ({ children }) => <SeizeConnectProvider>{children}</SeizeConnectProvider>,
      });

      try {
        await act(async () => {
          await result.current.seizeDisconnectAndLogout();
        });
        fail('Should have thrown AuthenticationError');
      } catch (error) {
        expect((error as any).name).toBe('AuthenticationError');
        expect((error as any).cause).toBeDefined();
        expect((error as any).cause.name).toBe('WalletDisconnectionError');
      }
    });
  });
});
