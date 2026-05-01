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
  recordReactionRequestSucceeded,
} from "@/utils/monitoring/dropReactionMonitoring";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";

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

jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: () => ({ isConnected: true }),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiPostWithoutBodyAndResponse: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/services/api/drop-api", () => ({
  fetchDropByIdBatched: jest.fn(),
}));

const {
  commonApiPostWithoutBodyAndResponse,
} = require("@/services/api/common-api");
const { fetchDropByIdBatched } = require("@/services/api/drop-api");

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("useWaveRealtimeUpdater", () => {
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

  it("skips fetched update when the latest cached drop is missing", async () => {
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

  it("skips fetched update when the latest cached drop is no longer full", async () => {
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
    expect(props.updateData).not.toHaveBeenCalled();
    expect(props.registerWave).not.toHaveBeenCalled();
    expect(props.syncNewestMessages).not.toHaveBeenCalled();
  });
});
