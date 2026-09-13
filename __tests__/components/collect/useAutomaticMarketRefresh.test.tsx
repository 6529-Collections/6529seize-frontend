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
  await act(async () => jest.advanceTimersByTimeAsync(120_000));
  act(() => globalThis.dispatchEvent(new Event("focus")));
  expect(refresh).toHaveBeenCalledTimes(1);
  await act(async () => finish());
  act(() => globalThis.dispatchEvent(new Event("online")));
  expect(refresh).toHaveBeenCalledTimes(2);
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
