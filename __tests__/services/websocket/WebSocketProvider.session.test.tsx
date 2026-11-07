import React from "react";
import { act, renderHook } from "@testing-library/react";
import { WebSocketProvider } from "@/services/websocket/WebSocketProvider";
import { WebSocketContext } from "@/services/websocket/WebSocketContext";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";
import * as authUtils from "@/services/auth/auth.utils";
import { fakeJwt } from "../../helpers/fakeJwt";
import { mockRandomUnit } from "../../helpers/mockRandomUnit";

jest.mock("@/services/auth/session-readiness", () => ({
  ensureActiveSession: jest.fn(),
}));
jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: jest.fn(),
  isAuthJwtUsable: jest.fn(() => true),
}));

class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readonly sent: Array<{ readonly type?: unknown }> = [];
  readonly close = jest.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
  });
  readonly send = jest.fn((message: string) => {
    this.sent.push(JSON.parse(message) as { readonly type?: unknown });
  });

  constructor(readonly url: string) {
    sockets.push(this);
  }

  open() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.(new Event("open"));
  }

  frame(message: Record<string, unknown>) {
    this.onmessage?.(
      new MessageEvent("message", { data: JSON.stringify(message) })
    );
  }
}

let sockets: MockWebSocket[] = [];
const originalWebSocket = globalThis.WebSocket;
const mockGetAuthJwt = authUtils.getAuthJwt as jest.Mock;

const ALICE = fakeJwt({ id: "1", sub: "0xalice", exp: 9_999_999_999 });
const ALICE_ROTATED = fakeJwt({ id: "2", sub: "0xalice", exp: 9_999_999_999 });
const BOB = fakeJwt({ id: "3", sub: "0xbob", exp: 9_999_999_999 });

const latestSocket = (): MockWebSocket => {
  const ws = sockets.at(-1);
  if (!ws) throw new Error("No socket was opened");
  return ws;
};

const renderProvider = () =>
  renderHook(() => React.useContext(WebSocketContext)!, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <WebSocketProvider config={{ url: "ws://test" }}>
        {children}
      </WebSocketProvider>
    ),
  });

type ProviderResult = ReturnType<typeof renderProvider>["result"];

const authenticate = (ws: MockWebSocket) => {
  act(() => {
    ws.open();
  });
  act(() => {
    ws.frame({ type: "AUTHENTICATED" });
  });
};

const connectAs = (result: ProviderResult, token: string): MockWebSocket => {
  mockGetAuthJwt.mockReturnValue(token);
  act(() => {
    result.current.connect(token);
  });
  const ws = latestSocket();
  authenticate(ws);
  return ws;
};

let restoreRandom: jest.SpyInstance;

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-11-07T12:00:00Z"));
  sockets = [];
  const factory = jest.fn((url: string) => new MockWebSocket(url));
  Object.assign(factory, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 });
  Object.defineProperty(globalThis, "WebSocket", {
    configurable: true,
    value: factory,
  });
  mockGetAuthJwt.mockReset();
  restoreRandom = mockRandomUnit(0.5);
});

afterEach(() => {
  restoreRandom.mockRestore();
  Object.defineProperty(globalThis, "WebSocket", {
    configurable: true,
    value: originalWebSocket,
  });
  jest.useRealTimers();
});

describe("WebSocketProvider sessions", () => {
  it("reports the tab's first authenticated session as initial", () => {
    const { result } = renderProvider();
    expect(result.current.connection).toBeNull();

    connectAs(result, ALICE);

    expect(result.current.status).toBe(WebSocketStatus.CONNECTED);
    expect(result.current.connection).toEqual({
      revision: 1,
      kind: "initial",
    });
  });

  it("re-authenticates a rotated token for the same identity on the open socket", () => {
    const { result } = renderProvider();
    const ws = connectAs(result, ALICE);

    mockGetAuthJwt.mockReturnValue(ALICE_ROTATED);
    act(() => {
      result.current.reauthenticate(ALICE_ROTATED);
    });

    expect(sockets).toHaveLength(1);
    expect(ws.sent.at(-1)).toEqual({
      type: "AUTHENTICATE",
      access_token: ALICE_ROTATED,
    });
    expect(result.current.status).toBe(WebSocketStatus.CONNECTED);

    act(() => {
      ws.frame({ type: "AUTHENTICATED" });
    });
    expect(result.current.status).toBe(WebSocketStatus.CONNECTED);
    expect(result.current.connection).toEqual({
      revision: 2,
      kind: "reauthenticated",
    });

    // The same token again is a no-op.
    act(() => {
      result.current.reauthenticate(ALICE_ROTATED);
    });
    expect(
      ws.sent.filter((frame) => frame.type === "AUTHENTICATE")
    ).toHaveLength(2);
  });

  it("replaces the socket for another identity", () => {
    const { result } = renderProvider();
    const first = connectAs(result, ALICE);

    mockGetAuthJwt.mockReturnValue(BOB);
    act(() => {
      result.current.reauthenticate(BOB);
    });

    expect(first.close).toHaveBeenCalled();
    expect(sockets).toHaveLength(2);
    authenticate(latestSocket());
    expect(result.current.connection).toMatchObject({
      kind: "reconnect",
    });
  });

  it("replaces a socket that does not answer an in-place re-authentication", () => {
    const { result } = renderProvider();
    const ws = connectAs(result, ALICE);

    mockGetAuthJwt.mockReturnValue(ALICE_ROTATED);
    act(() => {
      result.current.reauthenticate(ALICE_ROTATED);
    });
    act(() => {
      jest.advanceTimersByTime(8_000);
    });

    expect(ws.close).toHaveBeenCalled();
    expect(sockets).toHaveLength(2);
    authenticate(latestSocket());
    expect(result.current.connection).toMatchObject({
      kind: "reconnect",
    });
    expect(latestSocket().sent[0]).toEqual({
      type: "AUTHENTICATE",
      access_token: ALICE_ROTATED,
    });
  });

  it("disconnects without retrying when the server rejects the rotated token", () => {
    const { result } = renderProvider();
    const ws = connectAs(result, ALICE);

    mockGetAuthJwt.mockReturnValue(ALICE_ROTATED);
    act(() => {
      result.current.reauthenticate(ALICE_ROTATED);
    });
    act(() => {
      ws.frame({ type: "AUTHENTICATION_FAILED" });
    });

    expect(result.current.status).toBe(WebSocketStatus.DISCONNECTED);
    expect(ws.close).toHaveBeenCalledWith(4008, "Authentication failed");
    act(() => {
      result.current.connect(ALICE_ROTATED);
    });
    expect(sockets).toHaveLength(1);
  });

  describe("ensureLive", () => {
    it("keeps a socket that delivered a frame since the given time", () => {
      const { result } = renderProvider();
      const ws = connectAs(result, ALICE);
      const hiddenAt = Date.now();
      act(() => {
        jest.advanceTimersByTime(30_000);
        ws.frame({ type: "DROP_UPDATE", data: {} });
        jest.advanceTimersByTime(60_000);
      });

      act(() => {
        result.current.ensureLive(hiddenAt);
      });

      expect(sockets).toHaveLength(1);
      expect(ws.close).not.toHaveBeenCalled();
      expect(ws.sent.map((frame) => frame.type)).toEqual(["AUTHENTICATE"]);
    });

    it("replaces a socket that was quiet while hidden, without probing it", () => {
      const { result } = renderProvider();
      const ws = connectAs(result, ALICE);
      act(() => {
        jest.advanceTimersByTime(5_000);
      });
      const hiddenAt = Date.now();
      act(() => {
        jest.advanceTimersByTime(120_000);
      });

      act(() => {
        result.current.ensureLive(hiddenAt);
      });

      // Servers before PING/PONG cannot answer a probe, so none is sent.
      expect(ws.sent.map((frame) => frame.type)).toEqual(["AUTHENTICATE"]);
      expect(ws.close).toHaveBeenCalled();
      expect(sockets).toHaveLength(2);
      authenticate(latestSocket());
      expect(result.current.connection).toMatchObject({
        kind: "reconnect",
      });
    });

    it("replaces a socket that is no longer open", () => {
      const { result } = renderProvider();
      const ws = connectAs(result, ALICE);
      const since = Date.now();
      act(() => {
        ws.frame({ type: "DROP_UPDATE", data: {} });
      });
      ws.readyState = MockWebSocket.CLOSED;

      act(() => {
        result.current.ensureLive(since);
      });

      expect(sockets).toHaveLength(2);
    });

    it("does nothing without a settled session", () => {
      const { result } = renderProvider();
      mockGetAuthJwt.mockReturnValue(ALICE);
      act(() => {
        result.current.connect(ALICE);
      });
      act(() => {
        latestSocket().open();
      });

      act(() => {
        result.current.ensureLive(Date.now() + 1);
      });

      expect(sockets).toHaveLength(1);
    });
  });
});
