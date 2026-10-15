import { createElement } from "react";
import { act, renderHook } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
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

  it("hydrates as visible, then reports a hidden page", async () => {
    jest.useRealTimers();
    function Visibility() {
      return createElement("span", null, String(usePageVisible()));
    }
    const container = document.createElement("div");
    container.innerHTML = renderToString(createElement(Visibility));
    expect(container.textContent).toBe("true");
    setVisibility("hidden");
    const onRecoverableError = jest.fn();
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, createElement(Visibility), {
          onRecoverableError,
        });
      });
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(container.textContent).toBe("false");
      setVisibility("visible");
      expect(container.textContent).toBe("true");
    } finally {
      act(() => root?.unmount());
    }
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

  it("catches up once after a delay change while hidden", () => {
    const callback = jest.fn();
    const { rerender } = renderHook(
      ({ delayMs }) => useVisibleInterval(callback, delayMs),
      { initialProps: { delayMs: 1000 } }
    );
    setVisibility("hidden");
    rerender({ delayMs: 5000 });
    expect(jest.getTimerCount()).toBe(0);

    setVisibility("visible");
    expect(callback).toHaveBeenCalledTimes(1);
    act(() => jest.advanceTimersByTime(4999));
    expect(callback).toHaveBeenCalledTimes(1);
    act(() => jest.advanceTimersByTime(1));
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("catches up once when several signals report the page shown", () => {
    const callback = jest.fn();
    renderHook(() => useVisibleInterval(callback, 1000));
    setVisibility("hidden");

    // In the native app a visibility change and an app-state change both
    // notify subscribers when the app returns.
    setVisibility("visible");
    setNativeActive(true);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(1);
  });

  it("does not restart a consumer removed during a notification", () => {
    const second = jest.fn();
    let unmountSecond = () => {};
    renderHook(() => useVisibleInterval(() => unmountSecond(), 1000));
    const secondView = renderHook(() => useVisibleInterval(second, 1000));
    unmountSecond = secondView.unmount;
    setVisibility("hidden");

    setVisibility("visible");
    expect(second).not.toHaveBeenCalled();
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
