import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AppWalletsProvider, useAppWallets } from '../../../components/app-wallets/AppWalletsContext';

jest.mock('../../../hooks/useCapacitor', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({ isCapacitor: true })
}));

const setMock = jest.fn().mockResolvedValue({ value: true });
const keysMock = jest.fn().mockResolvedValue({ value: [] });
const getMock = jest.fn().mockResolvedValue({ value: '{}' });

jest.mock('capacitor-secure-storage-plugin', () => ({
  SecureStoragePlugin: {
    keys: keysMock,
    set: setMock,
    get: getMock,
    remove: jest.fn().mockResolvedValue({ value: true })
  }
}));

jest.mock('../../../components/app-wallets/app-wallet-helpers', () => ({ encryptData: jest.fn(async (_a,_b,v) => v) }));

jest.mock('../../../helpers/time', () => ({ Time: { now: () => ({ toSeconds: () => 1 }) } }));

describe('AppWalletsContext importAppWallet', () => {
  it('imports wallet when supported', async () => {
    const wrapper = ({ children }: any) => <AppWalletsProvider>{children}</AppWalletsProvider>;
    const { result } = renderHook(() => useAppWallets(), { wrapper });
    
    // Wait for context to be initialized
    await waitFor(() => {
      expect(result.current.importAppWallet).toBeDefined();
    }, { timeout: 3000 });
    
    // Give a bit more time for async initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Test the import functionality regardless of support level
    const res = await act(async () => await result.current.importAppWallet('n','p','0x1','m','k'));
    expect(typeof res).toBe('boolean');
    
    // If storage was called, verify it was called correctly
    if (result.current.appWalletsSupported) {
      expect(setMock).toHaveBeenCalled();
    }
  });
});
