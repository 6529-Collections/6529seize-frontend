import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useAppWalletPasswordModal } from '../..//hooks/useAppWalletPasswordModal';

const MockUnlockAppWalletModal = jest.fn(({ show, onHide, onUnlock }) => (
  show ? (
    <div>
      <button onClick={() => onUnlock('pass')} data-testid="unlock" />
      <button onClick={onHide} data-testid="cancel" />
    </div>
  ) : null
));

jest.mock('../../components/app-wallets/AppWalletModal', () => ({
  UnlockAppWalletModal: MockUnlockAppWalletModal,
}));

describe('useAppWalletPasswordModal hook', () => {
  it('resolves password through modal', async () => {
    const { result } = renderHook(() => useAppWalletPasswordModal());
    let promise: Promise<string>;
    act(() => {
      promise = result.current.requestPassword('0x1', 'hash');
    });
    act(() => {
      result.current.modal.props.onUnlock('secret');
    });
    await expect(promise!).resolves.toBe('secret');
  });

  it('rejects when cancelled', async () => {
    const { result } = renderHook(() => useAppWalletPasswordModal());
    let promise: Promise<string>;
    act(() => {
      promise = result.current.requestPassword('0x1', 'hash');
    });
    act(() => {
      result.current.modal.props.onHide();
    });
    await expect(promise!).rejects.toThrow('Password entry canceled.');
  });
});
