import { act, renderHook } from "@testing-library/react";
import { useWaveWebSocket } from "@/hooks/useWaveWebSocket";
import { AUTH_TOKEN_CHANGED_EVENT } from "@/services/auth/auth.utils";

let mockToken: string | null = null;
let mockTokenUsable = true;
jest.mock("@/services/auth/auth.utils", () => ({
  AUTH_TOKEN_CHANGED_EVENT: "6529-auth-token-changed",
  getAuthJwt: () => mockToken,
  isAuthJwtUsable: () => mockTokenUsable,
}));
jest.mock("@/config/env", () => ({
  publicEnv: { WS_ENDPOINT: "wss://waves.example" },
}));

class MockWebSocket extends EventTarget {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 3;
  readyState = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  send = jest.fn();
  close = jest.fn(() => {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  });
  constructor(readonly url: string) {
    super();
  }
  open() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }
  message(data: unknown) {
    const event = new MessageEvent("message", { data: JSON.stringify(data) });
    this.onmessage?.(event);
    this.dispatchEvent(event);
  }
}

let sockets: MockWebSocket[];
const originalWebSocket = globalThis.WebSocket;
function socket(index = sockets.length - 1): MockWebSocket {
  const ws = sockets[index];
  if (!ws) throw new Error("Missing test socket");
  return ws;
}
function changeToken(token: string | null) {
  mockToken = token;
  window.dispatchEvent(new Event(AUTH_TOKEN_CHANGED_EVENT));
}

beforeEach(() => {
  sockets = [];
  mockToken = null;
  mockTokenUsable = true;
  jest.useFakeTimers();
  const factory = jest.fn((url: string) => {
    const ws = new MockWebSocket(url);
    sockets.push(ws);
    return ws;
  });
  Object.assign(factory, { CONNECTING: 0, OPEN: 1, CLOSED: 3 });
  Object.defineProperty(globalThis, "WebSocket", {
    configurable: true,
    value: factory,
  });
});
afterEach(() => {
  Object.defineProperty(globalThis, "WebSocket", {
    configurable: true,
    value: originalWebSocket,
  });
  jest.useRealTimers();
});

it("preserves anonymous public-wave subscriptions", () => {
  const { result } = renderHook(() => useWaveWebSocket("wave"));
  act(() => socket().open());
  expect(socket().send).toHaveBeenCalledWith(
    JSON.stringify({ type: "SUBSCRIBE_TO_WAVE", wave_id: "wave" })
  );
  expect(result.current.socket).toBe(socket());
});

it("authenticates in a frame before subscribing, without putting credentials in the URL", () => {
  mockToken = "sender-token";
  const { result } = renderHook(() => useWaveWebSocket("private-wave"));
  act(() => socket().open());
  expect(socket().url).toBe("wss://waves.example");
  expect(socket().send.mock.calls).toEqual([
    [JSON.stringify({ type: "AUTHENTICATE", access_token: "sender-token" })],
  ]);
  expect(result.current.socket).toBeNull();
  act(() => socket().message({ type: "AUTHENTICATED", identity_id: "sender" }));
  expect(socket().send).toHaveBeenLastCalledWith(
    JSON.stringify({ type: "SUBSCRIBE_TO_WAVE", wave_id: "private-wave" })
  );
  expect(result.current.socket).toBe(socket());
  act(() => socket().message({ type: "AUTHENTICATED" }));
  expect(socket().send).toHaveBeenCalledTimes(2);
});

it("replaces subscriptions on refresh, profile switch and logout", () => {
  mockToken = "alice-token";
  const { result } = renderHook(() => useWaveWebSocket("wave"));
  for (const token of ["alice-refreshed", "bob-token", null]) {
    const previous = socket();
    act(() => {
      previous.open();
      previous.message({ type: "AUTHENTICATED" });
    });
    act(() => changeToken(token));
    expect(previous.close).toHaveBeenCalledTimes(1);
    expect(result.current.socket).toBeNull();
    act(() => {
      socket().open();
      if (token) socket().message({ type: "AUTHENTICATED" });
    });
    expect(result.current.socket).toBe(socket());
    expect(socket().send.mock.calls[0]?.[0]).toBe(
      JSON.stringify(
        token
          ? { type: "AUTHENTICATE", access_token: token }
          : { type: "SUBSCRIBE_TO_WAVE", wave_id: "wave" }
      )
    );
  }
});

it("ignores late callbacks from an old wave and cleans pending reconnects", () => {
  const { result, rerender, unmount } = renderHook(
    ({ wave }) => useWaveWebSocket(wave),
    { initialProps: { wave: "first" } }
  );
  const first = socket();
  rerender({ wave: "second" });
  act(() => {
    first.open();
    first.onclose?.();
    first.onerror?.();
  });
  expect(first.send).not.toHaveBeenCalled();
  expect(result.current.socket).toBeNull();
  act(() => socket().close());
  unmount();
  act(() => jest.advanceTimersByTime(2000));
  expect(sockets).toHaveLength(2);
});

it("reauthenticates and resubscribes after a transport disconnect", () => {
  mockToken = "token";
  const { result } = renderHook(() => useWaveWebSocket("wave"));
  act(() => {
    socket().open();
    socket().message({ type: "AUTHENTICATED" });
  });
  act(() => socket().close());
  expect(result.current.socket).toBeNull();
  act(() => jest.advanceTimersByTime(2000));
  act(() => socket().open());
  expect(socket().send).toHaveBeenLastCalledWith(
    JSON.stringify({ type: "AUTHENTICATE", access_token: "token" })
  );
  act(() => socket().message({ type: "AUTHENTICATED" }));
  expect(result.current.socket).toBe(socket());
});

it("does not downgrade rejected credentials to an anonymous subscription or retry them", () => {
  mockToken = "rejected";
  const { result } = renderHook(() => useWaveWebSocket("wave"));
  act(() => {
    socket().open();
    socket().message({ type: "AUTHENTICATION_FAILED" });
  });
  act(() => jest.advanceTimersByTime(60000));
  expect(sockets).toHaveLength(1);
  expect(socket().send).toHaveBeenCalledTimes(1);
  expect(result.current.socket).toBeNull();
  act(() => changeToken("replacement"));
  expect(sockets).toHaveLength(2);
});

it("bounds retries when the authentication acknowledgement never arrives", () => {
  mockToken = "token";
  renderHook(() => useWaveWebSocket("wave"));
  for (let index = 0; index < 21; index += 1) {
    act(() => socket().open());
    act(() => jest.advanceTimersByTime(8000));
    act(() => jest.advanceTimersByTime(2000));
  }
  expect(sockets).toHaveLength(21);
  expect(socket().close).toHaveBeenCalledWith(4011, "Authentication timeout");
});

it("does not open a disabled wave or use an expired credential", () => {
  const { rerender } = renderHook(({ wave }) => useWaveWebSocket(wave), {
    initialProps: { wave: "" },
  });
  expect(sockets).toHaveLength(0);
  mockTokenUsable = false;
  act(() => changeToken("expired"));
  rerender({ wave: "wave" });
  expect(sockets).toHaveLength(0);
});

it("manual disconnect prevents further reconnects", () => {
  const { result } = renderHook(() => useWaveWebSocket("wave"));
  act(() => result.current.disconnect());
  act(() => jest.advanceTimersByTime(60000));
  expect(socket().close).toHaveBeenCalledTimes(1);
  expect(result.current.socket).toBeNull();
  expect(sockets).toHaveLength(1);
});
