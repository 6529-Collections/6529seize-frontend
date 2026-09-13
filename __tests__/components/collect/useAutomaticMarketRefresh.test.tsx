import { act, renderHook } from "@testing-library/react";
import { useAutomaticMarketRefresh } from "@/components/collect/useAutomaticMarketRefresh";

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it("updates only a visible idle page, throttles focus and prevents overlapping reads", async () => {
  const visibility = jest.spyOn(document, "visibilityState", "get");
  let finish!: () => void;
  const refresh = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      })
  );
  renderHook(() => useAutomaticMarketRefresh(true, refresh));
  visibility.mockReturnValue("hidden");
  await act(async () => jest.advanceTimersByTimeAsync(60_000));
  expect(refresh).not.toHaveBeenCalled();
  visibility.mockReturnValue("visible");
  act(() => document.dispatchEvent(new Event("visibilitychange")));
  expect(refresh).toHaveBeenCalledTimes(1);
  await act(async () => jest.advanceTimersByTimeAsync(20_000));
  act(() => globalThis.dispatchEvent(new Event("focus")));
  expect(refresh).toHaveBeenCalledTimes(1);
  await act(async () => finish());
  await act(async () => jest.advanceTimersByTimeAsync(40_000));
  act(() => globalThis.dispatchEvent(new Event("online")));
  expect(refresh).toHaveBeenCalledTimes(2);
});

it("retries after a stalled read expires and does not let its late completion release a newer request", async () => {
  let finishOld!: () => void;
  const refresh = jest
    .fn<Promise<void>, [AbortSignal]>()
    .mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishOld = resolve;
        })
    )
    .mockImplementation(() => new Promise<void>(() => undefined));
  const { unmount } = renderHook(() =>
    useAutomaticMarketRefresh(true, refresh)
  );
  await act(async () => jest.advanceTimersByTimeAsync(60_000));
  const oldSignal = refresh.mock.calls[0]![0];
  expect(oldSignal.aborted).toBe(false);
  await act(async () => jest.advanceTimersByTimeAsync(30_000));
  expect(oldSignal.aborted).toBe(true);
  await act(async () => jest.advanceTimersByTimeAsync(30_000));
  expect(refresh).toHaveBeenCalledTimes(2);
  const newSignal = refresh.mock.calls[1]![0];
  await act(async () => finishOld());
  expect(newSignal.aborted).toBe(false);
  unmount();
  expect(newSignal.aborted).toBe(true);
  await act(async () => jest.advanceTimersByTimeAsync(0));
  expect(jest.getTimerCount()).toBe(0);
});

it("cancels a completed read's deadline and removes every timer on unmount", async () => {
  const refresh = jest.fn(async (_signal: AbortSignal) => undefined);
  const { unmount } = renderHook(() =>
    useAutomaticMarketRefresh(true, refresh)
  );
  await act(async () => jest.advanceTimersByTimeAsync(60_000));
  const signal = refresh.mock.calls[0]![0];
  expect(jest.getTimerCount()).toBe(1);
  await act(async () => jest.advanceTimersByTimeAsync(30_000));
  expect(signal.aborted).toBe(false);
  unmount();
  expect(jest.getTimerCount()).toBe(0);
});

it("invalidates an in-flight read immediately on selection and does not resume its old signal after ABA", async () => {
  let signal!: AbortSignal;
  const refresh = jest.fn(async (incoming: AbortSignal) => {
    signal = incoming;
    await new Promise(() => undefined);
  });
  const { rerender, unmount } = renderHook(
    ({ enabled }) => useAutomaticMarketRefresh(enabled, refresh),
    { initialProps: { enabled: true } }
  );
  await act(async () => jest.advanceTimersByTimeAsync(60_000));
  expect(signal.aborted).toBe(false);
  rerender({ enabled: false });
  expect(signal.aborted).toBe(true);
  rerender({ enabled: true });
  expect(signal.aborted).toBe(true);
  await act(async () => jest.advanceTimersByTimeAsync(60_000));
  expect(refresh).toHaveBeenCalledTimes(2);
  unmount();
  expect(signal.aborted).toBe(true);
});
