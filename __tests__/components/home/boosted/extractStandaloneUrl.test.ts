import {
  extractFirstMarkdownImage,
  extractStandaloneUrl,
  removePreviewUrlFromContent,
} from "@/components/home/boosted/extractStandaloneUrl";

describe("removePreviewUrlFromContent", () => {
  it("keeps markdown image URLs intact when the preview URL matches", () => {
    const imageUrl =
      "https://img.transient.xyz/?n=-1&output=webp&url=https%3A%2F%2Fipfs.transientusercontent.xyz%2Fipfs%2FQmVsjJs2AfMZkdudRx1bUypA1pr5cDBcp8Y8qshdw74Civ%2Fnft.jpg&w=3072&we=";
    const content = `![Seize](${imageUrl})`;

    expect(removePreviewUrlFromContent(content, imageUrl)).toBe(content);
  });
});

describe("extractStandaloneUrl", () => {
  it("returns a direct URL when it is the only visible content", () => {
    expect(extractStandaloneUrl(" https://example.com/art.png ")).toBe(
      "https://example.com/art.png"
    );
  });

  it("ignores markdown links and markdown images", () => {
    expect(extractStandaloneUrl("[Art](https://example.com/art.png)")).toBe(
      null
    );
    expect(extractStandaloneUrl("![Art](https://example.com/art.png)")).toBe(
      null
    );
  });

  it("returns null when surrounding text is present", () => {
    expect(extractStandaloneUrl("look https://example.com/art.png")).toBe(null);
  });
});

describe("extractFirstMarkdownImage", () => {
  it("returns the first markdown image even when it has a caption", () => {
    expect(
      extractFirstMarkdownImage(
        "caption\n\n![Art](https://example.com/art.png)"
      )
    ).toEqual({
      alt: "Art",
      url: "https://example.com/art.png",
    });
  });
});
