import { renderHook, act } from "@testing-library/react";
import useIsMobileScreen from "@/hooks/isMobileScreen";

describe("useIsMobileScreen", () => {
  const originalWidth = window.innerWidth;

  const setScreenWidth = (width: number) => {
    Object.defineProperty(window, "innerWidth", {
      value: width,
      writable: true,
      configurable: true,
    });
  };

  afterEach(() => {
    setScreenWidth(originalWidth);
  });

  it("returns true when screen is small", () => {
    setScreenWidth(500);
    const { result } = renderHook(() => useIsMobileScreen());
    expect(result.current).toBe(true);
  });

  it("updates when resized", () => {
    setScreenWidth(1000);
    const { result } = renderHook(() => useIsMobileScreen());
    expect(result.current).toBe(false);
    act(() => {
      setScreenWidth(700);
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toBe(true);
  });

  it("does not re-render when resized inside the same breakpoint", () => {
    setScreenWidth(500);
    let renderCount = 0;

    const { result } = renderHook(() => {
      renderCount += 1;
      return useIsMobileScreen();
    });
    const initialRenderCount = renderCount;

    act(() => {
      setScreenWidth(600);
      window.dispatchEvent(new Event("resize"));
      setScreenWidth(650);
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toBe(true);
    expect(renderCount).toBe(initialRenderCount);
  });
});
