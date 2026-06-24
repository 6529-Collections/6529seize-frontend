import { renderHook, act } from "@testing-library/react";
import {
  useWaveRealtimeUpdater,
  ProcessIncomingDropType,
} from "@/contexts/wave/hooks/useWaveRealtimeUpdater";
import { DropSize } from "@/helpers/waves/drop.helpers";

const mockSetQueriesData = jest.fn();
const mockSetQueryData = jest.fn();
const mockCancelQueries = jest.fn().mockResolvedValue(undefined);
const mockFindAll = jest.fn(() => []);

jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: () => ({ isConnected: true }),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ activeProfileProxy: null }),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ address: "0xAAA" }),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiPostWithoutBodyAndResponse: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: jest.fn(() => "test-jwt"),
}));

jest.mock("jwt-decode", () => ({
  jwtDecode: (token: string) => {
    if (token !== "test-jwt") {
      throw new Error(`Unexpected JWT decode for ${token}`);
    }

    return { sub: "0xAAA", role: null, exp: 4102444800 };
  },
}));

jest.mock("@/services/api/drop-api", () => ({
  fetchDropByIdBatched: jest.fn(),
}));

jest.mock("@/utils/monitoring/dropReactionMonitoring", () => ({
  recordReactionRealtimeReconciliation: jest.fn(() => ({
    shouldApplyCanonicalDrop: true,
    expectedReaction: null,
    serverReaction: null,
  })),
}));

jest.mock("@/contexts/wave/drop-visibility", () => ({
  isWaveDropNearViewport: jest.fn(() => true),
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: jest.fn(() => ({
    cancelQueries: mockCancelQueries,
    getQueryCache: () => ({
      findAll: mockFindAll,
    }),
    setQueryData: mockSetQueryData,
    setQueriesData: mockSetQueriesData,
  })),
}));

const {
  commonApiPostWithoutBodyAndResponse,
} = require("@/services/api/common-api");
const { fetchDropByIdBatched } = require("@/services/api/drop-api");
const {
  recordReactionRealtimeReconciliation,
} = require("@/utils/monitoring/dropReactionMonitoring");
const { isWaveDropNearViewport } = require("@/contexts/wave/drop-visibility");
const { getAuthJwt } = require("@/services/auth/auth.utils");
const getAuthJwtMock = getAuthJwt as jest.Mock;

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

let documentVisibilityState: DocumentVisibilityState = "visible";

const setDocumentVisibilityState = (state: DocumentVisibilityState) => {
  documentVisibilityState = state;
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => documentVisibilityState,
  });
};

describe("useWaveRealtimeUpdater", () => {
  beforeEach(() => {
    setDocumentVisibilityState("visible");
    getAuthJwtMock.mockReturnValue("test-jwt");
    (isWaveDropNearViewport as jest.Mock).mockReturnValue(true);
    (recordReactionRealtimeReconciliation as jest.Mock).mockReturnValue({
      shouldApplyCanonicalDrop: true,
      expectedReaction: null,
      serverReaction: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

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
    const store = {
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
    expect(recordReactionRealtimeReconciliation).toHaveBeenCalledWith({
      drop: {
        id: "d4",
        wave: { id: "wave1" },
        context_profile_context: null,
      },
      websocketStatus: "connected",
    });
    expect(mockSetQueriesData).toHaveBeenCalled();
    expect(props.updateData).toHaveBeenCalled();
  });

  it("syncs newest messages after helpbot final reaction updates", async () => {
    const store = {
      wave1: {
        drops: [
          {
            id: "helpbot-target",
            type: DropSize.FULL,
            stableKey: "helpbot-target",
            stableHash: "helpbot-target",
            serial_no: 20,
            author: {},
          },
        ],
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    fetchDropByIdBatched.mockResolvedValue({
      id: "helpbot-target",
      author: {},
      wave: { id: "wave1" },
      context_profile_context: null,
    });
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "helpbot-target",
      wave: { id: "wave1" },
      author: {},
      reactions: [
        {
          reaction: ":white_check_mark:",
          profiles: [{ handle: "help6529" }],
        },
      ],
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      )
    );
    await flushPromises();

    expect(props.syncNewestMessages).toHaveBeenCalledWith(
      "wave1",
      20,
      expect.any(AbortSignal)
    );
  });

  it("syncs newest messages after helpbot final reactions without reaction profile handles", async () => {
    const store = {
      wave1: {
        drops: [
          {
            id: "helpbot-target",
            type: DropSize.FULL,
            stableKey: "helpbot-target",
            stableHash: "helpbot-target",
            serial_no: 20,
            author: {},
          },
        ],
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    fetchDropByIdBatched.mockResolvedValue({
      id: "helpbot-target",
      author: {},
      wave: { id: "wave1" },
      context_profile_context: null,
    });
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "helpbot-target",
      wave: { id: "wave1" },
      author: {},
      mentioned_users: [
        {
          handle_in_content: "help6529",
          current_handle: "help6529",
        },
      ],
      reactions: [
        {
          reaction: ":white_check_mark:",
          profiles: [{}],
        },
      ],
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      )
    );
    await flushPromises();

    expect(props.syncNewestMessages).toHaveBeenCalledWith(
      "wave1",
      20,
      expect.any(AbortSignal)
    );
  });

  it("marks active wave as read after visible reaction updates", async () => {
    const store = {
      wave1: {
        drops: [
          {
            id: "d4-active",
            type: DropSize.FULL,
            stableKey: "d4-active",
            stableHash: "d4-active",
            author: {},
          },
        ],
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    props.activeWaveId = "wave1";
    fetchDropByIdBatched.mockResolvedValue({
      id: "d4-active",
      author: {},
      wave: { id: "wave1" },
      context_profile_context: null,
    });
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = { id: "d4-active", wave: { id: "wave1" }, author: {} };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      )
    );
    await flushPromises();

    expect(props.removeWaveDeliveredNotifications).toHaveBeenCalledWith(
      "wave1"
    );
    expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave1/read",
      headers: { Authorization: "Bearer test-jwt" },
    });
  });

  it("does not mark active wave as read when reaction target is not near viewport", async () => {
    const store = {
      wave1: {
        drops: [
          {
            id: "d4-offscreen",
            type: DropSize.FULL,
            stableKey: "d4-offscreen",
            stableHash: "d4-offscreen",
            author: {},
          },
        ],
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    props.activeWaveId = "wave1";
    (isWaveDropNearViewport as jest.Mock).mockReturnValue(false);
    fetchDropByIdBatched.mockResolvedValue({
      id: "d4-offscreen",
      author: {},
      wave: { id: "wave1" },
      context_profile_context: null,
    });
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "d4-offscreen",
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

    expect(isWaveDropNearViewport).toHaveBeenCalledWith(
      "wave1",
      "d4-offscreen"
    );
    expect(props.removeWaveDeliveredNotifications).not.toHaveBeenCalled();
    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();
  });

  it("skips stale DROP_REACTION_UPDATE canonical drops", async () => {
    const store = {
      wave1: {
        drops: [
          {
            id: "d4-stale",
            type: DropSize.FULL,
            stableKey: "d4-stale",
            stableHash: "d4-stale",
            author: {},
          },
        ],
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    props.activeWaveId = "wave1";
    fetchDropByIdBatched.mockResolvedValue({
      id: "d4-stale",
      author: {},
      wave: { id: "wave1" },
      context_profile_context: { reaction: ":old:" },
    });
    (recordReactionRealtimeReconciliation as jest.Mock).mockReturnValueOnce({
      shouldApplyCanonicalDrop: false,
      expectedReaction: ":new:",
      serverReaction: ":old:",
      supersededByMutationId: "mutation-2",
    });

    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "d4-stale",
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

    expect(fetchDropByIdBatched).toHaveBeenCalledWith("d4-stale");
    expect(props.updateData).not.toHaveBeenCalled();
    expect(mockSetQueriesData).not.toHaveBeenCalled();
    expect(props.removeWaveDeliveredNotifications).toHaveBeenCalledWith(
      "wave1"
    );
    expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave1/read",
      headers: { Authorization: "Bearer test-jwt" },
    });
  });

  it("does not mark background wave as read after reaction updates", async () => {
    const store = {
      wave1: {
        drops: [
          {
            id: "d4-background",
            type: DropSize.FULL,
            stableKey: "d4-background",
            stableHash: "d4-background",
            author: {},
          },
        ],
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    props.activeWaveId = "wave2";
    fetchDropByIdBatched.mockResolvedValue({
      id: "d4-background",
      author: {},
      wave: { id: "wave1" },
      context_profile_context: null,
    });

    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "d4-background",
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

    expect(props.removeWaveDeliveredNotifications).not.toHaveBeenCalled();
    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();
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

  it("preserves authenticated poll votes on websocket drop updates", async () => {
    const store = {
      wave1: {
        drops: [
          {
            id: "poll-drop",
            type: DropSize.FULL,
            stableKey: "poll-drop",
            stableHash: "poll-drop",
            serial_no: 10,
            created_at: 1000,
            author: { subscribed_actions: [] },
            wave: { id: "wave1" },
            poll: {
              id: "poll-1",
              options: [
                { option_no: 1, option_string: "First", votes: 2 },
                { option_no: 2, option_string: "Second", votes: 2 },
              ],
              voted: [2],
              multichoice: false,
              anonymous: false,
              closing_time: 2000,
              is_open: true,
            },
            context_profile_context: null,
          },
        ],
        latestFetchedSerialNo: null,
      },
    };
    const props = baseProps(store);
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const websocketDrop: any = {
      id: "poll-drop",
      serial_no: 10,
      created_at: 1000,
      author: { subscribed_actions: [] },
      wave: { id: "wave1" },
      poll: {
        id: "poll-1",
        options: [
          { option_no: 1, option_string: "First", votes: 3 },
          { option_no: 2, option_string: "Second", votes: 2 },
        ],
        voted: [1],
        multichoice: false,
        anonymous: false,
        closing_time: 2000,
        is_open: true,
      },
      context_profile_context: null,
    };

    await act(async () =>
      result.current.processIncomingDrop(
        websocketDrop,
        ProcessIncomingDropType.DROP_INSERT,
        { preferExistingPollVote: true }
      )
    );

    expect(props.updateData).toHaveBeenCalledWith(
      expect.objectContaining({
        drops: [
          expect.objectContaining({
            poll: expect.objectContaining({
              options: websocketDrop.poll.options,
              voted: [2],
            }),
          }),
        ],
      })
    );
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
      headers: { Authorization: "Bearer test-jwt" },
    });
  });

  it("does not mark active wave as read while hidden", async () => {
    setDocumentVisibilityState("hidden");

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

    expect(props.removeWaveDeliveredNotifications).not.toHaveBeenCalled();
    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();
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

  it("drops a delayed active-wave read after the active wave changes", async () => {
    getAuthJwtMock.mockReturnValue(null);

    const store = {
      wave1: { drops: [], latestFetchedSerialNo: 10 },
    };
    const props = baseProps(store);
    props.activeWaveId = "wave1";
    const { result, rerender } = renderHook(() =>
      useWaveRealtimeUpdater(props)
    );
    const drop: any = {
      id: "d-delayed-active",
      wave: { id: "wave1" },
      author: {},
    };

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
    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();

    props.activeWaveId = "wave2";
    getAuthJwtMock.mockReturnValue("test-jwt");
    rerender();
    await flushPromises();

    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();
  });

  it("drops a delayed active-wave read after the tab becomes hidden", async () => {
    getAuthJwtMock.mockReturnValue(null);

    const store = {
      wave1: { drops: [], latestFetchedSerialNo: 10 },
    };
    const props = baseProps(store);
    props.activeWaveId = "wave1";
    const { result, rerender } = renderHook(() =>
      useWaveRealtimeUpdater(props)
    );
    const drop: any = {
      id: "d-delayed-hidden",
      wave: { id: "wave1" },
      author: {},
    };

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
    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();

    setDocumentVisibilityState("hidden");
    getAuthJwtMock.mockReturnValue("test-jwt");
    rerender();
    await flushPromises();

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
