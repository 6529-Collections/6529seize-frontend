import { renderHook, act } from "@testing-library/react";
import React from "react";
import useNewDropCounter from "@/contexts/wave/hooks/useNewDropCounter";
import { AuthContext } from "@/components/auth/Auth";
import { WS_DROP_UPDATE_REASON_POLL_RESPONSE } from "@/helpers/Types";

jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: jest.fn(),
}));

const {
  useWebSocketMessage,
} = require("@/services/websocket/useWebSocketMessage");

const waves = [
  { id: "wave1", metrics: { latest_drop_timestamp: 10 } },
  { id: "wave2", metrics: { latest_drop_timestamp: 20 } },
] as any;

let wsCallback: any;
const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthContext.Provider value={{ connectedProfile: { handle: "me" } } as any}>
    {children}
  </AuthContext.Provider>
);

const emitDropUpdate = ({
  authorHandle = "other",
  createdAt = 30,
  reason,
  serialNo,
  waveId = "wave2",
}: {
  readonly authorHandle?: string;
  readonly createdAt?: number;
  readonly reason?: string;
  readonly serialNo?: number;
  readonly waveId?: string;
} = {}) => {
  const message: Record<string, unknown> = {
    wave: { id: waveId },
    author: { handle: authorHandle },
    created_at: createdAt,
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

describe("useNewDropCounter", () => {
  beforeEach(() => {
    (useWebSocketMessage as jest.Mock).mockImplementation(
      (_t: any, cb: any) => {
        wsCallback = cb;
        return { isConnected: true };
      }
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

  it("keeps websocket unread state until a trusted server snapshot covers it", () => {
    const refetch = jest.fn();
    const { result, rerender } = renderHook(
      ({
        latestDropTimestamp,
        latestReadTimestamp,
        serverSnapshotLatestDropTimestamp,
        trustServerSnapshotUnreadState,
        unreadDropsCount,
      }) =>
        useNewDropCounter(
          null,
          [
            {
              id: "wave2",
              latestDropTimestamp,
              latestReadTimestamp,
              serverSnapshotLatestDropTimestamp,
              unreadDropsCount,
            },
          ] as any,
          refetch,
          { trustServerSnapshotUnreadState }
        ),
      {
        wrapper,
        initialProps: {
          latestDropTimestamp: 20,
          latestReadTimestamp: 20,
          serverSnapshotLatestDropTimestamp: 20,
          trustServerSnapshotUnreadState: false,
          unreadDropsCount: 0,
        },
      }
    );

    emitDropUpdate({ createdAt: 30, serialNo: 5 });
    expect(result.current.newDropsCounts["wave2"]).toEqual({
      count: 1,
      latestDropTimestamp: 30,
      firstUnreadSerialNo: 5,
    });

    rerender({
      latestDropTimestamp: 31,
      latestReadTimestamp: 20,
      serverSnapshotLatestDropTimestamp: 20,
      trustServerSnapshotUnreadState: false,
      unreadDropsCount: 0,
    });

    expect(result.current.newDropsCounts["wave2"]).toEqual({
      count: 1,
      latestDropTimestamp: 30,
      firstUnreadSerialNo: 5,
    });

    rerender({
      latestDropTimestamp: 31,
      latestReadTimestamp: 20,
      serverSnapshotLatestDropTimestamp: 31,
      trustServerSnapshotUnreadState: false,
      unreadDropsCount: 0,
    });

    expect(result.current.newDropsCounts["wave2"]?.count).toBe(1);

    rerender({
      latestDropTimestamp: 31,
      latestReadTimestamp: 20,
      serverSnapshotLatestDropTimestamp: 31,
      trustServerSnapshotUnreadState: true,
      unreadDropsCount: 0,
    });

    expect(result.current.newDropsCounts["wave2"]).toEqual({
      count: 0,
      latestDropTimestamp: 31,
      firstUnreadSerialNo: null,
    });

    emitDropUpdate({ createdAt: 30, serialNo: 5 });
    expect(result.current.newDropsCounts["wave2"]?.count).toBe(0);

    emitDropUpdate({ createdAt: 32, serialNo: 6 });
    expect(result.current.newDropsCounts["wave2"]).toEqual({
      count: 1,
      latestDropTimestamp: 32,
      firstUnreadSerialNo: 6,
    });
  });

  it("keeps a distinct higher-serial drop at the snapshot timestamp", () => {
    const { result } = renderHook(
      () =>
        useNewDropCounter(
          null,
          [
            {
              id: "wave2",
              latestDropTimestamp: 31,
              latestReadTimestamp: 20,
              serverSnapshotLatestDropTimestamp: 31,
              unreadDropsCount: 0,
            },
          ] as any,
          jest.fn(),
          { trustServerSnapshotUnreadState: true }
        ),
      { wrapper }
    );

    emitDropUpdate({ createdAt: 31, serialNo: 6 });

    expect(result.current.newDropsCounts["wave2"]).toEqual({
      count: 1,
      latestDropTimestamp: 31,
      firstUnreadSerialNo: 6,
    });
  });

  it("commits reconciled state when resetting one wave", () => {
    const { result, rerender } = renderHook(
      ({ latestReadTimestamp }) =>
        useNewDropCounter(
          null,
          [
            {
              id: "wave2",
              latestDropTimestamp: 31,
              latestReadTimestamp,
            },
          ] as any,
          jest.fn()
        ),
      {
        wrapper,
        initialProps: { latestReadTimestamp: 20 },
      }
    );

    emitDropUpdate({ createdAt: 30, serialNo: 5 });
    rerender({ latestReadTimestamp: 31 });
    expect(result.current.newDropsCounts["wave2"]?.count).toBe(0);

    act(() => {
      result.current.resetWaveNewDropsCount("wave2");
    });
    rerender({ latestReadTimestamp: 20 });

    expect(result.current.newDropsCounts["wave2"]).toEqual({
      count: 0,
      latestDropTimestamp: 31,
      firstUnreadSerialNo: null,
    });
  });

  it("commits covered sibling reconciliation during a wave reset", () => {
    const { result, rerender } = renderHook(
      ({ wave2SnapshotTimestamp }) =>
        useNewDropCounter(
          null,
          [
            {
              id: "wave1",
              latestDropTimestamp: 10,
              latestReadTimestamp: 10,
              serverSnapshotLatestDropTimestamp: 10,
            },
            {
              id: "wave2",
              latestDropTimestamp: wave2SnapshotTimestamp,
              latestReadTimestamp: 20,
              serverSnapshotLatestDropTimestamp: wave2SnapshotTimestamp,
            },
          ] as any,
          jest.fn(),
          { trustServerSnapshotUnreadState: true }
        ),
      {
        wrapper,
        initialProps: { wave2SnapshotTimestamp: 20 },
      }
    );

    act(() => {
      result.current.resetWaveNewDropsCount("wave1");
    });
    emitDropUpdate({ createdAt: 30, serialNo: 5, waveId: "wave2" });
    expect(result.current.newDropsCounts["wave2"]?.count).toBe(1);

    rerender({ wave2SnapshotTimestamp: 31 });
    expect(result.current.newDropsCounts["wave2"]?.count).toBe(0);

    act(() => {
      result.current.resetWaveNewDropsCount("wave1");
    });
    rerender({ wave2SnapshotTimestamp: 20 });

    expect(result.current.newDropsCounts["wave2"]).toEqual({
      count: 0,
      latestDropTimestamp: 31,
      firstUnreadSerialNo: null,
    });
  });

  it("commits reconciled state when resetting all waves", () => {
    const { result, rerender } = renderHook(
      ({ latestReadTimestamp }) =>
        useNewDropCounter(
          null,
          [
            {
              id: "wave2",
              latestDropTimestamp: 31,
              latestReadTimestamp,
            },
          ] as any,
          jest.fn()
        ),
      {
        wrapper,
        initialProps: { latestReadTimestamp: 20 },
      }
    );

    emitDropUpdate({ createdAt: 30, serialNo: 5 });
    rerender({ latestReadTimestamp: 31 });
    expect(result.current.newDropsCounts["wave2"]?.count).toBe(0);

    act(() => {
      result.current.resetAllWavesNewDropsCount();
    });
    rerender({ latestReadTimestamp: 20 });

    expect(result.current.newDropsCounts["wave2"]).toEqual({
      count: 0,
      latestDropTimestamp: 31,
      firstUnreadSerialNo: null,
    });
  });

  it("uses the current wave snapshot for resets and websocket updates", () => {
    const { result, rerender } = renderHook(
      ({ serverSnapshotLatestDropTimestamp }) =>
        useNewDropCounter(
          null,
          [
            {
              id: "wave2",
              latestDropTimestamp: serverSnapshotLatestDropTimestamp,
              latestReadTimestamp: 20,
              serverSnapshotLatestDropTimestamp,
            },
          ] as any,
          jest.fn(),
          { trustServerSnapshotUnreadState: true }
        ),
      {
        wrapper,
        initialProps: { serverSnapshotLatestDropTimestamp: 20 },
      }
    );

    emitDropUpdate({ createdAt: 30, serialNo: 5 });
    rerender({ serverSnapshotLatestDropTimestamp: 31 });

    act(() => {
      result.current.resetWaveNewDropsCount("wave2");
    });
    emitDropUpdate({ createdAt: 30, serialNo: 5 });
    rerender({ serverSnapshotLatestDropTimestamp: 20 });

    expect(result.current.newDropsCounts["wave2"]).toEqual({
      count: 0,
      latestDropTimestamp: 31,
      firstUnreadSerialNo: null,
    });
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

  it("clears stored counts when re-enabled", () => {
    const { result, rerender } = renderHook(
      ({ enabled }) =>
        useNewDropCounter(null, waves, jest.fn(), {
          enabled,
        }),
      {
        wrapper,
        initialProps: { enabled: true },
      }
    );

    emitDropUpdate();
    expect(result.current.newDropsCounts["wave2"]?.count).toBe(1);

    rerender({ enabled: false });
    expect(result.current.newDropsCounts).toEqual({});

    rerender({ enabled: true });
    expect(result.current.newDropsCounts).toEqual({});
  });

  it("does not carry websocket counts into another viewer identity", () => {
    const { result, rerender } = renderHook(
      ({ identityKey }) =>
        useNewDropCounter(null, waves, jest.fn(), {
          stateIdentityKey: identityKey,
        }),
      {
        wrapper,
        initialProps: { identityKey: "profile-1" },
      }
    );

    emitDropUpdate();
    expect(result.current.newDropsCounts["wave2"]?.count).toBe(1);

    rerender({ identityKey: "profile-2" });

    expect(result.current.newDropsCounts).toEqual({});
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

  it("throttles unknown-wave refetches within cooldown window", () => {
    const refetch = jest.fn();
    const nowSpy = jest.spyOn(Date, "now");
    nowSpy.mockReturnValue(1000);

    renderHook(
      () =>
        useNewDropCounter(null, waves, refetch, {
          otherListWaveIds: new Set(),
          unknownWaveRefetchCooldownMs: 3000,
        }),
      { wrapper }
    );

    emitDropUpdate({ waveId: "unknown-1" });
    expect(refetch).toHaveBeenCalledTimes(1);

    nowSpy.mockReturnValue(2000);
    emitDropUpdate({ createdAt: 31, waveId: "unknown-2" });
    expect(refetch).toHaveBeenCalledTimes(1);

    nowSpy.mockReturnValue(4501);
    emitDropUpdate({ createdAt: 32, waveId: "unknown-3" });
    expect(refetch).toHaveBeenCalledTimes(2);
  });
});
