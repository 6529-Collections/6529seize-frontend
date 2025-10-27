import { renderHook } from '@testing-library/react';
import useDeviceInfo from '@/hooks/useDeviceInfo';

jest.mock('@/hooks/useCapacitor', () => ({ __esModule: true, default: jest.fn(() => ({ isCapacitor: false })) }));
const capacitorMock = require('@/hooks/useCapacitor').default as jest.Mock;

defineMatchMedia();

function defineMatchMedia(pointer = false, width = false) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn((query) => ({
      matches: query.includes('pointer') ? pointer : width,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
}

describe('useDeviceInfo', () => {
  it('detects classic mobile user agent', () => {
    Object.defineProperty(window.navigator, 'userAgent', { value: 'iPhone', configurable: true });
    defineMatchMedia(true, false);
    const { result } = renderHook(() => useDeviceInfo());
    expect(result.current.isMobileDevice).toBe(true);
    expect(result.current.hasTouchScreen).toBe(true);
    expect(result.current.isApp).toBe(false);
  });

  it('detects capacitor mobile with desktop UA', () => {
    capacitorMock.mockReturnValue({ isCapacitor: true });
    Object.defineProperty(window.navigator, 'userAgent', { value: 'Macintosh', configurable: true });
    defineMatchMedia(true, true);
    const { result } = renderHook(() => useDeviceInfo());
    expect(result.current.isMobileDevice).toBe(true);
    expect(result.current.isApp).toBe(true);
  });

  it('returns false for desktop without touch', () => {
    capacitorMock.mockReturnValue({ isCapacitor: false });
    Object.defineProperty(window.navigator, 'userAgent', { value: 'Mozilla/5.0', configurable: true });
    defineMatchMedia(false, false);
    const { result } = renderHook(() => useDeviceInfo());
    expect(result.current.isMobileDevice).toBe(false);
    expect(result.current.hasTouchScreen).toBe(false);
  });
});
