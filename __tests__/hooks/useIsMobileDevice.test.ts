import { renderHook } from '@testing-library/react';
import useIsMobileDevice from '../../hooks/isMobileDevice';

describe('useIsMobileDevice', () => {
  const originalUserAgent = navigator.userAgent;

  afterEach(() => {
    Object.defineProperty(window.navigator, 'userAgent', { value: originalUserAgent, configurable: true });
  });

  it('detects mobile user agent', () => {
    Object.defineProperty(window.navigator, 'userAgent', { value: 'iPhone', configurable: true });
    const { result } = renderHook(() => useIsMobileDevice());
    expect(result.current).toBe(true);
  });

  it('detects desktop user agent', () => {
    Object.defineProperty(window.navigator, 'userAgent', { value: 'Mozilla/5.0 (X11; Linux x86_64)', configurable: true });
    const { result } = renderHook(() => useIsMobileDevice());
    expect(result.current).toBe(false);
  });
});
