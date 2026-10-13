import { extractMetaImage } from "@/lib/twitter/meta";

describe("extractMetaImage", () => {
  it("returns the first image metadata in document order", () => {
    expect(
      extractMetaImage(`
        <meta property="og:title" content="Post">
        <meta name="twitter:image:src" content=" https://pbs.twimg.com/media/first.jpg ">
        <meta property="og:image" content="https://pbs.twimg.com/media/second.jpg">
      `)
    ).toBe("https://pbs.twimg.com/media/first.jpg");
  });

  it("skips image metadata without content", () => {
    expect(
      extractMetaImage(`
        <meta property="og:image" content="">
        <meta name="twitter:image" content="https://example.com/card.png">
      `)
    ).toBe("https://example.com/card.png");
  });

  it("ignores image metadata that does not point at an image", () => {
    expect(
      extractMetaImage(
        '<meta property="og:image" content="https://example.com/page">'
      )
    ).toBeUndefined();
    expect(extractMetaImage("<p>No metadata</p>")).toBeUndefined();
  });
});
