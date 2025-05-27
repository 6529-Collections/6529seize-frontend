import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AppWalletsProvider, useAppWallets } from '../../../components/app-wallets/AppWalletsContext';

jest.mock('../../../hooks/useCapacitor', () => () => ({ isCapacitor: false }));
jest.mock('../../../components/app-wallets/app-wallet-helpers', () => ({ encryptData: jest.fn(() => Promise.resolve('enc')) }));
jest.mock('capacitor-secure-storage-plugin', () => ({ SecureStoragePlugin: { keys: jest.fn(), set: jest.fn(), get: jest.fn(), remove: jest.fn() } }));

const { SecureStoragePlugin } = require('capacitor-secure-storage-plugin');

describe('AppWalletsContext', () => {
  it('throws when used outside provider', () => {
    const { result } = renderHook(() => {
      try { useAppWallets(); } catch (e) { return e; }
    });
    expect(result.current).toBeInstanceOf(Error);
  });

  it('initializes unsupported when not running in capacitor', async () => {
    const { result } = renderHook(() => useAppWallets(), { wrapper: AppWalletsProvider });
    expect(result.current.appWalletsSupported).toBe(false);
    expect(SecureStoragePlugin.keys).not.toHaveBeenCalled();
  });

  it('createAppWallet returns false when unsupported', async () => {
    const { result } = renderHook(() => useAppWallets(), { wrapper: AppWalletsProvider });
    const ok = await act(() => result.current.createAppWallet('name', 'pass'));
    expect(ok).toBe(false);
    expect(SecureStoragePlugin.set).not.toHaveBeenCalled();
  });
});
