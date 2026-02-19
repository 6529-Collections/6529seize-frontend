import { renderHook, act } from "@testing-library/react";
import React from "react";
import useNewDropCounter from "@/contexts/wave/hooks/useNewDropCounter";
import { AuthContext } from "@/components/auth/Auth";

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
    act(() => {
      wsCallback({
        wave: { id: "wave2" },
        author: { handle: "other" },
        created_at: 30,
      });
    });
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

  it("ignores messages from connected profile and resets on active change", () => {
    const { result, rerender } = renderHook(
      ({ activeId }) => useNewDropCounter(activeId, waves, jest.fn()),
      { wrapper, initialProps: { activeId: "wave1" } }
    );
    expect(result.current.newDropsCounts["wave1"]?.count).toBe(0);
    act(() => {
      wsCallback({
        wave: { id: "wave1" },
        author: { handle: "me" },
        created_at: 50,
      });
    });
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

    act(() => {
      wsCallback({
        wave: { id: "main-wave" },
        author: { handle: "other" },
        created_at: 30,
      });
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

    act(() => {
      wsCallback({
        wave: { id: "unknown-1" },
        author: { handle: "other" },
        created_at: 30,
      });
    });
    expect(refetch).toHaveBeenCalledTimes(1);

    nowSpy.mockReturnValue(2000);
    act(() => {
      wsCallback({
        wave: { id: "unknown-2" },
        author: { handle: "other" },
        created_at: 31,
      });
    });
    expect(refetch).toHaveBeenCalledTimes(1);

    nowSpy.mockReturnValue(4501);
    act(() => {
      wsCallback({
        wave: { id: "unknown-3" },
        author: { handle: "other" },
        created_at: 32,
      });
    });
    expect(refetch).toHaveBeenCalledTimes(2);
  });
});
