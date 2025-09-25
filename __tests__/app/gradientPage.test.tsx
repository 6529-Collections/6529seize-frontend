import { generateMetadata } from "@/app/6529-gradient/[id]/page";
import { fetchUrl } from "@/services/6529api";

// === Mock Services & Dependencies ===
jest.mock("@/services/6529api");
jest.mock("@/contexts/TitleContext", () => ({
  useSetTitle: jest.fn(),
}));
jest.mock("@/hooks/useCapacitor", () => () => ({ isIos: false }));
jest.mock("@/components/nft-image/NFTImage", () => () => (
  <div data-testid="nft-image" />
));
jest.mock("@/components/address/Address", () => () => (
  <div data-testid="address" />
));
jest.mock(
  "@/components/nft-marketplace-links/NFTMarketplaceLinks",
  () => () => <div data-testid="marketplace-links" />
);
jest.mock("@/components/the-memes/ArtistProfileHandle", () => () => (
  <div data-testid="artist-handle" />
));
jest.mock("@/components/latest-activity/LatestActivityRow", () => () => (
  <tr data-testid="activity-row" />
));
jest.mock("@/components/nftAttributes/NftStats", () => () => <></>);
jest.mock("@/components/nft-navigation/NftNavigation", () => () => <></>);

// === generateMetadata Function Test ===
describe("generateMetadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns metadata with thumbnail if available", async () => {
    (fetchUrl as jest.Mock).mockResolvedValue({
      data: [{ thumbnail: "https://example.com/thumb.png" }],
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: "10" }),
    });

    expect(metadata.title).toBe("6529 Gradient #10");

    const images = Array.isArray(metadata.openGraph?.images)
      ? metadata.openGraph.images
      : [metadata.openGraph?.images];

    expect(images?.[0]).toBe("https://example.com/thumb.png");
  });

  it("falls back to image if thumbnail is missing", async () => {
    (fetchUrl as jest.Mock).mockResolvedValue({
      data: [{ image: "https://example.com/image.png" }],
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: "20" }),
    });

    const images = Array.isArray(metadata.openGraph?.images)
      ? metadata.openGraph.images
      : [metadata.openGraph?.images];

    expect(images?.[0]).toBe("https://example.com/image.png");
  });

  it("uses default image if no data", async () => {
    (fetchUrl as jest.Mock).mockResolvedValue({ data: [] });

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: "30" }),
    });

    const images = Array.isArray(metadata.openGraph?.images)
      ? metadata.openGraph.images
      : [metadata.openGraph?.images];

    expect(images?.[0]).toBe("https://test.6529.io/6529io.png");
  });
});
