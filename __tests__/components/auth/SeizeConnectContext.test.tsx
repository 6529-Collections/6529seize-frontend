import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { SeizeConnectProvider, useSeizeConnectContext } from '../../../components/auth/SeizeConnectContext';
import { useAppKit, useAppKitAccount, useAppKitState, useDisconnect } from '@reown/appkit/react';
import { getWalletAddress, removeAuthJwt, migrateCookiesToLocalStorage } from '../../../services/auth/auth.utils';

jest.mock('@reown/appkit/react');
jest.mock('../../../services/auth/auth.utils');

const disconnect = jest.fn().mockResolvedValue(undefined);
const open = jest.fn();

(useDisconnect as jest.Mock).mockReturnValue({ disconnect });
(useAppKit as jest.Mock).mockReturnValue({ open });
(useAppKitState as jest.Mock).mockReturnValue({ open: false });
(useAppKitAccount as jest.Mock).mockReturnValue({ address: '0x1', isConnected: true });
(getWalletAddress as jest.Mock).mockReturnValue('0x1');
(migrateCookiesToLocalStorage as jest.Mock).mockImplementation(() => {});

beforeEach(() => {
  jest.clearAllMocks();
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
    expect(open).toHaveBeenCalledWith({ view: 'Connect' });
  });
});
