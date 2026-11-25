import { act, renderHook } from "@testing-library/react";
import { useChainClock } from "@/components/chain-identity/useChainClock";

const T0 = Date.UTC(2026, 10, 25, 12, 0);

beforeEach(() => {
  jest.useFakeTimers({ now: T0 });
});
afterEach(() => jest.useRealTimers());

it("moves on every 15 seconds while a view shows it", () => {
  const { result, unmount } = renderHook(() => useChainClock());
  expect(result.current).toBe(T0);
  act(() => {
    jest.advanceTimersByTime(15_000);
  });
  expect(result.current).toBe(T0 + 15_000);
  unmount();
});

it("never paints a time from before a view left, when it comes back", () => {
  const first = renderHook(() => useChainClock());
  first.unmount();
  // Away for a minute: no view keeps the clock moving.
  jest.setSystemTime(T0 + 60_000);
  const seen: number[] = [];
  renderHook(() => {
    const now = useChainClock();
    seen.push(now);
    return now;
  });
  expect(seen[0]).toBe(T0 + 60_000);
});
