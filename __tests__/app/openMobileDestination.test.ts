import { getMobileDestination } from "@/app/open-mobile/mobileDestination";

const ORIGIN = "https://6529.io";

describe("getMobileDestination", () => {
  it.each([
    ["/", "/"],
    ["/waves/123?drop=456#part-2", "/waves/123?drop=456#part-2"],
    ["/waves/../the-memes/1", "/the-memes/1"],
    ["/waves/%2e%2e/the-memes/1", "/the-memes/1"],
    [
      "/search?q=100%25&value=a%26b%3Dc%23d",
      "/search?q=100%25&value=a%26b%3Dc%23d",
    ],
    [
      "/search?q=%2F%2Fexample.com&next=%5Cexample",
      "/search?q=%2F%2Fexample.com&next=%5Cexample",
    ],
    [
      "/some%20profile?query=a+b#part%202",
      "/some%20profile?query=a+b#part%202",
    ],
    ["/café?locale=fr-FR", "/caf%C3%A9?locale=fr-FR"],
    ["%2Fwaves%2F123%3Fdrop%3D456%23part-2", "/waves/123?drop=456#part-2"],
  ])("canonicalizes %s to %s", (path, expected) => {
    expect(getMobileDestination(path, ORIGIN)).toBe(expected);
  });

  it.each([
    null,
    "",
    "waves/123",
    "https://example.com/path",
    "https://6529.io/waves/123",
    "javascript:alert(1)",
    "@example.com/path",
    "%40example.com/path",
    ".example.com/path",
    "%2Eexample.com/path",
    "//example.com/path",
    "%2F%2Fexample.com/path",
    "%252F%252Fexample.com/path",
    "/%2fexample.com/path",
    "/\\example.com/path",
    "/%5cexample.com/path",
    "\\\\example.com/path",
    "/waves\n/123",
    "/waves%0a/123",
    "/waves%00/123",
    "/waves%7f/123",
    "/bad%",
    "/bad%2",
    "/bad%GG",
    "/bad%E0%A4%A",
    "%E0%A4%A",
    "/search?q=bad%",
    "/waves#bad%",
    "/waves/..//example.com/path",
    "/waves/%2e%2e//example.com/path",
    "/waves/%2e%2e%2f/example.com/path",
  ])("rejects invalid destination %j", (path) => {
    expect(getMobileDestination(path, ORIGIN)).toBeNull();
  });
});
