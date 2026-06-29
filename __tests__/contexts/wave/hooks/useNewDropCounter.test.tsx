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
