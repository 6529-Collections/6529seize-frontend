import { parsePepeLink } from "@/components/drops/view/part/dropPartMarkdown/pepe";

describe("parsePepeLink", () => {
  it("parses asset links", () => {
    expect(parsePepeLink("https://pepe.wtf/asset/GOXPEPE")).toEqual({
      kind: "asset",
      slug: "GOXPEPE",
      href: "https://pepe.wtf/asset/GOXPEPE",
    });
  });

  it("parses collection links", () => {
    expect(parsePepeLink("https://pepe.wtf/collection/bitcorn")).toEqual({
      kind: "collection",
      slug: "bitcorn",
      href: "https://pepe.wtf/collection/bitcorn",
    });
  });

  it("parses artist links", () => {
    expect(parsePepeLink("https://pepe.wtf/artists/Easy-B")).toEqual({
      kind: "artist",
      slug: "Easy-B",
      href: "https://pepe.wtf/artists/Easy-B",
    });
  });

  it("parses set links", () => {
    expect(parsePepeLink("https://pepe.wtf/sets/Series-1")).toEqual({
      kind: "set",
      slug: "Series-1",
      href: "https://pepe.wtf/sets/Series-1",
    });
  });

  it("returns null for other hosts", () => {
    expect(parsePepeLink("https://example.com/asset/GOXPEPE")).toBeNull();
  });

  it("returns null for unsupported paths", () => {
    expect(parsePepeLink("https://pepe.wtf/")).toBeNull();
    expect(parsePepeLink("https://pepe.wtf/something/else")).toBeNull();
  });
});
