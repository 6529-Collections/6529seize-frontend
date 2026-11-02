import {
  ensureTwitterLink,
  isTwitterLink,
  TWITTER_DOMAINS,
} from "@/components/drops/view/part/dropPartMarkdown/twitter";

// Simulate the client bundle: the marker module throws exactly as it does when
// a Client Component graph reaches it, and cheerio must never load either.
jest.mock(
  "next/dist/compiled/server-only",
  () => {
    throw new Error("server-only module reached the client graph");
  },
  { virtual: true }
);
jest.mock("cheerio", () => {
  throw new Error("cheerio reached the client graph");
});

describe("ensureTwitterLink", () => {
  it.each([
    [
      "standard status link with query params",
      "https://twitter.com/test/status/1234567890?s=20&t=abc",
      "1234567890",
    ],
    [
      "i/web status link",
      "https://twitter.com/i/web/status/9876543210",
      "9876543210",
    ],
    [
      "mobile subdomain link",
      "https://mobile.twitter.com/test/status/1122334455",
      "1122334455",
    ],
    [
      "hashbang status link",
      "https://twitter.com/#!/user/status/9988776655",
      "9988776655",
    ],
    [
      "hashbang status link with query params",
      "https://twitter.com/#!/user/status/9988776655?s=20",
      "9988776655",
    ],
    [
      "x.com status link",
      "https://x.com/someone/status/4433221100",
      "4433221100",
    ],
  ])("returns payload with id for %s", (_, url, expectedId) => {
    const result = ensureTwitterLink(url);
    expect(result.tweetId).toBe(expectedId);
    expect(result.href).toBe(url);
  });

  it("returns payload when valid", () => {
    expect(ensureTwitterLink("https://twitter.com/user/status/123").tweetId).toBe("123");
  });

  it.each([
    ["non-numeric status id", "https://twitter.com/test/status/not-a-number"],
    ["missing status segment", "https://twitter.com/test/1234567890"],
    ["unsupported domain", "https://example.com/status/1234567890"],
    ["invalid url", "not-a-url"],
  ])("throws when invalid (%s)", (_, url) => {
    expect(() => ensureTwitterLink(url)).toThrow("Invalid Twitter/X link");
  });
});

describe("isTwitterLink", () => {
  it("detects supported URLs", () => {
    expect(isTwitterLink("https://x.com/user/status/321")).toBe(true);
    expect(isTwitterLink("https://mobile.twitter.com/user/statuses/555")).toBe(true);
  });

  it("rejects unsupported URLs", () => {
    expect(isTwitterLink("https://x.com/user/321")).toBe(false);
    expect(isTwitterLink("https://example.com/status/321")).toBe(false);
    expect(isTwitterLink("https://twitter.com/test/status/not-a-number")).toBe(false);
    expect(isTwitterLink("https://twitter.com/test/1234567890")).toBe(false);
    expect(isTwitterLink("not-a-url")).toBe(false);
  });
});

describe("client bundle boundary", () => {
  it("keeps the drop markdown helper free of server-only Twitter code", () => {
    expect(TWITTER_DOMAINS).toEqual(["twitter.com", "x.com"]);
  });

  it.each(["fetcher", "parser"])(
    "marks lib/twitter/%s as server-only",
    (moduleName) => {
      jest.isolateModules(() => {
        expect(() => require(`@/lib/twitter/${moduleName}`)).toThrow(
          "server-only module reached the client graph"
        );
      });
    }
  );
});
