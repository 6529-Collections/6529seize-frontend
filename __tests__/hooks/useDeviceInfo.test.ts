import { renderHook, act } from '@testing-library/react';
import useDeviceInfo from '@/hooks/useDeviceInfo';

jest.mock('@/hooks/useCapacitor', () => ({ __esModule: true, default: jest.fn(() => ({ isCapacitor: false })) }));
const capacitorMock = require('@/hooks/useCapacitor').default as jest.Mock;

let touchStartHandler: EventListener | null = null;

function defineMatchMedia(pointerFine = true, width = false) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn((query: string) => ({
      matches: query === '(pointer: fine)' ? pointerFine : query === '(max-width: 768px)' ? width : false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
}

describe('useDeviceInfo', () => {
  beforeEach(() => {
    jest.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'touchstart') {
        touchStartHandler = handler as EventListener;
      }
    });
    jest.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    touchStartHandler = null;
    jest.restoreAllMocks();
    capacitorMock.mockReturnValue({ isCapacitor: false });
  });

  it('detects classic mobile user agent', () => {
    Object.defineProperty(window.navigator, 'userAgent', { value: 'iPhone', configurable: true });
    defineMatchMedia(false, false);
    const { result } = renderHook(() => useDeviceInfo());
    expect(result.current.isMobileDevice).toBe(true);
    expect(result.current.isAppleMobile).toBe(true);
    expect(result.current.isApp).toBe(false);
    expect(result.current.hasTouchScreen).toBe(false);

    act(() => {
      if (touchStartHandler) {
        touchStartHandler(new Event('touchstart'));
      }
    });

    expect(result.current.hasTouchScreen).toBe(true);
  });

  it('detects capacitor mobile with desktop UA', () => {
    capacitorMock.mockReturnValue({ isCapacitor: true });
    Object.defineProperty(window.navigator, 'userAgent', { value: 'Macintosh', configurable: true });
    defineMatchMedia(false, true);
    const { result } = renderHook(() => useDeviceInfo());
    expect(result.current.isMobileDevice).toBe(true);
    expect(result.current.isApp).toBe(true);
    expect(result.current.isAppleMobile).toBe(false);

    act(() => {
      if (touchStartHandler) {
        touchStartHandler(new Event('touchstart'));
      }
    });

    expect(result.current.isAppleMobile).toBe(true);
    expect(result.current.hasTouchScreen).toBe(true);
  });

  it('returns false for desktop without touch', () => {
    capacitorMock.mockReturnValue({ isCapacitor: false });
    Object.defineProperty(window.navigator, 'userAgent', { value: 'Mozilla/5.0', configurable: true });
    defineMatchMedia(true, false);
    const { result } = renderHook(() => useDeviceInfo());
    expect(result.current.isMobileDevice).toBe(false);
    expect(result.current.hasTouchScreen).toBe(false);
    expect(result.current.isAppleMobile).toBe(false);
  });

  it('hasTouchScreen stays false when fine pointer is present even after touch', () => {
    capacitorMock.mockReturnValue({ isCapacitor: false });
    Object.defineProperty(window.navigator, 'userAgent', { value: 'Mozilla/5.0', configurable: true });
    defineMatchMedia(true, false);
    const { result } = renderHook(() => useDeviceInfo());

    act(() => {
      if (touchStartHandler) {
        touchStartHandler(new Event('touchstart'));
      }
    });

    expect(result.current.hasTouchScreen).toBe(false);
  });
});
