import { act, renderHook } from "@testing-library/react";

import {
  useMinuteNow,
  useSecondNow,
} from "@/components/tools/time-zones/liveClock";

const START = Date.UTC(2026, 9, 12, 10, 15, 42, 500);

// Shadows Document.prototype's getter with an own property on `document`;
// afterEach deletes it so later suites see jsdom's real visibilityState.
function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("liveClock", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(START);
    setVisibility("visible");
  });

  afterEach(() => {
    jest.useRealTimers();
    Reflect.deleteProperty(document, "visibilityState");
  });

  it("restores jsdom's own visibilityState after each test", () => {
    Reflect.deleteProperty(document, "visibilityState");
    expect(Object.hasOwn(document, "visibilityState")).toBe(false);
    expect(document.visibilityState).toBe("visible");
    setVisibility("visible");
  });

  it("updates minute subscribers once, on the minute boundary", () => {
    let renders = 0;
    const { result, unmount } = renderHook(() => {
      renders += 1;
      return useMinuteNow();
    });
    expect(result.current).toBe(Date.UTC(2026, 9, 12, 10, 15));
    const rendersAfterMount = renders;

    act(() => {
      jest.advanceTimersByTime(17_000);
    });
    expect(result.current).toBe(Date.UTC(2026, 9, 12, 10, 15));
    expect(renders).toBe(rendersAfterMount);

    act(() => {
      jest.advanceTimersByTime(1_000);
    });
    expect(result.current).toBe(Date.UTC(2026, 9, 12, 10, 16));
    expect(renders).toBe(rendersAfterMount + 1);
    unmount();
  });

  it("ticks second subscribers every second from the same timer", () => {
    const minute = renderHook(() => useMinuteNow());
    const second = renderHook(() => useSecondNow());
    expect(second.result.current).toBe(Date.UTC(2026, 9, 12, 10, 15, 42));

    act(() => {
      jest.advanceTimersByTime(1_000);
    });
    expect(second.result.current).toBe(Date.UTC(2026, 9, 12, 10, 15, 43));
    expect(minute.result.current).toBe(Date.UTC(2026, 9, 12, 10, 15));
    expect(jest.getTimerCount()).toBe(1);

    second.unmount();
    minute.unmount();
    expect(jest.getTimerCount()).toBe(0);
  });

  it("pauses while hidden and catches up as soon as the page is visible", () => {
    const { result, unmount } = renderHook(() => useMinuteNow());

    act(() => {
      setVisibility("hidden");
    });
    expect(jest.getTimerCount()).toBe(0);

    act(() => {
      jest.setSystemTime(Date.UTC(2026, 9, 12, 11, 2, 5));
    });
    expect(result.current).toBe(Date.UTC(2026, 9, 12, 10, 15));

    act(() => {
      setVisibility("visible");
    });
    expect(result.current).toBe(Date.UTC(2026, 9, 12, 11, 2));
    expect(jest.getTimerCount()).toBe(1);
    unmount();
  });
});
