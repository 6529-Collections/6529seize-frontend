import { act, renderHook } from "@testing-library/react";
import { useWaveIsTyping } from "@/hooks/useWaveIsTyping";
import { useCreateDropTyping } from "@/components/waves/create-drop-content/useCreateDropTyping";
import { WsMessageType } from "@/helpers/Types";
import { AUTH_TOKEN_CHANGED_EVENT } from "@/services/auth/auth.utils";

let mockToken: string | null = "alice-token";
jest.mock("@/services/auth/auth.utils", () => ({
  AUTH_TOKEN_CHANGED_EVENT: "6529-auth-token-changed",
  getAuthJwt: () => mockToken,
  isAuthJwtUsable: () => true,
}));
jest.mock("@/config/env", () => ({
  publicEnv: { WS_ENDPOINT: "wss://waves.example" },
}));
const mockGlobalSend = jest.fn();
jest.mock("@/services/websocket", () => ({
  useWebSocket: () => ({ send: mockGlobalSend }),
}));

type Connection = { identity: string | null; wave: string | null };
class WaveSocket extends EventTarget {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 3;
  readyState = 0;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  readonly connection: Connection = { identity: null, wave: null };
  send = jest.fn((payload: string) => {
    const message = JSON.parse(payload) as {
      type: string;
      wave_id?: string;
      access_token?: string;
    };
    if (message.type === "AUTHENTICATE") this.connection.identity = "alice";
    if (message.type === WsMessageType.SUBSCRIBE_TO_WAVE)
      this.connection.wave = message.wave_id ?? null;
  });
  close = jest.fn(() => {
    this.readyState = 3;
    this.onclose?.();
  });
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  receive(payload: unknown) {
    const event = new MessageEvent("message", {
      data: JSON.stringify(payload),
    });
    this.onmessage?.(event);
    this.dispatchEvent(event);
  }
}

let sockets: WaveSocket[];
const originalWebSocket = globalThis.WebSocket;
function socket(): WaveSocket {
  const ws = sockets.at(-1);
  if (!ws) throw new Error("Missing wave socket");
  return ws;
}

beforeEach(() => {
  mockToken = "alice-token";
  sockets = [];
  mockGlobalSend.mockReset();
  jest.useFakeTimers();
  const factory = jest.fn(() => {
    const ws = new WaveSocket();
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

it.each([false, true])(
  "delivers typing through the real composer and listener hooks (private=%s)",
  (privateWave) => {
    const wave = "wave";
    // Mirrors the backend recipient contract: the app socket is authenticated but
    // has no active wave; a separate authenticated wave subscription is required.
    const globalConnection: Connection = { identity: "alice", wave: null };
    const peerConnection: Connection = { identity: "bob", wave };
    const peerMessages: string[] = [];
    const rejected: string[] = [];
    const broadcast = (sender: string, level = 1) => {
      const recipients = [
        globalConnection,
        peerConnection,
        ...sockets.map((ws) => ws.connection),
      ]
        .filter((connection) => connection.wave === wave)
        .filter(
          (connection) =>
            !privateWave ||
            ["alice", "bob", "carol", "dave"].includes(
              connection.identity ?? ""
            )
        );
      if (!recipients.some((connection) => connection.identity === sender)) {
        rejected.push(sender);
        return;
      }
      for (const ws of sockets) {
        if (recipients.includes(ws.connection))
          ws.receive({
            type: WsMessageType.USER_IS_TYPING,
            data: { wave_id: wave, profile: { handle: sender, level } },
          });
      }
      if (recipients.includes(peerConnection)) peerMessages.push(sender);
    };
    mockGlobalSend.mockImplementation((type: WsMessageType) => {
      if (type === WsMessageType.USER_IS_TYPING) broadcast("alice");
    });
    const { result, rerender } = renderHook(
      ({ markdown }) => {
        useCreateDropTyping({ markdown, waveId: wave });
        return useWaveIsTyping(wave, "alice");
      },
      { initialProps: { markdown: "" } }
    );
    act(() => socket().open());
    expect(socket().connection.wave).toBeNull();
    rerender({ markdown: "before authentication" });
    expect(rejected).toEqual(["alice"]);
    act(() =>
      socket().receive({ type: "AUTHENTICATED", identity_id: "alice" })
    );
    expect(socket().connection).toEqual({ identity: "alice", wave });
    rerender({ markdown: "after authentication" });
    act(() => jest.advanceTimersByTime(4000));
    expect(peerMessages).toEqual(["alice"]);
    expect(result.current).toBe("");
    act(() => {
      broadcast("bob");
      jest.advanceTimersByTime(1000);
    });
    expect(result.current).toBe("bob is typing");
    expect(mockGlobalSend).toHaveBeenCalledWith(WsMessageType.USER_IS_TYPING, {
      wave_id: wave,
    });
    expect(
      mockGlobalSend.mock.calls.every(
        ([type]) => type === WsMessageType.USER_IS_TYPING
      )
    ).toBe(true);
    act(() => jest.advanceTimersByTime(6000));
    expect(result.current).toBe("");
  }
);

it("clears private typing on logout and ignores the closed account's messages", () => {
  const { result } = renderHook(() => useWaveIsTyping("private-wave", "alice"));
  const previous = socket();
  act(() => {
    previous.open();
    previous.receive({ type: "AUTHENTICATED" });
  });
  const typing = {
    type: WsMessageType.USER_IS_TYPING,
    data: {
      wave_id: "private-wave",
      profile: { handle: "bob", level: 1 },
    },
  };
  act(() => {
    previous.receive(typing);
    jest.advanceTimersByTime(1000);
  });
  expect(result.current).toBe("bob is typing");
  act(() => {
    mockToken = null;
    window.dispatchEvent(new Event(AUTH_TOKEN_CHANGED_EVENT));
  });
  expect(result.current).toBe("");
  expect(previous.close).toHaveBeenCalled();
  act(() => {
    previous.receive(typing);
    socket().open();
    jest.advanceTimersByTime(1000);
  });
  expect(result.current).toBe("");
});
