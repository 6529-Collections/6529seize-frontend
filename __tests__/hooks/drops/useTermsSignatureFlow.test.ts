import { renderHook, act } from '@testing-library/react';
import { useTermsSignatureFlow } from '../../../hooks/drops/useTermsSignatureFlow';
import { useDropSignature } from '../../../hooks/drops/useDropSignature';

jest.mock('../../../hooks/drops/useDropSignature');

const mockSignDrop = jest.fn().mockResolvedValue({ success: true, signature: 'sig' });
(useDropSignature as jest.Mock).mockReturnValue({ signDrop: mockSignDrop, isLoading: false });

describe('useTermsSignatureFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens modal when terms require acknowledgment', async () => {
    const { result } = renderHook(() => useTermsSignatureFlow());
    const callback = jest.fn();

    await act(async () => {
      await result.current.prepareAndSignDrop({
        drop: { id: 1 } as any,
        termsOfService: 'Terms here',
        onSigningComplete: callback,
      });
    });

    expect(result.current.isTermsModalOpen).toBe(true);
    expect(callback).not.toHaveBeenCalled();
  });

  it('signs immediately when no terms provided', async () => {
    const { result } = renderHook(() => useTermsSignatureFlow());
    const callback = jest.fn();

    await act(async () => {
      await result.current.prepareAndSignDrop({
        drop: { id: 2 } as any,
        termsOfService: null,
        onSigningComplete: callback,
      });
    });

    expect(mockSignDrop).toHaveBeenCalledWith({ drop: { id: 2 }, termsOfService: null });
    expect(callback).toHaveBeenCalledWith({ success: true, signature: 'sig' });
  });

  it('completes signing after terms accepted', async () => {
    const { result } = renderHook(() => useTermsSignatureFlow());
    const callback = jest.fn();

    await act(async () => {
      await result.current.prepareAndSignDrop({
        drop: { id: 3 } as any,
        termsOfService: 'Terms',
        onSigningComplete: callback,
      });
    });

    await act(async () => {
      await result.current.onTermsAccepted();
    });

    expect(mockSignDrop).toHaveBeenCalledWith({ drop: { id: 3 }, termsOfService: 'Terms' });
    expect(callback).toHaveBeenCalledWith({ success: true, signature: 'sig' });
    expect(result.current.isTermsModalOpen).toBe(false);
  });

  it('handles rejection correctly', async () => {
    const { result } = renderHook(() => useTermsSignatureFlow());
    const callback = jest.fn();

    await act(async () => {
      await result.current.prepareAndSignDrop({
        drop: { id: 4 } as any,
        termsOfService: 'Terms',
        onSigningComplete: callback,
      });
    });

    act(() => {
      result.current.onTermsRejected();
    });

    expect(callback).toHaveBeenCalledWith({ success: false });
    expect(result.current.isTermsModalOpen).toBe(false);
  });
});
