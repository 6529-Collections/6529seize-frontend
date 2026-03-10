import { getResolvedImageSrc } from "@/components/nft-image/utils/image-source";
import type { BaseNFT, NFTLite } from "@/entities/INFT";

const createMockNFT = (overrides: Partial<BaseNFT> = {}): BaseNFT => ({
  id: 1,
  contract: "0x123",
  created_at: new Date("2024-01-01T00:00:00.000Z"),
  mint_price: 0,
  supply: 1,
  name: "Test NFT",
  collection: "Test Collection",
  token_type: "ERC721",
  description: "Test Description",
  artist: "Test Artist",
  artist_seize_handle: "test_artist",
  uri: "https://example.com/token/1",
  icon: "https://example.com/icon.png",
  thumbnail: "https://example.com/thumb.png",
  scaled: "https://example.com/scaled.png",
  image: "https://example.com/image.png",
  animation: "https://example.com/animation.mp4",
  market_cap: 0,
  floor_price: 0,
  total_volume_last_24_hours: 0,
  total_volume_last_7_days: 0,
  total_volume_last_1_month: 0,
  total_volume: 0,
  highest_offer: 0,
  ...overrides,
});

const createMockNFTLite = (overrides: Partial<NFTLite> = {}): NFTLite => ({
  id: 1,
  contract: "0x123",
  name: "Test NFT Lite",
  icon: "https://example.com/icon.png",
  thumbnail: "https://example.com/thumb.png",
  scaled: "https://example.com/scaled.png",
  image: "https://example.com/image.png",
  animation: "https://example.com/animation.mp4",
  ...overrides,
});

describe("getResolvedImageSrc", () => {
  it("returns undefined for missing nft", () => {
    expect(getResolvedImageSrc(undefined)).toBeUndefined();
  });

  it("returns trimmed metadata.image when it is non-empty", () => {
    const nft = createMockNFT({
      image: "https://example.com/top-level.png",
      metadata: {
        image: "  https://example.com/metadata.png  ",
      },
    });

    expect(getResolvedImageSrc(nft)).toBe("https://example.com/metadata.png");
  });

  it("falls back to top-level image when metadata.image is whitespace only", () => {
    const nft = createMockNFT({
      image: "  https://example.com/top-level.png  ",
      metadata: {
        image: "   ",
      },
    });

    expect(getResolvedImageSrc(nft)).toBe("https://example.com/top-level.png");
  });

  it("returns undefined when every candidate is empty or invalid", () => {
    const nft = createMockNFT({
      image: "   ",
      metadata: {
        image: null,
      },
    });

    expect(getResolvedImageSrc(nft)).toBeUndefined();
  });

  it("returns trimmed top-level image for NFTLite", () => {
    const nft = createMockNFTLite({
      image: "  https://example.com/lite.png  ",
    });

    expect(getResolvedImageSrc(nft)).toBe("https://example.com/lite.png");
  });
});
