import { act, renderHook, waitFor } from "@testing-library/react";
import { useEffect, useLayoutEffect } from "react";
import useWaveMessagesStore from "@/contexts/wave/hooks/useWaveMessagesStore";
import { useWaveDataManager } from "@/contexts/wave/hooks/useWaveDataManager";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { DropSize, type Drop } from "@/helpers/waves/drop.helpers";

const mockFetchWaveMessages = jest.fn<
  Promise<ApiDrop[] | null>,
  [string, number | null, AbortSignal | undefined]
>();
const mockUpdateEligibility = jest.fn();

jest.mock("@sentry/nextjs", () => ({
  addBreadcrumb: jest.fn(),
}));

jest.mock("@/utils/monitoring/mobileLaunchTiming", () => ({
  markMobileLaunchStep: jest.fn(),
}));

jest.mock("@/services/analytics/productImpactTelemetry", () => ({
  getProductImpactNowMs: jest.fn(() => 1000),
  isProductImpactAbortError: (error: unknown) =>
    error instanceof DOMException && error.name === "AbortError",
  trackWaveFeedLoadCancelled: jest.fn(),
  trackWaveFeedLoadFailed: jest.fn(),
  trackWaveFeedLoadStarted: jest.fn(),
  trackWaveFeedLoadSucceeded: jest.fn(),
}));

jest.mock("@/contexts/wave/WaveEligibilityContext", () => ({
  useWaveEligibility: () => ({ updateEligibility: mockUpdateEligibility }),
}));

jest.mock("@/contexts/wave/utils/wave-messages-utils", () => ({
  ...jest.requireActual("@/contexts/wave/utils/wave-messages-utils"),
  fetchWaveMessages: (
    waveId: string,
    serialNo: number | null,
    signal?: AbortSignal
  ) => mockFetchWaveMessages(waveId, serialNo, signal),
}));

const WAVE_IDS = ["w1", "w2", "w3", "w4", "w5", "w6", "w7", "w8", "w9"];

// The store and data hooks read only these fields of a drop.
const makeApiDrop = (waveId: string, serialNo = 1): ApiDrop =>
  ({
    id: `${waveId}-drop-${serialNo}`,
    serial_no: serialNo,
    created_at: serialNo,
    wave: { id: waveId },
    author: { handle: "author" },
    parts: [],
    metadata: [],
  }) as unknown as ApiDrop;

const makeDrop = (waveId: string, serialNo = 1): Drop =>
  ({
    ...makeApiDrop(waveId, serialNo),
    type: DropSize.FULL,
    stableKey: `${waveId}-drop-${serialNo}`,
    stableHash: `${waveId}-drop-${serialNo}`,
  }) as unknown as Drop;

const flushStoreQueue = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

describe("useWaveMessagesStore eviction", () => {
  const renderStore = () => renderHook(() => useWaveMessagesStore());

  type StoreResult = ReturnType<typeof renderStore>["result"];

  const residentWaveIds = (result: StoreResult): string[] =>
    WAVE_IDS.filter((waveId) => result.current.getData(waveId) !== undefined);

  // Mirrors registration: a loading placeholder starts a fresh load.
  const loadWave = async (result: StoreResult, waveId: string) => {
    act(() => {
      result.current.updateData({ key: waveId, isLoading: true, drops: [] });
    });
    await waitFor(() => expect(result.current.getData(waveId)).toBeDefined());
  };

  it("keeps the five most recently opened waves when seven waves open", async () => {
    const { result } = renderStore();
    const evictedWaveIds: string[] = [];
    act(() => {
      result.current.subscribeToEvictions((waveId) => {
        evictedWaveIds.push(waveId);
      });
    });
    let closeOpenWave: () => void = () => {};

    for (const waveId of WAVE_IDS.slice(0, 7)) {
      // The next wave registers while the previous one is still open.
      await loadWave(result, waveId);
      act(() => result.current.trackActiveWave(waveId));
      closeOpenWave();
      const listener = jest.fn();
      act(() => result.current.subscribe(waveId, listener));
      closeOpenWave = () => {
        act(() => result.current.unsubscribe(waveId, listener));
      };
    }

    expect(residentWaveIds(result)).toEqual(["w3", "w4", "w5", "w6", "w7"]);
    expect(evictedWaveIds).toEqual(["w1", "w2"]);
  });

  it("never evicts the active wave or a wave with a mounted subscriber", async () => {
    const { result } = renderStore();
    const listener = jest.fn();
    act(() => result.current.trackActiveWave("w1"));
    await loadWave(result, "w1");
    await loadWave(result, "w2");
    act(() => result.current.subscribe("w2", listener));

    for (const waveId of ["w3", "w4", "w5", "w6", "w7", "w8"]) {
      await loadWave(result, waveId);
    }

    expect(residentWaveIds(result)).toEqual(["w1", "w2", "w6", "w7", "w8"]);
    expect(result.current.isWaveInUse("w1")).toBe(true);
    expect(result.current.isWaveInUse("w2")).toBe(true);

    // Protection ends when the subscriber unmounts.
    act(() => result.current.unsubscribe("w2", listener));
    await loadWave(result, "w9");

    expect(result.current.isWaveInUse("w2")).toBe(false);
    expect(residentWaveIds(result)).toEqual(["w1", "w6", "w7", "w8", "w9"]);
  });

  it("treats recently viewed waves as recently used", async () => {
    const { result } = renderStore();
    for (const waveId of WAVE_IDS.slice(0, 5)) {
      await loadWave(result, waveId);
    }
    const listener = jest.fn();
    act(() => {
      result.current.subscribe("w1", listener);
      result.current.unsubscribe("w1", listener);
    });

    await loadWave(result, "w6");

    expect(residentWaveIds(result)).toEqual(["w1", "w3", "w4", "w5", "w6"]);
  });

  it("ignores late writes for an evicted wave and reopens it without stale pagination", async () => {
    const { result } = renderStore();
    await loadWave(result, "w1");
    act(() => {
      result.current.updateData({
        key: "w1",
        isLoading: false,
        hasNextPage: false,
        drops: [makeDrop("w1")],
      });
    });
    await waitFor(() =>
      expect(result.current.getData("w1")?.drops).toHaveLength(1)
    );
    for (const waveId of ["w2", "w3", "w4", "w5", "w6"]) {
      await loadWave(result, waveId);
    }
    expect(result.current.getData("w1")).toBeUndefined();

    // A request that was in flight during eviction resolves late.
    act(() => {
      result.current.updateData({ key: "w1", drops: [makeDrop("w1", 2)] });
    });
    await flushStoreQueue();
    expect(result.current.getData("w1")).toBeUndefined();

    // Opening the wave again through a server seed starts a fresh cache whose
    // pagination comes from the new load, not the evicted one.
    const seedPromise = Promise.resolve({ ok: false, waveId: "w1" } as const);
    act(() => {
      result.current.registerPendingServerFeedSeed("w1", seedPromise);
      result.current.updateData({ key: "w1", drops: [makeDrop("w1", 3)] });
      result.current.applyServerFeedSeed({
        waveId: "w1",
        drops: [makeApiDrop("w1", 2)],
        hasNextPage: true,
        promise: seedPromise,
      });
    });

    await waitFor(() =>
      expect(result.current.getData("w1")?.hasNextPage).toBe(true)
    );
    expect(
      result.current.getData("w1")?.drops.map((drop) => drop.serial_no)
    ).toEqual(expect.arrayContaining([2, 3]));
    expect(result.current.getData("w1")?.drops).toHaveLength(2);
  });
});

describe("wave message eviction with the data manager", () => {
  // Wires the store to the data manager the way MyStreamProvider does.
  const useStreamData = (activeWaveId: string | null) => {
    const store = useWaveMessagesStore();
    const manager = useWaveDataManager({
      updateData: store.updateData,
      getData: store.getData,
      hasServerFeedSeed: store.hasServerFeedSeed,
      removeDrop: store.removeDrop,
    });
    const { trackActiveWave, subscribeToEvictions } = store;
    const { cancelPaginationFetch, cancelWaveDataFetch } = manager;
    useLayoutEffect(() => {
      trackActiveWave(activeWaveId);
    }, [activeWaveId, trackActiveWave]);
    useEffect(
      () =>
        subscribeToEvictions((waveId) => {
          cancelWaveDataFetch(waveId);
          cancelPaginationFetch(waveId);
        }),
      [cancelPaginationFetch, cancelWaveDataFetch, subscribeToEvictions]
    );
    return { store, manager };
  };

  const renderStreamData = () =>
    renderHook(({ activeWaveId }) => useStreamData(activeWaveId), {
      initialProps: { activeWaveId: null as string | null },
    });

  type StreamDataResult = ReturnType<typeof renderStreamData>["result"];

  const initialLoadCount = (waveId: string): number =>
    mockFetchWaveMessages.mock.calls.filter(
      ([calledWaveId, serialNo]) => calledWaveId === waveId && serialNo === null
    ).length;

  const openWave = async (
    result: StreamDataResult,
    rerender: (props: { activeWaveId: string | null }) => void,
    waveId: string
  ) => {
    act(() => result.current.manager.registerWave(waveId, true));
    rerender({ activeWaveId: waveId });
    await waitFor(() =>
      expect(result.current.store.getData(waveId)?.isLoading).toBe(false)
    );
  };

  beforeEach(() => {
    mockFetchWaveMessages.mockReset();
    mockFetchWaveMessages.mockImplementation(async (waveId) => [
      makeApiDrop(waveId),
    ]);
  });

  it("refetches an evicted wave when it is opened again", async () => {
    const { result, rerender } = renderStreamData();
    for (const waveId of WAVE_IDS.slice(0, 7)) {
      await openWave(result, rerender, waveId);
    }
    expect(result.current.store.getData("w1")).toBeUndefined();
    expect(initialLoadCount("w1")).toBe(1);

    await openWave(result, rerender, "w1");

    expect(initialLoadCount("w1")).toBe(2);
    expect(result.current.store.getData("w1")?.drops).toEqual([
      expect.objectContaining({ id: "w1-drop-1" }),
    ]);
  });

  it("aborts an in-flight load of an evicted wave without recreating it", async () => {
    let resolvePrefetch: (drops: ApiDrop[]) => void = () => {};
    let prefetchSignal: AbortSignal | undefined;
    mockFetchWaveMessages.mockImplementationOnce(
      (_waveId, _serialNo, signal) => {
        prefetchSignal = signal;
        return new Promise<ApiDrop[] | null>((resolve) => {
          resolvePrefetch = resolve;
        });
      }
    );
    const { result, rerender } = renderStreamData();
    // A hover prefetch registers a wave that never opens.
    act(() => result.current.manager.registerWave("w1"));
    await waitFor(() => expect(prefetchSignal).toBeDefined());

    for (const waveId of WAVE_IDS.slice(1, 7)) {
      await openWave(result, rerender, waveId);
    }

    expect(result.current.store.getData("w1")).toBeUndefined();
    expect(prefetchSignal?.aborted).toBe(true);

    await act(async () => {
      resolvePrefetch([makeApiDrop("w1")]);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(result.current.store.getData("w1")).toBeUndefined();
  });
});
