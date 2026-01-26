import { renderHook, act } from "@testing-library/react";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";

describe("useIsTouchDevice", () => {
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;
  let touchStartHandler: EventListener | null = null;
  let originalMaxTouchPoints: number | undefined;

  beforeEach(() => {
    originalMaxTouchPoints = (globalThis.navigator as Navigator | undefined)?.maxTouchPoints;
    addEventListenerSpy = jest.spyOn(globalThis, "addEventListener").mockImplementation((event, handler) => {
      if (event === "touchstart") {
        touchStartHandler = handler as EventListener;
      }
    });
    removeEventListenerSpy = jest.spyOn(globalThis, "removeEventListener");
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
    touchStartHandler = null;
    if (typeof originalMaxTouchPoints === "number") {
      Object.defineProperty(globalThis.navigator, "maxTouchPoints", {
        value: originalMaxTouchPoints,
        configurable: true,
      });
    } else {
      // Ensure tests don't leak touch points across cases.
      try {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete (globalThis.navigator as any).maxTouchPoints;
      } catch {
        // ignore
      }
    }
    jest.restoreAllMocks();
  });

  it("returns false initially when fine pointer is detected", () => {
    Object.defineProperty(globalThis, "matchMedia", {
      writable: true,
      value: jest.fn((query: string) => ({
        matches: query === "(pointer: fine)",
      })),
    });

    const { result } = renderHook(() => useIsTouchDevice());
    expect(result.current).toBe(false);
  });

  it("returns false initially and does not listen for touch when fine pointer exists", () => {
    Object.defineProperty(globalThis, "matchMedia", {
      writable: true,
      value: jest.fn((query: string) => ({
        matches: query === "(pointer: fine)",
      })),
    });

    renderHook(() => useIsTouchDevice());
    expect(addEventListenerSpy).not.toHaveBeenCalledWith("touchstart", expect.any(Function), expect.any(Object));
  });

  it("returns true initially when maxTouchPoints > 0 and no fine pointer", () => {
    Object.defineProperty(globalThis.navigator, "maxTouchPoints", { value: 10, configurable: true });
    Object.defineProperty(globalThis, "matchMedia", {
      writable: true,
      value: jest.fn(() => ({ matches: false })),
    });

    const { result } = renderHook(() => useIsTouchDevice());
    expect(result.current).toBe(true);
    expect(addEventListenerSpy).not.toHaveBeenCalledWith("touchstart", expect.any(Function), expect.any(Object));
  });

  it("returns false when a fine pointer exists even if maxTouchPoints > 0", () => {
    Object.defineProperty(globalThis.navigator, "maxTouchPoints", { value: 10, configurable: true });
    Object.defineProperty(globalThis, "matchMedia", {
      writable: true,
      value: jest.fn((query: string) => ({
        matches: query === "(any-pointer: fine)",
      })),
    });

    const { result } = renderHook(() => useIsTouchDevice());
    expect(result.current).toBe(false);
    expect(addEventListenerSpy).not.toHaveBeenCalledWith("touchstart", expect.any(Function), expect.any(Object));
  });

  it("returns false initially but switches to true after touchstart when no fine pointer", () => {
    Object.defineProperty(globalThis, "matchMedia", {
      writable: true,
      value: jest.fn(() => ({ matches: false })),
    });

    const { result } = renderHook(() => useIsTouchDevice());
    expect(result.current).toBe(false);

    act(() => {
      if (touchStartHandler) {
        touchStartHandler(new Event("touchstart"));
      }
    });

    expect(result.current).toBe(true);
  });

  it("removes touchstart listener after first touch", () => {
    Object.defineProperty(globalThis, "matchMedia", {
      writable: true,
      value: jest.fn(() => ({ matches: false })),
    });

    renderHook(() => useIsTouchDevice());

    act(() => {
      if (touchStartHandler) {
        touchStartHandler(new Event("touchstart"));
      }
    });

    expect(removeEventListenerSpy).toHaveBeenCalledWith("touchstart", expect.any(Function));
  });

  it("cleans up event listener on unmount", () => {
    Object.defineProperty(globalThis, "matchMedia", {
      writable: true,
      value: jest.fn(() => ({ matches: false })),
    });

    const { unmount } = renderHook(() => useIsTouchDevice());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("touchstart", expect.any(Function));
  });
});