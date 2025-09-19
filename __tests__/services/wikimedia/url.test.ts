import { parseWikimediaLink } from "@/src/services/wikimedia/url";

describe("parseWikimediaLink", () => {
  it("detects wikipedia hosts", () => {
    expect(parseWikimediaLink("https://en.wikipedia.org/wiki/Example")).toEqual({
      href: "https://en.wikipedia.org/wiki/Example",
    });
    expect(parseWikimediaLink("https://m.en.wikipedia.org/wiki/Example")).toEqual({
      href: "https://m.en.wikipedia.org/wiki/Example",
    });
  });

  it("detects wikimedia and wikidata hosts", () => {
    expect(parseWikimediaLink("https://commons.wikimedia.org/wiki/File:Example.jpg")).toEqual({
      href: "https://commons.wikimedia.org/wiki/File:Example.jpg",
    });
    expect(parseWikimediaLink("https://upload.wikimedia.org/wikipedia/commons/3/3c/Example.jpg")).toEqual({
      href: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Example.jpg",
    });
    expect(parseWikimediaLink("https://www.wikidata.org/wiki/Q42")).toEqual({
      href: "https://www.wikidata.org/wiki/Q42",
    });
  });

  it("detects short links", () => {
    expect(parseWikimediaLink("https://w.wiki/xyz")).toEqual({ href: "https://w.wiki/xyz" });
  });

  it("ignores other hosts", () => {
    expect(parseWikimediaLink("https://example.com")).toBeNull();
  });
});

