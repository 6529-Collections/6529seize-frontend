import { renderHook } from '@testing-library/react';
import { useElectron } from '../../hooks/useElectron';

describe('useElectron', () => {
  const originalUA = navigator.userAgent;
  const originalWindow = global.window;

  afterEach(() => {
    Object.defineProperty(window.navigator, 'userAgent', { value: originalUA, configurable: true });
    (global as any).window = originalWindow;
  });

  it('returns true when user agent contains Electron', () => {
    Object.defineProperty(window.navigator, 'userAgent', { value: 'Electron Foo', configurable: true });
    const { result } = renderHook(() => useElectron());
    expect(result.current).toBe(true);
  });

  it('returns false when user agent does not contain Electron', () => {
    Object.defineProperty(window.navigator, 'userAgent', { value: 'Mozilla/5.0', configurable: true });
    const { result } = renderHook(() => useElectron());
    expect(result.current).toBe(false);
  });

  it('returns false when window is undefined', () => {
    (global as any).window = undefined;
    const { result } = renderHook(() => useElectron());
    expect(result.current).toBe(false);
  });
});
