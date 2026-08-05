import { renderHook, act } from "@testing-library/react";
import {
  useWaveRealtimeUpdater,
  ProcessIncomingDropType,
} from "@/contexts/wave/hooks/useWaveRealtimeUpdater";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { WsMessageType } from "@/helpers/Types";

const mockSetQueriesData = jest.fn();
const mockSetQueryData = jest.fn();
const mockCancelQueries = jest.fn().mockResolvedValue(undefined);
const mockFindAll = jest.fn(() => []);
const mockRefreshEligibility = jest.fn().mockResolvedValue(undefined);
const mockWebSocketCallbacks = new Map<
  WsMessageType,
  (messageData: unknown) => void
>();

jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: (
    messageType: WsMessageType,
    callback: (messageData: unknown) => void
  ) => {
    mockWebSocketCallbacks.set(messageType, callback);
    return { isConnected: true };
  },
}));

jest.mock("@/contexts/wave/WaveEligibilityContext", () => ({
  useWaveEligibility: () => ({
    refreshEligibility: mockRefreshEligibility,
  }),
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

const emitWebSocketMessage = (
  messageType: WsMessageType,
  messageData: unknown
) => {
  const callback = mockWebSocketCallbacks.get(messageType);
  if (!callback) {
    throw new Error(`No callback registered for ${messageType}`);
  }
  const normalizedMessageData =
    messageType === WsMessageType.DROP_UPDATE_REF &&
    typeof messageData === "object" &&
    messageData !== null &&
    !Array.isArray(messageData)
      ? { author_id: "author-1", ...messageData }
      : messageData;
  act(() => callback(normalizedMessageData));
};

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
    fetchDropByIdBatched.mockReset();
    (isWaveDropNearViewport as jest.Mock).mockReturnValue(true);
    (recordReactionRealtimeReconciliation as jest.Mock).mockReturnValue({
      shouldApplyCanonicalDrop: true,
      expectedReaction: null,
      serverReaction: null,
    });
    mockRefreshEligibility.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockWebSocketCallbacks.clear();
    jest.useRealTimers();
  });

  const baseProps = (store: any) => ({
    activeWaveId: null as string | null,
    getData: (key: any) => store[key],
    updateData: jest.fn((update: any) => {
      store[update.key] = { ...store[update.key], ...update };
    }),
    hasServerFeedSeed: jest.fn().mockReturnValue(false),
    registerWave: jest.fn(),
    syncNewestMessages: jest
      .fn()
      .mockResolvedValue({ drops: null, highestSerialNo: null }),
    removeDrop: jest.fn(),
    removeWaveDeliveredNotifications: jest.fn().mockResolvedValue(undefined),
    isWaveMuted: jest.fn().mockReturnValue(false),
  });

  it("keeps full DROP_UPDATE messages on the existing optimistic path", async () => {
    const store = { wave1: { drops: [], latestFetchedSerialNo: 10 } };
    const props = baseProps(store);
    renderHook(() => useWaveRealtimeUpdater(props));

    emitWebSocketMessage(WsMessageType.DROP_UPDATE, {
      id: "full-drop",
      serial_no: 11,
      wave: { id: "wave1" },
      author: {},
    });
    await flushPromises();

    expect(props.updateData).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "wave1",
        drops: [expect.objectContaining({ id: "full-drop" })],
      })
    );
  });

  it("fetches the exact canonical drop for a valid compact reference", async () => {
    const store = { wave1: { drops: [], latestFetchedSerialNo: 10 } };
    const props = baseProps(store);
    const fetchedDrop = {
      id: "compact-drop",
      serial_no: 11,
      wave: { id: "wave1" },
      author: {},
    };
    fetchDropByIdBatched.mockResolvedValue(fetchedDrop);
    renderHook(() => useWaveRealtimeUpdater(props));

    emitWebSocketMessage(WsMessageType.DROP_UPDATE_REF, {
      drop_id: "compact-drop",
      wave_id: "wave1",
      serial_no: 11,
      update_type: WsMessageType.DROP_UPDATE,
    });
    await flushPromises();

    expect(fetchDropByIdBatched).toHaveBeenCalledWith("compact-drop");
    expect(store.wave1.drops).toEqual([
      expect.objectContaining({ id: "compact-drop" }),
    ]);
  });

  it("resolves same-serial rating and reaction references", async () => {
    const store = {
      wave1: {
        drops: [
          {
            id: "existing-drop",
            serial_no: 10,
            type: DropSize.FULL,
            stableKey: "existing-drop",
            stableHash: "existing-drop",
            wave: { id: "wave1" },
            author: {},
          },
        ],
        latestFetchedSerialNo: 10,
      },
    };
    const props = baseProps(store);
    fetchDropByIdBatched.mockResolvedValue({
      id: "existing-drop",
      serial_no: 10,
      wave: { id: "wave1" },
      author: {},
      context_profile_context: null,
    });
    renderHook(() => useWaveRealtimeUpdater(props));

    emitWebSocketMessage(WsMessageType.DROP_UPDATE_REF, {
      drop_id: "existing-drop",
      wave_id: "wave1",
      serial_no: 10,
      update_type: WsMessageType.DROP_RATING_UPDATE,
    });
    await flushPromises();

    emitWebSocketMessage(WsMessageType.DROP_UPDATE_REF, {
      drop_id: "existing-drop",
      wave_id: "wave1",
      serial_no: 10,
      update_type: WsMessageType.DROP_REACTION_UPDATE,
    });
    await flushPromises();

    expect(fetchDropByIdBatched).toHaveBeenNthCalledWith(1, "existing-drop");
    expect(fetchDropByIdBatched).toHaveBeenNthCalledWith(2, "existing-drop");
  });

  it("coalesces duplicate compact references into one follow-up sync", async () => {
    const store = { wave1: { drops: [], latestFetchedSerialNo: 10 } };
    const props = baseProps(store);
    const resolveDrop: Array<
      (value: {
        readonly id: string;
        readonly serial_no: number;
        readonly wave: { readonly id: string };
        readonly author: Record<string, never>;
      }) => void
    > = [];
    fetchDropByIdBatched.mockImplementation(
      () => new Promise((resolve) => resolveDrop.push(resolve))
    );
    renderHook(() => useWaveRealtimeUpdater(props));

    emitWebSocketMessage(WsMessageType.DROP_UPDATE_REF, {
      drop_id: "compact-drop",
      wave_id: "wave1",
      serial_no: 11,
      update_type: WsMessageType.DROP_UPDATE,
    });
    emitWebSocketMessage(WsMessageType.DROP_UPDATE_REF, {
      drop_id: "compact-drop",
      wave_id: "wave1",
      serial_no: 11,
      update_type: WsMessageType.DROP_UPDATE,
    });
    await Promise.resolve();

    expect(fetchDropByIdBatched).toHaveBeenCalledTimes(1);
    resolveDrop[0]!({
      id: "compact-drop",
      serial_no: 11,
      wave: { id: "wave1" },
      author: {},
    });
    await act(async () => {
      await Promise.resolve();
      await flushPromises();
    });
    expect(fetchDropByIdBatched).toHaveBeenCalledTimes(2);
    resolveDrop[1]!({
      id: "compact-drop",
      serial_no: 11,
      wave: { id: "wave1" },
      author: {},
    });
    await act(async () => {
      await Promise.resolve();
      await flushPromises();
    });
    expect(fetchDropByIdBatched).toHaveBeenCalledTimes(2);
  });

  it("keeps delimiter-bearing compact reference identities distinct", async () => {
    const store = {
      "wave:one": { drops: [], latestFetchedSerialNo: 10 },
      wave: { drops: [], latestFetchedSerialNo: 10 },
    };
    const props = baseProps(store);
    fetchDropByIdBatched.mockImplementation(async (dropId: string) => ({
      id: dropId,
      serial_no: 11,
      wave: { id: dropId === "drop" ? "wave:one" : "wave" },
      author: {},
    }));
    renderHook(() => useWaveRealtimeUpdater(props));

    emitWebSocketMessage(WsMessageType.DROP_UPDATE_REF, {
      drop_id: "drop",
      wave_id: "wave:one",
      serial_no: 11,
      update_type: WsMessageType.DROP_UPDATE,
    });
    emitWebSocketMessage(WsMessageType.DROP_UPDATE_REF, {
      drop_id: "one:drop",
      wave_id: "wave",
      serial_no: 11,
      update_type: WsMessageType.DROP_UPDATE,
    });
    await flushPromises();

    expect(fetchDropByIdBatched).toHaveBeenCalledWith("drop");
    expect(fetchDropByIdBatched).toHaveBeenCalledWith("one:drop");
  });

  it("retries compact refetches when the first read is behind", async () => {
    jest.useFakeTimers();
    const store = { wave1: { drops: [], latestFetchedSerialNo: 10 } };
    const props = baseProps(store);
    fetchDropByIdBatched
      .mockRejectedValueOnce(new Error("read replica lag"))
      .mockResolvedValueOnce({
        id: "compact-drop",
        serial_no: 11,
        wave: { id: "wave1" },
        author: {},
      });
    renderHook(() => useWaveRealtimeUpdater(props));

    emitWebSocketMessage(WsMessageType.DROP_UPDATE_REF, {
      drop_id: "compact-drop",
      wave_id: "wave1",
      serial_no: 11,
      update_type: WsMessageType.DROP_UPDATE,
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(fetchDropByIdBatched).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(250);
      await Promise.resolve();
    });
    expect(fetchDropByIdBatched).toHaveBeenCalledTimes(2);
  });

  it("stops after bounded compact-ref retries and reports failure", async () => {
    jest.useFakeTimers();
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const store = { wave1: { drops: [], latestFetchedSerialNo: 10 } };
    const props = baseProps(store);
    fetchDropByIdBatched.mockRejectedValue(new Error("replica unavailable"));
    renderHook(() => useWaveRealtimeUpdater(props));

    emitWebSocketMessage(WsMessageType.DROP_UPDATE_REF, {
      drop_id: "compact-drop",
      wave_id: "wave1",
      serial_no: 11,
      update_type: WsMessageType.DROP_UPDATE,
    });
    await act(async () => {
      await Promise.resolve();
    });

    for (const delayMs of [250, 750, 1500, 3000]) {
      await act(async () => {
        jest.advanceTimersByTime(delayMs);
        await Promise.resolve();
      });
    }

    expect(fetchDropByIdBatched).toHaveBeenCalledTimes(5);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("Failed to resolve compact drop"),
      expect.any(Error)
    );
    consoleError.mockRestore();
  });

  it("cancels pending compact-ref retries on unmount", async () => {
    jest.useFakeTimers();
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const store = { wave1: { drops: [], latestFetchedSerialNo: 10 } };
    const props = baseProps(store);
    fetchDropByIdBatched.mockRejectedValue(new Error("replica unavailable"));
    const { unmount } = renderHook(() => useWaveRealtimeUpdater(props));

    emitWebSocketMessage(WsMessageType.DROP_UPDATE_REF, {
      drop_id: "compact-drop",
      wave_id: "wave1",
      serial_no: 11,
      update_type: WsMessageType.DROP_UPDATE,
    });
    await act(async () => {
      await Promise.resolve();
    });

    act(() => unmount());
    await act(async () => {
      jest.advanceTimersByTime(5250);
      await Promise.resolve();
    });

    expect(fetchDropByIdBatched).toHaveBeenCalledTimes(1);
    expect(props.updateData).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("does not process a canonical drop that resolves after unmount", async () => {
    let resolveDrop!: (value: any) => void;
    const store = { wave1: { drops: [], latestFetchedSerialNo: 10 } };
    const props = baseProps(store);
    fetchDropByIdBatched.mockImplementation(
      () => new Promise((resolve) => (resolveDrop = resolve))
    );
    const { unmount } = renderHook(() => useWaveRealtimeUpdater(props));

    emitWebSocketMessage(WsMessageType.DROP_UPDATE_REF, {
      drop_id: "compact-drop",
      wave_id: "wave1",
      serial_no: 11,
      update_type: WsMessageType.DROP_UPDATE,
    });
    await act(async () => {
      await Promise.resolve();
    });
    act(() => unmount());

    resolveDrop({
      id: "compact-drop",
      serial_no: 11,
      wave: { id: "wave1" },
      author: {},
    });
    await act(async () => {
      await Promise.resolve();
      await flushPromises();
    });

    expect(props.updateData).not.toHaveBeenCalled();
    expect(props.registerWave).not.toHaveBeenCalled();
  });

  it("ignores malformed compact references", async () => {
    const store = { wave1: { drops: [], latestFetchedSerialNo: 10 } };
    const props = baseProps(store);
    renderHook(() => useWaveRealtimeUpdater(props));

    for (const message of [
      null,
      {},
      {
        drop_id: "",
        wave_id: "wave1",
        serial_no: 11,
        update_type: WsMessageType.DROP_UPDATE,
      },
      {
        drop_id: "drop",
        wave_id: "",
        serial_no: 11,
        update_type: WsMessageType.DROP_UPDATE,
      },
      {
        drop_id: "drop",
        wave_id: "wave1",
        author_id: null,
        serial_no: 11,
        update_type: WsMessageType.DROP_UPDATE,
      },
      {
        drop_id: "drop",
        wave_id: "wave1",
        serial_no: -1,
        update_type: WsMessageType.DROP_UPDATE,
      },
      {
        drop_id: "drop",
        wave_id: "wave1",
        serial_no: 1.5,
        update_type: WsMessageType.DROP_UPDATE,
      },
      {
        drop_id: "drop",
        wave_id: "wave1",
        serial_no: "11",
        update_type: WsMessageType.DROP_UPDATE,
      },
      {
        drop_id: "drop",
        wave_id: "wave1",
        serial_no: Infinity,
        update_type: WsMessageType.DROP_UPDATE,
      },
      {
        drop_id: "drop",
        wave_id: "wave1",
        serial_no: 11,
        update_type: "DROP_UNKNOWN",
      },
      {
        drop_id: "drop",
        wave_id: "wave1",
        serial_no: 11,
        update_type: WsMessageType.DROP_UPDATE,
        reason: 42,
      },
    ]) {
      emitWebSocketMessage(WsMessageType.DROP_UPDATE_REF, message);
    }
    await flushPromises();

    expect(props.syncNewestMessages).not.toHaveBeenCalled();
    expect(props.registerWave).not.toHaveBeenCalled();
  });

  it("does not sync an unrelated wave", async () => {
    const store = { wave1: { drops: [], latestFetchedSerialNo: 10 } };
    const props = baseProps(store);
    fetchDropByIdBatched.mockResolvedValue({
      id: "other-wave-drop",
      serial_no: 11,
      wave: { id: "wave2" },
      author: {},
    });
    renderHook(() => useWaveRealtimeUpdater(props));

    emitWebSocketMessage(WsMessageType.DROP_UPDATE_REF, {
      drop_id: "other-wave-drop",
      wave_id: "wave2",
      serial_no: 11,
      update_type: WsMessageType.DROP_UPDATE,
    });
    await flushPromises();

    expect(props.syncNewestMessages).not.toHaveBeenCalled();
    expect(props.registerWave).toHaveBeenCalledWith("wave2");
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

  it("normalizes string serial numbers before inserting realtime drops", async () => {
    const store = { wave1: { drops: [], latestFetchedSerialNo: 10 } };
    const props = baseProps(store);
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "helpbot-reply",
      serial_no: "6831",
      wave: { id: "wave1" },
      author: { handle: "help6529" },
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_INSERT
      )
    );
    await flushPromises();

    const insertedDrop = props.updateData.mock.calls[0][0].drops[0];
    expect(insertedDrop.serial_no).toBe(6831);
    expect(typeof insertedDrop.serial_no).toBe("number");
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

  it("does not sync newest messages after helpbot reactions without a known serial", async () => {
    const store = {
      wave1: {
        drops: [
          {
            id: "helpbot-no-serial",
            type: DropSize.FULL,
            stableKey: "helpbot-no-serial",
            stableHash: "helpbot-no-serial",
            author: {},
          },
        ],
        latestFetchedSerialNo: null,
      },
    };
    const props = baseProps(store);
    fetchDropByIdBatched.mockResolvedValue({
      id: "helpbot-no-serial",
      author: {},
      wave: { id: "wave1" },
      context_profile_context: null,
    });
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "helpbot-no-serial",
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

    expect(fetchDropByIdBatched).toHaveBeenCalledWith("helpbot-no-serial");
    expect(props.syncNewestMessages).not.toHaveBeenCalled();
  });

  it("syncs newest messages after helpbot final reactions even when canonical reaction is stale", async () => {
    const store = {
      wave1: {
        drops: [
          {
            id: "helpbot-stale-target",
            type: DropSize.FULL,
            stableKey: "helpbot-stale-target",
            stableHash: "helpbot-stale-target",
            serial_no: 20,
            author: {},
          },
        ],
        latestFetchedSerialNo: 20,
      },
    };
    const props = baseProps(store);
    fetchDropByIdBatched.mockResolvedValue({
      id: "helpbot-stale-target",
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
      id: "helpbot-stale-target",
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

    expect(props.updateData).not.toHaveBeenCalled();
    expect(mockSetQueriesData).not.toHaveBeenCalled();
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

  it("applies inserts while a server seed is pending without a full registration", async () => {
    const store: Record<string, any> = {};
    const props = baseProps(store);
    props.hasServerFeedSeed.mockImplementation(
      (waveId: string) => waveId === "wave2"
    );
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = {
      id: "seed-gap-drop",
      serial_no: 2,
      wave: { id: "wave2" },
      author: {},
    };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_INSERT
      )
    );

    expect(props.updateData).toHaveBeenCalledWith({
      key: "wave2",
      drops: [expect.objectContaining({ id: "seed-gap-drop" })],
    });
    expect(store["wave2"]?.drops).toEqual([
      expect.objectContaining({ id: "seed-gap-drop" }),
    ]);
    expect(props.registerWave).not.toHaveBeenCalled();
    expect(props.syncNewestMessages).not.toHaveBeenCalled();
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

  it("skips processing when an inactive wave is muted", async () => {
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

  it("processes realtime drops when the active wave is muted", async () => {
    const store = {
      wave1: { drops: [], latestFetchedSerialNo: 10 },
    };
    const props = baseProps(store);
    props.activeWaveId = "wave1";
    props.isWaveMuted = jest.fn().mockReturnValue(true);
    const { result } = renderHook(() => useWaveRealtimeUpdater(props));
    const drop: any = { id: "d12", wave: { id: "wave1" }, author: {} };

    await act(async () =>
      result.current.processIncomingDrop(
        drop,
        ProcessIncomingDropType.DROP_INSERT
      )
    );
    await flushPromises();

    expect(props.isWaveMuted).toHaveBeenCalledWith("wave1");
    expect(props.updateData).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "wave1",
        drops: [expect.objectContaining({ id: "d12" })],
      })
    );
    expect(props.registerWave).not.toHaveBeenCalled();
    expect(props.syncNewestMessages).toHaveBeenCalledWith(
      "wave1",
      10,
      expect.any(AbortSignal)
    );
    expect(props.removeWaveDeliveredNotifications).toHaveBeenCalledWith(
      "wave1"
    );
    expect(commonApiPostWithoutBodyAndResponse).toHaveBeenCalledWith({
      endpoint: "notifications/wave/wave1/read",
      headers: { Authorization: "Bearer test-jwt" },
    });
  });

  it("stops muted drop processing when the wave becomes inactive during eligibility refresh", async () => {
    const store = {
      wave1: { drops: [], latestFetchedSerialNo: 10 },
    };
    const props = baseProps(store);
    props.activeWaveId = "wave1";
    props.isWaveMuted = jest.fn().mockReturnValue(true);

    let resolveRefresh: (() => void) | undefined;
    mockRefreshEligibility.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveRefresh = resolve;
        })
    );

    const { result, rerender } = renderHook(() =>
      useWaveRealtimeUpdater(props)
    );
    act(() => {
      setDocumentVisibilityState("hidden");
      document.dispatchEvent(new Event("visibilitychange"));
      setDocumentVisibilityState("visible");
      document.dispatchEvent(new Event("visibilitychange"));
    });

    let processingPromise!: Promise<void>;
    await act(async () => {
      processingPromise = result.current.processIncomingDrop(
        { id: "d13", wave: { id: "wave1" }, author: {} } as any,
        ProcessIncomingDropType.DROP_INSERT
      );
      await flushPromises();
    });

    expect(mockRefreshEligibility).toHaveBeenCalledWith("wave1");

    act(() => {
      props.activeWaveId = "wave2";
      rerender();
    });

    if (!resolveRefresh) {
      throw new Error("Expected eligibility refresh to remain pending");
    }
    resolveRefresh();
    await act(async () => processingPromise);

    expect(props.updateData).not.toHaveBeenCalled();
    expect(props.registerWave).not.toHaveBeenCalled();
    expect(props.syncNewestMessages).not.toHaveBeenCalled();
    expect(props.removeWaveDeliveredNotifications).not.toHaveBeenCalled();
    expect(commonApiPostWithoutBodyAndResponse).not.toHaveBeenCalled();
  });
});
