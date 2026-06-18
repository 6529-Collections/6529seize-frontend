import { generateMetadata } from "@/app/6529-gradient/[id]/page";
import { GRADIENT_CONTRACT } from "@/constants/constants";
import { fetchUrl } from "@/services/6529api";

// === Mock Services & Dependencies ===
jest.mock("@/services/6529api");
jest.mock("@/contexts/TitleContext", () => ({
  useSetTitle: jest.fn(),
}));
jest.mock("@/hooks/useCapacitor", () => () => ({ isIos: false }));
jest.mock("@/components/nft-image/NFTImage", () => ({
  __esModule: true,
  default: () => <div data-testid="nft-image" />,
}));
jest.mock("@/components/address/Address", () => ({
  __esModule: true,
  default: () => <div data-testid="address" />,
}));
jest.mock("@/components/nft-marketplace-links/NFTMarketplaceLinks", () => ({
  __esModule: true,
  default: () => <div data-testid="marketplace-links" />,
}));
jest.mock("@/components/the-memes/ArtistProfileHandle", () => ({
  __esModule: true,
  default: () => <div data-testid="artist-handle" />,
}));
jest.mock("@/components/latest-activity/LatestActivityRow", () => ({
  __esModule: true,
  default: () => <tr data-testid="activity-row" />,
}));
jest.mock("@/components/nft-navigation/NftNavigation", () => ({
  __esModule: true,
  default: () => <></>,
}));

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

    const [image] = metadata.openGraph?.images as {
      alt: string;
      height: number;
      url: string;
      width: number;
    }[];
    const url = new URL(image.url);

    expect(image).toMatchObject({
      alt: "6529 Gradient #10 social card",
      height: 630,
      width: 1200,
    });
    expect(url.pathname).toBe(`/api/og-metadata/nfts/${GRADIENT_CONTRACT}/10`);
    expect(url.searchParams.get("badge")).toBe("6529 Gradient");
    expect(url.searchParams.get("collection")).toBe("6529 Gradient");
    expect(url.searchParams.get("image")).toBe("https://example.com/thumb.png");
    expect(url.searchParams.get("subtitle")).toBe("Collections");
    expect(url.searchParams.get("title")).toBe("6529 Gradient #10");
    expect(metadata.twitter?.card).toBe("summary_large_image");
  });

  it("falls back to image if thumbnail is missing", async () => {
    (fetchUrl as jest.Mock).mockResolvedValue({
      data: [{ image: "https://example.com/image.png" }],
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: "20" }),
    });

    const [image] = metadata.openGraph?.images as {
      url: string;
    }[];
    const url = new URL(image.url);

    expect(url.pathname).toBe(`/api/og-metadata/nfts/${GRADIENT_CONTRACT}/20`);
    expect(url.searchParams.get("image")).toBe("https://example.com/image.png");
  });

  it("uses branded card without raw image if no data", async () => {
    (fetchUrl as jest.Mock).mockResolvedValue({ data: [] });

    const metadata = await generateMetadata({
      params: Promise.resolve({ id: "30" }),
    });

    const [image] = metadata.openGraph?.images as {
      url: string;
    }[];
    const url = new URL(image.url);

    expect(url.pathname).toBe(`/api/og-metadata/nfts/${GRADIENT_CONTRACT}/30`);
    expect(url.searchParams.get("image")).toBeNull();
  });
});
