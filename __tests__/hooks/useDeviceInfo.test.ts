import useDeviceInfo from "@/hooks/useDeviceInfo";
import { act, renderHook } from "@testing-library/react";

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isCapacitor: false })),
}));
const capacitorMock = require("@/hooks/useCapacitor").default as jest.Mock;

let touchStartHandler: EventListener | null = null;

interface MatchMediaOptions {
  readonly finePointer?: boolean;
  readonly hover?: boolean;
  readonly narrowWidth?: boolean;
}

function defineMatchMedia({
  finePointer = false,
  hover = false,
  narrowWidth = false,
}: MatchMediaOptions = {}) {
  Object.defineProperty(globalThis, "matchMedia", {
    writable: true,
    value: jest.fn((query: string) => {
      let matches = false;
      if (query === "(pointer: fine)" || query === "(any-pointer: fine)") {
        matches = finePointer;
      } else if (query === "(hover: hover)" || query === "(any-hover: hover)") {
        matches = hover;
      } else if (query === "(max-width: 768px)") {
        matches = narrowWidth;
      }
      return {
        matches,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
    }),
  });
}

function defineMaxTouchPoints(value: number) {
  Object.defineProperty(globalThis.navigator, "maxTouchPoints", {
    value,
    configurable: true,
  });
}

function defineUserAgent(value: string) {
  Object.defineProperty(globalThis.navigator, "userAgent", {
    value,
    configurable: true,
  });
}

describe("useDeviceInfo", () => {
  beforeEach(() => {
    jest
      .spyOn(globalThis, "addEventListener")
      .mockImplementation((event, handler) => {
        if (event === "touchstart") {
          touchStartHandler = handler as EventListener;
        }
      });
    jest.spyOn(globalThis, "removeEventListener");
  });

  afterEach(() => {
    touchStartHandler = null;
    jest.restoreAllMocks();
    capacitorMock.mockReturnValue({ isCapacitor: false });
  });

  it("detects classic mobile user agent", () => {
    defineUserAgent("iPhone");
    defineMaxTouchPoints(5);
    defineMatchMedia();
    const { result } = renderHook(() => useDeviceInfo());
    expect(result.current.isMobileDevice).toBe(true);
    expect(result.current.isAppleMobile).toBe(true);
    expect(result.current.isApp).toBe(false);
    expect(result.current.hasTouchScreen).toBe(true);
  });

  it("detects capacitor mobile with desktop UA", () => {
    capacitorMock.mockReturnValue({ isCapacitor: true });
    defineUserAgent("Macintosh");
    defineMaxTouchPoints(5);
    defineMatchMedia({ narrowWidth: true });
    const { result } = renderHook(() => useDeviceInfo());
    expect(result.current.isMobileDevice).toBe(true);
    expect(result.current.isApp).toBe(true);
    expect(result.current.isAppleMobile).toBe(true);
    expect(result.current.hasTouchScreen).toBe(true);
  });

  it("returns false for desktop without touch", () => {
    capacitorMock.mockReturnValue({ isCapacitor: false });
    defineUserAgent("Mozilla/5.0");
    defineMaxTouchPoints(0);
    defineMatchMedia({ finePointer: true, hover: true });
    const { result } = renderHook(() => useDeviceInfo());
    expect(result.current.isMobileDevice).toBe(false);
    expect(result.current.hasTouchScreen).toBe(false);
    expect(result.current.isAppleMobile).toBe(false);
  });

  it("treats a Windows touch laptop (touch + fine pointer + hover) as desktop", () => {
    // Regression: Surface-style hybrids advertise 10 touch points but have a
    // trackpad/mouse — they must NOT be classified as touch-first.
    capacitorMock.mockReturnValue({ isCapacitor: false });
    defineUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"
    );
    defineMaxTouchPoints(10);
    defineMatchMedia({ finePointer: true, hover: true });
    const { result } = renderHook(() => useDeviceInfo());
    expect(result.current.hasTouchScreen).toBe(false);
    expect(result.current.isMobileDevice).toBe(false);
    expect(result.current.isAppleMobile).toBe(false);
  });

  it("keeps hasTouchScreen false on hybrid devices even after a touch event", () => {
    capacitorMock.mockReturnValue({ isCapacitor: false });
    defineUserAgent("Mozilla/5.0");
    defineMaxTouchPoints(10);
    defineMatchMedia({ finePointer: true, hover: true });
    const { result } = renderHook(() => useDeviceInfo());

    expect(result.current.hasTouchScreen).toBe(false);

    act(() => {
      if (touchStartHandler) {
        touchStartHandler(new Event("touchstart"));
      }
    });

    expect(result.current.hasTouchScreen).toBe(false);
  });

  it("hasTouchScreen becomes true after touch on devices without fine pointer or hover", () => {
    capacitorMock.mockReturnValue({ isCapacitor: false });
    defineUserAgent("Mozilla/5.0");
    defineMaxTouchPoints(0);
    defineMatchMedia();
    const { result } = renderHook(() => useDeviceInfo());

    expect(result.current.hasTouchScreen).toBe(false);

    act(() => {
      if (touchStartHandler) {
        touchStartHandler(new Event("touchstart"));
      }
    });

    expect(result.current.hasTouchScreen).toBe(true);
  });

  it("hasTouchScreen is true when maxTouchPoints > 0 and no fine pointer or hover", () => {
    capacitorMock.mockReturnValue({ isCapacitor: false });
    defineUserAgent("Mozilla/5.0");
    defineMaxTouchPoints(5);
    defineMatchMedia();
    const { result } = renderHook(() => useDeviceInfo());
    expect(result.current.hasTouchScreen).toBe(true);
  });

  it("keeps hasTouchScreen true for phones that pair a mouse (hover + fine pointer)", () => {
    // A Bluetooth mouse on a phone adds hover and a fine pointer, but the
    // mobile UA keeps the device touch-first.
    capacitorMock.mockReturnValue({ isCapacitor: false });
    defineUserAgent("iPhone");
    defineMaxTouchPoints(5);
    defineMatchMedia({ finePointer: true, hover: true });
    const { result } = renderHook(() => useDeviceInfo());
    expect(result.current.hasTouchScreen).toBe(true);
    expect(result.current.isMobileDevice).toBe(true);
  });
});
