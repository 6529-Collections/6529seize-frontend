import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AppWalletsProvider, useAppWallets } from '../../../components/app-wallets/AppWalletsContext';

jest.mock('../../../hooks/useCapacitor', () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false })
}));

const setMock = jest.fn();

jest.mock('capacitor-secure-storage-plugin', () => ({
  SecureStoragePlugin: { set: setMock }
}));

describe('AppWalletsContext unsupported', () => {
  it('createAppWallet returns false when not supported', async () => {
    const wrapper = ({ children }: any) => <AppWalletsProvider>{children}</AppWalletsProvider>;
    const { result } = renderHook(() => useAppWallets(), { wrapper });
    await waitFor(() => result.current.createAppWallet !== undefined);
    const res = await act(async () => result.current.createAppWallet('n','p'));
    expect(res).toBe(false);
    expect(setMock).not.toHaveBeenCalled();
  });
});
