import { publicEnv } from "@/config/env";
import * as lifecycle from "@/lib/action-lifecycle";
import * as recorder from "@/services/diagnostics/flightRecorder";

jest.mock("@/config/env", () => ({
  publicEnv: {
    NEXT_PUBLIC_FEATURE_SIGNED_MESSAGES: "true",
    NEXT_PUBLIC_E2EE_DM_ENABLED: "false",
    VERSION: "4.99.0",
  },
}));
const mockEnv = publicEnv as Record<string, string | undefined>;

const HANDLE = "punk6529";
const WALLET = "0x1234567890abcdef1234567890abcdef12345678";
const WAVE_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const SECRET = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.c2lnbmF0dXJl";
const MESSAGE = "gm frens this is my private message";

const network = {
  fetch: jest.fn(),
  sendBeacon: jest.fn(),
  xhrOpen: jest.fn(),
  webSocket: jest.fn(),
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-11-06T10:00:00Z"));
  sessionStorage.clear();
  localStorage.clear();
  for (const mock of Object.values(network)) mock.mockClear();
  globalThis.fetch = network.fetch as unknown as typeof fetch;
  Object.defineProperty(navigator, "sendBeacon", {
    configurable: true,
    value: network.sendBeacon,
  });
  jest
    .spyOn(XMLHttpRequest.prototype, "open")
    .mockImplementation(network.xhrOpen);
  (globalThis as { WebSocket: unknown }).WebSocket = network.webSocket;
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
  mockEnv["NEXT_PUBLIC_FEATURE_DIAGNOSTICS"] = "true";
  recorder.startFlightRecorder();
});

afterEach(() => {
  recorder.resetFlightRecorderForTests();
  jest.restoreAllMocks();
  jest.useRealTimers();
});

const hide = () => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "hidden",
  });
  globalThis.dispatchEvent(new Event("visibilitychange"));
};

describe("flight recorder", () => {
  it("records nothing and stores nothing with the flag off", () => {
    recorder.resetFlightRecorderForTests();
    mockEnv["NEXT_PUBLIC_FEATURE_DIAGNOSTICS"] = undefined;
    recorder.startFlightRecorder();
    recorder.recordFlightNavigation("/waves/[wave]");
    recorder.recordFlightError("boundary", new Error("boom"));
    hide();
    expect(sessionStorage.length).toBe(0);
  });

  it("records scrubbed navigation, API, WebSocket, action, error and long-task entries", () => {
    recorder.recordFlightNavigation(`/waves/${WAVE_ID}`);
    recorder.recordFlightNavigation("/waves/[wave]");
    recorder.recordFlightApi({
      method: "POST",
      endpoint: `https://api.6529.io/api/drops/${WAVE_ID}/reaction?wallet=${WALLET}&auth=${SECRET}`,
      status: 502,
      durationMs: 812.4,
      requestId: "a1b2c3d4-e5f6-4711-8899-aabbccddeeff",
    });
    recorder.recordFlightApi({
      method: "GET",
      endpoint: `https://api.6529.io/api/profiles/${HANDLE}`,
      status: 200,
      durationMs: 20,
      requestId: `bad id with ${HANDLE}`,
    });
    recorder.recordFlightWebSocket("disconnected");
    recorder.recordActionTransition({
      from: "sending",
      event: "SEND_ERROR",
      to: "send-failed",
      mode: "server",
      legal: true,
    });
    recorder.recordFlightError(
      "unhandled_error",
      new TypeError(
        `Cannot post "${MESSAGE}" for @${HANDLE} ${WALLET} ${WAVE_ID} at https://6529.io/${HANDLE}?token=${SECRET}`
      )
    );

    const snapshot = recorder.getFlightSnapshot();
    expect(snapshot).toMatchObject({
      v: 1,
      app_version: "4.99.0",
      route: "/waves/[wave]",
      flags: [
        "NEXT_PUBLIC_FEATURE_DIAGNOSTICS",
        "NEXT_PUBLIC_FEATURE_SIGNED_MESSAGES",
      ],
    });
    expect(snapshot.entries.map((entry) => entry.k)).toEqual([
      "nav",
      "nav",
      "api",
      "api",
      "ws",
      "action",
      "error",
    ]);
    expect(snapshot.entries[0]).toMatchObject({ route: "/waves/[x]" });
    expect(snapshot.entries[2]).toMatchObject({
      method: "POST",
      endpoint: "/drops/[id]/reaction",
      status: 502,
      ms: 812,
      request_id: "a1b2c3d4-e5f6-4711-8899-aabbccddeeff",
    });
    expect(snapshot.entries[3]).not.toHaveProperty("request_id");
    expect(snapshot.entries[6]).toMatchObject({
      kind: "unhandled_error",
      name: "TypeError",
    });

    const wire = JSON.stringify(snapshot);
    for (const forbidden of [
      HANDLE,
      WALLET,
      WALLET.slice(2, 12),
      WAVE_ID,
      SECRET,
      "secret",
      MESSAGE,
      "frens",
      "https://",
      "?",
    ])
      expect(wire).not.toContain(forbidden);
  });

  it("records real action-lifecycle transitions with nothing else attached", () => {
    const restoreReporter = lifecycle.setIllegalTransitionReporter(null);
    try {
      let state = lifecycle.createActionState("server");
      state = lifecycle.transition(state, {
        type: "SUBMIT",
        requiresSignature: false,
      });
      state = lifecycle.transition(state, { type: "SEND_OK" });
      // An illegal attempt is observed with to === from.
      lifecycle.transition(state, { type: "WALLET_REJECTED" });
    } finally {
      restoreReporter();
    }
    const actions = recorder
      .getFlightSnapshot()
      .entries.filter((entry) => entry.k === "action");
    expect(actions.length).toBeGreaterThanOrEqual(3);
    expect(actions[0]).toMatchObject({
      from: "draft",
      event: "SUBMIT",
      mode: "server",
      legal: true,
    });
    expect(actions.at(-1)).toMatchObject({
      event: "WALLET_REJECTED",
      legal: false,
    });
    const illegal = actions.at(-1) as { from: string; to: string };
    expect(illegal.to).toBe(illegal.from);

    // Stopping the recorder unsubscribes it.
    recorder.resetFlightRecorderForTests();
    recorder.startFlightRecorder();
    lifecycle.transition(lifecycle.createActionState("server"), {
      type: "SUBMIT",
      requiresSignature: false,
    });
    expect(
      recorder.getFlightSnapshot().entries.filter((e) => e.k === "action")
    ).toHaveLength(1);
  });

  it("keeps only the first app-chunk stack frame, without its query", () => {
    const error = new Error("boom");
    error.stack = [
      "Error: boom",
      "    at render (https://6529.io/_next/static/chunks/app-4f2a.js?dpl=abc:1:2345)",
      "    at https://6529.io/punk6529/collected:10:20",
    ].join("\n");
    recorder.recordFlightError("boundary", error);
    const thirdParty = new Error("x");
    thirdParty.stack = "Error: x\n    at https://evil.example/punk6529.js:1:1";
    recorder.recordFlightError("other", thirdParty);
    const [first, second] = recorder.getFlightSnapshot().entries;
    expect(first).toMatchObject({
      frame: "/_next/static/chunks/app-4f2a.js:1:2345",
    });
    expect(second).not.toHaveProperty("frame");
  });

  it("keeps only the last five minutes", () => {
    recorder.recordFlightNavigation("/a");
    jest.advanceTimersByTime(4 * 60 * 1000);
    recorder.recordFlightNavigation("/b");
    jest.advanceTimersByTime(2 * 60 * 1000);
    recorder.recordFlightNavigation("/c");
    expect(
      recorder
        .getFlightSnapshot()
        .entries.map((e) => (e as { route: string }).route)
    ).toEqual(["/b", "/c"]);
    jest.advanceTimersByTime(6 * 60 * 1000);
    expect(recorder.getFlightSnapshot().entries).toEqual([]);
  });

  it("stays within about 200 KB, dropping the oldest entries first", () => {
    const long = "word ".repeat(400);
    for (let i = 0; i < 5000; i++)
      recorder.recordFlightWebSocket(`state ${i % 10}`);
    for (let i = 0; i < 3000; i++)
      recorder.recordFlightError("other", new Error(long));
    const snapshot = recorder.getFlightSnapshot();
    const size = JSON.stringify(snapshot.entries).length;
    expect(size).toBeLessThanOrEqual(recorder.RECORDER_MAX_BYTES);
    expect(size).toBeGreaterThan(recorder.RECORDER_MAX_BYTES / 2);
    expect(snapshot.entries.every((e) => e.k === "error")).toBe(true);
  });

  it("writes a local copy on hide that survives a reload and is deleted after an hour", () => {
    recorder.recordFlightNavigation("/waves/[wave]");
    hide();
    const saved = JSON.parse(
      sessionStorage.getItem(recorder.LOCAL_COPY_KEY)!
    ) as {
      saved_at: number;
      entries: unknown[];
    };
    expect(saved.entries).toEqual([
      expect.objectContaining({ k: "nav", route: "/waves/[wave]" }),
      expect.objectContaining({ k: "visibility", state: "hidden" }),
    ]);

    // Reload: a new page load reads the copy as "previous".
    recorder.resetFlightRecorderForTests();
    jest.advanceTimersByTime(10 * 60 * 1000);
    recorder.startFlightRecorder();
    expect(recorder.getFlightSnapshot().previous?.entries).toHaveLength(2);

    jest.advanceTimersByTime(51 * 60 * 1000);
    expect(sessionStorage.getItem(recorder.LOCAL_COPY_KEY)).toBeNull();
    expect(recorder.getFlightSnapshot().previous).toBeNull();
  });

  it("ignores and removes a local copy older than an hour", () => {
    sessionStorage.setItem(
      "6529:flight-recorder",
      JSON.stringify({ saved_at: Date.now() - 61 * 60 * 1000, entries: [] })
    );
    recorder.resetFlightRecorderForTests();
    recorder.startFlightRecorder();
    expect(recorder.getFlightSnapshot().previous).toBeNull();
    expect(sessionStorage.getItem("6529:flight-recorder")).toBeNull();
  });

  it("writes the local copy when an error happens", () => {
    globalThis.dispatchEvent(
      new ErrorEvent("error", { error: new Error("boom"), message: "boom" })
    );
    expect(sessionStorage.getItem(recorder.LOCAL_COPY_KEY)).toContain(
      '"k":"error"'
    );
  });

  it("never sends anything or uses localStorage", () => {
    recorder.recordFlightNavigation("/waves/[wave]");
    recorder.recordFlightApi({
      method: "GET",
      endpoint: "/api/drops",
      status: 500,
      durationMs: 1,
    });
    recorder.recordFlightError("boundary", new Error("x"));
    hide();
    globalThis.dispatchEvent(new Event("pagehide"));
    recorder.getFlightSnapshot();
    jest.runAllTimers();
    expect(network.fetch).not.toHaveBeenCalled();
    expect(network.sendBeacon).not.toHaveBeenCalled();
    expect(network.xhrOpen).not.toHaveBeenCalled();
    expect(network.webSocket).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
    expect(document.cookie).toBe("");
  });
});
