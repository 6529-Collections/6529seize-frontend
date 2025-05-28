import { renderHook, act } from '@testing-library/react';
import { useAppWalletPasswordModal } from '../../hooks/useAppWalletPasswordModal';

jest.mock('../../components/app-wallets/AppWalletModal', () => ({
  UnlockAppWalletModal: ({ show, onUnlock, onHide }: any) => (
    <div data-testid="modal" data-show={show} onClick={() => onUnlock('pass')} onDoubleClick={onHide} />
  ),
}));

describe('useAppWalletPasswordModal', () => {
  it('resolves promise on unlock', async () => {
    const { result } = renderHook(() => useAppWalletPasswordModal());

    let resolved: string | undefined;
    let promise: Promise<string> = Promise.resolve('');
    await act(async () => {
      promise = result.current.requestPassword('0x1', 'hash');
    });

    act(() => {
      result.current.modal.props.onUnlock('pass');
    });

    await expect(promise).resolves.toBe('pass');
  });

  it('rejects promise on cancel', async () => {
    const { result } = renderHook(() => useAppWalletPasswordModal());

    let promise: Promise<string> = Promise.resolve('');
    await act(async () => {
      promise = result.current.requestPassword('0x1', 'hash');
    });

    act(() => {
      result.current.modal.props.onHide();
    });

    await expect(promise).rejects.toBeInstanceOf(Error);
  });
});
