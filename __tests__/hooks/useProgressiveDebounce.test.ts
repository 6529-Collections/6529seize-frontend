import { renderHook, act } from '@testing-library/react';
import { useProgressiveDebounce } from '@/hooks/useProgressiveDebounce';

describe('useProgressiveDebounce', () => {
  jest.useFakeTimers();
  it('calls callback after delay and resets', () => {
    const cb = jest.fn();
    const { rerender } = renderHook(({dep}) => useProgressiveDebounce(cb, [dep], { minDelay:50, maxDelay:200, increaseFactor:2, decreaseFactor:2 }), { initialProps:{dep:0} });
    expect(cb).not.toHaveBeenCalled();
    act(() => { jest.advanceTimersByTime(50); });
    expect(cb).toHaveBeenCalledTimes(1);
    rerender({dep:1});
    act(() => { jest.advanceTimersByTime(50); });
    expect(cb).toHaveBeenCalledTimes(2);
  });
});
