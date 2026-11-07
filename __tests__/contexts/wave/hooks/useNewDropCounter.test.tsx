import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import useNewDropCounter from "@/contexts/wave/hooks/useNewDropCounter";
import { AuthContext } from "@/components/auth/Auth";
import { mockRandomUnit } from "../../../helpers/mockRandomUnit";
import {
  WS_DROP_UPDATE_REASON_POLL_RESPONSE,
  WsMessageType,
} from "@/helpers/Types";

jest.mock("@/services/api/drop-api", () => ({
  fetchDropByIdBatched: jest.fn(),
}));
const { fetchDropByIdBatched } = require("@/services/api/drop-api");

jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: jest.fn(),
}));

const {
  useWebSocketMessage,
} = require("@/services/websocket/useWebSocketMessage");

// Unknown-wave list refreshes wait a uniform 2-20 s.
const MAX_REFRESH_DELAY_MS = 20_000;

const waves = [
  { id: "wave1", metrics: { latest_drop_timestamp: 10 } },
  { id: "wave2", metrics: { latest_drop_timestamp: 20 } },
] as any;

let wsCallback: any;
const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthContext.Provider
    value={{ connectedProfile: { id: "me-id", handle: "me" } } as any}
  >
    {children}
  </AuthContext.Provider>
);

const emitDropUpdate = ({
  authorHandle = "other",
  createdAt = 30,
  reason,
  serialNo,
  waveId = "wave2",
  isReply = false,
}: {
  readonly authorHandle?: string;
  readonly createdAt?: number;
  readonly reason?: string;
  readonly serialNo?: number;
  readonly waveId?: string;
  readonly isReply?: boolean;
} = {}) => {
  const message: Record<string, unknown> = {
    wave: { id: waveId },
    author: { handle: authorHandle },
    created_at: createdAt,
    ...(isReply ? { reply_to: { drop_id: "announcement" } } : {}),
  };

  if (reason !== undefined) {
    message.reason = reason;
  }
  if (serialNo !== undefined) {
    message.serial_no = serialNo;
  }

  act(() => {
    wsCallback(message);
  });
};

const emitDropUpdateRef = (message: Record<string, unknown>) => {
  const compactCallback = (useWebSocketMessage as jest.Mock).mock.calls.find(
    ([messageType]) => messageType === WsMessageType.DROP_UPDATE_REF
  )?.[1];

  if (!compactCallback) {
    throw new Error("No compact drop-update callback registered");
  }

  act(() => {
    compactCallback({ author_id: "other-id", ...message });
  });
};

describe("useNewDropCounter", () => {
  beforeEach(() => {
    fetchDropByIdBatched.mockReset();
    (useWebSocketMessage as jest.Mock).mockClear();
    (useWebSocketMessage as jest.Mock).mockImplementation(
      (_t: any, cb: any) => {
        if (_t === WsMessageType.DROP_UPDATE) wsCallback = cb;
        return { isConnected: true };
      }
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("leaves collapsed reply counts and timestamps unchanged but counts new announcements", () => {
    const { result } = renderHook(
      () =>
        useNewDropCounter(
          null,
          [{ ...waves[1], repliesCollapsed: true }],
          jest.fn()
        ),
      { wrapper }
    );
    emitDropUpdate({ isReply: true });
    expect(result.current.newDropsCounts["wave2"]).toBeUndefined();
    emitDropUpdate({ serialNo: 10 });
    expect(result.current.newDropsCounts["wave2"]).toMatchObject({
      count: 1,
      latestDropTimestamp: 30,
    });
  });

  it("keeps counting inline replies", () => {
    const { result } = renderHook(
      () => useNewDropCounter(null, waves, jest.fn()),
      { wrapper }
    );
    emitDropUpdate({ isReply: true, serialNo: 11 });
    expect(result.current.newDropsCounts["wave2"]?.count).toBe(1);
  });

  it.each([true, false])(
    "resolves compact collapsed-wave updates (reply: %s)",
    async (isReply) => {
      fetchDropByIdBatched.mockResolvedValue({
        wave: { id: "wave2" },
        author: { handle: "other" },
        created_at: 40,
        serial_no: 12,
        ...(isReply ? { reply_to: { drop_id: "announcement" } } : {}),
      });
      const { result } = renderHook(
        () =>
          useNewDropCounter(
            null,
            [{ ...waves[1], repliesCollapsed: true }],
            jest.fn()
          ),
        { wrapper }
      );
      emitDropUpdateRef({
        drop_id: "compact",
        wave_id: "wave2",
        serial_no: 12,
        update_type: WsMessageType.DROP_UPDATE,
      });
      // The ref requests the canonical drop synchronously. Resolve it inside
      // act. Yielding first, as waitFor does, applies the state update outside
      // act on React's scheduler, which can land after the assertions.
      expect(fetchDropByIdBatched).toHaveBeenCalledWith("compact");
      await act(async () => {
        await fetchDropByIdBatched.mock.results[0].value;
      });
      // Fetch completion can precede the hook's committed state update.
      await waitFor(() => {
        expect(result.current.newDropsCounts["wave2"]?.count ?? 0).toBe(
          isReply ? 0 : 1
        );
        expect(
          result.current.newDropsCounts["wave2"]?.latestDropTimestamp ?? null
        ).toBe(isReply ? null : 40);
      });
    }
  );

  it("discards a compact resolution after switching profiles", async () => {
    let finish = (_drop: unknown) => {};
    fetchDropByIdBatched.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    let profileId = "me-id";
    const switchingWrapper = ({ children }: React.PropsWithChildren) => (
      <AuthContext.Provider
        value={
          {
            connectedProfile: { id: profileId, handle: "me" },
          } as React.ContextType<typeof AuthContext>
        }
      >
        {children}
      </AuthContext.Provider>
    );
    const { result, rerender } = renderHook(
      () =>
        useNewDropCounter(
          null,
          [{ ...waves[1], repliesCollapsed: true }],
          jest.fn()
        ),
      { wrapper: switchingWrapper }
    );
    emitDropUpdateRef({
      drop_id: "late",
      wave_id: "wave2",
      serial_no: 13,
      update_type: WsMessageType.DROP_UPDATE,
    });
    profileId = "new-profile";
    rerender();
    await act(async () => {
      finish({
        wave: { id: "wave2" },
        author: { handle: "other" },
        created_at: 60,
        serial_no: 13,
      });
    });
    expect(result.current.newDropsCounts["wave2"]).toBeUndefined();
  });

  it("increments counts and resets all", () => {
    const refetch = jest.fn();
    const { result } = renderHook(
      () => useNewDropCounter(null, waves, refetch),
      { wrapper }
    );
    emitDropUpdate();
    expect(result.current.newDropsCounts["wave2"]?.count).toBe(1);
    expect(result.current.newDropsCounts["wave2"]?.latestDropTimestamp).toBe(
      30
    );
    act(() => {
      result.current.resetAllWavesNewDropsCount();
    });
    expect(result.current.newDropsCounts["wave1"]?.count).toBe(0);
    expect(result.current.newDropsCounts["wave2"]?.count).toBe(0);
  });

  it("does not increment counts for poll response updates", () => {
    const refetch = jest.fn();
    const { result } = renderHook(
      () => useNewDropCounter(null, waves, refetch),
      { wrapper }
    );

    emitDropUpdate({ reason: WS_DROP_UPDATE_REASON_POLL_RESPONSE });

    expect(result.current.newDropsCounts["wave2"]?.count ?? 0).toBe(0);
    expect(refetch).not.toHaveBeenCalled();
  });

  it("counts only content compact refs and preserves poll-response suppression", () => {
    const refetch = jest.fn();
    jest.spyOn(Date, "now").mockReturnValue(1234);
    const { result } = renderHook(
      () => useNewDropCounter(null, waves, refetch),
      { wrapper }
    );

    emitDropUpdateRef({
      drop_id: "rating-drop",
      wave_id: "wave2",
      serial_no: 20,
      update_type: WsMessageType.DROP_RATING_UPDATE,
    });
    emitDropUpdateRef({
      drop_id: "poll-drop",
      wave_id: "wave2",
      serial_no: 21,
      update_type: WsMessageType.DROP_UPDATE,
      reason: WS_DROP_UPDATE_REASON_POLL_RESPONSE,
    });
    emitDropUpdateRef({
      drop_id: "content-drop",
      wave_id: "wave2",
      serial_no: 22,
      update_type: WsMessageType.DROP_UPDATE,
      reason: "AUTHOR_EDIT",
    });

    expect(result.current.newDropsCounts["wave2"]).toEqual({
      count: 1,
      latestDropTimestamp: 1234,
      firstUnreadSerialNo: 22,
    });
    expect(refetch).not.toHaveBeenCalled();
  });

  it("resolves an unknown-wave compact ref before counting it", async () => {
    jest.useFakeTimers();
    try {
      await resolvesUnknownWaveCompactRef();
    } finally {
      jest.useRealTimers();
    }
  });

  const resolvesUnknownWaveCompactRef = async () => {
    fetchDropByIdBatched.mockResolvedValue({
      wave: { id: "unknown-wave" },
      author: { handle: "other" },
      created_at: 2345,
      serial_no: 23,
    });
    const refetch = jest.fn();
    jest.spyOn(Date, "now").mockReturnValue(2345);
    const { result } = renderHook(
      () =>
        useNewDropCounter(null, waves, refetch, {
          otherListWaveIds: new Set(),
        }),
      { wrapper }
    );

    emitDropUpdateRef({
      drop_id: "new-drop",
      wave_id: "unknown-wave",
      serial_no: 23,
      update_type: WsMessageType.DROP_UPDATE,
    });

    await waitFor(() =>
      expect(result.current.newDropsCounts["unknown-wave"]).toEqual({
        count: 1,
        latestDropTimestamp: 2345,
        firstUnreadSerialNo: 23,
      })
    );
    // The list refresh follows later, coalesced and jittered.
    expect(refetch).not.toHaveBeenCalled();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(MAX_REFRESH_DELAY_MS);
    });
    expect(refetch).toHaveBeenCalledTimes(1);
  };

  it("does not count the connected profile's compact content ref", () => {
    const refetch = jest.fn();
    jest.spyOn(Date, "now").mockReturnValue(3456);
    const { result } = renderHook(
      () => useNewDropCounter(null, waves, refetch),
      { wrapper }
    );

    emitDropUpdateRef({
      author_id: "me-id",
      drop_id: "own-drop",
      wave_id: "wave2",
      serial_no: 24,
      update_type: WsMessageType.DROP_UPDATE,
    });

    expect(result.current.newDropsCounts["wave2"]).toEqual({
      count: 0,
      latestDropTimestamp: 3456,
      firstUnreadSerialNo: null,
    });
    expect(refetch).not.toHaveBeenCalled();
  });

  it("does not process websocket updates or resets while disabled", () => {
    const refetch = jest.fn();
    const { result } = renderHook(
      () => useNewDropCounter(null, waves, refetch, { enabled: false }),
      { wrapper }
    );

    emitDropUpdate();
    act(() => {
      result.current.resetAllWavesNewDropsCount();
      result.current.resetWaveNewDropsCount("wave2");
    });

    expect(result.current.newDropsCounts).toEqual({});
    expect(refetch).not.toHaveBeenCalled();
  });

  it("updates muted wave timestamps without unread counts", () => {
    const refetch = jest.fn();
    const { result, rerender } = renderHook(
      ({ muted }) =>
        useNewDropCounter(
          null,
          [...waves, { id: "muted-wave", muted }],
          refetch
        ),
      { wrapper, initialProps: { muted: false } }
    );

    emitDropUpdate({ createdAt: 60, serialNo: 5, waveId: "muted-wave" });
    expect(result.current.newDropsCounts["muted-wave"]).toEqual({
      count: 1,
      latestDropTimestamp: 60,
      firstUnreadSerialNo: 5,
    });

    rerender({ muted: true });

    emitDropUpdate({ createdAt: 70, serialNo: 6, waveId: "muted-wave" });

    expect(result.current.newDropsCounts["muted-wave"]).toEqual({
      count: 0,
      latestDropTimestamp: 70,
      firstUnreadSerialNo: null,
    });
    expect(refetch).not.toHaveBeenCalled();
  });

  it("ignores messages from connected profile and resets on active change", () => {
    const { result, rerender } = renderHook(
      ({ activeId }) => useNewDropCounter(activeId, waves, jest.fn()),
      { wrapper, initialProps: { activeId: "wave1" } }
    );
    expect(result.current.newDropsCounts["wave1"]?.count).toBe(0);
    emitDropUpdate({ authorHandle: "me", createdAt: 50, waveId: "wave1" });
    expect(result.current.newDropsCounts["wave1"]?.count).toBe(0);
    rerender({ activeId: "wave2" });
    expect(result.current.newDropsCounts["wave2"]?.count).toBe(0);
  });

  it("skips unknown-wave refetch when wave exists in opposite list", () => {
    const refetch = jest.fn();
    renderHook(
      () =>
        useNewDropCounter(null, waves, refetch, {
          otherListWaveIds: new Set(["main-wave"]),
        }),
      { wrapper }
    );

    emitDropUpdate({ waveId: "main-wave" });

    expect(refetch).not.toHaveBeenCalled();
  });

  it("tracks own unknown-wave timestamps without refetching the list", () => {
    const refetch = jest.fn();
    const { result } = renderHook(
      () =>
        useNewDropCounter(null, waves, refetch, {
          otherListWaveIds: new Set(),
        }),
      { wrapper }
    );

    emitDropUpdate({
      authorHandle: "me",
      createdAt: 55,
      waveId: "unknown-own-wave",
    });

    expect(result.current.newDropsCounts["unknown-own-wave"]).toEqual({
      count: 0,
      latestDropTimestamp: 55,
      firstUnreadSerialNo: null,
    });
    expect(refetch).not.toHaveBeenCalled();
  });

  it("tracks visible active unknown-wave timestamps without refetching the list", () => {
    const refetch = jest.fn();
    const { result } = renderHook(
      () =>
        useNewDropCounter("unknown-active-wave", waves, refetch, {
          otherListWaveIds: new Set(),
        }),
      { wrapper }
    );

    emitDropUpdate({
      createdAt: 56,
      serialNo: 7,
      waveId: "unknown-active-wave",
    });

    expect(result.current.newDropsCounts["unknown-active-wave"]).toEqual({
      count: 0,
      latestDropTimestamp: 56,
      firstUnreadSerialNo: null,
    });
    expect(refetch).not.toHaveBeenCalled();
  });

  describe("list refreshes for drops in unknown waves", () => {
    const advance = async (ms: number) => {
      await act(async () => {
        await jest.advanceTimersByTimeAsync(ms);
      });
    };
    let visibility: DocumentVisibilityState = "visible";
    let randomUnit: jest.SpyInstance;

    const renderCounter = () => {
      const refetch = jest.fn();
      renderHook(
        () =>
          useNewDropCounter(null, waves, refetch, {
            otherListWaveIds: new Set(),
          }),
        { wrapper }
      );
      return refetch;
    };

    beforeAll(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => visibility,
      });
    });

    afterAll(() => {
      // Back to jsdom's own getter on the prototype.
      Reflect.deleteProperty(document, "visibilityState");
    });

    beforeEach(() => {
      jest.useFakeTimers();
      visibility = "visible";
      // A neutral jitter sample: every refresh waits the 11 s midpoint.
      randomUnit = mockRandomUnit(0.5);
    });

    afterEach(() => {
      randomUnit.mockRestore();
      jest.useRealTimers();
    });

    it("turns ten drops in ten seconds into one jittered refresh", async () => {
      const refetch = renderCounter();

      for (let index = 0; index < 10; index++) {
        emitDropUpdate({ createdAt: 40 + index, waveId: `unknown-${index}` });
        // Replies count too: they still need the wave in the list.
        emitDropUpdate({ isReply: true, waveId: `unknown-reply-${index}` });
        await advance(1_000);
      }
      expect(refetch).not.toHaveBeenCalled();

      await advance(MAX_REFRESH_DELAY_MS);
      expect(refetch).toHaveBeenCalledTimes(1);
    });

    it("spreads the first refresh between 2 and 20 seconds", async () => {
      randomUnit.mockRestore();
      randomUnit = mockRandomUnit(0);
      const early = renderCounter();
      emitDropUpdate({ waveId: "unknown-early" });
      await advance(1_999);
      expect(early).not.toHaveBeenCalled();
      await advance(1);
      expect(early).toHaveBeenCalledTimes(1);
    });

    it("never waits longer than 20 seconds for the first refresh", async () => {
      randomUnit.mockRestore();
      randomUnit = mockRandomUnit(0.999_999_9);
      const late = renderCounter();
      emitDropUpdate({ waveId: "unknown-late" });
      await advance(19_000);
      expect(late).not.toHaveBeenCalled();
      await advance(1_000);
      expect(late).toHaveBeenCalledTimes(1);
    });

    it("gives drops after a refresh one trailing refresh after the minimum gap", async () => {
      const refetch = renderCounter();
      emitDropUpdate({ waveId: "unknown-1" });
      await advance(11_000);
      expect(refetch).toHaveBeenCalledTimes(1);

      emitDropUpdate({ createdAt: 31, waveId: "unknown-2" });
      await advance(1_000);
      emitDropUpdate({ createdAt: 32, waveId: "unknown-3" });
      // 30 s after the refresh, plus the 11 s jitter, from the first drop.
      await advance(30_000 + 11_000 - 1_000 - 1);
      expect(refetch).toHaveBeenCalledTimes(1);
      await advance(1);
      expect(refetch).toHaveBeenCalledTimes(2);

      await advance(5 * 60_000);
      expect(refetch).toHaveBeenCalledTimes(2);
    });

    it("waits for a hidden tab to show before refreshing", async () => {
      const refetch = renderCounter();
      visibility = "hidden";
      emitDropUpdate({ waveId: "unknown-hidden" });
      await advance(5 * 60_000);
      expect(refetch).not.toHaveBeenCalled();

      visibility = "visible";
      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await advance(11_000);
      expect(refetch).toHaveBeenCalledTimes(1);
    });

    it("defers a refresh that comes due in a hidden tab, then keeps the gap", async () => {
      const refetch = renderCounter();
      emitDropUpdate({ waveId: "unknown-1" });
      visibility = "hidden";
      await advance(5 * 60_000);
      expect(refetch).not.toHaveBeenCalled();

      // Showing the tab schedules a fresh jittered refresh, not an instant
      // one, so tabs shown together still spread out.
      visibility = "visible";
      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await advance(11_000 - 1);
      expect(refetch).not.toHaveBeenCalled();
      await advance(1);
      expect(refetch).toHaveBeenCalledTimes(1);

      // The refresh counts: the next drop waits out the 30 s gap.
      emitDropUpdate({ createdAt: 31, waveId: "unknown-2" });
      await advance(30_000 + 11_000 - 1);
      expect(refetch).toHaveBeenCalledTimes(1);
      await advance(1);
      expect(refetch).toHaveBeenCalledTimes(2);
    });

    it("cancels a pending refresh on unmount", async () => {
      const refetch = jest.fn();
      const { unmount } = renderHook(
        () =>
          useNewDropCounter(null, waves, refetch, {
            otherListWaveIds: new Set(),
          }),
        { wrapper }
      );
      emitDropUpdate({ waveId: "unknown-gone" });
      unmount();
      await advance(MAX_REFRESH_DELAY_MS);
      expect(refetch).not.toHaveBeenCalled();
    });
  });
});
