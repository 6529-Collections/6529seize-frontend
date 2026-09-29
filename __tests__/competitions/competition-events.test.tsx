import { act, renderHook } from "@testing-library/react";
import { useCompetitionEvents } from "@/hooks/competitions/useCompetitionEvents";
import { invalidateCompetitionWave } from "@/services/api/competitions-api";

let listener: (data: unknown) => void;
const mockUnsubscribe = jest.fn();
const mockSubscribe = jest.fn((_type, callback) => {
  listener = callback;
  return mockUnsubscribe;
});
const mockClient = {};
jest.mock("@/services/websocket/useWebSocket", () => ({
  useWebSocket: () => ({ subscribe: mockSubscribe }),
}));
jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => mockClient,
}));
jest.mock("@/services/api/competitions-api", () => ({
  invalidateCompetitionWave: jest.fn().mockResolvedValue(undefined),
}));
const event = (id: string, wave = "wave") => ({
  event_id: id,
  event_version: 1,
  wave_id: wave,
  competition_id: id,
});
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});
afterEach(() => jest.useRealTimers());

it("batches a full wave update burst while still refreshing later events", () => {
  renderHook(() => useCompetitionEvents("wave"));
  act(() => {
    for (let i = 0; i < 60; i++) listener(event(String(i)));
    jest.advanceTimersByTime(999);
  });
  expect(invalidateCompetitionWave).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(1));
  expect(invalidateCompetitionWave).toHaveBeenCalledTimes(1);
  expect(invalidateCompetitionWave).toHaveBeenCalledWith(mockClient, "wave");
  act(() => {
    listener(event("later"));
    jest.advanceTimersByTime(1000);
  });
  expect(invalidateCompetitionWave).toHaveBeenCalledTimes(2);
});
it("ignores duplicate, malformed and unrelated events", () => {
  renderHook(() => useCompetitionEvents("wave"));
  act(() => {
    listener(event("one"));
    jest.advanceTimersByTime(1000);
  });
  act(() => {
    listener(event("one"));
    listener(event("two", "other"));
    listener(null);
    listener({ ...event("three"), event_version: 2 });
    jest.advanceTimersByTime(1000);
  });
  expect(invalidateCompetitionWave).toHaveBeenCalledTimes(1);
});
it("cancels queued refreshes when changing waves or unmounting", () => {
  const { rerender, unmount } = renderHook(
    ({ wave }) => useCompetitionEvents(wave),
    { initialProps: { wave: "wave" } }
  );
  act(() => listener(event("one")));
  rerender({ wave: "other" });
  act(() => jest.advanceTimersByTime(1000));
  expect(invalidateCompetitionWave).not.toHaveBeenCalled();
  act(() => listener(event("two", "other")));
  unmount();
  act(() => jest.advanceTimersByTime(1000));
  expect(invalidateCompetitionWave).not.toHaveBeenCalled();
  expect(mockUnsubscribe).toHaveBeenCalledTimes(2);
});
