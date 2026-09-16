import {
  getMobileAppLink,
  getMobilePlatform,
  getNativeLinkDestination,
  isMobileAppDestination,
} from "@/helpers/mobileAppLinks";

const origin = "https://6529.io";
const androidChrome =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36";
const destination = "/waves/123?drop=456&tag=a&tag=b&search=a%26b%23c#drop-456";
const args = {
  destination,
  origin,
  scheme: "mobile6529",
  userAgent: "iPhone Safari",
};

describe("mobile app links", () => {
  it("opens directly and round-trips the wave, drop, repeated query values and fragment", () => {
    const link = getMobileAppLink(args)!;
    expect(link).toBe(`mobile6529://navigate${destination}`);
    const result = new URL(
      getNativeLinkDestination(link, "mobile6529", origin, 123)!,
      origin
    );
    expect(result.pathname).toBe("/waves/123");
    expect(result.searchParams.get("drop")).toBe("456");
    expect(result.searchParams.getAll("tag")).toEqual(["a", "b"]);
    expect(result.searchParams.get("search")).toBe("a&b#c");
    expect(result.searchParams.get("_t")).toBe("123");
    expect(result.hash).toBe("#drop-456");
  });

  it.each([
    "/",
    "/prxt0/collected?view=grid",
    "/the-memes/548",
    "/messages?wave=123&drop=456",
    "/tools/block-finder",
  ])("preserves supported destination %s", (path) => {
    expect(getMobileAppLink({ ...args, destination: path })).toBe(
      `mobile6529://navigate${path}`
    );
  });

  it("uses Android Chrome's package-targeted intent and preserves the fallback destination", () => {
    const link = getMobileAppLink({ ...args, userAgent: androidChrome })!;
    expect(link).toContain(
      `intent://navigate${destination}#Intent;scheme=mobile6529;package=com.core6529.app;`
    );
    const encodedFallback = link
      .split("S.browser_fallback_url=")[1]!
      .split(";end")[0]!;
    const fallback = new URL(decodeURIComponent(encodedFallback));
    expect(fallback.origin).toBe(origin);
    expect(fallback.pathname).toBe("/open-mobile");
    expect(fallback.searchParams.get("path")).toBe(destination);
  });

  it("retries directly on the fallback page without an intent loop", () => {
    expect(
      getMobileAppLink({ ...args, userAgent: androidChrome, useIntent: false })
    ).toBe(`mobile6529://navigate${destination}`);
  });

  it.each([
    "Android Firefox/140",
    "Android Chrome/140 SamsungBrowser/28",
    "Android; wv) Chrome/140",
  ])("uses a scheme in other or embedded browsers: %s", (userAgent) => {
    expect(getMobileAppLink({ ...args, userAgent })).toBe(
      `mobile6529://navigate${destination}`
    );
  });

  it.each([
    "//evil.example",
    "/bad%",
    "/%2Fexample.com",
    "/open-mobile?path=/waves/1",
    "/auth/callback",
    "/access",
    "/app-wallets",
    "/tools/app-wallets",
    "/tools/app-wallets/import-wallet",
    "/tools/app-wallets/0x123?tab=details#wallet",
    "/tools/%61pp-wallets",
    "/accept-connection-sharing?token=secret",
    "/%6fpen-mobile",
  ])(
    "does not advertise or hand off unsafe/unsupported destination %s",
    (path) => {
      expect(getMobileAppLink({ ...args, destination: path })).toBeNull();
    }
  );

  it("handles a malformed pathname without crashing the shell", () => {
    expect(isMobileAppDestination("/bad%")).toBe(false);
  });

  it("preserves connection-sharing scope behavior", () => {
    const result = new URL(
      getNativeLinkDestination(
        "mobile6529://share-connection?code=abc%26def",
        "mobile6529",
        origin,
        123
      )!,
      origin
    );
    expect(result.pathname).toBe("/accept-connection-sharing");
    expect(result.searchParams.get("code")).toBe("abc&def");
  });

  it.each([
    "https://navigate/waves/1",
    "javascript:alert(1)",
    "mobile6529://unknown/waves/1",
    "mobile6529://user@navigate/waves/1",
    "mobile6529://navigate//example.com",
    "mobile6529://navigate/bad%",
    "garbage",
  ])("rejects untrusted native URL %s", (value) => {
    expect(
      getNativeLinkDestination(value, "mobile6529", origin, 123)
    ).toBeNull();
  });

  it("supports configured schemes and the released app's scheme", () => {
    expect(getMobileAppLink({ ...args, scheme: "testmobile6529" })).toBe(
      `testmobile6529://navigate${destination}`
    );
    expect(
      getNativeLinkDestination(
        "mobile6529://navigate/waves/1",
        "testmobile6529",
        origin,
        123
      )
    ).toBe("/waves/1?_t=123");
    expect(getMobileAppLink({ ...args, scheme: "javascript" })).toBe(
      `mobile6529://navigate${destination}`
    );
  });

  it.each([
    ["iPhone", 0, "iOS"],
    ["iPad", 0, "iOS"],
    ["Macintosh", 5, "iOS"],
    ["Android", 0, "Android"],
    ["Macintosh", 0, null],
    ["Windows", 10, null],
    ["iPhone Electron", 0, null],
  ] as const)(
    "classifies %s with %i touch points",
    (ua, touchPoints, platform) => {
      expect(getMobilePlatform(ua, touchPoints)).toBe(platform);
    }
  );
});
