import useDeviceInfo from "@/hooks/useDeviceInfo";
import useInteractionMode from "@/src/interaction/useInteractionMode";
import { createInteractionMode } from "@/__tests__/utils/interactionMode";
import { act, renderHook } from "@testing-library/react";

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: jest.fn(() => ({ isCapacitor: false })),
}));

jest.mock("@/src/interaction/useInteractionMode");

const capacitorMock = require("@/hooks/useCapacitor").default as jest.Mock;
const useInteractionModeMock = useInteractionMode as jest.Mock;

function setInteractionMode(
  overrides: Parameters<typeof createInteractionMode>[0] = {}
) {
  useInteractionModeMock.mockReturnValue(createInteractionMode(overrides));
}

function defineMatchMedia(width = false) {
  Object.defineProperty(globalThis, "matchMedia", {
    writable: true,
    value: jest.fn((query: string) => ({
      matches: query === "(max-width: 768px)" ? width : false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  });
}

describe("useDeviceInfo", () => {
  beforeEach(() => {
    setInteractionMode();
    jest.spyOn(globalThis, "addEventListener").mockImplementation(jest.fn());
    jest.spyOn(globalThis, "removeEventListener").mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.restoreAllMocks();
    capacitorMock.mockReturnValue({ isCapacitor: false });
  });

  it("detects classic mobile user agent", () => {
    Object.defineProperty(globalThis.navigator, "userAgent", {
      value: "iPhone",
      configurable: true,
    });
    setInteractionMode({ enableLongPress: true, hasCoarsePointer: true });
    defineMatchMedia(false);

    const { result } = renderHook(() => useDeviceInfo());

    expect(result.current.isMobileDevice).toBe(true);
    expect(result.current.isAppleMobile).toBe(true);
    expect(result.current.isApp).toBe(false);
    expect(result.current.hasTouchScreen).toBe(true);
  });

  it("detects capacitor mobile with desktop UA", () => {
    capacitorMock.mockReturnValue({ isCapacitor: true });
    Object.defineProperty(globalThis.navigator, "userAgent", {
      value: "Macintosh",
      configurable: true,
    });
    setInteractionMode({ enableLongPress: true, hasCoarsePointer: true });
    defineMatchMedia(true);

    const { result } = renderHook(() => useDeviceInfo());

    expect(result.current.isMobileDevice).toBe(true);
    expect(result.current.isApp).toBe(true);
    expect(result.current.isAppleMobile).toBe(true);
    expect(result.current.hasTouchScreen).toBe(true);
  });

  it("returns false for desktop without touch activation", () => {
    capacitorMock.mockReturnValue({ isCapacitor: false });
    Object.defineProperty(globalThis.navigator, "userAgent", {
      value: "Mozilla/5.0",
      configurable: true,
    });
    setInteractionMode({ enableLongPress: false, hasCoarsePointer: false });
    defineMatchMedia(false);

    const { result } = renderHook(() => useDeviceInfo());

    expect(result.current.isMobileDevice).toBe(false);
    expect(result.current.hasTouchScreen).toBe(false);
    expect(result.current.isAppleMobile).toBe(false);
  });

  it("updates hasTouchScreen from centralized interaction mode", () => {
    Object.defineProperty(globalThis.navigator, "userAgent", {
      value: "Mozilla/5.0",
      configurable: true,
    });
    setInteractionMode({ enableLongPress: false, hasCoarsePointer: true });
    defineMatchMedia(false);

    const { result, rerender } = renderHook(() => useDeviceInfo());
    expect(result.current.hasTouchScreen).toBe(false);

    act(() => {
      setInteractionMode({ enableLongPress: true, hasCoarsePointer: true });
      rerender();
    });

    expect(result.current.hasTouchScreen).toBe(true);
  });

  it("ignores browser touch primitives in favor of centralized interaction mode", () => {
    const touchStartDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      "ontouchstart"
    );
    const globalWithTouchStart = globalThis as typeof globalThis & {
      ontouchstart?: unknown;
    };
    capacitorMock.mockReturnValue({ isCapacitor: false });
    Object.defineProperty(globalThis.navigator, "userAgent", {
      value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      configurable: true,
    });
    Object.defineProperty(globalThis.navigator, "maxTouchPoints", {
      value: 5,
      configurable: true,
    });
    Object.defineProperty(globalThis, "ontouchstart", {
      value: jest.fn(),
      configurable: true,
    });
    setInteractionMode({ enableLongPress: false, hasCoarsePointer: false });
    defineMatchMedia(false);

    try {
      const { result } = renderHook(() => useDeviceInfo());

      expect(result.current.hasTouchScreen).toBe(false);
      expect(result.current.isAppleMobile).toBe(false);
      expect(result.current.isMobileDevice).toBe(false);
    } finally {
      if (touchStartDescriptor) {
        Object.defineProperty(globalThis, "ontouchstart", touchStartDescriptor);
      } else {
        delete globalWithTouchStart.ontouchstart;
      }
    }
  });
});
