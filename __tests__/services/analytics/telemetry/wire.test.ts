import { detectBrowser } from "@/services/analytics/telemetry/environment";
import {
  encodeBatches,
  guardRoute,
  isEnumValue,
  toHealthCounts,
  toProductEvent,
  toReferrerDomain,
  type WireEvent,
} from "@/services/analytics/telemetry/wire";

describe("guardRoute", () => {
  it.each([
    ["/waves/[wave]", "/waves/[wave]"],
    ["/[user]/[...cmsPath]", "/[user]/[...cmsPath]"],
    ["/nextgen/[[...view]]", "/nextgen/[[...view]]"],
    ["/drops/:id", "/drops/:id"],
    ["/about/mission?x=1", "/about/mission"],
    ["/0x1234567890abcdef1234567890abcdef12345678", "/[x]"],
    ["/waves/3fa85f64-5717-4562-b3fc-2c963f66afa6", "/waves/[x]"],
    ["/the-memes/123", "/the-memes/[x]"],
    ["/Punk6529", "/[x]"],
    ["/a/b/c/d/e/f/g/h/i/j", "/a/b/c/d/e/f/g/h"],
    ["/eyJhbGciOiJIUzI1NiJ9abcdefghij", "/[x]"],
    [
      "/tools/app-wallets/[app-wallet-address]",
      "/tools/app-wallets/[app_wallet_address]",
    ],
    ["/about/mission.md", "/about/[x]"],
    ["/[user]/[...cmsPath", "/[user]/[x]"],
    ["/[[...view]", "/[x]"],
    [":handle/collected", "/:handle/collected"],
    ["/" + "a".repeat(41) + "/b/c/d", "/[x]/b/c/d"],
  ])("guards %p", (route, expected) => {
    expect(guardRoute(route)).toBe(expected);
  });
});

describe("toProductEvent", () => {
  it("drops unregistered events", () => {
    expect(toProductEvent("Page Viewed", { route_pattern: "/" })).toBeNull();
    expect(toProductEvent("anything typed")).toBeNull();
  });

  it("keeps registry props only, renames platform to client and caps at six", () => {
    expect(
      toProductEvent("Profile action clicked", {
        section: "Artwork",
        action: "Open artwork",
        platform: "mobile_web",
        profile_tab: "Collected",
        profile_viewer_context: "own_profile",
        route_pattern: "/:handle/collected",
        logical_page: "profile_collected",
        extra: "x",
      })
    ).toEqual({
      name: "Profile action clicked",
      p: {
        section: "Artwork",
        action: "Open artwork",
        client: "mobile_web",
        profile_tab: "Collected",
        profile_viewer_context: "own_profile",
      },
    });
    const many = toProductEvent("Auth Forced Logout", {
      client_type: "web",
      reason: "session_refresh",
      refresh_outcome: "failed",
      auth_state_before: "authenticated",
      auth_state_after: "logged_out",
      product_failure: true,
      was_connected_wallet: false,
      status_bucket: "2xx",
    });
    expect(Object.keys(many?.p ?? {})).toHaveLength(6);
  });

  it("drops numbers, objects and identifier-shaped strings", () => {
    expect(
      toProductEvent("Wave Feed Load Succeeded", {
        load_source: "cache",
        duration_bucket: "1s_3s",
        drop_count_bucket: 42,
        status_bucket: { nested: true },
        error_kind: "0xabcdef",
        is_native: false,
      })?.p
    ).toEqual({
      load_source: "cache",
      duration_bucket: "1s_3s",
      is_native: false,
    });
  });
});

describe("isEnumValue", () => {
  it.each([
    "Open network health",
    "session_upgrade_deadline_expired",
    "50+",
    "10-49",
    "1",
  ])("accepts %p", (value) => expect(isEnumValue(value)).toBe(true));
  it.each([
    "gm frens this is my private message",
    "https://6529.io/punk6529",
    "/waves/abc",
    "0x1234",
    "3fa85f64-5717-4562",
    "12345",
    "eyJhbGciOiJIUzI1NiJ9abcdef",
    "",
    " leading",
    "a?b=c",
  ])("rejects %p", (value) => expect(isEnumValue(value)).toBe(false));
});

describe("toReferrerDomain", () => {
  it.each([
    ["https://www.google.com/search?q=x", "google.com"],
    ["https://t.co/abc", "t.co"],
    ["https://6529.io/x", undefined],
    ["https://staging.6529.io/x", undefined],
    ["https://www.6529.io/", undefined],
    ["android-app://com.google/", undefined],
    ["", undefined],
    ["not a url", undefined],
    ["http://192.168.0.1/x", undefined],
    ["https://[::1]/", undefined],
    ["https://localhost/", undefined],
  ])("%p -> %p", (referrer, expected) => {
    expect(toReferrerDomain(referrer, "6529.io")).toBe(expected);
  });
});

describe("toHealthCounts", () => {
  it("drops empty counters, clamps counts and caps dimension keys", () => {
    const api = Object.fromEntries(
      Array.from({ length: 20 }, (_, i) => [`/e${i}`, 1])
    );
    const counts = toHealthCounts({
      ws_drop: 0,
      long_task: 20000,
      api_fail: api,
      error: {},
    });
    expect(counts).toEqual({
      long_task: 10000,
      api_fail: expect.any(Object),
    });
    expect(Object.keys(counts?.api_fail ?? {})).toHaveLength(16);
    expect(toHealthCounts({})).toBeNull();
  });
});

describe("encodeBatches", () => {
  it("drops a single event that cannot fit in 8 KB", () => {
    const huge = {
      v: 1,
      t: "ev",
      route: "/",
      device: "desktop",
      platform: "web",
      name: "x".repeat(9000),
      p: {},
    } as WireEvent;
    expect(encodeBatches([huge])).toEqual([]);
  });
});

describe("detectBrowser", () => {
  it.each([
    [
      "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
      "chrome",
      "142",
    ],
    [
      "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0",
      "edge",
      "142",
    ],
    ["Mozilla/5.0 (Macintosh) Gecko/20100101 Firefox/144.0", "firefox", "144"],
    [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      "safari",
      "18",
    ],
    [
      "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/142.0 Mobile/15E148 Safari/604.1",
      "chrome",
      "142",
    ],
    ["curl/8.0", "other", ""],
  ])("%p", (ua, browser, major) => {
    expect(detectBrowser(ua)).toEqual({ browser, major });
  });
});
