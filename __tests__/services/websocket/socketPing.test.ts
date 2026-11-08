import {
  isPongFrame,
  isWsPingEnabled,
  KEEPALIVE_IDLE_MS,
  MAX_MISSED_PONGS,
  PONG_TIMEOUT_MS,
  SocketPinger,
} from "@/services/websocket/socketPing";
import { mockRandomUnit } from "../../helpers/mockRandomUnit";

const mockPublicEnv: { NEXT_PUBLIC_FEATURE_WS_PING?: string } = {};
jest.mock("@/config/env", () => ({
  get publicEnv() {
    return mockPublicEnv;
  },
}));

const PING_ID = /^[A-Za-z0-9_.:-]{1,32}$/;

function fakeSocket() {
  const sent: Array<{ readonly type: string; readonly id?: string }> = [];
  const ws: { readyState: number; send: jest.Mock } = {
    readyState: WebSocket.OPEN,
    send: jest.fn((frame: string) => {
      sent.push(JSON.parse(frame) as { type: string; id?: string });
    }),
  };
  return { ws: ws as unknown as WebSocket, sent, raw: ws };
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

let restoreRandom: jest.SpyInstance;
let pingers: SocketPinger[];
function pinger(ws: WebSocket, onDead = jest.fn()) {
  const created = new SocketPinger(ws, onDead);
  pingers.push(created);
  return created;
}

beforeEach(() => {
  jest.useFakeTimers();
  restoreRandom = mockRandomUnit(0.5);
  pingers = [];
  setVisibility("visible");
});
afterEach(() => {
  for (const created of pingers) created.stop();
  restoreRandom.mockRestore();
  jest.useRealTimers();
});

it("is on only when the build flag is exactly true", () => {
  delete mockPublicEnv.NEXT_PUBLIC_FEATURE_WS_PING;
  expect(isWsPingEnabled()).toBe(false);
  mockPublicEnv.NEXT_PUBLIC_FEATURE_WS_PING = "1";
  expect(isWsPingEnabled()).toBe(false);
  mockPublicEnv.NEXT_PUBLIC_FEATURE_WS_PING = "true";
  expect(isWsPingEnabled()).toBe(true);
});

it("recognizes PONG frames only", () => {
  expect(isPongFrame({ type: "PONG", id: "p1" })).toBe(true);
  expect(isPongFrame({ type: "PING", id: "p1" })).toBe(false);
  expect(isPongFrame(null)).toBe(false);
  expect(isPongFrame("PONG")).toBe(false);
});

describe("keepalive", () => {
  it("pings a visible quiet socket before the gateway's idle timeout", () => {
    const { ws, sent } = fakeSocket();
    pinger(ws);

    jest.advanceTimersByTime(KEEPALIVE_IDLE_MS - 1);
    expect(sent).toEqual([]);
    jest.advanceTimersByTime(1);

    expect(sent).toEqual([
      { type: "PING", id: expect.stringMatching(PING_ID) },
    ]);
    expect(KEEPALIVE_IDLE_MS).toBeLessThan(10 * 60_000);
  });

  it("jitters the quiet spell by up to 10%", () => {
    restoreRandom.mockRestore();
    restoreRandom = mockRandomUnit(0);
    const early = fakeSocket();
    pinger(early.ws);
    jest.advanceTimersByTime(KEEPALIVE_IDLE_MS * 0.9);
    expect(early.sent).toHaveLength(1);

    restoreRandom.mockRestore();
    restoreRandom = mockRandomUnit(0.999_999);
    const late = fakeSocket();
    pinger(late.ws);
    jest.advanceTimersByTime(KEEPALIVE_IDLE_MS * 1.1 - 2);
    expect(late.sent).toHaveLength(0);
    jest.advanceTimersByTime(2);
    expect(late.sent).toHaveLength(1);
  });

  it("counts frames either way as activity", () => {
    const { ws, sent } = fakeSocket();
    const keepalive = pinger(ws);

    jest.advanceTimersByTime(KEEPALIVE_IDLE_MS - 1_000);
    keepalive.noteReceived();
    jest.advanceTimersByTime(KEEPALIVE_IDLE_MS - 1_000);
    keepalive.noteSent();
    jest.advanceTimersByTime(KEEPALIVE_IDLE_MS - 1);
    expect(sent).toEqual([]);

    jest.advanceTimersByTime(1);
    expect(sent).toHaveLength(1);
  });

  it("sends nothing from a hidden tab and pings when it is shown after the spell", () => {
    const { ws, sent } = fakeSocket();
    pinger(ws);
    setVisibility("hidden");

    jest.advanceTimersByTime(KEEPALIVE_IDLE_MS * 3);
    expect(sent).toEqual([]);

    setVisibility("visible");
    expect(sent).toEqual([
      { type: "PING", id: expect.stringMatching(PING_ID) },
    ]);
  });

  it("waits out the rest of the spell when a tab is shown early", () => {
    const { ws, sent } = fakeSocket();
    pinger(ws);
    setVisibility("hidden");
    jest.advanceTimersByTime(60_000);
    setVisibility("visible");
    expect(sent).toEqual([]);

    jest.advanceTimersByTime(KEEPALIVE_IDLE_MS - 60_000);
    expect(sent).toHaveLength(1);
  });

  it("re-arms after an answer", () => {
    const { ws, sent } = fakeSocket();
    const keepalive = pinger(ws);
    jest.advanceTimersByTime(KEEPALIVE_IDLE_MS);
    keepalive.noteReceived();

    jest.advanceTimersByTime(KEEPALIVE_IDLE_MS);

    expect(sent).toHaveLength(2);
    expect(sent[1]?.id).not.toBe(sent[0]?.id);
  });
});

describe("liveness", () => {
  it("probes at once and treats any received frame as the answer", () => {
    const { ws, sent } = fakeSocket();
    const onDead = jest.fn();
    const keepalive = pinger(ws, onDead);

    keepalive.probe();
    keepalive.probe();
    expect(sent).toHaveLength(1);
    keepalive.noteReceived();
    jest.advanceTimersByTime(PONG_TIMEOUT_MS * MAX_MISSED_PONGS * 2);

    expect(onDead).not.toHaveBeenCalled();
    expect(sent).toHaveLength(1);
  });

  it("reports a socket dead once after two unanswered PINGs", () => {
    const { ws, sent } = fakeSocket();
    const onDead = jest.fn();
    const keepalive = pinger(ws, onDead);

    keepalive.probe();
    jest.advanceTimersByTime(PONG_TIMEOUT_MS - 1);
    expect(sent).toHaveLength(1);
    jest.advanceTimersByTime(1);
    expect(sent).toHaveLength(2);
    expect(onDead).not.toHaveBeenCalled();
    jest.advanceTimersByTime(PONG_TIMEOUT_MS);

    expect(MAX_MISSED_PONGS).toBe(2);
    expect(onDead).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(KEEPALIVE_IDLE_MS * 2);
    keepalive.probe();
    expect(sent).toHaveLength(2);
    expect(onDead).toHaveBeenCalledTimes(1);
  });

  it("does not ping a socket that is no longer open", () => {
    const { ws, sent, raw } = fakeSocket();
    const keepalive = pinger(ws);
    raw.readyState = WebSocket.CLOSED;

    keepalive.probe();
    jest.advanceTimersByTime(KEEPALIVE_IDLE_MS * 2);

    expect(sent).toEqual([]);
  });

  it("stops every timer and listener", () => {
    const { ws, sent } = fakeSocket();
    const onDead = jest.fn();
    const keepalive = pinger(ws, onDead);
    keepalive.probe();
    keepalive.stop();

    jest.advanceTimersByTime(KEEPALIVE_IDLE_MS * 2);
    setVisibility("hidden");
    setVisibility("visible");

    expect(sent).toHaveLength(1);
    expect(onDead).not.toHaveBeenCalled();
  });
});
