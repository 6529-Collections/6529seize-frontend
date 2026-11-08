import { act, renderHook } from "@testing-library/react";
import {
  useDebouncedWaveReads,
  WAVE_READ_DEBOUNCE_MS,
  type FlushWaveRead,
} from "@/hooks/useMarkWaveNotificationsRead.debounce";

jest.mock("@/services/auth/auth.utils", () => ({
  PROFILE_SWITCHED_EVENT: "6529-profile-switched",
}));

let visibilityState: DocumentVisibilityState = "visible";

const setVisibility = (state: DocumentVisibilityState) => {
  visibilityState = state;
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
};

const renderReads = (
  initial: { activeWaveId: string | null; identityKey: string } = {
    activeWaveId: "wave-1",
    identityKey: "identity-a",
  }
) => {
  const flush = jest.fn<ReturnType<FlushWaveRead>, Parameters<FlushWaveRead>>();
  const rendered = renderHook(
    (props: { activeWaveId: string | null; identityKey: string }) =>
      useDebouncedWaveReads({ ...props, flush }),
    { initialProps: initial }
  );
  return { flush, ...rendered };
};

describe("useDebouncedWaveReads", () => {
  beforeAll(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => visibilityState,
    });
  });

  beforeEach(() => {
    jest.useFakeTimers();
    visibilityState = "visible";
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("sends one read through the newest serial when the window ends", () => {
    const { flush, result } = renderReads();

    act(() => {
      result.current.enqueue("wave-1", 10);
      result.current.enqueue("wave-1", 12);
      result.current.enqueue("wave-1", 11);
    });
    act(() => {
      jest.advanceTimersByTime(WAVE_READ_DEBOUNCE_MS - 1);
    });
    expect(flush).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(flush).toHaveBeenCalledTimes(1);
    expect(flush).toHaveBeenCalledWith("wave-1", 12, "timer");
  });

  it("never sends a read later than the window, however long the burst", () => {
    const { flush, result } = renderReads();

    for (let serial = 1; serial <= 9; serial++) {
      act(() => {
        result.current.enqueue("wave-1", serial);
        jest.advanceTimersByTime(1_000);
      });
    }

    // Nine messages over nine seconds send three reads, one per window.
    expect(flush.mock.calls).toEqual([
      ["wave-1", 3, "timer"],
      ["wave-1", 6, "timer"],
      ["wave-1", 9, "timer"],
    ]);
  });

  it("keeps the newest defined serial when some markers have none", () => {
    const { flush, result } = renderReads();

    act(() => {
      result.current.enqueue("wave-1", undefined);
      result.current.enqueue("wave-1", 7);
      result.current.enqueue("wave-1", undefined);
      jest.advanceTimersByTime(WAVE_READ_DEBOUNCE_MS);
    });

    expect(flush).toHaveBeenCalledWith("wave-1", 7, "timer");
  });

  it("sends the read for a wave as soon as the reader leaves it", () => {
    const { flush, result, rerender } = renderReads();

    act(() => {
      result.current.enqueue("wave-1", 5);
    });
    rerender({ activeWaveId: "wave-2", identityKey: "identity-a" });

    expect(flush).toHaveBeenCalledWith("wave-1", 5, "leave");
    act(() => {
      jest.advanceTimersByTime(WAVE_READ_DEBOUNCE_MS);
    });
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["the window blurs", () => window.dispatchEvent(new Event("blur"))],
    ["the page is hidden", () => window.dispatchEvent(new Event("pagehide"))],
  ])("sends pending reads when %s", (_label, trigger) => {
    const { flush, result } = renderReads();

    act(() => {
      result.current.enqueue("wave-1", 3);
    });
    act(() => {
      trigger();
    });

    expect(flush).toHaveBeenCalledWith("wave-1", 3, "blur");
  });

  it("sends pending reads when the tab becomes hidden, not when it shows", () => {
    const { flush, result } = renderReads();

    act(() => {
      result.current.enqueue("wave-1", 4);
    });
    setVisibility("visible");
    expect(flush).not.toHaveBeenCalled();

    setVisibility("hidden");
    expect(flush).toHaveBeenCalledWith("wave-1", 4, "blur");
  });

  it("sends pending reads on unmount", () => {
    const { flush, result, unmount } = renderReads();

    act(() => {
      result.current.enqueue("wave-1", 8);
    });
    unmount();

    expect(flush).toHaveBeenCalledWith("wave-1", 8, "unmount");
  });

  it("discards pending reads on a profile switch", () => {
    const { flush, result } = renderReads();

    act(() => {
      result.current.enqueue("wave-1", 8);
    });
    act(() => {
      globalThis.dispatchEvent(new CustomEvent("6529-profile-switched"));
      jest.advanceTimersByTime(WAVE_READ_DEBOUNCE_MS);
    });

    expect(flush).not.toHaveBeenCalled();
  });

  it("discards pending reads when the reading identity changes", () => {
    const { flush, result, rerender } = renderReads();

    act(() => {
      result.current.enqueue("wave-1", 8);
    });
    rerender({ activeWaveId: "wave-1", identityKey: "identity-b" });
    act(() => {
      jest.advanceTimersByTime(WAVE_READ_DEBOUNCE_MS);
    });

    expect(flush).not.toHaveBeenCalled();
  });

  it("uses the latest flush callback", () => {
    const firstFlush = jest.fn();
    const nextFlush = jest.fn();
    const { result, rerender } = renderHook(
      ({ flush }: { flush: FlushWaveRead }) =>
        useDebouncedWaveReads({
          activeWaveId: "wave-1",
          identityKey: "identity-a",
          flush,
        }),
      { initialProps: { flush: firstFlush as FlushWaveRead } }
    );

    act(() => {
      result.current.enqueue("wave-1", 2);
    });
    rerender({ flush: nextFlush });
    act(() => {
      jest.advanceTimersByTime(WAVE_READ_DEBOUNCE_MS);
    });

    expect(firstFlush).not.toHaveBeenCalled();
    expect(nextFlush).toHaveBeenCalledWith("wave-1", 2, "timer");
  });

  it("keeps one window per wave", () => {
    const { flush, result } = renderReads();

    act(() => {
      result.current.enqueue("wave-1", 1);
      jest.advanceTimersByTime(1_000);
      result.current.enqueue("wave-2", 2);
      jest.advanceTimersByTime(WAVE_READ_DEBOUNCE_MS - 1_000);
    });
    expect(flush.mock.calls).toEqual([["wave-1", 1, "timer"]]);

    act(() => {
      jest.advanceTimersByTime(1_000);
    });
    expect(flush.mock.calls).toEqual([
      ["wave-1", 1, "timer"],
      ["wave-2", 2, "timer"],
    ]);
  });
});
