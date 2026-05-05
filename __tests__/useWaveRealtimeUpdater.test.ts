import { renderHook, act, waitFor } from "@testing-library/react";
import {
  useWaveRealtimeUpdater,
  ProcessIncomingDropType,
} from "@/contexts/wave/hooks/useWaveRealtimeUpdater";
import { DropSize } from "@/helpers/waves/drop.helpers";
import * as Sentry from "@sentry/nextjs";
import {
  __resetDropReactionMonitoringForTests,
  beginReactionMutation,
  recordReactionRequestFailed,
  recordReactionRequestSucceeded,
} from "@/utils/monitoring/dropReactionMonitoring";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";
import { WsMessageType } from "@/helpers/Types";

jest.mock("@sentry/nextjs", () => ({
  __esModule: true,
  addBreadcrumb: jest.fn(),
  withScope: jest.fn((callback: (scope: any) => void) => {
    const scope = {
      setLevel: jest.fn(),
      setFingerprint: jest.fn(),
      setTag: jest.fn(),
      setExtras: jest.fn(),
    };
    callback(scope);
  }),
  captureException: jest.fn(),
}));

const mockWebSocketHandlers = new Map<unknown, (messageData: any) => void>();

jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: jest.fn(
    (type: unknown, handler: (messageData: any) => void) => {
      mockWebSocketHandlers.set(type, handler);
      return { isConnected: true };
    }
  ),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiPostWithoutBodyAndResponse: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/services/api/drop-api", () => ({
  fetchDropByIdBatched: jest.fn(),
}));

const mockSetQueriesData = jest.fn();
const mockGetQueriesData = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: jest.fn(() => ({
    getQueriesData: mockGetQueriesData,
    setQueriesData: mockSetQueriesData,
  })),
}));

const {
  commonApiPostWithoutBodyAndResponse,
} = require("@/services/api/common-api");
const { fetchDropByIdBatched } = require("@/services/api/drop-api");

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
};

describe("useWaveRealtimeUpdater", () => {
  const setDocumentVisibility = (visibilityState: DocumentVisibilityState) => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: visibilityState,
    });
  };

  beforeEach(() => {
    mockWebSocketHandlers.clear();
    setDocumentVisibility("visible");
    mockGetQueriesData.mockReturnValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    __resetDropReactionMonitoringForTests();
  });

  const contextProfileContext = (reaction: string | null) => ({
    rating: 0,
    min_rating: 0,
    max_rating: 0,
    reaction,
    boosted: false,
    bookmarked: false,
    curatable: false,
    curated: false,
  });

  const profile = (id: string, handle = id) => ({ id, handle });

  const reactionEntry = (
    reaction: string,
    profiles = [profile("profile-1")]
  ) => ({
    reaction,
    profiles,
  });

  const reactionEntries = (reaction: string) => [reactionEntry(reaction)];

  const baseProps = (store: any) => ({
    activeWaveId: null as string | null,
    getData: (key: any) => store[key],
    updateData: jest.fn((update: any) => {
      store[update.key] = { ...store[update.key], ...update };
    }),
    registerWave: jest.fn(),
    syncNewestMessages: jest
      .fn()
      .mockResolvedValue({ drops: null, highestSerialNo: null }),
    removeDrop: jest.fn(),
    removeWaveDeliveredNotifications: jest.fn().mockResolvedValue(undefined),
    isWaveMuted: jest.fn().mockReturnValue(false),
  });

  const toStoredDrop = (drop: any) => ({
    ...drop,
    type: DropSize.FULL,
    stableKey: drop.id,
    stableHash: drop.id,
  });

  const applyWaveStoreUpdate = (store: any, update: any) => {
    const currentDrops = store[update.key]?.drops ?? [];
    const updateDrops = update.drops ?? currentDrops;
    store[update.key] = {
      ...store[update.key],
      ...update,
      drops: [
        ...currentDrops.filter(
          (currentDrop: any) =>
            !updateDrops.some(
              (updatedDrop: any) => updatedDrop.id === currentDrop.id
            )
        ),
        ...updateDrops,
      ],
    };
  };

  const expectCachedDropUpdate = (
    cachedDrop: any,
    verifyUpdatedDrop: (updatedDrop: any) => void
  ) => {
    expect(mockSetQueriesData).toHaveBeenCalled();

    for (const [, updateCachedData] of mockSetQueriesData.mock.calls) {
      verifyUpdatedDrop(updateCachedData(cachedDrop));
    }
  };

  const expectNoMutedWaveSideEffects = (props: any) => {
    expect(props.updateData).not.toHaveBeenCalled();
    expect(props.registerWave).not.toHaveBeenCalled();
    expect(props.syncNewestMessages).not.toHaveBeenCalled();
    expect(props.removeWaveDeliveredNotifications).not.toHaveBeenCalled();
    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();
  };

  it("optimistically adds drop and syncs newest messages", async () => {
    const store = { wave1: { drops: [], latestFetchedSerialNo: 10 } };
    const props = baseProps(store);
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = { id: "d1", wave: { id: "wave1" }, author: {} };
    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_INSERT
      )
    );
    await flushPromises();
    expect(props.updateData).toHaveBeenCalled();
    expect(props.syncNewestMessages).toHaveBeenCalled();
  });

  it("reconciles newest-message sync drops before writing the wave store", async () => {
    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    const currentUser = profile("profile-1", "current-user");
    beginReactionMutation({
      dropId: "d-newest-protected",
      waveId: "wave1",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      profile: currentUser as any,
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    const store: any = {
      wave1: {
        drops: [
          {
            id: "d-newest-protected",
            type: DropSize.FULL,
            stableKey: "protected-stable-key",
            stableHash: "protected-stable-hash",
            serial_no: 20,
            author: {},
            wave: { id: "wave1" },
            context_profile_context: contextProfileContext(":joy:"),
            reactions: [reactionEntry(":joy:", [currentUser])],
          },
        ],
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    props.updateData = jest.fn((update: any) =>
      applyWaveStoreUpdate(store, update)
    );
    const serverDrops = [
      {
        id: "d-newest-protected",
        serial_no: 21,
        author: {},
        wave: { id: "wave1" },
        context_profile_context: contextProfileContext(":wave:"),
        reactions: [
          reactionEntry(":wave:", [
            profile("profile-1", "server-current-user"),
            profile("profile-2", "fresh-wave"),
          ]),
        ],
      },
    ];
    props.syncNewestMessages = jest.fn(
      async (
        waveId: string,
        _sinceSerialNo: number,
        _signal: AbortSignal,
        reconcileDrops?: (drops: any[]) => any[]
      ) => {
        const displayDrops = reconcileDrops?.(serverDrops) ?? serverDrops;
        props.updateData({
          key: waveId,
          drops: displayDrops.map(toStoredDrop),
          latestFetchedSerialNo: 21,
        });

        return {
          drops: displayDrops,
          highestSerialNo: 21,
        };
      }
    );

    dateNowSpy.mockReturnValue(2_000);
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "d-newest-trigger",
      serial_no: 22,
      wave: { id: "wave1" },
      author: {},
      context_profile_context: null,
      reactions: [],
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_INSERT
      )
    );

    await waitFor(() => expect(props.syncNewestMessages).toHaveBeenCalled());
    await waitFor(() =>
      expect(
        props.updateData.mock.calls.some((call) =>
          call[0].drops?.some(
            (updatedDrop: any) => updatedDrop.id === "d-newest-protected"
          )
        )
      ).toBe(true)
    );

    const syncUpdate = props.updateData.mock.calls
      .map((call) => call[0])
      .filter((update) =>
        update.drops?.some(
          (updatedDrop: any) => updatedDrop.id === "d-newest-protected"
        )
      )
      .at(-1);
    const syncedDrop = syncUpdate?.drops.find(
      (updatedDrop: any) => updatedDrop.id === "d-newest-protected"
    );
    expect(syncedDrop.context_profile_context.reaction).toBe(":joy:");
    expect(syncedDrop.reactions).toEqual([
      reactionEntry(":wave:", [profile("profile-2", "fresh-wave")]),
      reactionEntry(":joy:", [currentUser]),
    ]);
  });

  it("does not replay reconciled newest-sync drops after a reaction rollback", async () => {
    const dropId = "d-newest-rollback-race";
    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    const currentUser = profile("profile-1", "current-user");
    const mutation = beginReactionMutation({
      dropId,
      waveId: "wave1",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      profile: currentUser as any,
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    const store: any = {
      wave1: {
        drops: [
          {
            id: dropId,
            type: DropSize.FULL,
            stableKey: "rollback-race-stable-key",
            stableHash: "rollback-race-stable-hash",
            serial_no: 20,
            author: {},
            wave: { id: "wave1" },
            context_profile_context: contextProfileContext(":joy:"),
            reactions: [reactionEntry(":joy:", [currentUser])],
          },
        ],
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    props.updateData = jest.fn((update: any) =>
      applyWaveStoreUpdate(store, update)
    );
    const serverDrop = {
      id: dropId,
      serial_no: 21,
      author: {},
      wave: { id: "wave1" },
      context_profile_context: contextProfileContext(":wave:"),
      reactions: [
        reactionEntry(":wave:", [
          profile("profile-1", "server-current-user"),
          profile("profile-2", "fresh-wave"),
        ]),
      ],
    };
    props.syncNewestMessages = jest.fn(
      async (
        waveId: string,
        _sinceSerialNo: number,
        _signal: AbortSignal,
        reconcileDrops?: (drops: any[]) => any[]
      ) => {
        const displayDrops = reconcileDrops?.([serverDrop]) ?? [serverDrop];

        props.updateData({
          key: waveId,
          drops: displayDrops.map(toStoredDrop),
          latestFetchedSerialNo: 21,
        });
        expect(
          store.wave1.drops.find((drop: any) => drop.id === dropId)
            ?.context_profile_context.reaction
        ).toBe(":joy:");

        dateNowSpy.mockReturnValue(2_500);
        recordReactionRequestFailed(mutation, new Error("network failed"));
        props.updateData({
          key: waveId,
          drops: [
            {
              ...toStoredDrop(serverDrop),
              stableKey: "rollback-race-stable-key",
              stableHash: "rollback-race-stable-hash",
              context_profile_context: contextProfileContext(":wave:"),
              reactions: [reactionEntry(":wave:", [currentUser])],
            },
          ],
          latestFetchedSerialNo: 21,
        });

        return {
          drops: displayDrops,
          highestSerialNo: 21,
        };
      }
    );

    dateNowSpy.mockReturnValue(2_000);
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "d-newest-rollback-trigger",
      serial_no: 22,
      wave: { id: "wave1" },
      author: {},
      context_profile_context: null,
      reactions: [],
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_INSERT
      )
    );

    await waitFor(() => expect(props.syncNewestMessages).toHaveBeenCalled());
    await flushPromises();

    const finalDrop = store.wave1.drops.find(
      (updatedDrop: any) => updatedDrop.id === dropId
    );
    expect(finalDrop.context_profile_context.reaction).toBe(":wave:");
    expect(finalDrop.reactions).toEqual([
      reactionEntry(":wave:", [currentUser]),
    ]);
  });

  it("handles aborted fetch without logging", async () => {
    const consoleLog = jest.spyOn(console, "log").mockImplementation(() => {});
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const store: any = { wave1: { drops: [], latestFetchedSerialNo: 1 } };
    const props = baseProps(store);
    props.syncNewestMessages = jest
      .fn()
      .mockRejectedValue(new DOMException("aborted", "AbortError"));
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = { id: "d2", wave: { id: "wave1" }, author: {} };

    await act(async () => {
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_INSERT
      );
    });
    await flushPromises();
    // AbortError should not be logged (it's expected behavior)
    expect(consoleLog).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    consoleLog.mockRestore();
    consoleError.mockRestore();
  });

  it("logs error when fetch fails", async () => {
    const consoleErr = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const store = { wave1: { drops: [], latestFetchedSerialNo: 1 } };
    const props = baseProps(store);
    props.syncNewestMessages = jest.fn().mockRejectedValue(new Error("fail"));
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = { id: "d3", wave: { id: "wave1" }, author: {} };
    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_INSERT
      )
    );
    await flushPromises();
    expect(consoleErr).toHaveBeenCalled();
    consoleErr.mockRestore();
  });

  it("handles DROP_REACTION_UPDATE when drop exists", async () => {
    const store: any = {
      wave1: {
        drops: [
          {
            id: "d4",
            type: DropSize.FULL,
            stableKey: "d4",
            stableHash: "d4",
            author: {},
          },
        ],
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    fetchDropByIdBatched.mockResolvedValue({
      id: "d4",
      author: {},
      wave: { id: "wave1" },
      context_profile_context: null,
    });
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = { id: "d4", wave: { id: "wave1" }, author: {} };
    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      )
    );
    await flushPromises();
    expect(fetchDropByIdBatched).toHaveBeenCalledWith("d4");
    expect(props.updateData).toHaveBeenCalled();
  });

  it("does not update wave store when the latest fetched drop is missing", async () => {
    const store: any = {
      wave1: {
        drops: [
          {
            id: "d-missing-after-fetch",
            type: DropSize.FULL,
            stableKey: "stable-key",
            stableHash: "stable-hash",
            author: {},
            wave: { id: "wave1" },
          },
        ],
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    fetchDropByIdBatched.mockImplementation(async () => {
      store.wave1.drops = [];
      return {
        id: "d-missing-after-fetch",
        author: {},
        wave: { id: "wave1" },
        context_profile_context: null,
        reactions: [],
      };
    });

    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "d-missing-after-fetch",
      wave: { id: "wave1" },
      author: {},
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      )
    );
    await flushPromises();

    expect(props.updateData).not.toHaveBeenCalled();
  });

  it("does not update wave store when the latest fetched drop is no longer full", async () => {
    const store: any = {
      wave1: {
        drops: [
          {
            id: "d-light-after-fetch",
            type: DropSize.FULL,
            stableKey: "stable-key",
            stableHash: "stable-hash",
            author: {},
            wave: { id: "wave1" },
          },
        ],
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    fetchDropByIdBatched.mockImplementation(async () => {
      store.wave1.drops = [
        {
          id: "d-light-after-fetch",
          type: DropSize.LIGHT,
          stableKey: "light-key",
          stableHash: "light-hash",
          waveId: "wave1",
        },
      ];
      return {
        id: "d-light-after-fetch",
        author: {},
        wave: { id: "wave1" },
        context_profile_context: null,
        reactions: [],
      };
    });

    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "d-light-after-fetch",
      wave: { id: "wave1" },
      author: {},
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      )
    );
    await flushPromises();

    expect(props.updateData).not.toHaveBeenCalled();
  });

  it("updates React Query caches for reaction updates missing from wave store", async () => {
    const store: any = {
      wave1: {
        drops: [],
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    const oldCacheContext = contextProfileContext(":old-cache:");
    mockGetQueriesData.mockReturnValue([
      [
        ["DROPS"],
        {
          pages: [
            [
              {
                id: "d-cache-only-reaction",
                context_profile_context: oldCacheContext,
                reactions: [],
              },
            ],
          ],
        },
      ],
    ]);
    fetchDropByIdBatched.mockResolvedValue({
      id: "d-cache-only-reaction",
      author: {},
      wave: { id: "wave1" },
      context_profile_context: contextProfileContext(":server:"),
      reactions: reactionEntries(":server:"),
    });

    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "d-cache-only-reaction",
      wave: { id: "wave1" },
      author: {},
      context_profile_context: contextProfileContext(":websocket:"),
      reactions: reactionEntries(":websocket:"),
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      )
    );
    await flushPromises();

    expect(fetchDropByIdBatched).toHaveBeenCalledWith("d-cache-only-reaction");
    expect(props.updateData).not.toHaveBeenCalled();
    expect(mockSetQueriesData).toHaveBeenCalled();

    for (const [, updateCachedData] of mockSetQueriesData.mock.calls) {
      const updatedCacheDrop = updateCachedData({
        id: "d-cache-only-reaction",
        context_profile_context: oldCacheContext,
        reactions: [],
      });
      expect(updatedCacheDrop.context_profile_context.reaction).toBe(
        ":server:"
      );
      expect(updatedCacheDrop.reactions).toEqual(reactionEntries(":server:"));
    }
  });

  it("skips reaction refetches when a loaded wave has no local or cached drop", async () => {
    const store: any = {
      wave1: {
        drops: [],
        isLoading: false,
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "d-missing-local-and-cache",
      wave: { id: "wave1" },
      author: {},
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      )
    );
    await flushPromises();

    expect(fetchDropByIdBatched).not.toHaveBeenCalled();
    expect(props.updateData).not.toHaveBeenCalled();
    expect(mockSetQueriesData).not.toHaveBeenCalled();
  });

  it("fetches reaction updates for missing drops while the wave is loading", async () => {
    const staleReaction = reactionEntries(":stale:");
    const freshReaction = reactionEntries(":fresh:");
    const store: any = {
      wave1: {
        drops: [],
        isLoading: true,
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    fetchDropByIdBatched.mockImplementation(async () => {
      store.wave1 = {
        ...store.wave1,
        drops: [
          {
            id: "d-loading-reaction",
            type: DropSize.FULL,
            stableKey: "loading-stable-key",
            stableHash: "loading-stable-hash",
            author: {},
            wave: { id: "wave1" },
            context_profile_context: contextProfileContext(":stale:"),
            reactions: staleReaction,
          },
        ],
        isLoading: false,
      };

      return {
        id: "d-loading-reaction",
        author: {},
        wave: { id: "wave1" },
        context_profile_context: contextProfileContext(":fresh:"),
        reactions: freshReaction,
      };
    });

    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "d-loading-reaction",
      wave: { id: "wave1" },
      author: {},
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      )
    );
    await flushPromises();

    expect(props.registerWave).not.toHaveBeenCalled();
    expect(fetchDropByIdBatched).toHaveBeenCalledWith("d-loading-reaction");
    expect(props.updateData).toHaveBeenCalled();

    const lastUpdate =
      props.updateData.mock.calls[props.updateData.mock.calls.length - 1]?.[0];
    const updatedDrop = lastUpdate.drops[0];
    expect(updatedDrop.stableKey).toBe("loading-stable-key");
    expect(updatedDrop.stableHash).toBe("loading-stable-hash");
    expect(updatedDrop.context_profile_context.reaction).toBe(":fresh:");
    expect(updatedDrop.reactions).toBe(freshReaction);
  });

  it("replays fetched reaction updates after the initial loading wave adds the drop", async () => {
    const staleReaction = reactionEntries(":stale:");
    const freshReaction = reactionEntries(":fresh:");
    const freshContext = {
      ...contextProfileContext(":fresh:"),
      rating: 9,
    };
    const staleContext = {
      ...contextProfileContext(":stale:"),
      rating: 1,
    };
    const store: any = {
      wave1: {
        drops: [],
        isLoading: true,
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    fetchDropByIdBatched.mockResolvedValue({
      id: "d-loading-replay",
      author: {},
      wave: { id: "wave1" },
      context_profile_context: freshContext,
      reactions: freshReaction,
    });

    const { result, rerender } = renderHook(() =>
      useWaveRealtimeUpdater(props)
    );
    const drop: any = {
      id: "d-loading-replay",
      wave: { id: "wave1" },
      author: {},
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      )
    );
    await flushPromises();

    expect(props.updateData).not.toHaveBeenCalled();

    store.wave1 = {
      ...store.wave1,
      drops: [
        {
          id: "d-loading-replay",
          type: DropSize.FULL,
          stableKey: "initial-stable-key",
          stableHash: "initial-stable-hash",
          author: {},
          wave: { id: "wave1" },
          context_profile_context: staleContext,
          reactions: staleReaction,
        },
      ],
      isLoading: false,
    };

    act(() => {
      rerender();
    });

    await waitFor(() => expect(props.updateData).toHaveBeenCalledTimes(1));

    const replayedUpdate = props.updateData.mock.calls[0]?.[0];
    const replayedDrop = replayedUpdate.drops[0];
    expect(replayedDrop.stableKey).toBe("initial-stable-key");
    expect(replayedDrop.stableHash).toBe("initial-stable-hash");
    expect(replayedDrop.context_profile_context.reaction).toBe(":fresh:");
    expect(replayedDrop.context_profile_context.rating).toBe(9);
    expect(replayedDrop.reactions).toBe(freshReaction);
  });

  it("reconciles pending fetched reaction replays with the latest protected cache reaction", async () => {
    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    const currentUser = profile("profile-1", "current-user");
    const serverReactions = [
      reactionEntry(":wave:", [
        profile("profile-1", "server-current-user"),
        profile("profile-2", "fresh-wave"),
      ]),
      reactionEntry(":fire:", [profile("profile-3", "fresh-fire")]),
    ];
    const serverContext = {
      ...contextProfileContext(":wave:"),
      rating: 9,
    };
    const loadedContext = {
      ...contextProfileContext(":stale:"),
      rating: 1,
    };
    const store: any = {
      wave1: {
        drops: [],
        isLoading: true,
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    fetchDropByIdBatched.mockResolvedValue({
      id: "d-loading-replay-protected",
      title: "server-title",
      rating: 42,
      realtime_rating: 43,
      rating_prediction: 44,
      author: {},
      wave: { id: "wave1" },
      context_profile_context: serverContext,
      reactions: serverReactions,
    });

    const { result, rerender } = renderHook(() =>
      useWaveRealtimeUpdater(props)
    );
    const drop: any = {
      id: "d-loading-replay-protected",
      wave: { id: "wave1" },
      author: {},
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      )
    );
    await flushPromises();

    expect(props.updateData).not.toHaveBeenCalled();

    dateNowSpy.mockReturnValue(1_500);
    beginReactionMutation({
      dropId: "d-loading-replay-protected",
      waveId: "wave1",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });
    mockGetQueriesData.mockReturnValue([
      [
        ["DROPS"],
        {
          pages: [
            [
              {
                id: "d-loading-replay-protected",
                context_profile_context: contextProfileContext(":joy:"),
                reactions: [reactionEntry(":joy:", [currentUser])],
              },
            ],
          ],
        },
      ],
    ]);
    mockSetQueriesData.mockClear();

    dateNowSpy.mockReturnValue(2_000);
    store.wave1 = {
      ...store.wave1,
      drops: [
        {
          id: "d-loading-replay-protected",
          type: DropSize.FULL,
          stableKey: "initial-protected-stable-key",
          stableHash: "initial-protected-stable-hash",
          title: "loaded-title",
          rating: 1,
          author: {},
          wave: { id: "wave1" },
          context_profile_context: loadedContext,
          reactions: reactionEntries(":stale:"),
        },
      ],
      isLoading: false,
    };

    act(() => {
      rerender();
    });

    await waitFor(() => expect(props.updateData).toHaveBeenCalledTimes(1));

    const replayedUpdate = props.updateData.mock.calls[0]?.[0];
    const replayedDrop = replayedUpdate.drops[0];
    expect(replayedDrop.stableKey).toBe("initial-protected-stable-key");
    expect(replayedDrop.stableHash).toBe("initial-protected-stable-hash");
    expect(replayedDrop.title).toBe("server-title");
    expect(replayedDrop.rating).toBe(42);
    expect(replayedDrop.realtime_rating).toBe(43);
    expect(replayedDrop.rating_prediction).toBe(44);
    expect(replayedDrop.context_profile_context.rating).toBe(9);
    expect(replayedDrop.context_profile_context.reaction).toBe(":joy:");
    expect(replayedDrop.reactions).toEqual([
      reactionEntry(":wave:", [profile("profile-2", "fresh-wave")]),
      reactionEntry(":fire:", [profile("profile-3", "fresh-fire")]),
      reactionEntry(":joy:", [currentUser]),
    ]);

    expect(mockSetQueriesData).toHaveBeenCalled();

    for (const [, updateCachedData] of mockSetQueriesData.mock.calls) {
      const updatedCacheDrop = updateCachedData({
        id: "d-loading-replay-protected",
        context_profile_context: contextProfileContext(":wave:"),
        reactions: [],
      });
      expect(updatedCacheDrop.context_profile_context.reaction).toBe(":joy:");
      expect(updatedCacheDrop.reactions).toEqual([
        reactionEntry(":wave:", [profile("profile-2", "fresh-wave")]),
        reactionEntry(":fire:", [profile("profile-3", "fresh-fire")]),
        reactionEntry(":joy:", [currentUser]),
      ]);
    }
  });

  it("lets stale server reaction win when pending replay happens after protection expires", async () => {
    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    const mutation = beginReactionMutation({
      dropId: "d-loading-replay-expired",
      waveId: "wave1",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });
    dateNowSpy.mockReturnValue(1_100);
    recordReactionRequestSucceeded(mutation);

    const currentUser = profile("profile-1", "current-user");
    const store: any = {
      wave1: {
        drops: [],
        isLoading: true,
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    fetchDropByIdBatched.mockResolvedValue({
      id: "d-loading-replay-expired",
      title: "server-title",
      author: {},
      wave: { id: "wave1" },
      context_profile_context: {
        ...contextProfileContext(":wave:"),
        rating: 9,
      },
      reactions: [
        reactionEntry(":wave:", [
          profile("profile-1", "server-current-user"),
          profile("profile-2", "fresh-wave"),
        ]),
      ],
    });

    dateNowSpy.mockReturnValue(2_000);
    const { result, rerender } = renderHook(() =>
      useWaveRealtimeUpdater(props)
    );
    const drop: any = {
      id: "d-loading-replay-expired",
      wave: { id: "wave1" },
      author: {},
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      )
    );
    await flushPromises();

    expect(props.updateData).not.toHaveBeenCalled();

    dateNowSpy.mockReturnValue(6_101);
    store.wave1 = {
      ...store.wave1,
      drops: [
        {
          id: "d-loading-replay-expired",
          type: DropSize.FULL,
          stableKey: "expired-stable-key",
          stableHash: "expired-stable-hash",
          author: {},
          wave: { id: "wave1" },
          context_profile_context: contextProfileContext(":joy:"),
          reactions: [reactionEntry(":joy:", [currentUser])],
        },
      ],
      isLoading: false,
    };

    act(() => {
      rerender();
    });

    await waitFor(() => expect(props.updateData).toHaveBeenCalledTimes(1));

    const replayedUpdate = props.updateData.mock.calls[0]?.[0];
    const replayedDrop = replayedUpdate.drops[0];
    expect(replayedDrop.stableKey).toBe("expired-stable-key");
    expect(replayedDrop.stableHash).toBe("expired-stable-hash");
    expect(replayedDrop.title).toBe("server-title");
    expect(replayedDrop.context_profile_context.rating).toBe(9);
    expect(replayedDrop.context_profile_context.reaction).toBe(":wave:");
    expect(replayedDrop.reactions).toEqual([
      reactionEntry(":wave:", [
        profile("profile-1", "server-current-user"),
        profile("profile-2", "fresh-wave"),
      ]),
    ]);
  });

  it("ignores older overlapping fetched reaction updates that finish last", async () => {
    const firstFetch = deferred<any>();
    const secondFetch = deferred<any>();
    const store: any = {
      wave1: {
        drops: [
          {
            id: "d-overlap-reaction",
            type: DropSize.FULL,
            stableKey: "overlap-stable-key",
            stableHash: "overlap-stable-hash",
            author: {},
            wave: { id: "wave1" },
            context_profile_context: contextProfileContext(":local:"),
            reactions: reactionEntries(":local:"),
          },
        ],
        isLoading: false,
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    fetchDropByIdBatched
      .mockImplementationOnce(() => firstFetch.promise)
      .mockImplementationOnce(() => secondFetch.promise);

    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "d-overlap-reaction",
      wave: { id: "wave1" },
      author: {},
    };

    act(() => {
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      );
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      );
    });

    expect(fetchDropByIdBatched).toHaveBeenCalledTimes(2);

    await act(async () => {
      secondFetch.resolve({
        id: "d-overlap-reaction",
        author: {},
        wave: { id: "wave1" },
        context_profile_context: contextProfileContext(":second:"),
        reactions: reactionEntries(":second:"),
      });
      await flushPromises();
    });

    expect(props.updateData).toHaveBeenCalledTimes(1);
    expect(mockSetQueriesData).toHaveBeenCalledTimes(5);

    await act(async () => {
      firstFetch.resolve({
        id: "d-overlap-reaction",
        author: {},
        wave: { id: "wave1" },
        context_profile_context: contextProfileContext(":first:"),
        reactions: reactionEntries(":first:"),
      });
      await flushPromises();
    });

    expect(props.updateData).toHaveBeenCalledTimes(1);
    expect(mockSetQueriesData).toHaveBeenCalledTimes(5);

    const update = props.updateData.mock.calls[0]?.[0];
    const updatedDrop = update.drops[0];
    expect(updatedDrop.stableKey).toBe("overlap-stable-key");
    expect(updatedDrop.stableHash).toBe("overlap-stable-hash");
    expect(updatedDrop.context_profile_context.reaction).toBe(":second:");
    expect(updatedDrop.reactions).toEqual(reactionEntries(":second:"));
  });

  it("updates React Query caches for rating updates without promoting light wave-store drops", async () => {
    const store: any = {
      wave1: {
        drops: [
          {
            id: "d-light-rating",
            type: DropSize.LIGHT,
            stableKey: "light-key",
            stableHash: "light-hash",
            waveId: "wave1",
          },
        ],
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    fetchDropByIdBatched.mockResolvedValue({
      id: "d-light-rating",
      author: {},
      wave: { id: "wave1" },
      context_profile_context: {
        ...contextProfileContext(null),
        rating: 7,
      },
      reactions: [],
    });

    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "d-light-rating",
      wave: { id: "wave1" },
      author: {},
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_RATING_UPDATE
      )
    );
    await flushPromises();

    expect(fetchDropByIdBatched).toHaveBeenCalledWith("d-light-rating");
    expect(props.updateData).not.toHaveBeenCalled();
    expect(mockSetQueriesData).toHaveBeenCalled();

    for (const [, updateCachedData] of mockSetQueriesData.mock.calls) {
      const updatedCacheDrop = updateCachedData({
        id: "d-light-rating",
        type: DropSize.LIGHT,
        stableKey: "cached-light-key",
        stableHash: "cached-light-hash",
        context_profile_context: contextProfileContext(null),
        reactions: [],
      });
      expect(updatedCacheDrop.type).toBe(DropSize.LIGHT);
      expect(updatedCacheDrop.context_profile_context.rating).toBe(7);
    }
  });

  it("preserves protected reactions when a rating refetch returns stale reaction data", async () => {
    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    beginReactionMutation({
      dropId: "d-rating-stale-reaction",
      waveId: "wave1",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    const currentUser = profile("profile-1", "current-user");
    const store: any = {
      wave1: {
        drops: [
          {
            id: "d-rating-stale-reaction",
            type: DropSize.FULL,
            stableKey: "stable-key",
            stableHash: "stable-hash",
            title: "local-title",
            rating: 1,
            realtime_rating: 2,
            rating_prediction: 3,
            author: {},
            wave: { id: "wave1" },
            context_profile_context: {
              ...contextProfileContext(":joy:"),
              rating: 4,
            },
            reactions: [reactionEntry(":joy:", [currentUser])],
          },
        ],
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    fetchDropByIdBatched.mockResolvedValue({
      id: "d-rating-stale-reaction",
      title: "server-title",
      rating: 42,
      realtime_rating: 43,
      rating_prediction: 44,
      author: {},
      wave: { id: "wave1" },
      context_profile_context: {
        ...contextProfileContext(":wave:"),
        rating: 7,
      },
      reactions: [
        reactionEntry(":wave:", [
          profile("profile-1", "server-current-user"),
          profile("profile-2", "fresh-wave"),
        ]),
        reactionEntry(":fire:", [profile("profile-3", "fresh-fire")]),
      ],
    });

    dateNowSpy.mockReturnValue(2_000);
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "d-rating-stale-reaction",
      wave: { id: "wave1" },
      author: {},
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_RATING_UPDATE
      )
    );
    await flushPromises();

    const lastUpdate =
      props.updateData.mock.calls[props.updateData.mock.calls.length - 1]?.[0];
    const updatedDrop = lastUpdate.drops[0];
    expect(updatedDrop.title).toBe("server-title");
    expect(updatedDrop.rating).toBe(42);
    expect(updatedDrop.realtime_rating).toBe(43);
    expect(updatedDrop.rating_prediction).toBe(44);
    expect(updatedDrop.context_profile_context.rating).toBe(7);
    expect(updatedDrop.context_profile_context.reaction).toBe(":joy:");
    expect(updatedDrop.reactions).toEqual([
      reactionEntry(":wave:", [profile("profile-2", "fresh-wave")]),
      reactionEntry(":fire:", [profile("profile-3", "fresh-fire")]),
      reactionEntry(":joy:", [currentUser]),
    ]);
  });

  it("preserves protected cache-only reactions when server fetch is stale", async () => {
    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    beginReactionMutation({
      dropId: "d-cache-only-stale",
      waveId: "wave1",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    const currentUser = profile("profile-1", "current-user");
    mockGetQueriesData.mockReturnValue([
      [
        ["DROPS"],
        {
          pages: [
            [
              {
                id: "d-cache-only-stale",
                context_profile_context: contextProfileContext(":joy:"),
                reactions: [reactionEntry(":joy:", [currentUser])],
              },
            ],
          ],
        },
      ],
    ]);

    const store: any = {
      wave1: {
        drops: [],
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    fetchDropByIdBatched.mockResolvedValue({
      id: "d-cache-only-stale",
      author: {},
      wave: { id: "wave1" },
      context_profile_context: contextProfileContext(":wave:"),
      reactions: [
        reactionEntry(":wave:", [
          profile("profile-1", "server-current-user"),
          profile("profile-2", "fresh-wave"),
        ]),
      ],
    });

    dateNowSpy.mockReturnValue(2_000);
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "d-cache-only-stale",
      wave: { id: "wave1" },
      author: {},
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      )
    );
    await flushPromises();

    expect(props.updateData).not.toHaveBeenCalled();
    expect(mockSetQueriesData).toHaveBeenCalled();

    for (const [, updateCachedData] of mockSetQueriesData.mock.calls) {
      const updatedCacheDrop = updateCachedData({
        id: "d-cache-only-stale",
        context_profile_context: contextProfileContext(":wave:"),
        reactions: [],
      });
      expect(updatedCacheDrop.context_profile_context.reaction).toBe(":joy:");
      expect(updatedCacheDrop.reactions).toEqual([
        reactionEntry(":wave:", [profile("profile-2", "fresh-wave")]),
        reactionEntry(":joy:", [currentUser]),
      ]);
    }
  });

  it("preserves protected cache-only reactions during rating refetches", async () => {
    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    beginReactionMutation({
      dropId: "d-cache-only-rating-stale",
      waveId: "wave1",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    const currentUser = profile("profile-1", "current-user");
    mockGetQueriesData.mockReturnValue([
      [
        ["DROPS"],
        {
          pages: [
            [
              {
                id: "d-cache-only-rating-stale",
                rating: 1,
                realtime_rating: 2,
                rating_prediction: 3,
                context_profile_context: {
                  ...contextProfileContext(":joy:"),
                  rating: 4,
                },
                reactions: [reactionEntry(":joy:", [currentUser])],
              },
            ],
          ],
        },
      ],
    ]);

    const store: any = {
      wave1: {
        drops: [],
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    fetchDropByIdBatched.mockResolvedValue({
      id: "d-cache-only-rating-stale",
      rating: 42,
      realtime_rating: 43,
      rating_prediction: 44,
      author: {},
      wave: { id: "wave1" },
      context_profile_context: {
        ...contextProfileContext(":wave:"),
        rating: 7,
      },
      reactions: [
        reactionEntry(":wave:", [
          profile("profile-1", "server-current-user"),
          profile("profile-2", "fresh-wave"),
        ]),
      ],
    });

    dateNowSpy.mockReturnValue(2_000);
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "d-cache-only-rating-stale",
      wave: { id: "wave1" },
      author: {},
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_RATING_UPDATE
      )
    );
    await flushPromises();

    expect(props.updateData).not.toHaveBeenCalled();
    expect(mockSetQueriesData).toHaveBeenCalled();

    for (const [, updateCachedData] of mockSetQueriesData.mock.calls) {
      const updatedCacheDrop = updateCachedData({
        id: "d-cache-only-rating-stale",
        rating: 1,
        realtime_rating: 2,
        rating_prediction: 3,
        context_profile_context: contextProfileContext(":wave:"),
        reactions: [],
      });
      expect(updatedCacheDrop.rating).toBe(42);
      expect(updatedCacheDrop.realtime_rating).toBe(43);
      expect(updatedCacheDrop.rating_prediction).toBe(44);
      expect(updatedCacheDrop.context_profile_context.rating).toBe(7);
      expect(updatedCacheDrop.context_profile_context.reaction).toBe(":joy:");
      expect(updatedCacheDrop.reactions).toEqual([
        reactionEntry(":wave:", [profile("profile-2", "fresh-wave")]),
        reactionEntry(":joy:", [currentUser]),
      ]);
    }
  });

  it("removes only the protected user when local remove sees stale server reaction", async () => {
    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    beginReactionMutation({
      dropId: "d-stale-remove",
      waveId: "wave1",
      source: "quick-react",
      action: "remove",
      previousReaction: ":joy:",
      intendedReaction: null,
      optimisticReaction: null,
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    const serverReactions = [
      reactionEntry(":joy:", [
        profile("profile-1", "current-user"),
        profile("profile-2", "fresh-joy"),
      ]),
      reactionEntry(":wave:", [profile("profile-3", "fresh-wave")]),
    ];
    const store: any = {
      wave1: {
        drops: [
          {
            id: "d-stale-remove",
            type: DropSize.FULL,
            stableKey: "stable-key",
            stableHash: "stable-hash",
            title: "local-title",
            author: {},
            wave: { id: "wave1" },
            context_profile_context: contextProfileContext(null),
            reactions: [],
          },
        ],
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    fetchDropByIdBatched.mockResolvedValue({
      id: "d-stale-remove",
      title: "server-title",
      author: {},
      wave: { id: "wave1" },
      context_profile_context: contextProfileContext(":joy:"),
      reactions: serverReactions,
    });

    dateNowSpy.mockReturnValue(2_000);
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "d-stale-remove",
      wave: { id: "wave1" },
      author: {},
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      )
    );
    await flushPromises();

    const lastUpdate =
      props.updateData.mock.calls[props.updateData.mock.calls.length - 1]?.[0];
    const updatedDrop = lastUpdate.drops[0];
    expect(updatedDrop.title).toBe("server-title");
    expect(updatedDrop.context_profile_context.reaction).toBeNull();
    expect(updatedDrop.reactions).toEqual([
      reactionEntry(":joy:", [profile("profile-2", "fresh-joy")]),
      reactionEntry(":wave:", [profile("profile-3", "fresh-wave")]),
    ]);
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.realtime_stale_ignored",
      })
    );
  });

  it("merges protected optimistic reaction with fresh server reactions", async () => {
    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    beginReactionMutation({
      dropId: "d-stale-add",
      waveId: "wave1",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    const currentUser = profile("profile-1", "current-user");
    const localReactions = [reactionEntry(":joy:", [currentUser])];
    const serverReactions = [
      reactionEntry(":wave:", [
        profile("profile-1", "server-current-user"),
        profile("profile-2", "fresh-wave"),
      ]),
      reactionEntry(":joy:", [profile("profile-3", "fresh-joy")]),
      reactionEntry(":fire:", [profile("profile-4", "fresh-fire")]),
    ];
    const store = {
      wave1: {
        drops: [
          {
            id: "d-stale-add",
            type: DropSize.FULL,
            stableKey: "stable-key",
            stableHash: "stable-hash",
            author: {},
            wave: { id: "wave1" },
            context_profile_context: contextProfileContext(":joy:"),
            reactions: localReactions,
          },
        ],
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    fetchDropByIdBatched.mockResolvedValue({
      id: "d-stale-add",
      author: {},
      wave: { id: "wave1" },
      context_profile_context: contextProfileContext(":wave:"),
      reactions: serverReactions,
    });

    dateNowSpy.mockReturnValue(2_000);
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "d-stale-add",
      wave: { id: "wave1" },
      author: {},
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      )
    );
    await flushPromises();

    const lastUpdate =
      props.updateData.mock.calls[props.updateData.mock.calls.length - 1]?.[0];
    const updatedDrop = lastUpdate.drops[0];
    expect(updatedDrop.context_profile_context.reaction).toBe(":joy:");
    expect(updatedDrop.reactions).toEqual([
      reactionEntry(":wave:", [profile("profile-2", "fresh-wave")]),
      reactionEntry(":joy:", [profile("profile-3", "fresh-joy"), currentUser]),
      reactionEntry(":fire:", [profile("profile-4", "fresh-fire")]),
    ]);
  });

  it("updates React Query caches with reconciled protected reactions", async () => {
    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    beginReactionMutation({
      dropId: "d-cache-stale",
      waveId: "wave1",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    const currentUser = profile("profile-1", "current-user");
    const store = {
      wave1: {
        drops: [
          {
            id: "d-cache-stale",
            type: DropSize.FULL,
            stableKey: "stable-key",
            stableHash: "stable-hash",
            author: {},
            wave: { id: "wave1" },
            context_profile_context: contextProfileContext(":joy:"),
            reactions: [reactionEntry(":joy:", [currentUser])],
          },
        ],
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    fetchDropByIdBatched.mockResolvedValue({
      id: "d-cache-stale",
      author: {},
      wave: { id: "wave1" },
      context_profile_context: contextProfileContext(":wave:"),
      reactions: [
        reactionEntry(":wave:", [
          profile("profile-1", "server-current-user"),
          profile("profile-2", "fresh-wave"),
        ]),
      ],
    });

    dateNowSpy.mockReturnValue(2_000);
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "d-cache-stale",
      wave: { id: "wave1" },
      author: {},
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      )
    );
    await flushPromises();

    expect(mockSetQueriesData).toHaveBeenCalled();

    const cachedDrop = {
      id: "d-cache-stale",
      type: DropSize.FULL,
      stableKey: "cached-stable-key",
      stableHash: "cached-stable-hash",
      context_profile_context: contextProfileContext(":wave:"),
      reactions: [],
    };

    for (const [, updateCachedData] of mockSetQueriesData.mock.calls) {
      const updatedCacheDrop = updateCachedData(cachedDrop);
      expect(updatedCacheDrop.context_profile_context.reaction).toBe(":joy:");
      expect(updatedCacheDrop.reactions).toEqual([
        reactionEntry(":wave:", [profile("profile-2", "fresh-wave")]),
        reactionEntry(":joy:", [currentUser]),
      ]);
    }
  });

  it("uses the newest local reaction when it changes while refetch is in flight", async () => {
    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    beginReactionMutation({
      dropId: "d-race-reaction",
      waveId: "wave1",
      source: "picker",
      action: "add",
      previousReaction: null,
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    const currentUser = profile("profile-1", "current-user");
    const store: any = {
      wave1: {
        drops: [
          {
            id: "d-race-reaction",
            type: DropSize.FULL,
            stableKey: "old-stable-key",
            stableHash: "old-stable-hash",
            author: {},
            wave: { id: "wave1" },
            context_profile_context: contextProfileContext(":joy:"),
            reactions: [reactionEntry(":joy:", [currentUser])],
          },
        ],
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    let resolveFetch: (drop: any) => void = () => undefined;
    fetchDropByIdBatched.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "d-race-reaction",
      wave: { id: "wave1" },
      author: {},
    };

    act(() => {
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      );
    });

    expect(fetchDropByIdBatched).toHaveBeenCalledWith("d-race-reaction");

    dateNowSpy.mockReturnValue(1_500);
    beginReactionMutation({
      dropId: "d-race-reaction",
      waveId: "wave1",
      source: "picker",
      action: "replace",
      previousReaction: ":joy:",
      intendedReaction: ":fire:",
      optimisticReaction: ":fire:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });
    store.wave1.drops = [
      {
        ...store.wave1.drops[0],
        stableKey: "new-stable-key",
        stableHash: "new-stable-hash",
        context_profile_context: contextProfileContext(":fire:"),
        reactions: [reactionEntry(":fire:", [currentUser])],
      },
    ];

    dateNowSpy.mockReturnValue(2_000);
    await act(async () => {
      resolveFetch({
        id: "d-race-reaction",
        author: {},
        wave: { id: "wave1" },
        context_profile_context: contextProfileContext(":joy:"),
        reactions: [
          reactionEntry(":joy:", [
            profile("profile-1", "server-current-user"),
            profile("profile-2", "fresh-joy"),
          ]),
          reactionEntry(":wave:", [profile("profile-3", "fresh-wave")]),
        ],
      });
      await flushPromises();
    });
    await waitFor(() => {
      expect(props.updateData).toHaveBeenCalled();
    });

    const lastUpdate =
      props.updateData.mock.calls[props.updateData.mock.calls.length - 1]?.[0];
    const updatedDrop = lastUpdate.drops[0];
    expect(updatedDrop.context_profile_context.reaction).toBe(":fire:");
    expect(updatedDrop.stableKey).toBe("new-stable-key");
    expect(updatedDrop.stableHash).toBe("new-stable-hash");
    expect(updatedDrop.reactions).toEqual([
      reactionEntry(":joy:", [profile("profile-2", "fresh-joy")]),
      reactionEntry(":wave:", [profile("profile-3", "fresh-wave")]),
      reactionEntry(":fire:", [currentUser]),
    ]);
  });

  it("updates normally when protected intent matches server reaction", async () => {
    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    beginReactionMutation({
      dropId: "d-matching-reaction",
      waveId: "wave1",
      source: "picker",
      action: "add",
      previousReaction: null,
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    const localReactions = reactionEntries(":wave:");
    const serverReactions = reactionEntries(":joy:");
    const store = {
      wave1: {
        drops: [
          {
            id: "d-matching-reaction",
            type: DropSize.FULL,
            stableKey: "stable-key",
            stableHash: "stable-hash",
            author: {},
            wave: { id: "wave1" },
            context_profile_context: contextProfileContext(":wave:"),
            reactions: localReactions,
          },
        ],
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    fetchDropByIdBatched.mockResolvedValue({
      id: "d-matching-reaction",
      author: {},
      wave: { id: "wave1" },
      context_profile_context: contextProfileContext(":joy:"),
      reactions: serverReactions,
    });

    dateNowSpy.mockReturnValue(2_000);
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "d-matching-reaction",
      wave: { id: "wave1" },
      author: {},
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      )
    );
    await flushPromises();

    const lastUpdate =
      props.updateData.mock.calls[props.updateData.mock.calls.length - 1]?.[0];
    const updatedDrop = lastUpdate.drops[0];
    expect(updatedDrop.context_profile_context.reaction).toBe(":joy:");
    expect(updatedDrop.reactions).toBe(serverReactions);
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.realtime_reconciled",
      })
    );
  });

  it("uses server reaction and can warn when mismatch is outside protection window", async () => {
    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    const mutation = beginReactionMutation({
      dropId: "d-expired-reaction",
      waveId: "wave1",
      source: "chip",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });
    dateNowSpy.mockReturnValue(1_100);
    recordReactionRequestSucceeded(mutation);

    const localReactions = reactionEntries(":joy:");
    const serverReactions = reactionEntries(":wave:");
    const store = {
      wave1: {
        drops: [
          {
            id: "d-expired-reaction",
            type: DropSize.FULL,
            stableKey: "stable-key",
            stableHash: "stable-hash",
            author: {},
            wave: { id: "wave1" },
            context_profile_context: contextProfileContext(":joy:"),
            reactions: localReactions,
          },
        ],
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    fetchDropByIdBatched.mockResolvedValue({
      id: "d-expired-reaction",
      author: {},
      wave: { id: "wave1" },
      context_profile_context: contextProfileContext(":wave:"),
      reactions: serverReactions,
    });

    dateNowSpy.mockReturnValue(6_101);
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "d-expired-reaction",
      wave: { id: "wave1" },
      author: {},
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      )
    );
    await flushPromises();

    const lastUpdate =
      props.updateData.mock.calls[props.updateData.mock.calls.length - 1]?.[0];
    const updatedDrop = lastUpdate.drops[0];
    expect(updatedDrop.context_profile_context.reaction).toBe(":wave:");
    expect(updatedDrop.reactions).toBe(serverReactions);
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "reaction.optimistic_reverted",
      })
    );
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Reaction optimistic state disagreed with canonical state",
      })
    );
  });

  it("does not process when wave is missing", async () => {
    const props = baseProps({});
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = { id: "d5" }; // wave missing
    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_INSERT
      )
    );
    expect(props.registerWave).not.toHaveBeenCalled();
  });

  it("registers wave when currentData is undefined", async () => {
    const props = baseProps({});
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = { id: "d6", wave: { id: "wave2" }, author: {} };
    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_INSERT
      )
    );
    expect(props.registerWave).toHaveBeenCalledWith("wave2");
    expect(fetchDropByIdBatched).not.toHaveBeenCalled();
    expect(mockSetQueriesData).toHaveBeenCalled();
  });

  it("registers unopened waves and refreshes cache-only reaction updates", async () => {
    const props = baseProps({});
    const serverContext = {
      ...contextProfileContext(":server:"),
      rating: 9,
    };
    const oldCacheContext = {
      ...contextProfileContext(":old-cache:"),
      rating: 1,
    };

    mockGetQueriesData.mockReturnValue([
      [
        ["DROPS"],
        {
          pages: [
            [
              {
                id: "d-cache-only-unopened",
                context_profile_context: oldCacheContext,
                reactions: reactionEntries(":old-cache:"),
              },
            ],
          ],
        },
      ],
    ]);
    fetchDropByIdBatched.mockResolvedValue({
      id: "d-cache-only-unopened",
      author: {},
      wave: { id: "wave2" },
      context_profile_context: serverContext,
      reactions: reactionEntries(":server:"),
    });

    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "d-cache-only-unopened",
      wave: { id: "wave2" },
      author: {},
      context_profile_context: contextProfileContext(":websocket:"),
      reactions: reactionEntries(":websocket:"),
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      )
    );
    await flushPromises();

    expect(props.registerWave).toHaveBeenCalledWith("wave2");
    expect(fetchDropByIdBatched).toHaveBeenCalledWith("d-cache-only-unopened");
    expect(props.updateData).not.toHaveBeenCalled();
    expect(mockSetQueriesData).toHaveBeenCalled();

    for (const [, updateCachedData] of mockSetQueriesData.mock.calls) {
      const updatedCacheDrop = updateCachedData({
        id: "d-cache-only-unopened",
        context_profile_context: oldCacheContext,
        reactions: reactionEntries(":old-cache:"),
      });

      expect(updatedCacheDrop.context_profile_context.rating).toBe(9);
      expect(updatedCacheDrop.context_profile_context.reaction).toBe(
        ":server:"
      );
      expect(updatedCacheDrop.reactions).toEqual(reactionEntries(":server:"));
    }
  });

  it("registers unopened waves but skips reaction refetches without a local or cached drop", async () => {
    const props = baseProps({});
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "d-unopened-missing-local-and-cache",
      wave: { id: "wave2" },
      author: {},
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      )
    );
    await flushPromises();

    expect(props.registerWave).toHaveBeenCalledWith("wave2");
    expect(fetchDropByIdBatched).not.toHaveBeenCalled();
    expect(props.updateData).not.toHaveBeenCalled();
    expect(mockSetQueriesData).not.toHaveBeenCalled();
  });

  it("preserves protected cached reactions when registering an unopened wave adds stale data", async () => {
    const dropId = "d-unopened-protected-stale";
    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    beginReactionMutation({
      dropId,
      waveId: "wave2",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });

    const currentUser = profile("profile-1", "current-user");
    mockGetQueriesData.mockReturnValue([
      [
        ["DROPS"],
        {
          pages: [
            [
              {
                id: dropId,
                context_profile_context: contextProfileContext(":joy:"),
                reactions: [reactionEntry(":joy:", [currentUser])],
              },
            ],
          ],
        },
      ],
    ]);

    const store: any = {};
    const props = baseProps(store);
    props.registerWave = jest.fn((waveId: string) => {
      store[waveId] = {
        drops: [
          {
            id: dropId,
            type: DropSize.FULL,
            stableKey: "registered-stable-key",
            stableHash: "registered-stable-hash",
            author: {},
            wave: { id: waveId },
            context_profile_context: contextProfileContext(":wave:"),
            reactions: [
              reactionEntry(":wave:", [
                profile("profile-1", "server-current-user"),
                profile("profile-2", "registered-wave"),
              ]),
            ],
          },
        ],
        latestFetchedSerialNo: 20,
      };
    });
    fetchDropByIdBatched.mockResolvedValue({
      id: dropId,
      author: {},
      wave: { id: "wave2" },
      context_profile_context: contextProfileContext(":wave:"),
      reactions: [
        reactionEntry(":wave:", [
          profile("profile-1", "server-current-user"),
          profile("profile-2", "fresh-wave"),
        ]),
      ],
    });

    dateNowSpy.mockReturnValue(2_000);
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: dropId,
      wave: { id: "wave2" },
      author: {},
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      )
    );
    await flushPromises();

    expect(props.registerWave).toHaveBeenCalledWith("wave2");
    expect(fetchDropByIdBatched).toHaveBeenCalledWith(dropId);
    expect(mockSetQueriesData).toHaveBeenCalled();

    for (const [, updateCachedData] of mockSetQueriesData.mock.calls) {
      const updatedCacheDrop = updateCachedData({
        id: dropId,
        context_profile_context: contextProfileContext(":joy:"),
        reactions: [reactionEntry(":joy:", [currentUser])],
      });

      expect(updatedCacheDrop.context_profile_context.reaction).toBe(":joy:");
      expect(updatedCacheDrop.reactions).toEqual([
        reactionEntry(":wave:", [profile("profile-2", "fresh-wave")]),
        reactionEntry(":joy:", [currentUser]),
      ]);
    }
  });

  it("uses the newest cache reaction for unopened waves when fetch returns stale data", async () => {
    const dropId = "d-unopened-cache-race";
    const currentUser = profile("profile-1", "current-user");
    const store: any = {};
    let cachedDrop: any = null;
    let resolveFetch: (drop: any) => void = () => undefined;

    mockGetQueriesData.mockImplementation(() =>
      cachedDrop === null
        ? []
        : [
            [
              ["DROPS"],
              {
                pages: [[cachedDrop]],
              },
            ],
          ]
    );
    fetchDropByIdBatched.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    const props = baseProps(store);
    props.registerWave = jest.fn((waveId: string) => {
      store[waveId] = {
        drops: [
          {
            id: dropId,
            type: DropSize.FULL,
            stableKey: "registered-stable-key",
            stableHash: "registered-stable-hash",
            author: {},
            wave: { id: waveId },
            context_profile_context: contextProfileContext(":wave:"),
            reactions: [
              reactionEntry(":wave:", [
                profile("profile-1", "server-current-user"),
                profile("profile-2", "registered-wave"),
              ]),
            ],
          },
        ],
        latestFetchedSerialNo: 20,
      };
    });

    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: dropId,
      wave: { id: "wave2" },
      author: {},
    };

    act(() => {
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      );
    });

    expect(fetchDropByIdBatched).toHaveBeenCalledWith(dropId);

    dateNowSpy.mockReturnValue(1_500);
    beginReactionMutation({
      dropId,
      waveId: "wave2",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });
    cachedDrop = {
      id: dropId,
      context_profile_context: contextProfileContext(":joy:"),
      reactions: [reactionEntry(":joy:", [currentUser])],
    };

    dateNowSpy.mockReturnValue(2_000);
    await act(async () => {
      resolveFetch({
        id: dropId,
        author: {},
        wave: { id: "wave2" },
        context_profile_context: contextProfileContext(":wave:"),
        reactions: [
          reactionEntry(":wave:", [
            profile("profile-1", "server-current-user"),
            profile("profile-2", "fresh-wave"),
          ]),
        ],
      });
      await flushPromises();
    });

    await waitFor(() => {
      expect(mockSetQueriesData).toHaveBeenCalled();
    });

    for (const [, updateCachedData] of mockSetQueriesData.mock.calls) {
      const updatedCacheDrop = updateCachedData(cachedDrop);

      expect(updatedCacheDrop.context_profile_context.reaction).toBe(":joy:");
      expect(updatedCacheDrop.reactions).toEqual([
        reactionEntry(":wave:", [profile("profile-2", "fresh-wave")]),
        reactionEntry(":joy:", [currentUser]),
      ]);
    }
  });

  it("uses the protected wave-store reaction for unopened waves when cache is stale", async () => {
    const dropId = "d-unopened-wave-store-protected";
    const currentUser = profile("profile-1", "wave-store-user");
    const staleCacheUser = profile("profile-1", "old-cache-user");
    const store: any = {};
    let resolveFetch: (drop: any) => void = () => undefined;

    mockGetQueriesData.mockReturnValue([
      [
        ["DROPS"],
        {
          pages: [
            [
              {
                id: dropId,
                context_profile_context: contextProfileContext(":wave:"),
                reactions: [reactionEntry(":wave:", [staleCacheUser])],
              },
            ],
          ],
        },
      ],
    ]);
    fetchDropByIdBatched.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    const props = baseProps(store);
    props.registerWave = jest.fn((waveId: string) => {
      store[waveId] = {
        drops: [
          {
            id: dropId,
            type: DropSize.FULL,
            stableKey: "registered-stable-key",
            stableHash: "registered-stable-hash",
            author: {},
            wave: { id: waveId },
            context_profile_context: contextProfileContext(":wave:"),
            reactions: [reactionEntry(":wave:", [staleCacheUser])],
          },
        ],
        latestFetchedSerialNo: 20,
      };
    });

    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(1_000);
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: dropId,
      wave: { id: "wave2" },
      author: {},
    };

    act(() => {
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      );
    });

    expect(fetchDropByIdBatched).toHaveBeenCalledWith(dropId);

    dateNowSpy.mockReturnValue(1_500);
    beginReactionMutation({
      dropId,
      waveId: "wave2",
      source: "picker",
      action: "replace",
      previousReaction: ":wave:",
      intendedReaction: ":joy:",
      optimisticReaction: ":joy:",
      profileId: "profile-1",
      websocketStatus: WebSocketStatus.CONNECTED,
    });
    store.wave2.drops = [
      {
        ...store.wave2.drops[0],
        context_profile_context: contextProfileContext(":joy:"),
        reactions: [reactionEntry(":joy:", [currentUser])],
      },
    ];

    dateNowSpy.mockReturnValue(2_000);
    await act(async () => {
      resolveFetch({
        id: dropId,
        author: {},
        wave: { id: "wave2" },
        context_profile_context: contextProfileContext(":wave:"),
        reactions: [
          reactionEntry(":wave:", [
            profile("profile-1", "server-current-user"),
            profile("profile-2", "fresh-wave"),
          ]),
        ],
      });
      await flushPromises();
    });

    await waitFor(() => {
      expect(props.updateData).toHaveBeenCalled();
    });

    const lastUpdate =
      props.updateData.mock.calls[props.updateData.mock.calls.length - 1]?.[0];
    const updatedDrop = lastUpdate.drops[0];
    expect(updatedDrop.context_profile_context.reaction).toBe(":joy:");
    expect(updatedDrop.reactions).toEqual([
      reactionEntry(":wave:", [profile("profile-2", "fresh-wave")]),
      reactionEntry(":joy:", [currentUser]),
    ]);
  });

  it("skips when existing drop is LIGHT type", async () => {
    const store = {
      wave1: {
        drops: [{ id: "d7", type: DropSize.LIGHT }],
        latestFetchedSerialNo: 10,
      },
    };
    const props = baseProps(store);
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = { id: "d7", wave: { id: "wave1" }, author: {} };
    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_INSERT
      )
    );
    expect(props.updateData).not.toHaveBeenCalled();
  });

  it("removes drop when processDropRemoved is called", async () => {
    const props = baseProps({});
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    await act(async () => result.current.processDropRemoved("wave1", "d8"));
    expect(props.removeDrop).toHaveBeenCalledWith("wave1", "d8");
  });

  it("marks active wave as read and removes delivered notifications", async () => {
    const store = {
      wave1: { drops: [], latestFetchedSerialNo: 10 },
    };
    const props = baseProps(store);
    props.activeWaveId = "wave1";
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = { id: "d9", wave: { id: "wave1" }, author: {} };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_INSERT
      )
    );
    await flushPromises();

    expect(props.removeWaveDeliveredNotifications).toHaveBeenCalledWith(
      "wave1"
    );
    expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave1/read",
    });
  });

  it("does not call the read endpoint for an active hidden wave", async () => {
    setDocumentVisibility("hidden");
    const store = {
      wave1: { drops: [], latestFetchedSerialNo: 10 },
    };
    const props = baseProps(store);
    props.activeWaveId = "wave1";
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = { id: "d9-hidden", wave: { id: "wave1" }, author: {} };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_INSERT
      )
    );
    await flushPromises();

    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();
    expect(props.removeWaveDeliveredNotifications).not.toHaveBeenCalled();
  });

  it("does not mark non-active wave as read", async () => {
    const store = {
      wave1: { drops: [], latestFetchedSerialNo: 10 },
    };
    const props = baseProps(store);
    props.activeWaveId = "wave2";
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = { id: "d10", wave: { id: "wave1" }, author: {} };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_INSERT
      )
    );
    await flushPromises();

    expect(props.removeWaveDeliveredNotifications).not.toHaveBeenCalled();
    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();
  });

  it("handles attachment updates when a full drop part has no attachments", () => {
    const oldAttachment = {
      attachment_id: "attachment-1",
      file_name: "old.png",
      mime_type: "image/png",
      kind: "image",
      status: "PENDING",
    };
    const updatedAttachment = {
      ...oldAttachment,
      file_name: "new.png",
      status: "READY",
    };
    const otherAttachment = {
      attachment_id: "attachment-2",
      file_name: "other.png",
      mime_type: "image/png",
      kind: "image",
      status: "PENDING",
    };
    const partWithoutAttachments = {
      part_id: "part-without-attachments",
      content: "no attachment data yet",
    };
    const store: any = {
      wave1: {
        drops: [
          {
            id: "d-attachment-update",
            type: DropSize.FULL,
            stableKey: "stable-key",
            stableHash: "stable-hash",
            author: {},
            wave: { id: "wave1" },
            parts: [
              partWithoutAttachments,
              {
                part_id: "part-with-attachments",
                content: "has attachment data",
                attachments: [oldAttachment, otherAttachment],
              },
            ],
          },
        ],
        latestFetchedSerialNo: 10,
      },
    };
    const props = baseProps(store);
    props.activeWaveId = "wave1";

    renderHook(() => useWaveRealtimeUpdater(props));

    const handler = mockWebSocketHandlers.get(
      WsMessageType.ATTACHMENT_STATUS_UPDATE
    );
    expect(handler).toEqual(expect.any(Function));

    expect(() => {
      act(() => {
        handler!(updatedAttachment);
      });
    }).not.toThrow();

    const lastUpdate =
      props.updateData.mock.calls[props.updateData.mock.calls.length - 1]?.[0];
    const updatedDrop = lastUpdate.drops[0];
    expect(updatedDrop.parts[0]).not.toHaveProperty("attachments");
    expect(updatedDrop.parts[1].attachments).toEqual([
      updatedAttachment,
      otherAttachment,
    ]);
  });

  it.each<[string, ProcessIncomingDropType]>([
    ["reaction", ProcessIncomingDropType.DROP_REACTION_UPDATE],
    ["rating", ProcessIncomingDropType.DROP_RATING_UPDATE],
  ])(
    "skips muted %s updates when the drop exists only in the wave store",
    async (_label, type) => {
      const store: any = {
        wave1: {
          drops: [
            {
              id: "d-muted-wave-only",
              type: DropSize.FULL,
              stableKey: "muted-wave-only-stable-key",
              stableHash: "muted-wave-only-stable-hash",
              author: {},
              wave: { id: "wave1" },
              context_profile_context: contextProfileContext(":local:"),
              reactions: reactionEntries(":local:"),
            },
          ],
          isLoading: false,
          latestFetchedSerialNo: 10,
        },
      };
      const props = baseProps(store);
      props.activeWaveId = "wave1";
      props.isWaveMuted = jest.fn().mockReturnValue(true);

      const { result } = renderHook(() => useWaveRealtimeUpdater(props));
      const drop: any = {
        id: "d-muted-wave-only",
        wave: { id: "wave1" },
        author: {},
      };

      await act(async () => result.current.processIncomingDrop(drop, type));
      await flushPromises();

      expect(props.isWaveMuted).toHaveBeenCalledWith("wave1");
      expect(fetchDropByIdBatched).not.toHaveBeenCalled();
      expect(mockSetQueriesData).not.toHaveBeenCalled();
      expectNoMutedWaveSideEffects(props);
    }
  );

  it("updates React Query caches for muted reaction updates without wave work", async () => {
    const oldCacheContext = contextProfileContext(":old-cache:");
    const store: any = {
      wave1: {
        drops: [
          {
            id: "d-muted-cache-reaction",
            type: DropSize.FULL,
            stableKey: "muted-reaction-stable-key",
            stableHash: "muted-reaction-stable-hash",
            author: {},
            wave: { id: "wave1" },
            context_profile_context: oldCacheContext,
            reactions: reactionEntries(":old-cache:"),
          },
        ],
        latestFetchedSerialNo: 10,
      },
    };
    const props = baseProps(store);
    props.activeWaveId = "wave1";
    props.isWaveMuted = jest.fn().mockReturnValue(true);

    const serverReactions = reactionEntries(":server:");
    mockGetQueriesData.mockReturnValue([
      [
        ["DROPS"],
        {
          pages: [
            [
              {
                id: "d-muted-cache-reaction",
                context_profile_context: oldCacheContext,
                reactions: reactionEntries(":old-cache:"),
              },
            ],
          ],
        },
      ],
    ]);
    fetchDropByIdBatched.mockResolvedValue({
      id: "d-muted-cache-reaction",
      author: {},
      wave: { id: "wave1" },
      context_profile_context: contextProfileContext(":server:"),
      reactions: serverReactions,
    });

    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "d-muted-cache-reaction",
      wave: { id: "wave1" },
      author: {},
      context_profile_context: contextProfileContext(":websocket:"),
      reactions: reactionEntries(":websocket:"),
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      )
    );
    await flushPromises();

    expect(props.isWaveMuted).toHaveBeenCalledWith("wave1");
    expect(fetchDropByIdBatched).toHaveBeenCalledWith("d-muted-cache-reaction");
    expectCachedDropUpdate(
      {
        id: "d-muted-cache-reaction",
        context_profile_context: oldCacheContext,
        reactions: reactionEntries(":old-cache:"),
      },
      (updatedCacheDrop) => {
        expect(updatedCacheDrop.context_profile_context.reaction).toBe(
          ":server:"
        );
        expect(updatedCacheDrop.reactions).toEqual(serverReactions);
      }
    );
    expectNoMutedWaveSideEffects(props);
  });

  it("updates React Query caches for muted rating updates without wave work", async () => {
    const oldCacheContext = {
      ...contextProfileContext(null),
      rating: 1,
    };
    const serverContext = {
      ...contextProfileContext(null),
      rating: 7,
    };
    const store: any = {
      wave1: {
        drops: [
          {
            id: "d-muted-cache-rating",
            type: DropSize.FULL,
            stableKey: "muted-rating-stable-key",
            stableHash: "muted-rating-stable-hash",
            author: {},
            wave: { id: "wave1" },
            context_profile_context: oldCacheContext,
            reactions: [],
          },
        ],
        latestFetchedSerialNo: 10,
      },
    };
    const props = baseProps(store);
    props.activeWaveId = "wave1";
    props.isWaveMuted = jest.fn().mockReturnValue(true);

    mockGetQueriesData.mockReturnValue([
      [
        ["DROPS"],
        {
          pages: [
            [
              {
                id: "d-muted-cache-rating",
                context_profile_context: oldCacheContext,
                reactions: [],
              },
            ],
          ],
        },
      ],
    ]);
    fetchDropByIdBatched.mockResolvedValue({
      id: "d-muted-cache-rating",
      author: {},
      wave: { id: "wave1" },
      context_profile_context: serverContext,
      reactions: [],
    });

    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "d-muted-cache-rating",
      wave: { id: "wave1" },
      author: {},
      context_profile_context: {
        ...contextProfileContext(null),
        rating: 2,
      },
      reactions: [],
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_RATING_UPDATE
      )
    );
    await flushPromises();

    expect(props.isWaveMuted).toHaveBeenCalledWith("wave1");
    expect(fetchDropByIdBatched).toHaveBeenCalledWith("d-muted-cache-rating");
    expectCachedDropUpdate(
      {
        id: "d-muted-cache-rating",
        context_profile_context: oldCacheContext,
        reactions: [],
      },
      (updatedCacheDrop) => {
        expect(updatedCacheDrop.context_profile_context.rating).toBe(7);
      }
    );
    expectNoMutedWaveSideEffects(props);
  });

  it("skips processing when wave is muted", async () => {
    const store = {
      wave1: { drops: [], latestFetchedSerialNo: 10 },
    };
    const props = baseProps(store);
    props.isWaveMuted = jest.fn().mockReturnValue(true);
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = { id: "d11", wave: { id: "wave1" }, author: {} };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_INSERT
      )
    );
    await flushPromises();

    expect(props.isWaveMuted).toHaveBeenCalledWith("wave1");
    expect(mockSetQueriesData).toHaveBeenCalled();
    expect(props.updateData).not.toHaveBeenCalled();
    expect(props.registerWave).not.toHaveBeenCalled();
    expect(props.syncNewestMessages).not.toHaveBeenCalled();
  });
});
