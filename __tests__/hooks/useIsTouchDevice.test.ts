import { renderHook, act } from "@testing-library/react";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";

describe("useIsTouchDevice", () => {
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;
  let touchStartHandler: EventListener | null = null;

  beforeEach(() => {
    addEventListenerSpy = jest
      .spyOn(globalThis, "addEventListener")
      .mockImplementation((event, handler) => {
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
    expect(addEventListenerSpy).not.toHaveBeenCalledWith(
      "touchstart",
      expect.any(Function),
      expect.any(Object)
    );
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

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "touchstart",
      expect.any(Function)
    );
  });

  it("cleans up event listener on unmount", () => {
    Object.defineProperty(globalThis, "matchMedia", {
      writable: true,
      value: jest.fn(() => ({ matches: false })),
    });

    const { unmount } = renderHook(() => useIsTouchDevice());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "touchstart",
      expect.any(Function)
    );
  });
});
