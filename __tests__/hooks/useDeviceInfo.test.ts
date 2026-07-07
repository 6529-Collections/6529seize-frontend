import useDeviceInfo from "@/hooks/useDeviceInfo";
import { __resetNativeDeviceStoresForTests } from "@/hooks/nativeDeviceStore";
import { act, renderHook } from "@testing-library/react";

jest.mock("@capacitor/core", () => ({
  registerPlugin: jest.fn(),
  WebPlugin: class {},
  Capacitor: {
    isNativePlatform: jest.fn(),
    getPlatform: jest.fn(),
  },
}));

jest.mock("@capacitor/app", () => ({
  App: {
    getState: jest.fn(),
    addListener: jest.fn(() => Promise.resolve({ remove: jest.fn() })),
    removeAllListeners: jest.fn(),
  },
}));

const { Capacitor } = require("@capacitor/core");
const { App } = require("@capacitor/app");

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
    __resetNativeDeviceStoresForTests();
    jest.clearAllMocks();
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);
    (Capacitor.getPlatform as jest.Mock).mockReturnValue("web");
    (App.getState as jest.Mock).mockResolvedValue({ isActive: false });
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
    __resetNativeDeviceStoresForTests();
    jest.restoreAllMocks();
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
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (Capacitor.getPlatform as jest.Mock).mockReturnValue("ios");
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
    defineUserAgent("Mozilla/5.0");
    defineMaxTouchPoints(5);
    defineMatchMedia();
    const { result } = renderHook(() => useDeviceInfo());
    expect(result.current.hasTouchScreen).toBe(true);
  });

  it("keeps hasTouchScreen true for phones that pair a mouse (hover + fine pointer)", () => {
    // A Bluetooth mouse on a phone adds hover and a fine pointer, but the
    // mobile UA keeps the device touch-first.
    defineUserAgent("iPhone");
    defineMaxTouchPoints(5);
    defineMatchMedia({ finePointer: true, hover: true });
    const { result } = renderHook(() => useDeviceInfo());
    expect(result.current.hasTouchScreen).toBe(true);
    expect(result.current.isMobileDevice).toBe(true);
  });

  it("shares browser listeners across multiple hook callers", () => {
    defineUserAgent("Mozilla/5.0");
    defineMaxTouchPoints(0);
    defineMatchMedia();

    const { result } = renderHook(() => {
      const first = useDeviceInfo();
      const second = useDeviceInfo();

      return { first, second };
    });

    expect(result.current.first).toEqual(result.current.second);
    expect(
      (globalThis.addEventListener as jest.Mock).mock.calls.filter(
        ([event]) => event === "resize"
      )
    ).toHaveLength(1);
    expect(
      (globalThis.addEventListener as jest.Mock).mock.calls.filter(
        ([event]) => event === "touchstart"
      )
    ).toHaveLength(1);
  });
});
