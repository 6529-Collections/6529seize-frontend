import { renderHook, act } from '@testing-library/react';
import { AppWalletsProvider, useAppWallets } from '../../../components/app-wallets/AppWalletsContext';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import { ethers } from 'ethers';
import { encryptData } from '../../../components/app-wallets/app-wallet-helpers';
import useCapacitor from '../../../hooks/useCapacitor';

jest.mock('capacitor-secure-storage-plugin', () => ({
  SecureStoragePlugin: {
    keys: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    remove: jest.fn(),
  },
}));

jest.mock('ethers', () => ({
  ethers: {
    Wallet: { createRandom: jest.fn() },
  },
}));

jest.mock('../../../components/app-wallets/app-wallet-helpers', () => ({
  encryptData: jest.fn(async () => 'encrypted'),
}));

jest.mock('../../../hooks/useCapacitor');

const walletObject = { address: '0xabc', mnemonic: { phrase: 'phrase' }, privateKey: 'priv' };
(ethers.Wallet.createRandom as jest.Mock).mockReturnValue(walletObject);
(SecureStoragePlugin.set as jest.Mock).mockResolvedValue({ value: true });
(SecureStoragePlugin.keys as jest.Mock).mockResolvedValue({ value: [] });
(SecureStoragePlugin.get as jest.Mock).mockResolvedValue({ value: '{}' });
(SecureStoragePlugin.remove as jest.Mock).mockResolvedValue({ value: true });


describe('AppWalletsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns false when unsupported', async () => {
    (useCapacitor as jest.Mock).mockReturnValue({ isCapacitor: false });
    const { result } = renderHook(() => useAppWallets(), { wrapper: AppWalletsProvider });
    await act(async () => { await Promise.resolve(); });
    expect(result.current.appWalletsSupported).toBe(false);
    const created = await result.current.createAppWallet('name', 'pass');
    expect(created).toBe(false);
    expect(SecureStoragePlugin.set).not.toHaveBeenCalled();
  });

  it('allows creating wallet when supported', async () => {
    (useCapacitor as jest.Mock).mockReturnValue({ isCapacitor: true });
    const { result } = renderHook(() => useAppWallets(), { wrapper: AppWalletsProvider });
    await act(async () => { await Promise.resolve(); });
    expect(result.current.appWalletsSupported).toBe(true);

    let res;
    await act(async () => { res = await result.current.createAppWallet('n','p'); });
    expect(SecureStoragePlugin.set).toHaveBeenCalled();
    expect(res).toBe(true);
  });

  it('throws when hook used outside provider', () => {
    expect(() => renderHook(() => useAppWallets())).toThrow();
  });
});
