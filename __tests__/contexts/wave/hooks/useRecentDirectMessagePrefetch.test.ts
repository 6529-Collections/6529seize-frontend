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
        viewerIdentityKey: "wallet:primary",
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
      useRecentDirectMessagePrefetch({
        enabled: true,
        viewerIdentityKey: "wallet:primary",
        waves,
        prefetchWave,
      })
    );
  });
  expect(prefetchWave.mock.calls).toEqual([["first"], ["second"], ["third"]]);
});

it.each(["disabled", "hidden", "missing-viewer"])(
  "does not prefetch when %s",
  async (state) => {
    if (state === "hidden")
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "hidden",
      });
    await act(async () => {
      renderHook(() =>
        useRecentDirectMessagePrefetch({
          enabled: state !== "disabled",
          viewerIdentityKey:
            state === "missing-viewer" ? null : "wallet:primary",
          waves,
          prefetchWave,
        })
      );
    });
    expect(prefetchWave).not.toHaveBeenCalled();
    expect(mockPrefetchDetails).not.toHaveBeenCalled();
  }
);

it.each(["leave-list", "unmount", "profile-switch", "background"])(
  "stops queued work after %s",
  async (transition) => {
    const messages = deferred();
    prefetchWave.mockReturnValueOnce(messages.promise);
    const view = renderHook(
      (enabled) =>
        useRecentDirectMessagePrefetch({
          enabled,
          viewerIdentityKey: "wallet:primary",
          waves,
          prefetchWave,
        }),
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

it("restarts for cached conversations after the viewer changes without an empty list render", async () => {
  const oldMessages = deferred();
  prefetchWave.mockReturnValueOnce(oldMessages.promise);
  const nextWaves = waves.map(({ id }) => ({ id: `next-${id}` }));
  const { rerender } = renderHook(
    (props) =>
      useRecentDirectMessagePrefetch({ enabled: true, prefetchWave, ...props }),
    { initialProps: { waves, viewerIdentityKey: "wallet:primary" } }
  );
  expect(prefetchWave.mock.calls).toEqual([["first"]]);
  await act(async () => {
    globalThis.dispatchEvent(new CustomEvent(PROFILE_SWITCHED_EVENT));
    rerender({ waves: nextWaves, viewerIdentityKey: "wallet:proxy:next" });
  });
  await act(async () => oldMessages.resolve());
  expect(prefetchWave.mock.calls).toEqual([
    ["first"],
    ["next-first"],
    ["next-second"],
    ["next-third"],
  ]);
  expect(mockPrefetchDetails.mock.calls).toEqual(prefetchWave.mock.calls);
});

it("waits for the new viewer's list when it is not cached", async () => {
  const { rerender } = renderHook(
    (currentWaves) =>
      useRecentDirectMessagePrefetch({
        enabled: true,
        viewerIdentityKey: "wallet:primary",
        waves: currentWaves,
        prefetchWave,
      }),
    { initialProps: [] as typeof waves }
  );
  expect(prefetchWave).not.toHaveBeenCalled();
  await act(async () => rerender(waves));
  expect(prefetchWave.mock.calls).toEqual([["first"], ["second"], ["third"]]);
});
