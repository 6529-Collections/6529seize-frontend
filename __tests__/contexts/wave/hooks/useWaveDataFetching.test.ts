import { renderHook, act } from "@testing-library/react";
import { useWaveDataFetching } from "@/contexts/wave/hooks/useWaveDataFetching";
import useWaveMessagesStore from "@/contexts/wave/hooks/useWaveMessagesStore";
import {
  WAVE_DROPS_NATIVE_INITIAL_PARAMS,
  WAVE_DROPS_PARAMS,
} from "@/components/react-query-wrapper/utils/query-utils";
import { markMobileLaunchStep } from "@/utils/monitoring/mobileLaunchTiming";

jest.mock("@/utils/monitoring/mobileLaunchTiming", () => ({
  markMobileLaunchStep: jest.fn(),
}));

const markMobileLaunchStepMock = markMobileLaunchStep as jest.Mock;
const mockTrackWaveFeedLoadCancelled = jest.fn();
const mockTrackWaveFeedLoadFailed = jest.fn();
const mockTrackWaveFeedLoadStarted = jest.fn();
const mockTrackWaveFeedLoadSucceeded = jest.fn();

jest.mock("@/services/analytics/productImpactTelemetry", () => ({
  getProductImpactNowMs: jest.fn(() => 1000),
  isProductImpactAbortError: (error: unknown) =>
    error instanceof DOMException && error.name === "AbortError",
  trackWaveFeedLoadCancelled: (
    ...args: Parameters<typeof mockTrackWaveFeedLoadCancelled>
  ) => mockTrackWaveFeedLoadCancelled(...args),
  trackWaveFeedLoadFailed: (
    ...args: Parameters<typeof mockTrackWaveFeedLoadFailed>
  ) => mockTrackWaveFeedLoadFailed(...args),
  trackWaveFeedLoadStarted: (
    ...args: Parameters<typeof mockTrackWaveFeedLoadStarted>
  ) => mockTrackWaveFeedLoadStarted(...args),
  trackWaveFeedLoadSucceeded: (
    ...args: Parameters<typeof mockTrackWaveFeedLoadSucceeded>
  ) => mockTrackWaveFeedLoadSucceeded(...args),
}));

const getLoadingState = jest.fn(() => ({
  state: { isLoading: false, promise: null },
  shouldContinue: true,
}));
const setLoadingState = jest.fn();
const setPromise = jest.fn();
const clearLoadingState = jest.fn();

jest.mock("@/contexts/wave/hooks/useWaveLoadingState", () => ({
  useWaveLoadingState: () => ({
    getLoadingState,
    setLoadingState,
    setPromise,
    clearLoadingState,
  }),
}));

const cancelFetch = jest.fn();
const createController = jest.fn(() => ({ signal: {} }) as AbortController);
const cleanupController = jest.fn();

jest.mock("@/contexts/wave/hooks/useWaveAbortController", () => ({
  useWaveAbortController: () => ({
    cancelFetch,
    createController,
    cleanupController,
  }),
}));

export const fetchWaveMessages = jest.fn();
export const formatWaveMessages = jest.fn();
export const createEmptyWaveMessages = jest.fn();
export const fetchNewestWaveMessages = jest.fn();

jest.mock("@/contexts/wave/utils/wave-messages-utils", () => ({
  ...jest.requireActual("@/contexts/wave/utils/wave-messages-utils"),
  fetchWaveMessages: (...args: any[]) => fetchWaveMessages(...args),
  formatWaveMessages: (...args: any[]) => formatWaveMessages(...args),
  createEmptyWaveMessages: (...args: any[]) => createEmptyWaveMessages(...args),
  fetchNewestWaveMessages: (...args: any[]) => fetchNewestWaveMessages(...args),
}));

describe("useWaveDataFetching", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  function setup(
    initial: Record<string, any>,
    options: {
      readonly hasServerFeedSeed?: (waveId: string) => boolean;
      readonly isCapacitor?: boolean;
    } = {}
  ) {
    const store = { ...initial };
    const updateData = jest.fn((u: any) => {
      store[u.key] = { ...store[u.key], ...u };
    });
    const getData = jest.fn((key: string) => store[key]);
    const { result } = renderHook(() =>
      useWaveDataFetching({
        updateData,
        getData,
        removeDrop: jest.fn(),
        hasServerFeedSeed: options.hasServerFeedSeed ?? (() => false),
        isCapacitor: options.isCapacitor,
      })
    );
    return { result, updateData, getData, store };
  }

  it("does not start a duplicate initial request while a server seed is pending", async () => {
    let hasSeed = true;
    fetchWaveMessages.mockResolvedValue([{ id: "d1", serial_no: 1 }]);
    formatWaveMessages.mockReturnValue({ key: "wave1", drops: [{ id: "d1" }] });
    createEmptyWaveMessages.mockReturnValue({ key: "wave1", drops: [] });
    const { result } = setup(
      { wave1: { drops: [] } },
      { hasServerFeedSeed: () => hasSeed }
    );

    await act(async () => {
      result.current.registerWave("wave1", true);
      result.current.registerWave("wave1", true);
      await Promise.resolve();
    });

    expect(fetchWaveMessages).not.toHaveBeenCalled();
    expect(setLoadingState).not.toHaveBeenCalled();
    expect(createController).not.toHaveBeenCalled();

    hasSeed = false;
    await act(async () => {
      result.current.registerWave("wave1", true);
      await Promise.resolve();
    });

    expect(fetchWaveMessages).toHaveBeenCalledTimes(1);
  });

  it("keeps the initial guard until a queued seed commits, then syncs newer drops", async () => {
    jest.useFakeTimers();
    formatWaveMessages.mockImplementation(
      (waveId: string, drops: any[], options: Record<string, unknown> = {}) => ({
        key: waveId,
        drops,
        ...options,
      })
    );
    createEmptyWaveMessages.mockImplementation((waveId: string) => ({
      key: waveId,
      drops: [],
    }));
    fetchNewestWaveMessages.mockResolvedValue({
      drops: [],
      highestSerialNo: 1,
    });
    const seedPromise = Promise.resolve({
      ok: true,
      waveId: "wave1",
      drops: [],
      hasNextPage: false,
    } as const);
    const seedDrop = {
      id: "seed",
      serial_no: 1,
      wave: { id: "wave1" },
      author: { handle: "author" },
      parts: [],
      metadata: [],
      created_at: "2020",
      title: "",
      type: "FULL",
    } as any;
    const { result } = renderHook(() => {
      const store = useWaveMessagesStore();
      const fetching = useWaveDataFetching({
        updateData: store.updateData,
        getData: store.getData,
        removeDrop: store.removeDrop,
        hasServerFeedSeed: store.hasServerFeedSeed,
      });
      return { fetching, store };
    });

    act(() => {
      result.current.store.updateData({
        key: "blocker",
        isLoading: true,
      });
      result.current.store.registerPendingServerFeedSeed("wave1", seedPromise);
      result.current.store.completeInitialServerFeedRegistration("wave1");
      result.current.store.applyServerFeedSeed({
        waveId: "wave1",
        drops: [seedDrop],
        hasNextPage: false,
        onReady: () => result.current.fetching.registerWave("wave1", true),
        promise: seedPromise,
      });
    });

    expect(result.current.store.getData("wave1")).toBeUndefined();
    expect(result.current.store.hasServerFeedSeed("wave1")).toBe(true);

    await act(async () => {
      result.current.fetching.registerWave("wave1", true);
      await Promise.resolve();
    });

    expect(fetchWaveMessages).not.toHaveBeenCalled();

    await act(async () => {
      await jest.runAllTimersAsync();
      await Promise.resolve();
    });

    expect(result.current.store.getData("wave1")?.drops).toEqual([
      expect.objectContaining({ id: "seed" }),
    ]);
    expect(result.current.store.hasServerFeedSeed("wave1")).toBe(false);
    expect(fetchWaveMessages).not.toHaveBeenCalled();
    expect(fetchNewestWaveMessages).toHaveBeenCalledWith(
      "wave1",
      1,
      WAVE_DROPS_PARAMS.limit,
      expect.any(Object),
      expect.any(Function)
    );
  });

  it("fetches wave data and updates store", async () => {
    fetchWaveMessages.mockResolvedValue([{ id: "d1", serial_no: 1 }]);
    formatWaveMessages.mockReturnValue({ key: "wave1", drops: [{ id: "d1" }] });
    createEmptyWaveMessages.mockReturnValue({ key: "wave1", drops: [] });
    const { result, updateData } = setup({ wave1: { drops: [] } });

    await act(async () => {
      result.current.registerWave("wave1");
      await Promise.resolve();
    });

    expect(setLoadingState).toHaveBeenCalledWith("wave1", true);
    expect(createController).toHaveBeenCalledWith("wave1");
    expect(fetchWaveMessages).toHaveBeenCalledWith(
      "wave1",
      null,
      expect.any(Object),
      expect.any(Function),
      expect.objectContaining({ onFailure: expect.any(Function) })
    );
    expect(markMobileLaunchStepMock).toHaveBeenCalledWith(
      "wave_messages_loaded"
    );
    expect(mockTrackWaveFeedLoadStarted).toHaveBeenCalledWith({
      hadCachedDrops: false,
      isNative: false,
      loadSource: "initial_visible",
    });
    expect(mockTrackWaveFeedLoadSucceeded).toHaveBeenCalledWith({
      dropCount: 1,
      durationMs: 0,
      hadCachedDrops: false,
      isNative: false,
      loadSource: "initial_visible",
    });
    expect(updateData).toHaveBeenNthCalledWith(1, { key: "wave1", drops: [] });
    expect(updateData).toHaveBeenLastCalledWith({
      key: "wave1",
      drops: [{ id: "d1" }],
    });
  });

  it("ignores abort errors", async () => {
    const abortError = new DOMException("aborted", "AbortError");
    fetchWaveMessages.mockRejectedValue(abortError);
    createEmptyWaveMessages.mockReturnValue({ key: "wave1", drops: [] });
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { result, updateData } = setup({ wave1: { drops: [] } });

    await act(async () => {
      result.current.registerWave("wave1");
      await Promise.resolve();
    });

    expect(updateData).toHaveBeenCalledTimes(1); // only initial empty state
    expect(consoleSpy).not.toHaveBeenCalled();
    expect(mockTrackWaveFeedLoadCancelled).toHaveBeenCalledWith({
      durationMs: 0,
      error: abortError,
      hadCachedDrops: false,
      isNative: false,
      loadSource: "initial_visible",
      remainedUnavailable: false,
    });
    expect(mockTrackWaveFeedLoadFailed).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("tracks non-abort initial feed failures as unavailable", async () => {
    const failureError = Object.assign(new Error("Service unavailable"), {
      status: 503,
    });
    fetchWaveMessages.mockImplementation(
      async (
        _waveId: unknown,
        _serialNo: unknown,
        _signal: unknown,
        _updateEligibility: unknown,
        options: { readonly onFailure?: (error: unknown) => void }
      ) => {
        options.onFailure?.(failureError);
        return null;
      }
    );
    createEmptyWaveMessages.mockReturnValue({ key: "wave1", drops: [] });
    const { result, updateData } = setup({ wave1: { drops: [] } });

    await act(async () => {
      result.current.registerWave("wave1");
      await Promise.resolve();
    });

    expect(updateData).toHaveBeenCalledTimes(2);
    expect(updateData).toHaveBeenLastCalledWith({
      key: "wave1",
      isLoading: false,
    });
    expect(mockTrackWaveFeedLoadFailed).toHaveBeenCalledWith({
      durationMs: 0,
      error: failureError,
      hadCachedDrops: false,
      isNative: false,
      loadSource: "initial_visible",
      remainedUnavailable: true,
    });
  });

  it("tracks abort-like null feed results as cancellations", async () => {
    const abortError = new DOMException("Fetch is aborted", "AbortError");
    fetchWaveMessages.mockImplementation(
      async (
        _waveId: unknown,
        _serialNo: unknown,
        _signal: unknown,
        _updateEligibility: unknown,
        options: { readonly onFailure?: (error: unknown) => void }
      ) => {
        options.onFailure?.(abortError);
        return null;
      }
    );
    createEmptyWaveMessages.mockReturnValue({ key: "wave1", drops: [] });
    const { result, updateData } = setup({ wave1: { drops: [] } });

    await act(async () => {
      result.current.registerWave("wave1");
      await Promise.resolve();
    });

    expect(updateData).toHaveBeenCalledTimes(2);
    expect(updateData).toHaveBeenLastCalledWith({
      key: "wave1",
      isLoading: false,
    });
    expect(mockTrackWaveFeedLoadCancelled).toHaveBeenCalledWith({
      durationMs: 0,
      error: abortError,
      hadCachedDrops: false,
      isNative: false,
      loadSource: "initial_visible",
      remainedUnavailable: false,
    });
    expect(mockTrackWaveFeedLoadFailed).not.toHaveBeenCalled();
  });

  it("syncNewestMessages updates data and returns result", async () => {
    fetchNewestWaveMessages.mockResolvedValue({
      drops: [{ id: "d", serial_no: 11 }],
      highestSerialNo: 11,
    });
    formatWaveMessages.mockReturnValue({ key: "wave1", drops: [{ id: "d" }] });
    const { result, updateData } = setup({ wave1: { drops: [] } });

    const res = await result.current.syncNewestMessages(
      "wave1",
      10,
      new AbortController().signal
    );
    expect(fetchNewestWaveMessages).toHaveBeenCalledWith(
      "wave1",
      10,
      50,
      expect.any(Object),
      expect.any(Function)
    );
    expect(updateData).toHaveBeenCalledWith({
      key: "wave1",
      drops: [{ id: "d" }],
    });
    expect(res).toEqual({
      drops: [{ id: "d", serial_no: 11 }],
      highestSerialNo: 11,
    });
  });

  it("syncNewestMessages handles error", async () => {
    fetchNewestWaveMessages.mockResolvedValue({
      drops: null,
      highestSerialNo: null,
    });
    const { result, updateData } = setup({ wave1: { drops: [] } });
    const res = await result.current.syncNewestMessages(
      "wave1",
      10,
      new AbortController().signal
    );
    expect(updateData).not.toHaveBeenCalled();
    expect(res).toEqual({ drops: null, highestSerialNo: null });
  });

  it("caps newest sync when every page is full", async () => {
    fetchNewestWaveMessages.mockImplementation(
      async (_waveId, sinceSerialNo: number, limit: number) => {
        const drops = Array.from({ length: limit }, (_, index) => ({
          id: `new-${sinceSerialNo}-${index}`,
          serial_no: sinceSerialNo + index + 1,
        }));

        return {
          drops,
          highestSerialNo: sinceSerialNo + limit,
        };
      }
    );
    formatWaveMessages.mockImplementation((waveId, drops) => ({
      key: waveId,
      drops,
    }));
    const { result } = setup({ wave1: { drops: [] } });

    const res = await result.current.syncNewestMessages(
      "wave1",
      10,
      new AbortController().signal
    );

    expect(fetchNewestWaveMessages).toHaveBeenCalledTimes(20);
    expect(res.highestSerialNo).toBe(10 + 20 * 50);
  });

  it("uses a tracked controller for existing wave newest sync", async () => {
    fetchNewestWaveMessages.mockResolvedValue({
      drops: [],
      highestSerialNo: 5,
    });
    formatWaveMessages.mockReturnValue({ key: "wave1", drops: [] });
    const newestSyncController = { signal: {} } as AbortController;
    createController.mockReturnValueOnce(newestSyncController);
    const { result } = setup({
      wave1: {
        drops: [{ id: "existing", serial_no: 5 }],
      },
    });

    await act(async () => {
      result.current.registerWave("wave1", true);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(createController).toHaveBeenCalledWith("wave1-newest-sync");
    expect(fetchNewestWaveMessages).toHaveBeenCalledWith(
      "wave1",
      5,
      50,
      newestSyncController.signal,
      expect.any(Function)
    );
    expect(cleanupController).toHaveBeenCalledWith(
      "wave1-newest-sync",
      newestSyncController
    );
    expect(mockTrackWaveFeedLoadStarted).toHaveBeenCalledWith({
      hadCachedDrops: true,
      isNative: false,
      loadSource: "cache",
    });
    expect(mockTrackWaveFeedLoadSucceeded).toHaveBeenCalledWith({
      dropCount: 1,
      durationMs: 0,
      hadCachedDrops: true,
      isNative: false,
      loadSource: "cache",
    });
    expect(mockTrackWaveFeedLoadStarted).toHaveBeenCalledWith({
      hadCachedDrops: true,
      isNative: false,
      loadSource: "background_sync",
    });
    expect(mockTrackWaveFeedLoadSucceeded).toHaveBeenCalledWith({
      dropCount: 0,
      durationMs: 0,
      hadCachedDrops: true,
      isNative: false,
      loadSource: "background_sync",
    });
  });

  it("tracks aborted newest syncs without surfacing console errors", async () => {
    const abortError = new DOMException("aborted", "AbortError");
    fetchNewestWaveMessages.mockRejectedValue(abortError);
    const newestSyncController = { signal: {} } as AbortController;
    createController.mockReturnValueOnce(newestSyncController);
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { result } = setup({
      wave1: {
        drops: [{ id: "existing", serial_no: 5 }],
      },
    });

    await act(async () => {
      await result.current.registerWave("wave1", true);
    });

    expect(fetchNewestWaveMessages).toHaveBeenCalledWith(
      "wave1",
      5,
      50,
      newestSyncController.signal,
      expect.any(Function)
    );
    expect(mockTrackWaveFeedLoadCancelled).toHaveBeenCalledWith({
      durationMs: 0,
      error: abortError,
      hadCachedDrops: true,
      isNative: false,
      loadSource: "background_sync",
      remainedUnavailable: false,
    });
    expect(cleanupController).toHaveBeenCalledWith(
      "wave1-newest-sync",
      newestSyncController
    );
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("uses a smaller native initial limit and backfills the remaining first page later", async () => {
    jest.useFakeTimers();
    const initialDrops = Array.from(
      { length: WAVE_DROPS_NATIVE_INITIAL_PARAMS.limit },
      (_, index) => ({
        id: `initial-${index}`,
        serial_no: 100 - index,
      })
    );
    const backfillLimit =
      WAVE_DROPS_PARAMS.limit - WAVE_DROPS_NATIVE_INITIAL_PARAMS.limit;
    const backfillDrops = Array.from({ length: backfillLimit }, (_, index) => ({
      id: `backfill-${index}`,
      serial_no: 80 - index,
    }));

    fetchWaveMessages
      .mockResolvedValueOnce(initialDrops)
      .mockResolvedValueOnce(backfillDrops);
    formatWaveMessages.mockImplementation((waveId, drops) => ({
      key: waveId,
      drops,
    }));
    createEmptyWaveMessages.mockReturnValue({ key: "wave1", drops: [] });

    const { result, store, updateData } = setup(
      {
        wave1: {
          drops: [],
        },
      },
      { isCapacitor: true }
    );

    await act(async () => {
      result.current.registerWave("wave1");
      await Promise.resolve();
    });

    expect(fetchWaveMessages).toHaveBeenNthCalledWith(
      1,
      "wave1",
      null,
      expect.any(Object),
      expect.any(Function),
      expect.objectContaining({
        limit: WAVE_DROPS_NATIVE_INITIAL_PARAMS.limit,
        onFailure: expect.any(Function),
      })
    );

    await act(async () => {
      jest.advanceTimersByTime(250);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchWaveMessages).toHaveBeenNthCalledWith(
      2,
      "wave1",
      81,
      expect.any(Object),
      expect.any(Function),
      expect.objectContaining({
        limit: backfillLimit,
        onFailure: expect.any(Function),
      })
    );

    expect(updateData).toHaveBeenLastCalledWith(
      expect.objectContaining({
        key: "wave1",
        drops: expect.arrayContaining([
          expect.objectContaining({ id: "initial-0" }),
          expect.objectContaining({ id: "backfill-0" }),
        ]),
      })
    );
    expect(store.wave1.drops).toHaveLength(WAVE_DROPS_PARAMS.limit);
    expect(store.wave1.drops.map((drop: { id: string }) => drop.id)).toEqual([
      ...initialDrops.map((drop) => drop.id),
      ...backfillDrops.map((drop) => drop.id),
    ]);
    expect(mockTrackWaveFeedLoadStarted).toHaveBeenCalledWith({
      hadCachedDrops: true,
      isNative: true,
      loadSource: "native_initial_backfill",
    });
    expect(mockTrackWaveFeedLoadSucceeded).toHaveBeenCalledWith({
      dropCount: backfillDrops.length,
      durationMs: 0,
      hadCachedDrops: true,
      isNative: true,
      loadSource: "native_initial_backfill",
    });

    jest.useRealTimers();
  });

  it("tracks aborted native initial backfills as cancellations", async () => {
    jest.useFakeTimers();
    const initialDrops = Array.from(
      { length: WAVE_DROPS_NATIVE_INITIAL_PARAMS.limit },
      (_, index) => ({
        id: `initial-${index}`,
        serial_no: 100 - index,
      })
    );
    const abortError = new DOMException("aborted", "AbortError");

    fetchWaveMessages
      .mockResolvedValueOnce(initialDrops)
      .mockRejectedValueOnce(abortError);
    formatWaveMessages.mockImplementation((waveId, drops) => ({
      key: waveId,
      drops,
    }));
    createEmptyWaveMessages.mockReturnValue({ key: "wave1", drops: [] });

    const { result } = setup(
      {
        wave1: {
          drops: [],
        },
      },
      { isCapacitor: true }
    );

    await act(async () => {
      result.current.registerWave("wave1");
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(250);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockTrackWaveFeedLoadCancelled).toHaveBeenCalledWith({
      durationMs: 0,
      error: abortError,
      hadCachedDrops: true,
      isNative: true,
      loadSource: "native_initial_backfill",
      remainedUnavailable: false,
    });

    jest.useRealTimers();
  });

  it("cancels newest sync when canceling a wave fetch", () => {
    const { result } = setup({ wave1: { drops: [] } });

    act(() => {
      result.current.cancelWaveDataFetch("wave1");
    });

    expect(cancelFetch).toHaveBeenCalledWith("wave1", "wave_deactivated");
    expect(cancelFetch).toHaveBeenCalledWith(
      "wave1-initial-backfill",
      "wave_deactivated"
    );
    expect(cancelFetch).toHaveBeenCalledWith(
      "wave1-newest-sync",
      "wave_deactivated"
    );
  });

  it("does not schedule native initial backfill for targeted serial restores", async () => {
    jest.useFakeTimers();
    const initialDrops = Array.from(
      { length: WAVE_DROPS_NATIVE_INITIAL_PARAMS.limit },
      (_, index) => ({
        id: `initial-${index}`,
        serial_no: 100 - index,
      })
    );

    fetchWaveMessages.mockResolvedValueOnce(initialDrops);
    formatWaveMessages.mockImplementation((waveId, drops) => ({
      key: waveId,
      drops,
    }));
    createEmptyWaveMessages.mockReturnValue({ key: "wave1", drops: [] });

    const { result } = setup(
      {
        wave1: {
          drops: [],
        },
      },
      { isCapacitor: true }
    );

    await act(async () => {
      result.current.registerWave("wave1", false, {
        skipInitialBackfill: true,
      });
      await Promise.resolve();
    });

    await act(async () => {
      jest.advanceTimersByTime(250);
      await Promise.resolve();
    });

    expect(fetchWaveMessages).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });
});
