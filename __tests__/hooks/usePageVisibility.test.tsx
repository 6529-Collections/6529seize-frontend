import { act, renderHook } from "@testing-library/react";
import {
  usePageVisible,
  useVisibleInterval,
} from "@/hooks/usePageVisibility";
import { subscribeNativeAppActivity } from "@/services/app-activity/native-app-activity";

let mockNativeActive = true;
let mockNotifyNative: (() => void) | undefined;
const mockStopNative = jest.fn();
jest.mock("@/services/app-activity/native-app-activity", () => ({
  getNativeAppActivity: () => mockNativeActive,
  subscribeNativeAppActivity: jest.fn((notify: () => void) => {
    mockNotifyNative = notify;
    return mockStopNative;
  }),
}));

function setVisibility(value: DocumentVisibilityState) {
  act(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

function setNativeActive(value: boolean) {
  act(() => {
    mockNativeActive = value;
    mockNotifyNative?.();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockNativeActive = true;
  mockNotifyNative = undefined;
  setVisibility("visible");
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("usePageVisible", () => {
  it("follows document visibility through one shared listener", () => {
    const addListener = jest.spyOn(document, "addEventListener");
    const removeListener = jest.spyOn(document, "removeEventListener");
    const first = renderHook(usePageVisible);
    const second = renderHook(usePageVisible);

    expect(first.result.current).toBe(true);
    expect(
      addListener.mock.calls.filter(([type]) => type === "visibilitychange")
    ).toHaveLength(1);
    expect(subscribeNativeAppActivity).toHaveBeenCalledTimes(1);

    setVisibility("hidden");
    expect(first.result.current).toBe(false);
    expect(second.result.current).toBe(false);

    setVisibility("visible");
    expect(first.result.current).toBe(true);

    first.unmount();
    expect(mockStopNative).not.toHaveBeenCalled();
    second.unmount();
    expect(mockStopNative).toHaveBeenCalledTimes(1);
    expect(
      removeListener.mock.calls.filter(([type]) => type === "visibilitychange")
    ).toHaveLength(1);
    addListener.mockRestore();
    removeListener.mockRestore();
  });

  it("treats an inactive native app as hidden", () => {
    const { result } = renderHook(usePageVisible);

    setNativeActive(false);
    expect(result.current).toBe(false);

    setNativeActive(true);
    expect(result.current).toBe(true);
  });
});

describe("useVisibleInterval", () => {
  it("runs on its cadence while the page is visible", () => {
    const callback = jest.fn();
    renderHook(() => useVisibleInterval(callback, 1000));

    expect(callback).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(3000));
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it("stops while hidden and catches up as soon as the page is shown", () => {
    const callback = jest.fn();
    renderHook(() => useVisibleInterval(callback, 1000));
    act(() => jest.advanceTimersByTime(1000));
    expect(callback).toHaveBeenCalledTimes(1);

    setVisibility("hidden");
    expect(jest.getTimerCount()).toBe(0);
    act(() => jest.advanceTimersByTime(60_000));
    expect(callback).toHaveBeenCalledTimes(1);

    setVisibility("visible");
    expect(callback).toHaveBeenCalledTimes(2);
    act(() => jest.advanceTimersByTime(999));
    expect(callback).toHaveBeenCalledTimes(2);
    act(() => jest.advanceTimersByTime(1));
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it("does not start in a hidden page until it is shown", () => {
    setVisibility("hidden");
    const callback = jest.fn();
    renderHook(() => useVisibleInterval(callback, 1000));

    expect(jest.getTimerCount()).toBe(0);
    act(() => jest.advanceTimersByTime(5000));
    expect(callback).not.toHaveBeenCalled();

    setVisibility("visible");
    expect(callback).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(1);
  });

  it("pauses while the native app is inactive", () => {
    const callback = jest.fn();
    renderHook(() => useVisibleInterval(callback, 1000));

    setNativeActive(false);
    expect(jest.getTimerCount()).toBe(0);

    setNativeActive(true);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(1);
  });

  it("ignores visibility events that do not change visibility", () => {
    const callback = jest.fn();
    renderHook(() => useVisibleInterval(callback, 1000));

    setVisibility("visible");
    expect(callback).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(1);
  });

  it("stops for a null delay and calls the latest callback", () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = renderHook(
      ({ callback, delayMs }) => useVisibleInterval(callback, delayMs),
      {
        initialProps: {
          callback: first,
          delayMs: 1000 as number | null,
        },
      }
    );

    rerender({ callback: second, delayMs: 1000 });
    act(() => jest.advanceTimersByTime(1000));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);

    rerender({ callback: second, delayMs: null });
    expect(jest.getTimerCount()).toBe(0);
    setVisibility("hidden");
    setVisibility("visible");
    act(() => jest.advanceTimersByTime(5000));
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("stops its timer on unmount", () => {
    const callback = jest.fn();
    const { unmount } = renderHook(() => useVisibleInterval(callback, 1000));

    unmount();
    expect(jest.getTimerCount()).toBe(0);
    setVisibility("hidden");
    setVisibility("visible");
    expect(callback).not.toHaveBeenCalled();
  });
});
