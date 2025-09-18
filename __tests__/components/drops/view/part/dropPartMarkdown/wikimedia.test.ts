import { isWikimediaHost, parseWikimediaLink } from "@/components/drops/view/part/dropPartMarkdown/wikimedia";

describe("parseWikimediaLink", () => {
  it("detects wikipedia articles", () => {
    const result = parseWikimediaLink("https://en.wikipedia.org/wiki/Alan_Turing");
    expect(result).toEqual({ href: "https://en.wikipedia.org/wiki/Alan_Turing" });
  });

  it("detects short links", () => {
    const result = parseWikimediaLink("https://w.wiki/3sXw");
    expect(result).toEqual({ href: "https://w.wiki/3sXw" });
  });

  it("rejects non-supported hosts", () => {
    expect(parseWikimediaLink("https://example.com/wiki/Alan_Turing")).toBeNull();
  });
});

describe("isWikimediaHost", () => {
  it("recognises commons and upload hosts", () => {
    expect(isWikimediaHost("commons.wikimedia.org")).toBe(true);
    expect(isWikimediaHost("upload.wikimedia.org")).toBe(true);
  });

  it("recognises language subdomains", () => {
    expect(isWikimediaHost("en.wikipedia.org")).toBe(true);
    expect(isWikimediaHost("fr.m.wikipedia.org")).toBe(true);
  });

  it("ignores unrelated hosts", () => {
    expect(isWikimediaHost("example.org")).toBe(false);
  });
});
