import { act, renderHook } from "@testing-library/react";
import { useRecentDirectMessagePrefetch } from "@/contexts/wave/hooks/useRecentDirectMessagePrefetch";
import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";

const mockPrefetchDetails = jest.fn<Promise<void>, [string]>();
jest.mock("@/hooks/usePrefetchWaveData", () => ({
  usePrefetchWaveData: () => mockPrefetchDetails,
}));

const waves = ["first", "second", "third", "fourth"].map((id) => ({ id }));
const prefetchWave = jest.fn<Promise<void>, [string]>();

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPrefetchDetails.mockResolvedValue(undefined);
  prefetchWave.mockResolvedValue(undefined);
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
});

it("prepares only three chats, waiting for both requests before starting the next", async () => {
  const details = deferred();
  const messages = deferred();
  mockPrefetchDetails.mockReturnValueOnce(details.promise);
  prefetchWave.mockReturnValueOnce(messages.promise);
  const { rerender } = renderHook(
    (currentWaves) =>
      useRecentDirectMessagePrefetch({
        enabled: true,
        waves: currentWaves,
        prefetchWave,
      }),
    { initialProps: waves }
  );
  expect(prefetchWave.mock.calls).toEqual([["first"]]);
  await act(async () => details.resolve());
  expect(prefetchWave.mock.calls).toEqual([["first"]]);
  await act(async () => messages.resolve());
  expect(prefetchWave.mock.calls).toEqual([["first"], ["second"], ["third"]]);
  expect(mockPrefetchDetails.mock.calls).toEqual(prefetchWave.mock.calls);
  rerender(waves.map((wave) => ({ ...wave })));
  rerender([...waves].reverse());
  expect(prefetchWave).toHaveBeenCalledTimes(3);
});

it("continues after a failed prefetch", async () => {
  prefetchWave.mockRejectedValueOnce(new Error("Unavailable"));
  mockPrefetchDetails.mockRejectedValueOnce(new Error("Unavailable"));
  await act(async () => {
    renderHook(() =>
      useRecentDirectMessagePrefetch({ enabled: true, waves, prefetchWave })
    );
  });
  expect(prefetchWave.mock.calls).toEqual([["first"], ["second"], ["third"]]);
});

it.each(["disabled", "hidden"])("does not prefetch when %s", async (state) => {
  if (state === "hidden")
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
  await act(async () => {
    renderHook(() =>
      useRecentDirectMessagePrefetch({
        enabled: state !== "disabled",
        waves,
        prefetchWave,
      })
    );
  });
  expect(prefetchWave).not.toHaveBeenCalled();
  expect(mockPrefetchDetails).not.toHaveBeenCalled();
});

it.each(["leave-list", "unmount", "profile-switch", "background"])(
  "stops queued work after %s",
  async (transition) => {
    const messages = deferred();
    prefetchWave.mockReturnValueOnce(messages.promise);
    const view = renderHook(
      (enabled) =>
        useRecentDirectMessagePrefetch({ enabled, waves, prefetchWave }),
      { initialProps: true }
    );
    if (transition === "leave-list") view.rerender(false);
    if (transition === "unmount") view.unmount();
    if (transition === "profile-switch")
      act(() => {
        globalThis.dispatchEvent(new CustomEvent(PROFILE_SWITCHED_EVENT));
      });
    if (transition === "background")
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "hidden",
      });
    await act(async () => messages.resolve());
    expect(prefetchWave.mock.calls).toEqual([["first"]]);
    expect(mockPrefetchDetails.mock.calls).toEqual([["first"]]);
  }
);
