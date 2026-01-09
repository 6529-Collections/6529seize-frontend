import { renderHook, act } from "@testing-library/react";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";

describe("useIsTouchDevice", () => {
  const originalWindow = globalThis.window;
  const originalNavigator = globalThis.navigator;

  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      writable: true,
    });
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      writable: true,
    });
  });

  it("returns false when window is undefined", () => {
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      writable: true,
    });

    const { result } = renderHook(() => useIsTouchDevice());
    expect(result.current).toBe(false);
  });

  it("returns true when ontouchstart is in window", () => {
    const mockWindow = {
      ...originalWindow,
      ontouchstart: null,
      matchMedia: jest.fn(() => ({ matches: false })),
    };
    Object.defineProperty(globalThis, "window", {
      value: mockWindow,
      writable: true,
    });

    const { result } = renderHook(() => useIsTouchDevice());

    act(() => {
      jest.runAllTimers?.();
    });

    expect(result.current).toBe(true);
  });

  it("returns true when navigator.maxTouchPoints > 0", () => {
    const mockWindow = {
      ...originalWindow,
      matchMedia: jest.fn(() => ({ matches: false })),
    };
    Object.defineProperty(globalThis, "window", {
      value: mockWindow,
      writable: true,
    });
    Object.defineProperty(globalThis, "navigator", {
      value: { maxTouchPoints: 5 },
      writable: true,
    });

    const { result } = renderHook(() => useIsTouchDevice());

    act(() => {
      jest.runAllTimers?.();
    });

    expect(result.current).toBe(true);
  });

  it("returns true when matchMedia pointer:coarse matches", () => {
    const mockWindow = {
      ...originalWindow,
      matchMedia: jest.fn((query: string) => ({
        matches: query === "(pointer: coarse)",
      })),
    };
    Object.defineProperty(globalThis, "window", {
      value: mockWindow,
      writable: true,
    });
    Object.defineProperty(globalThis, "navigator", {
      value: { maxTouchPoints: 0 },
      writable: true,
    });

    const { result } = renderHook(() => useIsTouchDevice());

    act(() => {
      jest.runAllTimers?.();
    });

    expect(result.current).toBe(true);
  });

  it("returns false when no touch indicators present", () => {
    const mockWindow = {
      ...originalWindow,
      matchMedia: jest.fn(() => ({ matches: false })),
    };
    Object.defineProperty(globalThis, "window", {
      value: mockWindow,
      writable: true,
    });
    Object.defineProperty(globalThis, "navigator", {
      value: { maxTouchPoints: 0 },
      writable: true,
    });

    const { result } = renderHook(() => useIsTouchDevice());

    expect(result.current).toBe(false);
  });
});
