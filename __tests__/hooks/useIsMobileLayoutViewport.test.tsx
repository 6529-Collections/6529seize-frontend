import { act, cleanup, renderHook } from "@testing-library/react";
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
  const originalWidth = globalThis.window.innerWidth;

  afterEach(() => {
    cleanup();
    setViewportWidth(originalWidth);
    jest.restoreAllMocks();
  });

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
      setViewportWidth(1023);
      globalThis.window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toBe(true);

    act(() => {
      setViewportWidth(1024);
      globalThis.window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toBe(false);
  });

  it("checks the width once per same-layout resize and updates all consumers on a crossing", () => {
    let width = 1440;
    const readViewportWidth = jest.fn(() => width);
    Object.defineProperty(globalThis.window, "innerWidth", {
      configurable: true,
      get: readViewportWidth,
    });

    const first = renderHook(useIsMobileLayoutViewport);
    const second = renderHook(useIsMobileLayoutViewport);
    const resize = (nextWidth: number) => {
      act(() => {
        width = nextWidth;
        globalThis.window.dispatchEvent(new Event("resize"));
      });
    };

    readViewportWidth.mockClear();
    resize(1024);
    expect(readViewportWidth).toHaveBeenCalledTimes(1);
    expect(first.result.current).toBe(false);
    expect(second.result.current).toBe(false);

    resize(1023);
    expect(first.result.current).toBe(true);
    expect(second.result.current).toBe(true);

    readViewportWidth.mockClear();
    resize(900);
    expect(readViewportWidth).toHaveBeenCalledTimes(1);
    expect(first.result.current).toBe(true);
    expect(second.result.current).toBe(true);

    resize(1024);
    expect(first.result.current).toBe(false);
    expect(second.result.current).toBe(false);
  });

  it("reads the live layout for a new consumer while a resize is pending", () => {
    setViewportWidth(1440);
    const first = renderHook(useIsMobileLayoutViewport);

    setViewportWidth(1023);
    const next = renderHook(useIsMobileLayoutViewport);
    expect(first.result.current).toBe(false);
    expect(next.result.current).toBe(true);

    act(() => {
      globalThis.window.dispatchEvent(new Event("resize"));
    });
    expect(first.result.current).toBe(true);
    expect(next.result.current).toBe(true);
  });

  it("removes the shared resize listener when the last consumer unmounts", () => {
    setViewportWidth(1440);
    const addEventListener = jest.spyOn(globalThis.window, "addEventListener");
    const removeEventListener = jest.spyOn(
      globalThis.window,
      "removeEventListener"
    );
    const first = renderHook(useIsMobileLayoutViewport);
    const second = renderHook(useIsMobileLayoutViewport);
    const resizeListeners = addEventListener.mock.calls.filter(
      ([type]) => type === "resize"
    );

    expect(resizeListeners).toHaveLength(1);
    const listener = resizeListeners[0]?.[1];

    first.unmount();
    expect(removeEventListener).not.toHaveBeenCalledWith("resize", listener);

    second.unmount();
    expect(removeEventListener).toHaveBeenCalledWith("resize", listener);

    setViewportWidth(900);
    const remounted = renderHook(useIsMobileLayoutViewport);
    expect(remounted.result.current).toBe(true);

    act(() => {
      setViewportWidth(1024);
      globalThis.window.dispatchEvent(new Event("resize"));
    });
    expect(remounted.result.current).toBe(false);
  });
});
