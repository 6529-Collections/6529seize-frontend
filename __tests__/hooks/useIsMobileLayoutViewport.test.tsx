import { act, renderHook } from "@testing-library/react";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";

/** Sets the jsdom viewport width for viewport snapshot tests. */
const setViewportWidth = (width: number) => {
  Object.defineProperty(globalThis.window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
};

describe("useIsMobileLayoutViewport", () => {
  it("returns false for desktop-width layouts", () => {
    setViewportWidth(1440);

    const { result } = renderHook(() => useIsMobileLayoutViewport());

    expect(result.current).toBe(false);
  });

  it("returns true below the mobile layout breakpoint", () => {
    setViewportWidth(800);

    const { result } = renderHook(() => useIsMobileLayoutViewport());

    expect(result.current).toBe(true);
  });

  it("updates when the viewport crosses the mobile layout breakpoint", () => {
    setViewportWidth(1440);
    const { result } = renderHook(() => useIsMobileLayoutViewport());

    act(() => {
      setViewportWidth(800);
      globalThis.window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toBe(true);

    act(() => {
      setViewportWidth(1024);
      globalThis.window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toBe(false);
  });
});
