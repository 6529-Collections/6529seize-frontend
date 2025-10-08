import { ensureTwitterLink, isTwitterLink, parseTwitterLink } from "@/components/drops/view/part/dropPartMarkdown/twitter";

describe("parseTwitterLink", () => {
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
  ])("returns tweet id for %s", (_, url, expectedId) => {
    const result = parseTwitterLink(url);
    expect(result).not.toBeNull();
    expect(result?.tweetId).toBe(expectedId);
    expect(result?.href).toBe(url);
  });

  it.each([
    ["non-numeric status id", "https://twitter.com/test/status/not-a-number"],
    ["missing status segment", "https://twitter.com/test/1234567890"],
    ["unsupported domain", "https://example.com/status/1234567890"],
    ["invalid url", "not-a-url"],
  ])("returns null for %s", (_, url) => {
    expect(parseTwitterLink(url)).toBeNull();
  });
});

describe("ensureTwitterLink", () => {
  it("returns payload when valid", () => {
    expect(ensureTwitterLink("https://twitter.com/user/status/123").tweetId).toBe("123");
  });

  it("throws when invalid", () => {
    expect(() => ensureTwitterLink("https://twitter.com/user/123")).toThrow("Invalid Twitter/X link");
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
  });
});
