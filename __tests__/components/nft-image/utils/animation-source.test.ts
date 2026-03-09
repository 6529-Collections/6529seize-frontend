import { getResolvedAnimationSrc } from "@/components/nft-image/utils/animation-source";
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

describe("getResolvedAnimationSrc", () => {
  it("returns undefined for missing nft", () => {
    expect(getResolvedAnimationSrc(undefined)).toBeUndefined();
  });

  it("returns the trimmed top-level animation when it is non-empty", () => {
    const nft = createMockNFT({
      animation: "  https://example.com/top-level.mp4  ",
      metadata: {
        animation: "https://example.com/metadata.mp4",
        animation_url: "https://example.com/metadata-url.mp4",
      },
    });

    expect(getResolvedAnimationSrc(nft)).toBe(
      "https://example.com/top-level.mp4"
    );
  });

  it("falls back to metadata.animation when top-level animation is empty", () => {
    const nft = createMockNFT({
      animation: "   ",
      metadata: {
        animation: "  https://example.com/metadata.mp4  ",
        animation_url: "https://example.com/metadata-url.mp4",
      },
    });

    expect(getResolvedAnimationSrc(nft)).toBe(
      "https://example.com/metadata.mp4"
    );
  });

  it("falls back to metadata.animation_url when earlier candidates are empty", () => {
    const nft = createMockNFT({
      animation: "",
      metadata: {
        animation: "   ",
        animation_url: "  https://example.com/metadata-url.mp4  ",
      },
    });

    expect(getResolvedAnimationSrc(nft)).toBe(
      "https://example.com/metadata-url.mp4"
    );
  });

  it("returns undefined when every candidate is empty or invalid", () => {
    const nft = createMockNFT({
      animation: "   ",
      metadata: {
        animation: null,
        animation_url: 123,
      },
    });

    expect(getResolvedAnimationSrc(nft)).toBeUndefined();
  });

  it("ignores metadata for NFTLite and returns trimmed top-level animation", () => {
    const nft = createMockNFTLite({
      animation: "  https://example.com/lite.mp4  ",
    });

    expect(getResolvedAnimationSrc(nft)).toBe("https://example.com/lite.mp4");
  });

  it("returns undefined for NFTLite when top-level animation is whitespace only", () => {
    const nft = createMockNFTLite({
      animation: "   ",
    });

    expect(getResolvedAnimationSrc(nft)).toBeUndefined();
  });
});
