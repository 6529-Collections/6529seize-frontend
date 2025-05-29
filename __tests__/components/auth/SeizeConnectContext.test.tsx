import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { SeizeConnectProvider, useSeizeConnectContext } from '../../../components/auth/SeizeConnectContext';
import { useAccount, useConnections, useDisconnect } from 'wagmi';
import { useWeb3Modal, useWeb3ModalState } from '@web3modal/wagmi/react';
import { getWalletAddress, removeAuthJwt } from '../../../services/auth/auth.utils';

jest.mock('wagmi');
jest.mock('@web3modal/wagmi/react');
jest.mock('../../../services/auth/auth.utils');

const disconnect = jest.fn();
const openConnect = jest.fn();

(useConnections as jest.Mock).mockReturnValue([{ connector: 'c1' }]);
(useDisconnect as jest.Mock).mockReturnValue({ disconnect });
(useWeb3Modal as jest.Mock).mockReturnValue({ open: openConnect });
(useWeb3ModalState as jest.Mock).mockReturnValue({ open: false });
(useAccount as jest.Mock).mockReturnValue({ address: '0x1', isConnected: true });
(getWalletAddress as jest.Mock).mockReturnValue('0x1');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('SeizeConnectContext', () => {
  it('throws when used outside provider', () => {
    const { result } = renderHook(() => () => useSeizeConnectContext());
    expect(() => result.current()).toThrow();
  });

  it('provides connect and disconnect logic', () => {
    const { result } = renderHook(() => useSeizeConnectContext(), {
      wrapper: ({ children }) => <SeizeConnectProvider>{children}</SeizeConnectProvider>,
    });

    act(() => {
      result.current.seizeConnect();
    });
    expect(openConnect).toHaveBeenCalledWith({ view: 'Connect' });

    act(() => {
      result.current.seizeDisconnect();
    });
    expect(disconnect).toHaveBeenCalledWith({ connector: 'c1' });
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
    expect(openConnect).toHaveBeenCalled();
  });
});
