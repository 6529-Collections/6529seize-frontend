import {
  getNftCanonicalPath,
  getNftFocusPolicy,
  getNftSitemapFocuses,
} from "@/helpers/seo/nft-route-policy";

describe("NFT route policy", () => {
  it.each([
    ["the-memes", "live", "/the-memes/1", true],
    ["the-memes", "the-art", "/the-memes/1", true],
    ["the-memes", "references", "/the-memes/1", true],
    ["the-memes", "history", "/the-memes/1?focus=activity", true],
    ["the-memes", "your-cards", "/the-memes/1?focus=your-cards", false],
    ["meme-lab", "references", "/meme-lab/1?focus=references", true],
  ] as const)(
    "normalizes %s focus=%s",
    (collection, focus, canonicalPath, indexable) => {
      expect(
        getNftCanonicalPath({ collection, id: "1", requestedFocus: focus })
      ).toBe(canonicalPath);
      expect(getNftFocusPolicy(collection, focus).indexable).toBe(indexable);
    }
  );

  it("does not create sitemap entries for aliases or private views", () => {
    expect(getNftSitemapFocuses("the-memes")).not.toEqual(
      expect.arrayContaining(["live", "the-art", "references", "your-cards"])
    );
    expect(getNftSitemapFocuses("meme-lab")).toContain("references");
  });
});
