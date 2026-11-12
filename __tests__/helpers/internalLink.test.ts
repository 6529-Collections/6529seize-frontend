import {
  getInternalLinkPath,
  getInternalPageLinkPath,
} from "@/helpers/internalLink";

const SITE = "https://6529.io";

describe("getInternalPageLinkPath", () => {
  it.each([
    ["http://6529.io/the-memes/1", SITE, "/the-memes/1"],
    ["https://www.6529.io/the-memes/1", SITE, "/the-memes/1"],
    [`${SITE}/waves/123?serialNo=7#part-2`, SITE, "/waves/123?serialNo=7#part-2"],
    ["/vitalik.eth", SITE, "/vitalik.eth"],
    [
      "https://staging.6529.io/waves/123",
      "https://staging.6529.io",
      "/waves/123",
    ],
  ])("routes %s within %s", (href, siteUrl, path) => {
    expect(getInternalPageLinkPath(href, siteUrl)).toBe(path);
  });

  it.each([
    "/api/auth",
    "/%61pi/auth",
    "/the-memes/card.png",
    "//elsewhere.example/waves/123",
    "https://6529.io.other.example/waves/123",
    "https://www.6529.io@other.example/waves/123",
    "https://user@www.6529.io/waves/123",
    "https://www.6529.io:8443/waves/123",
    "http://6529.io/%2Felsewhere.example",
    "/\\elsewhere.example/waves/123",
    "http://6529.io/\\elsewhere.example/waves/123",
    "https://www.6529.io/%5Celsewhere.example/waves/123",
    "https://www.6529.io/waves/..//elsewhere.example",
    "http://6529.io/waves\n/123",
    "https://www.6529.io/\t/elsewhere.example",
    "http://6529.io/waves%0a/123",
    "https://www.6529.io/waves%00/123",
    "https://www.6529.io/bad%",
    "javascript:alert(1)",
    "data:text/html,hi",
    "mobile6529://navigate/waves",
    "blob:https://6529.io/waves",
  ])("keeps %s outside app page routing", (href) => {
    expect(getInternalPageLinkPath(href, SITE)).toBeNull();
  });

  it.each([SITE, "http://6529.io", "https://www.6529.io"])(
    "keeps %s pointed at production when opened from staging",
    (origin) => {
      expect(
        getInternalPageLinkPath(`${origin}/waves/123`, "https://staging.6529.io")
      ).toBeNull();
    }
  );
});

describe("getInternalLinkPath", () => {
  it.each([
    ["https://6529.io", "/"],
    ["https://6529.io/", "/"],
    ["https://6529.io/waves/123", "/waves/123"],
    ["https://6529.io/waves/123?drop=456", "/waves/123?drop=456"],
    ["https://6529.io/waves/123#part-2", "/waves/123#part-2"],
    [
      "https://6529.io/waves/123?drop=456&serialNo=7#part-2",
      "/waves/123?drop=456&serialNo=7#part-2",
    ],
    ["HTTPS://6529.IO/the-memes/1", "/the-memes/1"],
    ["https://6529.io:443/network", "/network"],
    ["https://6529.io/waves/../the-memes/1", "/the-memes/1"],
    [
      "https://6529.io/search?q=%2F%2Fexample.com",
      "/search?q=%2F%2Fexample.com",
    ],
    ["/waves/123?drop=456#part-2", "/waves/123?drop=456#part-2"],
    ["/network?group=g1", "/network?group=g1"],
  ])("keeps %s on the site as %s", (href, expected) => {
    expect(getInternalLinkPath(href, SITE)).toBe(expected);
  });

  it.each([
    // Look-alike and credential-bearing hosts.
    "https://6529.io.other.example/path",
    "https://6529.io@other.example/path",
    "https://user@6529.io/path",
    "https://user:pass@6529.io/path",
    "https://other6529.io/path",
    "https://www.6529.io/path",
    // Paths that a browser reads as another host.
    "https://6529.io//other.example/path",
    "https://6529.io/%2F%2Fother.example/path",
    "https://6529.io/waves/..//other.example/path",
    "//other.example/path",
    "///other.example/path",
    // Backslashes, raw or encoded.
    "https://6529.io/\\other.example/path",
    "https://6529.io\\@other.example/path",
    "https://6529.io/%5Cother.example/path",
    "/\\other.example/path",
    // Control characters, raw or encoded.
    "https://6529.io/waves\n/123",
    "https://6529.io/\t/other.example",
    "https://6529.io/waves%0a/123",
    "https://6529.io/waves%00/123",
    // Other schemes and ports.
    "http://6529.io/path",
    "javascript:alert(1)",
    "data:text/html,hi",
    "mobile6529://navigate/waves",
    "https://6529.io:8443/path",
    // Not URLs.
    "",
    "waves/123",
    "vitalik.eth",
    "https://6529.io/bad%",
  ])("does not treat %j as a link on the site", (href) => {
    expect(getInternalLinkPath(href, SITE)).toBeNull();
  });

  it("matches the configured port exactly", () => {
    expect(
      getInternalLinkPath(
        "http://localhost:3001/waves",
        "http://localhost:3001"
      )
    ).toBe("/waves");
    expect(
      getInternalLinkPath(
        "http://localhost:3000/waves",
        "http://localhost:3001"
      )
    ).toBeNull();
  });

  it("treats nothing as internal without a valid site URL", () => {
    expect(getInternalLinkPath("https://6529.io/waves", undefined)).toBeNull();
    expect(getInternalLinkPath("/waves", "")).toBeNull();
    expect(getInternalLinkPath("/waves", "not a url")).toBeNull();
  });

  it("uses the configured site origin by default", () => {
    expect(getInternalLinkPath("https://test.6529.io/waves?x=1#y")).toBe(
      "/waves?x=1#y"
    );
    expect(getInternalLinkPath("https://6529.io/waves")).toBeNull();
  });
});
