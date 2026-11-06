type Collector = typeof import("@/services/analytics/telemetry/collector");

const HANDLE = "punk6529";
const WALLET = "0x1234567890abcdef1234567890abcdef12345678";
const WAVE_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
const DROP_ID = "9b2d7c1e-0f4a-4d5e-8b6c-7a1d2e3f4a5b";
const SECRET = "eyJhbGciOiJIUzI1NiJ9.secret-token-value";
const MESSAGE = "gm frens this is my private message";
const TITLE = "The Memes - Main Stage | punk6529";

const sendBeacon = jest.fn<boolean, [string, string]>(() => true);
const fetchMock = jest.fn(() => Promise.resolve(new Response(null)));

const loadCollector = (flag: string | undefined): Collector => {
  jest.resetModules();
  jest.doMock("@/config/env", () => ({
    publicEnv: { NEXT_PUBLIC_FEATURE_FIRST_PARTY_TELEMETRY: flag },
  }));
  return jest.requireActual<Collector>(
    "@/services/analytics/telemetry/collector"
  );
};

const sentBodies = (): string[] => [
  ...sendBeacon.mock.calls.map(([, body]) => body),
  ...fetchMock.mock.calls.map(
    (call) => ((call as unknown[])[1] as RequestInit).body as string
  ),
];
const sentEvents = () =>
  sentBodies().flatMap(
    (body) => (JSON.parse(body) as { events: Record<string, unknown>[] }).events
  );

const hidePage = () => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "hidden",
  });
  globalThis.dispatchEvent(new Event("visibilitychange"));
};

let collector: Collector;

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-11-06T10:00:00Z"));
  sendBeacon.mockClear();
  fetchMock.mockClear();
  Object.defineProperty(navigator, "sendBeacon", {
    configurable: true,
    value: sendBeacon,
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
  Object.defineProperty(document, "referrer", {
    configurable: true,
    value: "",
  });
  document.title = TITLE;
  window.history.replaceState(null, "", "/");
  collector = loadCollector("true");
});

afterEach(() => {
  collector.resetTelemetryForTests();
  jest.useRealTimers();
});

const viewPage = (pathname: string, route: string, pageGroup = "waves") => {
  window.history.replaceState(null, "", pathname);
  collector.recordPageView({ pathname, route, pageGroup, signedIn: true });
};

describe("first-party collector", () => {
  it("sends nothing when the flag is off", () => {
    collector = loadCollector(undefined);
    collector.setTelemetryCountry("US", false);
    viewPage("/waves/x", "/waves/[wave]");
    collector.recordProductEvent("Homepage section seen", {
      section: "Introduction",
    });
    collector.countApiRequest({
      endpoint: "/api/drops",
      status: 500,
      durationMs: 9000,
    });
    jest.runAllTimers();
    hidePage();
    expect(sendBeacon).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends one page-view batch with route templates only", () => {
    collector.setTelemetryCountry("US", false);
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: `https://www.google.com/search?q=${HANDLE}&token=${SECRET}`,
    });
    viewPage(`/waves/${WAVE_ID}?drop=${DROP_ID}`, "/waves/[wave]");
    jest.advanceTimersByTime(1500);

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    expect(sendBeacon.mock.calls[0]?.[0]).toBe("/e");
    const [pv] = sentEvents();
    expect(pv).toMatchObject({
      v: 1,
      t: "pv",
      route: "/waves/[wave]",
      page_group: "waves",
      prev_route: "entry",
      referrer_domain: "google.com",
      signed_in: true,
    });
    expect(JSON.parse(sentBodies()[0]!)).toMatchObject({ v: 1 });
  });

  it("keeps the previous route as a template and the referrer on entry only", () => {
    collector.setTelemetryCountry("US", false);
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "https://x.com/someone/status/123",
    });
    viewPage(`/${HANDLE}`, "/[user]", "profile");
    viewPage(`/waves/${WAVE_ID}`, "/waves/[wave]");
    jest.advanceTimersByTime(1500);
    const [first, second] = sentEvents();
    expect(first).toMatchObject({ route: "/[user]", referrer_domain: "x.com" });
    expect(second).toMatchObject({
      route: "/waves/[wave]",
      prev_route: "/[user]",
    });
    expect(second).not.toHaveProperty("referrer_domain");
  });

  it("drops internal referrers", () => {
    collector.setTelemetryCountry("US", false);
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: `https://6529.io/${HANDLE}`,
    });
    viewPage("/", "/", "home");
    jest.advanceTimersByTime(1500);
    expect(sentEvents()[0]).not.toHaveProperty("referrer_domain");
  });

  it("never sends URLs, queries, titles, handles, addresses, IDs, message text or tokens", () => {
    collector.setTelemetryCountry("US", false);
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: `https://evil.example/${WALLET}?secret=${SECRET}`,
    });
    // A route a caller forgot to template still cannot carry an identifier.
    viewPage(
      `/${HANDLE}/collected?address=${WALLET}`,
      `/${WALLET}/drops/${DROP_ID}/123456/${SECRET}`
    );
    collector.recordProductEvent("Homepage action clicked", {
      section: "Get started",
      action: MESSAGE,
      handle: HANDLE,
      wallet: WALLET,
      layout_version: WAVE_ID,
      screen_size: SECRET,
      signed_in: true,
    });
    collector.recordProductEvent("Auth Forced Logout", {
      reason: "session_refresh",
      route_pattern: `/${HANDLE}`,
      client_type: WALLET,
    });
    collector.recordProductEvent(`Typed ${MESSAGE}`, { text: MESSAGE });
    collector.countApiRequest({
      endpoint: `https://api.6529.io/api/profiles/${HANDLE}/drops/${DROP_ID}?wallet=${WALLET}&auth=${SECRET}`,
      status: 500,
      durationMs: 4000,
    });
    collector.countApiRequest({
      endpoint: `https://api.6529.io/api/waves/${WAVE_ID}/drops?serial_no_less_than=99`,
      status: "network_error",
      durationMs: 10,
    });
    const image = document.createElement("img");
    image.src = `https://ipfs.example/${WALLET}.png`;
    document.body.appendChild(image);
    image.dispatchEvent(new Event("error"));
    globalThis.dispatchEvent(
      new ErrorEvent("error", { message: `Failed for ${HANDLE} ${SECRET}` })
    );
    collector.recordVital("LCP", 1234.4);
    jest.advanceTimersByTime(1500);
    hidePage();

    const wire = sentBodies().join("\n");
    expect(wire.length).toBeGreaterThan(0);
    for (const forbidden of [
      HANDLE,
      WALLET.toLowerCase(),
      WALLET.slice(2, 12),
      WAVE_ID,
      DROP_ID,
      "123456",
      SECRET,
      "secret",
      MESSAGE,
      "gm frens",
      TITLE,
      "Main Stage",
      "http",
      "?",
      "evil.example/",
      "ipfs",
      "Mozilla",
    ]) {
      expect(wire).not.toContain(forbidden);
    }
    const events = sentEvents();
    expect(
      events.find(
        (e) => e["t"] === "ev" && e["name"] === "Homepage action clicked"
      )
    ).toMatchObject({
      p: { section: "Get started", signed_in: true },
    });
    expect(events.some((e) => String(e["name"] ?? "").includes("Typed"))).toBe(
      false
    );
  });

  it("aggregates health counters per page view by kind and endpoint template", () => {
    collector.setTelemetryCountry("US", false);
    viewPage(`/waves/${WAVE_ID}`, "/waves/[wave]");
    const script = document.createElement("script");
    document.body.appendChild(script);
    script.dispatchEvent(new Event("error"));
    script.dispatchEvent(new Event("error"));
    const video = document.createElement("video");
    document.body.appendChild(video);
    video.dispatchEvent(new Event("error"));
    globalThis.dispatchEvent(
      new ErrorEvent("error", {
        error: Object.assign(new Error("Loading chunk 12 failed"), {
          name: "ChunkLoadError",
        }),
      })
    );
    collector.countApiRequest({
      endpoint: `https://api.6529.io/api/drops/${DROP_ID}`,
      status: 503,
      durationMs: 50,
    });
    collector.countApiRequest({
      endpoint: `https://api.6529.io/api/drops/${DROP_ID}`,
      status: 200,
      durationMs: 3500,
    });
    collector.countApiRequest({
      endpoint: "https://api.6529.io/api/drops",
      status: "aborted",
      durationMs: 9000,
    });
    collector.countApiRequest({
      endpoint: "https://api.6529.io/api/drops",
      status: 404,
      durationMs: 20,
    });
    collector.countWebSocket("drop");
    collector.countWebSocket("reconnect");
    collector.countBoundaryError();
    viewPage("/", "/", "home");
    jest.advanceTimersByTime(1500);

    const health = sentEvents().filter((e) => e["t"] === "health");
    expect(health).toHaveLength(1);
    expect(health[0]).toMatchObject({
      route: "/waves/[wave]",
      c: {
        asset_fail: { script: 2, media: 1 },
        api_fail: { "/drops/[uuid]": 1 },
        api_slow: { "/drops/[uuid]": 1 },
        ws_drop: 1,
        ws_reconnect: 1,
        error: { chunk_load: 1, boundary: 1 },
      },
    });
  });

  it("sends vitals once, on the first hide, for the landing route", () => {
    collector.setTelemetryCountry("US", false);
    viewPage("/", "/", "home");
    collector.recordVital("LCP", 2500.6);
    collector.recordVital("CLS", 0.123456);
    collector.recordVital("INP", 999999);
    collector.recordVital("FID", 12);
    viewPage(`/waves/${WAVE_ID}`, "/waves/[wave]");
    hidePage();
    collector.recordVital("INP", 50);
    hidePage();
    const vitals = sentEvents().filter((e) => e["t"] === "vitals");
    expect(vitals).toEqual([
      expect.objectContaining({
        route: "/",
        lcp: 2501,
        cls: 0.1235,
        inp: 300000,
      }),
    ]);
    expect(vitals[0]).not.toHaveProperty("fid");
  });

  it("holds the page-view batch until the country is known, and sends it on hide without fp", () => {
    viewPage("/", "/", "home");
    jest.advanceTimersByTime(10_000);
    expect(sendBeacon).not.toHaveBeenCalled();
    hidePage();
    expect(sentEvents()[0]).toMatchObject({ t: "pv" });
    expect(sentEvents()[0]).not.toHaveProperty("fp");
  });

  it("falls back to fetch keepalive without credentials when sendBeacon refuses", () => {
    sendBeacon.mockReturnValueOnce(false);
    collector.setTelemetryCountry("US", false);
    viewPage("/", "/", "home");
    jest.advanceTimersByTime(1500);
    expect(fetchMock).toHaveBeenCalledWith(
      "/e",
      expect.objectContaining({
        method: "POST",
        keepalive: true,
        credentials: "omit",
      })
    );
  });

  it("rewrites a 404 page view to /[other], whichever commits first", () => {
    collector.setTelemetryCountry("US", false);
    collector.markPageNotFound(`/about/${HANDLE}`);
    viewPage(`/about/${HANDLE}`, `/about/${HANDLE}`, "about");
    viewPage(`/tools/${HANDLE}`, `/tools/${HANDLE}`, "tools");
    collector.markPageNotFound(`/tools/${HANDLE}`);
    jest.advanceTimersByTime(1500);
    const views = sentEvents().filter((e) => e["t"] === "pv");
    expect(views.map((e) => e["route"])).toEqual(["/[other]", "/[other]"]);
    expect(sentBodies().join()).not.toContain(HANDLE);
  });

  it("never reads keystrokes or form contents", () => {
    collector.setTelemetryCountry("US", false);
    viewPage("/messages", "/messages", "messages");
    const input = document.createElement("textarea");
    document.body.appendChild(input);
    input.value = MESSAGE;
    for (const key of MESSAGE) {
      input.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.form?.dispatchEvent(new Event("submit", { bubbles: true }));
    jest.advanceTimersByTime(1500);
    hidePage();
    const wire = sentBodies().join();
    expect(wire).not.toContain("frens");
    expect(wire).not.toContain("private");
    expect(sentEvents().map((e) => e["t"])).toEqual(["pv"]);
  });

  it("sets no cookies and uses no storage", () => {
    const setItem = jest.spyOn(Storage.prototype, "setItem");
    collector.setTelemetryCountry("US", false);
    viewPage("/", "/", "home");
    collector.recordProductEvent("Homepage section seen", {
      section: "Introduction",
    });
    jest.advanceTimersByTime(1500);
    hidePage();
    expect(setItem).not.toHaveBeenCalled();
    expect(document.cookie).toBe("");
    setItem.mockRestore();
  });

  it("keeps every batch within 40 events and 8 KB", () => {
    collector.setTelemetryCountry("US", false);
    viewPage("/", "/", "home");
    for (let i = 0; i < 150; i++)
      collector.recordProductEvent("Homepage section seen", {
        section: "Introduction",
      });
    hidePage();
    const bodies = sentBodies();
    expect(bodies.length).toBeGreaterThan(3);
    for (const body of bodies) {
      expect(body.length).toBeLessThanOrEqual(8192);
      expect(
        (JSON.parse(body) as { events: unknown[] }).events.length
      ).toBeLessThanOrEqual(40);
    }
  });
});

describe("fp (C52a)", () => {
  const viewHome = () => {
    viewPage("/", "/", "home");
    jest.advanceTimersByTime(1500);
    return sentEvents().find((e) => e["t"] === "pv");
  };

  it.each(["DE", "FR", "IE", "NO", "IS", "LI", "GB", "UK", "", "  ", "XX1"])(
    "is absent for country %p",
    (country) => {
      collector.setTelemetryCountry(country, false);
      expect(viewHome()).not.toHaveProperty("fp");
    }
  );

  it("is a short hash outside the EU/EEA/UK, with no raw trait values", () => {
    collector.setTelemetryCountry("US", false);
    const pv = viewHome();
    expect(pv?.["fp"]).toMatch(/^[A-Za-z0-9_-]{8,32}$/);
    const wire = sentBodies().join();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    for (const raw of [timeZone, navigator.language, "Mozilla", "jsdom"])
      expect(wire).not.toContain(raw);
  });
});
