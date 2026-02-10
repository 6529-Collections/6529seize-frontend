import { renderHook, act } from '@testing-library/react';
import useIsMobileScreen from '@/hooks/isMobileScreen';

describe('useIsMobileScreen', () => {
  const originalWidth = window.innerWidth;

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: originalWidth, writable: true, configurable: true });
  });

  it('returns true when screen is small', () => {
    Object.defineProperty(window, 'innerWidth', { value: 500, writable: true, configurable: true });
    const { result } = renderHook(() => useIsMobileScreen());
    expect(result.current).toBe(true);
  });

  it('updates when resized', () => {
    Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true, configurable: true });
    const { result } = renderHook(() => useIsMobileScreen());
    expect(result.current).toBe(false);
    act(() => {
      window.innerWidth = 700 as number;
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current).toBe(true);
  });
});
