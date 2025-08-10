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
