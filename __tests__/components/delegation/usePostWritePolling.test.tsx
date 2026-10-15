import { usePostWritePolling } from "@/components/delegation/collection-delegation/usePostWritePolling";
import { useDelegationToast } from "@/components/delegation/DelegationToast";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { act, fireEvent, render, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

// The documented cadence: re-read every 5 s for 30 s after a confirmed write.
const POST_WRITE_POLL_INTERVAL_MS = 5_000;
const POST_WRITE_POLL_WINDOW_MS = 30_000;

async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

describe("usePostWritePolling", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not poll until a write is confirmed", () => {
    const { result } = renderHook(() => usePostWritePolling());

    expect(result.current.refetchInterval).toBe(false);
    act(() => {
      jest.advanceTimersByTime(POST_WRITE_POLL_WINDOW_MS * 10);
    });
    expect(result.current.refetchInterval).toBe(false);
  });

  it("polls for a bounded window after a confirmed write, then stops", () => {
    const { result } = renderHook(() => usePostWritePolling());

    act(() => result.current.startPostWritePolling());
    expect(result.current.refetchInterval).toBe(POST_WRITE_POLL_INTERVAL_MS);

    act(() => {
      jest.advanceTimersByTime(POST_WRITE_POLL_WINDOW_MS - 1);
    });
    expect(result.current.refetchInterval).toBe(POST_WRITE_POLL_INTERVAL_MS);

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current.refetchInterval).toBe(false);
  });

  it("restarts the window when another write is confirmed", () => {
    const { result } = renderHook(() => usePostWritePolling());

    act(() => result.current.startPostWritePolling());
    act(() => {
      jest.advanceTimersByTime(POST_WRITE_POLL_WINDOW_MS - 1000);
    });
    act(() => result.current.startPostWritePolling());
    act(() => {
      jest.advanceTimersByTime(POST_WRITE_POLL_WINDOW_MS - 1);
    });
    expect(result.current.refetchInterval).toBe(POST_WRITE_POLL_INTERVAL_MS);

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current.refetchInterval).toBe(false);
  });

  it("keeps a stable start callback", () => {
    const { result, rerender } = renderHook(() => usePostWritePolling());
    const { startPostWritePolling } = result.current;

    act(() => startPostWritePolling());
    rerender();

    expect(result.current.startPostWritePolling).toBe(startPostWritePolling);
  });

  it("clears its timer on unmount", () => {
    const { result, unmount } = renderHook(() => usePostWritePolling());

    act(() => result.current.startPostWritePolling());
    expect(jest.getTimerCount()).toBeGreaterThan(0);

    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe("useDelegationToast onSuccess", () => {
  function ToastHarness({ onSuccess }: { readonly onSuccess: () => void }) {
    const { showDelegationToast } = useDelegationToast({ onSuccess });
    return (
      <>
        {(["confirm_wallet", "submitted", "error", "success"] as const).map(
          (status) => (
            <button
              key={status}
              type="button"
              onClick={() => showDelegationToast({ status, title: "Write" })}
            >
              {status}
            </button>
          )
        )}
      </>
    );
  }

  it("fires only when a write's success toast is shown", () => {
    const onSuccess = jest.fn();
    const { getByText } = render(<ToastHarness onSuccess={onSuccess} />);

    fireEvent.click(getByText("confirm_wallet"));
    fireEvent.click(getByText("submitted"));
    fireEvent.click(getByText("error"));
    expect(onSuccess).not.toHaveBeenCalled();

    fireEvent.click(getByText("success"));
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  function ToastHarnessWithoutCallback() {
    const { showDelegationToast } = useDelegationToast();
    return (
      <button
        type="button"
        onClick={() =>
          showDelegationToast({ status: "success", title: "Write" })
        }
      >
        success
      </button>
    );
  }

  it("works without a success callback", () => {
    const { getByText } = render(<ToastHarnessWithoutCallback />);

    expect(() => fireEvent.click(getByText("success"))).not.toThrow();
  });
});

describe("post-write polling with a real query", () => {
  const readFn = jest.fn();

  function Harness() {
    const { refetchInterval, startPostWritePolling } = usePostWritePolling();
    const { showDelegationToast } = useDelegationToast({
      onSuccess: startPostWritePolling,
    });
    useQuery({
      queryKey: ["delegation-read"],
      queryFn: () => {
        readFn();
        return Promise.resolve(readFn.mock.calls.length);
      },
      refetchInterval,
      refetchOnWindowFocus: true,
    });
    return (
      <>
        <button
          type="button"
          onClick={() =>
            showDelegationToast({ status: "submitted", title: "Write" })
          }
        >
          submit
        </button>
        <button
          type="button"
          onClick={() =>
            showDelegationToast({ status: "success", title: "Write" })
          }
        >
          confirm
        </button>
      </>
    );
  }

  function renderHarness() {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 10_000, gcTime: Infinity },
      },
    });
    const wrapper = ({ children }: { readonly children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    return render(<Harness />, { wrapper });
  }

  beforeEach(() => {
    jest.useFakeTimers();
    readFn.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("reads once and never polls without a confirmed write", async () => {
    const { getByText } = renderHarness();
    await advance(0);
    expect(readFn).toHaveBeenCalledTimes(1);

    await advance(10 * 60_000);
    expect(readFn).toHaveBeenCalledTimes(1);

    // A pending (not yet confirmed) write does not start polling either.
    fireEvent.click(getByText("submit"));
    await advance(10 * 60_000);
    expect(readFn).toHaveBeenCalledTimes(1);
  });

  it("re-reads after a confirmed write and then goes quiet", async () => {
    const { getByText } = renderHarness();
    await advance(0);
    expect(readFn).toHaveBeenCalledTimes(1);

    fireEvent.click(getByText("confirm"));
    await advance(POST_WRITE_POLL_INTERVAL_MS);
    expect(readFn).toHaveBeenCalledTimes(2);

    await advance(POST_WRITE_POLL_WINDOW_MS);
    const readsInWindow = readFn.mock.calls.length;
    expect(readsInWindow).toBeGreaterThan(2);
    expect(readsInWindow).toBeLessThanOrEqual(
      1 + POST_WRITE_POLL_WINDOW_MS / POST_WRITE_POLL_INTERVAL_MS + 1
    );

    await advance(10 * 60_000);
    expect(readFn).toHaveBeenCalledTimes(readsInWindow);
  });
});
