import useDeviceInfo from '@/hooks/useDeviceInfo';
import { act, renderHook } from '@testing-library/react';

jest.mock('@/hooks/useCapacitor', () => ({ __esModule: true, default: jest.fn(() => ({ isCapacitor: false })) }));
const capacitorMock = require('@/hooks/useCapacitor').default as jest.Mock;

let touchStartHandler: EventListener | null = null;

function defineMatchMedia(pointerFine = true, anyPointerFine = true, hover = true, anyHover = true, width = false) {
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    value: jest.fn((query: string) => {
      if (query === '(pointer: fine)') {
        return { matches: pointerFine, addEventListener: jest.fn(), removeEventListener: jest.fn() };
      }
      if (query === '(any-pointer: fine)') {
        return { matches: anyPointerFine, addEventListener: jest.fn(), removeEventListener: jest.fn() };
      }
      if (query === '(hover: hover)') {
        return { matches: hover, addEventListener: jest.fn(), removeEventListener: jest.fn() };
      }
      if (query === '(any-hover: hover)') {
        return { matches: anyHover, addEventListener: jest.fn(), removeEventListener: jest.fn() };
      }
      if (query === '(max-width: 768px)') {
        return { matches: width, addEventListener: jest.fn(), removeEventListener: jest.fn() };
      }
      return { matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() };
    }),
  });
}

describe('useDeviceInfo', () => {
  beforeEach(() => {
    jest.spyOn(globalThis, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'touchstart') {
        touchStartHandler = handler as EventListener;
      }
    });
    jest.spyOn(globalThis, 'removeEventListener');
  });

  afterEach(() => {
    touchStartHandler = null;
    jest.restoreAllMocks();
    capacitorMock.mockReturnValue({ isCapacitor: false });
  });

  it('detects classic mobile user agent', () => {
    Object.defineProperty(globalThis.navigator, 'userAgent', { value: 'iPhone', configurable: true });
    Object.defineProperty(globalThis.navigator, 'maxTouchPoints', { value: 5, configurable: true });
    defineMatchMedia(false, false, false, false, false);
    const { result } = renderHook(() => useDeviceInfo());
    expect(result.current.isMobileDevice).toBe(true);
    expect(result.current.isAppleMobile).toBe(true);
    expect(result.current.isApp).toBe(false);
    expect(result.current.hasTouchScreen).toBe(true);
    expect(result.current.shouldUseTouchUI).toBe(true);
  });

  it('detects capacitor mobile with desktop UA', () => {
    capacitorMock.mockReturnValue({ isCapacitor: true });
    Object.defineProperty(globalThis.navigator, 'userAgent', { value: 'Macintosh', configurable: true });
    Object.defineProperty(globalThis.navigator, 'maxTouchPoints', { value: 5, configurable: true });
    defineMatchMedia(false, false, false, false, true);
    const { result } = renderHook(() => useDeviceInfo());
    expect(result.current.isMobileDevice).toBe(true);
    expect(result.current.isApp).toBe(true);
    expect(result.current.isAppleMobile).toBe(true);
    expect(result.current.hasTouchScreen).toBe(true);
    expect(result.current.shouldUseTouchUI).toBe(false);
  });

  it('returns false for desktop without touch', () => {
    capacitorMock.mockReturnValue({ isCapacitor: false });
    Object.defineProperty(globalThis.navigator, 'userAgent', { value: 'Mozilla/5.0', configurable: true });
    Object.defineProperty(globalThis.navigator, 'maxTouchPoints', { value: 0, configurable: true });
    defineMatchMedia(true, true, true, true, false);
    const { result } = renderHook(() => useDeviceInfo());
    expect(result.current.isMobileDevice).toBe(false);
    expect(result.current.hasTouchScreen).toBe(false);
    expect(result.current.shouldUseTouchUI).toBe(false);
    expect(result.current.isAppleMobile).toBe(false);
  });

  it('hasTouchScreen becomes true on hybrid device after touch even with fine pointer', () => {
    capacitorMock.mockReturnValue({ isCapacitor: false });
    Object.defineProperty(globalThis.navigator, 'userAgent', { value: 'Mozilla/5.0', configurable: true });
    Object.defineProperty(globalThis.navigator, 'maxTouchPoints', { value: 0, configurable: true });
    defineMatchMedia(true, true, true, true, false);
    const { result } = renderHook(() => useDeviceInfo());

    expect(result.current.hasTouchScreen).toBe(false);
    expect(result.current.shouldUseTouchUI).toBe(false);

    act(() => {
      if (touchStartHandler) {
        touchStartHandler(new Event('touchstart'));
      }
    });

    expect(result.current.hasTouchScreen).toBe(true);
    expect(result.current.shouldUseTouchUI).toBe(false);
  });

  it('hasTouchScreen is true when maxTouchPoints > 0 even without touch event', () => {
    capacitorMock.mockReturnValue({ isCapacitor: false });
    Object.defineProperty(globalThis.navigator, 'userAgent', { value: 'Mozilla/5.0', configurable: true });
    Object.defineProperty(globalThis.navigator, 'maxTouchPoints', { value: 5, configurable: true });
    defineMatchMedia(true, true, true, true, false);
    const { result } = renderHook(() => useDeviceInfo());
    expect(result.current.hasTouchScreen).toBe(true);
    expect(result.current.shouldUseTouchUI).toBe(false);
  });

  it('shouldUseTouchUI is false for desktop with fine pointer and hover', () => {
    capacitorMock.mockReturnValue({ isCapacitor: false });
    Object.defineProperty(globalThis.navigator, 'userAgent', { value: 'Mozilla/5.0', configurable: true });
    Object.defineProperty(globalThis.navigator, 'maxTouchPoints', { value: 10, configurable: true });
    defineMatchMedia(true, true, true, true, false);
    const { result } = renderHook(() => useDeviceInfo());
    expect(result.current.hasTouchScreen).toBe(true);
    expect(result.current.shouldUseTouchUI).toBe(false);
  });

  it('shouldUseTouchUI is true for mobile device without fine pointer or hover', () => {
    capacitorMock.mockReturnValue({ isCapacitor: false });
    Object.defineProperty(globalThis.navigator, 'userAgent', { value: 'Android', configurable: true });
    Object.defineProperty(globalThis.navigator, 'maxTouchPoints', { value: 5, configurable: true });
    defineMatchMedia(false, false, false, false, false);
    const { result } = renderHook(() => useDeviceInfo());
    expect(result.current.hasTouchScreen).toBe(true);
    expect(result.current.shouldUseTouchUI).toBe(true);
  });

  it('shouldUseTouchUI is false for touchscreen laptop (has fine pointer)', () => {
    capacitorMock.mockReturnValue({ isCapacitor: false });
    Object.defineProperty(globalThis.navigator, 'userAgent', { value: 'Mozilla/5.0 Windows', configurable: true });
    Object.defineProperty(globalThis.navigator, 'maxTouchPoints', { value: 10, configurable: true });
    defineMatchMedia(true, true, true, true, false);
    const { result } = renderHook(() => useDeviceInfo());
    expect(result.current.hasTouchScreen).toBe(true);
    expect(result.current.shouldUseTouchUI).toBe(false);
  });
});
