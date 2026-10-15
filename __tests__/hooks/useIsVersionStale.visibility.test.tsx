import { act, renderHook } from "@testing-library/react";
import { useIsVersionStale } from "@/hooks/useIsVersionStale";

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(globalThis.location.search),
}));

const mockNativeActivitySubscribers = new Set<() => void>();
jest.mock("@/services/app-activity/native-app-activity", () => ({
  subscribeNativeAppActivity: (subscriber: () => void) => {
    mockNativeActivitySubscribers.add(subscriber);
    return () => {
      mockNativeActivitySubscribers.delete(subscriber);
    };
  },
}));

const INTERVAL_MS = 1000;

let visibilityState: DocumentVisibilityState = "visible";

function setVisibility(next: DocumentVisibilityState) {
  visibilityState = next;
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

describe("useIsVersionStale visibility", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    visibilityState = "visible";
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => visibilityState,
    });
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ json: async () => ({ stale: false }) });
    globalThis.fetch = fetchMock;
    globalThis.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    jest.useRealTimers();
    Reflect.deleteProperty(document, "visibilityState");
  });

  it("resumes on the native app's resume signal even without a visibility event", async () => {
    const { unmount } = renderHook(() => useIsVersionStale(INTERVAL_MS));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    setVisibility("hidden");
    await advance(INTERVAL_MS * 10);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // The web view became visible again but did not fire visibilitychange.
    visibilityState = "visible";
    act(() => {
      mockNativeActivitySubscribers.forEach((subscriber) => subscriber());
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await advance(INTERVAL_MS);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    unmount();
    expect(mockNativeActivitySubscribers.size).toBe(0);
  });

  it("checks immediately and then on the interval while visible", async () => {
    renderHook(() => useIsVersionStale(INTERVAL_MS));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await advance(INTERVAL_MS);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await advance(INTERVAL_MS);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("stops polling while the tab is hidden and leaves no timer behind", async () => {
    renderHook(() => useIsVersionStale(INTERVAL_MS));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    setVisibility("hidden");
    expect(jest.getTimerCount()).toBe(0);

    await advance(INTERVAL_MS * 10);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not check on mount in a hidden tab, then checks once it is shown", async () => {
    visibilityState = "hidden";
    renderHook(() => useIsVersionStale(INTERVAL_MS));

    await advance(INTERVAL_MS * 5);
    expect(fetchMock).not.toHaveBeenCalled();

    setVisibility("visible");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("checks immediately when the tab becomes visible again, then resumes the cadence", async () => {
    renderHook(() => useIsVersionStale(INTERVAL_MS));
    setVisibility("hidden");
    await advance(INTERVAL_MS * 3);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    setVisibility("visible");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await advance(INTERVAL_MS);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("keeps polling when the tab is shown right after a check", async () => {
    renderHook(() => useIsVersionStale(INTERVAL_MS));
    setVisibility("hidden");
    setVisibility("visible");
    // The mount check just ran, so showing the tab does not add another one,
    // but the cadence must still restart.
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await advance(INTERVAL_MS);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("checks once when visibilitychange and focus fire together", async () => {
    renderHook(() => useIsVersionStale(INTERVAL_MS));
    setVisibility("hidden");
    await advance(INTERVAL_MS * 2);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    setVisibility("visible");
    act(() => {
      globalThis.dispatchEvent(new Event("focus"));
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("checks on focus and when back online, but not while hidden", async () => {
    const longInterval = 10_000;
    renderHook(() => useIsVersionStale(longInterval));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await advance(2000);
    act(() => {
      globalThis.dispatchEvent(new Event("focus"));
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // A second wake-up event right after a check does not add another one.
    act(() => {
      globalThis.dispatchEvent(new Event("online"));
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await advance(2000);
    act(() => {
      globalThis.dispatchEvent(new Event("online"));
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    visibilityState = "hidden";
    await advance(longInterval * 3);
    act(() => {
      globalThis.dispatchEvent(new Event("online"));
      globalThis.dispatchEvent(new Event("focus"));
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not poll when disabled", async () => {
    renderHook(() => useIsVersionStale(INTERVAL_MS, false));

    await advance(INTERVAL_MS * 5);
    setVisibility("hidden");
    setVisibility("visible");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stops everything on unmount", async () => {
    const { unmount } = renderHook(() => useIsVersionStale(INTERVAL_MS));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    unmount();
    expect(jest.getTimerCount()).toBe(0);

    await advance(INTERVAL_MS * 3);
    setVisibility("hidden");
    setVisibility("visible");
    act(() => {
      globalThis.dispatchEvent(new Event("focus"));
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports stale from the latest check", async () => {
    fetchMock.mockResolvedValueOnce({ json: async () => ({ stale: false }) });
    fetchMock.mockResolvedValue({ json: async () => ({ stale: true }) });
    const { result } = renderHook(() => useIsVersionStale(INTERVAL_MS));
    await advance(0);
    expect(result.current).toBe(false);

    await advance(INTERVAL_MS);
    expect(result.current).toBe(true);
  });

  it("ignores an older check that resolves after a newer one", async () => {
    const resolvers: Array<(stale: boolean) => void> = [];
    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvers.push((stale) => resolve({ json: async () => ({ stale }) }));
        })
    );
    const { result } = renderHook(() => useIsVersionStale(INTERVAL_MS));
    await advance(INTERVAL_MS);
    expect(resolvers).toHaveLength(2);

    await act(async () => {
      resolvers[1]?.(true);
    });
    expect(result.current).toBe(true);

    await act(async () => {
      resolvers[0]?.(false);
    });
    expect(result.current).toBe(true);
  });
});
