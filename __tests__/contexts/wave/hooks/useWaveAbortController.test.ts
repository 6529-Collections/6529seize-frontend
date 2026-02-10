import { renderHook, act } from '@testing-library/react';
import { useWaveAbortController } from '@/contexts/wave/hooks/useWaveAbortController';

describe('useWaveAbortController', () => {
  it('creates, cancels and cleans up controllers', () => {
    const { result, unmount } = renderHook(() => useWaveAbortController());

    const controller = result.current.createController('w1');
    const abortSpy = jest.spyOn(controller, 'abort');

    act(() => {
      result.current.cancelFetch('w1');
    });
    expect(abortSpy).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.cleanupController('w1', controller);
    });

    act(() => {
      result.current.cancelFetch('w1');
    });
    expect(abortSpy).toHaveBeenCalledTimes(1);

    const controller2 = result.current.createController('w2');
    const abortSpy2 = jest.spyOn(controller2, 'abort');
    act(() => {
      result.current.cancelAllFetches();
    });
    expect(abortSpy2).toHaveBeenCalled();

    const abortSpy3 = jest.spyOn(controller2, 'abort');
    unmount();
    expect(abortSpy3).toHaveBeenCalled();
  });
});
