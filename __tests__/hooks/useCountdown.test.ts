import { renderHook, act } from '@testing-library/react';
import { useCountdown } from '../../hooks/useCountdown';

jest.useFakeTimers();

describe('useCountdown', () => {
  let now: number;
  let nowSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    now = 1600000000000;
    nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    jest.clearAllTimers();
    nowSpy.mockRestore();
  });

  it('returns empty string when target is null', () => {
    const { result } = renderHook(() => useCountdown(null));
    expect(result.current).toBe('');
  });

  it('updates countdown over time and ends at "Now"', () => {
    const target = now + 2 * 60 * 60 * 1000; // 2 hours
    const { result } = renderHook(() => useCountdown(target));
    expect(result.current).toBe('in 2h 0m');

    // advance 5 minutes (interval < 1 day -> 5 minutes)
    act(() => {
      now += 5 * 60 * 1000;
      jest.advanceTimersByTime(5 * 60 * 1000);
    });
    expect(result.current).toBe('in 1h 55m');

    // advance past target time
    act(() => {
      now = target + 1000;
      jest.advanceTimersByTime(5 * 60 * 1000);
    });
    expect(result.current).toBe('Now');
  });
});
