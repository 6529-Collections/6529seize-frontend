import { act, cleanup, renderHook } from "@testing-library/react";
import { useWaveWebSocket } from "@/hooks/useWaveWebSocket";
import { getTypingSocketUrl } from "@/services/websocket/typingSocket";
import { AUTH_TOKEN_CHANGED_EVENT } from "@/services/auth/auth.utils";
import { fakeJwt } from "../helpers/fakeJwt";

let mockAppActive = true;
jest.mock("@/hooks/useMobileAppActivity", () => ({
  useMobileAppActivity: () => mockAppActive,
}));

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
  /** The frames sent, by type. */
  frames(): Array<Record<string, unknown>> {
    return this.send.mock.calls.map(
      ([frame]) => JSON.parse(String(frame)) as Record<string, unknown>
    );
  }
}

const OPEN_AFTER_VISIBLE_MS = 2_000;
const CLOSE_AFTER_IDLE_MS = 30_000;

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
function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}
const subscribeFrame = (waveId: string) => ({
  type: "SUBSCRIBE_TO_WAVE",
  wave_id: waveId,
});
const authenticateFrame = (token: string) => ({
  type: "AUTHENTICATE",
  access_token: token,
});

/** Lets the socket open (the tab has been visible long enough) and connect. */
function openSocket({ authenticate = true } = {}) {
  act(() => jest.advanceTimersByTime(OPEN_AFTER_VISIBLE_MS));
  act(() => socket().open());
  if (authenticate && mockToken) {
    act(() => socket().message({ type: "AUTHENTICATED" }));
  }
}

beforeEach(() => {
  mockAppActive = true;
  sockets = [];
  mockToken = null;
  mockTokenUsable = true;
  jest.useFakeTimers();
  setVisibility("visible");
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
  // The socket is shared by the tab: release every reader and let it close.
  cleanup();
  mockAppActive = true;
  setVisibility("visible");
  act(() => jest.advanceTimersByTime(CLOSE_AFTER_IDLE_MS + 1));
  Object.defineProperty(globalThis, "WebSocket", {
    configurable: true,
    value: originalWebSocket,
  });
  jest.useRealTimers();
});

it("declares the typing purpose and keeps other URL parts", () => {
  expect(getTypingSocketUrl("wss://ws.example/prod?region=eu")).toBe(
    "wss://ws.example/prod?region=eu&purpose=typing"
  );
  expect(getTypingSocketUrl("wss://ws.example/?purpose=app")).toBe(
    "wss://ws.example/?purpose=typing"
  );
  expect(getTypingSocketUrl("not a url")).toBe("not a url");
});

it("opens once the tab has been visible for 2 s and subscribes an anonymous reader", () => {
  const { result } = renderHook(() => useWaveWebSocket("wave"));
  act(() => jest.advanceTimersByTime(OPEN_AFTER_VISIBLE_MS - 1));
  expect(sockets).toHaveLength(0);

  openSocket();

  expect(socket().url).toBe("wss://waves.example/?purpose=typing");
  expect(socket().frames()).toEqual([subscribeFrame("wave")]);
  expect(result.current.socket).toBe(socket());
});

it("does not open in a hidden tab until it has been visible for 2 s", () => {
  setVisibility("hidden");
  renderHook(() => useWaveWebSocket("wave"));
  act(() => jest.advanceTimersByTime(60_000));
  expect(sockets).toHaveLength(0);

  act(() => setVisibility("visible"));
  act(() => jest.advanceTimersByTime(OPEN_AFTER_VISIBLE_MS - 1));
  expect(sockets).toHaveLength(0);
  act(() => jest.advanceTimersByTime(1));
  expect(sockets).toHaveLength(1);
});

it("authenticates in a frame before subscribing, without credentials in the URL", () => {
  mockToken = "sender-token";
  const { result } = renderHook(() => useWaveWebSocket("private-wave"));
  openSocket({ authenticate: false });

  expect(socket().url).toBe("wss://waves.example/?purpose=typing");
  expect(socket().frames()).toEqual([authenticateFrame("sender-token")]);
  expect(result.current.socket).toBeNull();

  act(() => socket().message({ type: "AUTHENTICATED" }));
  expect(socket().frames()).toEqual([
    authenticateFrame("sender-token"),
    subscribeFrame("private-wave"),
  ]);
  expect(result.current.socket).toBe(socket());
});

it("re-subscribes the same socket when the reader switches waves", () => {
  mockToken = "token";
  const { result, rerender } = renderHook(
    ({ wave }) => useWaveWebSocket(wave),
    { initialProps: { wave: "first" } }
  );
  openSocket();
  const shared = socket();

  rerender({ wave: "second" });

  expect(sockets).toHaveLength(1);
  expect(shared.close).not.toHaveBeenCalled();
  expect(shared.frames()).toEqual([
    authenticateFrame("token"),
    subscribeFrame("first"),
    subscribeFrame("second"),
  ]);
  expect(result.current.socket).toBe(shared);
});

it("follows the newest wave asked for and falls back when it is released", () => {
  const first = renderHook(() => useWaveWebSocket("first"));
  openSocket();
  const second = renderHook(() => useWaveWebSocket("second"));

  expect(first.result.current.socket).toBeNull();
  expect(second.result.current.socket).toBe(socket());

  second.unmount();

  expect(socket().frames()).toEqual([
    subscribeFrame("first"),
    subscribeFrame("second"),
    subscribeFrame("first"),
  ]);
  expect(first.result.current.socket).toBe(socket());
  expect(sockets).toHaveLength(1);
});

it("keeps the socket for 30 s after the reader leaves wave views", () => {
  const view = renderHook(() => useWaveWebSocket("wave"));
  openSocket();
  const shared = socket();
  view.unmount();

  act(() => jest.advanceTimersByTime(CLOSE_AFTER_IDLE_MS - 1));
  expect(shared.close).not.toHaveBeenCalled();

  // Coming back within the window reuses it.
  const back = renderHook(() => useWaveWebSocket("other"));
  expect(sockets).toHaveLength(1);
  expect(back.result.current.socket).toBe(shared);
  back.unmount();

  act(() => jest.advanceTimersByTime(CLOSE_AFTER_IDLE_MS));
  expect(shared.close).toHaveBeenCalledTimes(1);
});

it("reauthenticates and resubscribes the current wave after a transport close", () => {
  mockToken = "token";
  const { result, rerender } = renderHook(
    ({ wave }) => useWaveWebSocket(wave),
    { initialProps: { wave: "first" } }
  );
  openSocket();
  rerender({ wave: "second" });

  act(() => socket().close());
  expect(result.current.socket).toBeNull();
  act(() => jest.advanceTimersByTime(2_000));
  expect(sockets).toHaveLength(2);
  act(() => socket().open());
  act(() => socket().message({ type: "AUTHENTICATED" }));

  expect(socket().frames()).toEqual([
    authenticateFrame("token"),
    subscribeFrame("second"),
  ]);
  expect(result.current.socket).toBe(socket());
});

it("waits for the tab to be visible before reconnecting", () => {
  renderHook(() => useWaveWebSocket("wave"));
  openSocket();
  act(() => setVisibility("hidden"));
  act(() => socket().close());
  act(() => jest.advanceTimersByTime(60_000));
  expect(sockets).toHaveLength(1);

  act(() => setVisibility("visible"));
  act(() => jest.advanceTimersByTime(OPEN_AFTER_VISIBLE_MS));
  expect(sockets).toHaveLength(2);
});

it("does not downgrade rejected credentials or retry them, and retries a newer token", () => {
  mockToken = "rejected";
  const { result } = renderHook(() => useWaveWebSocket("wave"));
  openSocket({ authenticate: false });
  act(() => socket().message({ type: "AUTHENTICATION_FAILED" }));

  expect(socket().close).toHaveBeenCalledWith(4008, "Authentication failed");
  act(() => jest.advanceTimersByTime(60_000));
  expect(sockets).toHaveLength(1);
  expect(socket().frames()).toEqual([authenticateFrame("rejected")]);
  expect(result.current.socket).toBeNull();

  act(() => changeToken("replacement"));
  expect(sockets).toHaveLength(2);
  act(() => socket().open());
  expect(socket().frames()).toEqual([authenticateFrame("replacement")]);
});

it("bounds retries when the authentication acknowledgement never arrives", () => {
  mockToken = "token";
  renderHook(() => useWaveWebSocket("wave"));
  act(() => jest.advanceTimersByTime(OPEN_AFTER_VISIBLE_MS));
  for (let index = 0; index < 21; index += 1) {
    act(() => socket().open());
    act(() => jest.advanceTimersByTime(8_000));
    act(() => jest.advanceTimersByTime(2_000));
  }
  expect(sockets).toHaveLength(21);
  expect(socket().close).toHaveBeenCalledWith(4011, "Authentication timeout");
});

it("does not open for a disabled wave or with an expired credential", () => {
  const { rerender } = renderHook(({ wave }) => useWaveWebSocket(wave), {
    initialProps: { wave: "" },
  });
  act(() => jest.advanceTimersByTime(OPEN_AFTER_VISIBLE_MS));
  expect(sockets).toHaveLength(0);
  mockTokenUsable = false;
  act(() => changeToken("expired"));
  rerender({ wave: "wave" });
  act(() => jest.advanceTimersByTime(OPEN_AFTER_VISIBLE_MS));
  expect(sockets).toHaveLength(0);
});

it("closes while the native app is inactive and reopens on resume", () => {
  const { result, rerender } = renderHook(() => useWaveWebSocket("wave"));
  openSocket();
  const first = socket();

  mockAppActive = false;
  rerender();
  expect(first.close).toHaveBeenCalledTimes(1);
  expect(result.current.socket).toBeNull();
  act(() => jest.advanceTimersByTime(60_000));
  expect(sockets).toHaveLength(1);

  mockAppActive = true;
  rerender();
  // A resumed app waits until it has been visible for 2 s again.
  expect(sockets).toHaveLength(1);
  act(() => jest.advanceTimersByTime(OPEN_AFTER_VISIBLE_MS));
  expect(sockets).toHaveLength(2);
  act(() => socket().open());
  expect(socket().frames()).toEqual([subscribeFrame("wave")]);
  expect(result.current.socket).toBe(socket());
});

it("keeps a manual disconnect across activity changes but permits a new wave", () => {
  const { result, rerender } = renderHook(
    ({ wave }) => useWaveWebSocket(wave),
    { initialProps: { wave: "first" } }
  );
  openSocket();
  act(() => result.current.disconnect());
  expect(result.current.socket).toBeNull();
  mockAppActive = false;
  rerender({ wave: "first" });
  mockAppActive = true;
  rerender({ wave: "first" });
  act(() => jest.advanceTimersByTime(60_000));
  expect(result.current.socket).toBeNull();

  rerender({ wave: "second" });
  act(() => jest.advanceTimersByTime(OPEN_AFTER_VISIBLE_MS));
  act(() => socket().open());
  expect(socket().frames()).toContainEqual(subscribeFrame("second"));
  expect(result.current.socket).toBe(socket());
});

describe("tokens", () => {
  const ALICE = fakeJwt({ id: "1", sub: "0xalice" });
  const ALICE_ROTATED = fakeJwt({ id: "2", sub: "0xalice" });
  const BOB = fakeJwt({ id: "3", sub: "0xbob" });

  it("re-authenticates the open socket in place and keeps its subscription", () => {
    mockToken = ALICE;
    const { result } = renderHook(() => useWaveWebSocket("wave"));
    openSocket();

    act(() => changeToken(ALICE_ROTATED));

    expect(sockets).toHaveLength(1);
    expect(socket().frames()).toEqual([
      authenticateFrame(ALICE),
      subscribeFrame("wave"),
      authenticateFrame(ALICE_ROTATED),
    ]);
    act(() => socket().message({ type: "AUTHENTICATED" }));
    expect(socket().send).toHaveBeenCalledTimes(3);
    expect(result.current.socket).toBe(socket());
  });

  it("sends a token that rotated during the handshake once the first is accepted", () => {
    mockToken = ALICE;
    renderHook(() => useWaveWebSocket("wave"));
    openSocket({ authenticate: false });
    act(() => changeToken(ALICE_ROTATED));
    expect(socket().send).toHaveBeenCalledTimes(1);

    act(() => socket().message({ type: "AUTHENTICATED" }));

    expect(socket().frames()).toEqual([
      authenticateFrame(ALICE),
      subscribeFrame("wave"),
      authenticateFrame(ALICE_ROTATED),
    ]);
  });

  it("replaces the socket when the identity changes", () => {
    mockToken = ALICE;
    renderHook(() => useWaveWebSocket("wave"));
    openSocket();
    const first = socket();

    act(() => changeToken(BOB));

    expect(first.close).toHaveBeenCalledTimes(1);
    expect(sockets).toHaveLength(2);
    act(() => socket().open());
    expect(socket().frames()).toEqual([authenticateFrame(BOB)]);
  });
});
