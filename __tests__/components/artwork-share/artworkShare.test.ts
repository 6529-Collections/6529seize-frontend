import {
  getArtworkExportUrl,
  type ArtworkShareDetails,
} from "@/components/artwork-share/artworkShare";
import {
  GRADIENT_CONTRACT,
  MEMES_CONTRACT,
  NEXTGEN_CONTRACT,
} from "@/constants/constants";

const artwork = (
  overrides: Partial<ArtworkShareDetails>
): ArtworkShareDetails => ({
  kind: "memes",
  tokenId: 7,
  title: "Meme #7",
  artist: "Artist",
  collection: "The Memes",
  ...overrides,
});

describe("getArtworkExportUrl", () => {
  it.each([
    ["memes", MEMES_CONTRACT, 7],
    ["gradient", GRADIENT_CONTRACT, 12],
    ["nextgen", NEXTGEN_CONTRACT, 10000000042],
  ] as const)(
    "identifies %s artwork by contract and token ID only",
    (kind, contract, tokenId) => {
      const url = new URL(
        getArtworkExportUrl(
          artwork({
            kind,
            tokenId,
            title: "Injected title",
            artist: "Injected artist",
            collection: "Injected collection",
          }),
          "story"
        )
      );

      expect(url.pathname).toBe(`/api/og-metadata/nfts/${contract}/${tokenId}`);
      expect([...url.searchParams.entries()]).toEqual([["format", "story"]]);
    }
  );
});
