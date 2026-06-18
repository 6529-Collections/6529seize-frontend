import { generateMetadata as generateRememeDetailMetadata } from "@/app/rememes/[contract]/[id]/page";
import { generateMetadata as generateRememesAddMetadata } from "@/app/rememes/add/page";
import { generateMetadata as generateRememesMetadata } from "@/app/rememes/page";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { fetchUrl } from "@/services/6529api";
import type { Metadata } from "next";

jest.mock("@/services/6529api", () => ({ fetchUrl: jest.fn() }));

jest.mock("@/helpers/server.app.helpers", () => ({
  getAppCommonHeaders: jest.fn().mockResolvedValue({ "x-test": "1" }),
}));

jest.mock("@/components/rememes/Rememes", () => ({
  __esModule: true,
  default: () => <div data-testid="rememes" />,
}));

jest.mock("@/components/rememes/RememeAddPage", () => ({
  __esModule: true,
  default: () => <div data-testid="rememe-add" />,
}));

jest.mock("@/components/rememes/RememePage", () => ({
  __esModule: true,
  default: () => <div data-testid="rememe-page" />,
}));

const getSocialImage = (metadata: Metadata) => {
  const [image] = metadata.openGraph?.images as {
    alt: string;
    height: number;
    url: string;
    width: number;
  }[];
  return image;
};

describe("ReMemes metadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses the branded ReMemes collection card on the landing page", async () => {
    const metadata = await generateRememesMetadata();
    const image = getSocialImage(metadata);
    const url = new URL(image.url);

    expect(metadata.title).toBe("ReMemes");
    expect(metadata.twitter?.card).toBe("summary_large_image");
    expect(image).toMatchObject({
      alt: "ReMemes collection social card",
      height: 630,
      width: 1200,
    });
    expect(url.pathname).toBe("/api/og-metadata/collections/rememes");
    expect(url.search).toBe("");
  });

  it("uses a route-specific ReMemes card on the add page", async () => {
    const metadata = await generateRememesAddMetadata();
    const image = getSocialImage(metadata);
    const url = new URL(image.url);

    expect(metadata.title).toBe("ReMemes | Add");
    expect(metadata.twitter?.card).toBe("summary_large_image");
    expect(image).toMatchObject({
      alt: "Add ReMeme social card",
      height: 630,
      width: 1200,
    });
    expect(url.pathname).toBe("/api/og-metadata/collections/rememes");
    expect(url.searchParams.get("subtitle")).toBe(
      "Submit a community remix or derivative"
    );
    expect(url.searchParams.get("title")).toBe("Add a ReMeme");
  });

  it("uses branded NFT card metadata for ReMeme detail pages", async () => {
    (fetchUrl as jest.Mock).mockResolvedValue({
      data: [
        {
          contract_opensea_data: {
            collectionName: "Remix Editions",
            imageUrl: "https://cdn.test/collection.png",
          },
          image: "https://cdn.test/raw.png",
          media: [{ gateway: "https://cdn.test/gateway.png" }],
          metadata: { name: "Community Remix" },
          s3_image_original: "https://cdn.test/original.png",
          s3_image_scaled: "https://cdn.test/scaled.png",
        },
      ],
    });

    const metadata = await generateRememeDetailMetadata({
      params: Promise.resolve({ contract: "0xabc", id: "7" }),
    });

    expect(getAppCommonHeaders).toHaveBeenCalled();
    expect(fetchUrl).toHaveBeenCalledWith(
      expect.stringContaining("/api/rememes?contract=0xabc&id=7"),
      { headers: { "x-test": "1" } }
    );

    const image = getSocialImage(metadata);
    const url = new URL(image.url);

    expect(metadata.title).toBe("Community Remix | ReMemes");
    expect(metadata.twitter?.card).toBe("summary_large_image");
    expect(image).toMatchObject({
      alt: "Community Remix ReMeme social card",
      height: 630,
      width: 1200,
    });
    expect(url.pathname).toBe("/api/og-metadata/nfts/0xabc/7");
    expect(url.searchParams.get("badge")).toBe("ReMemes");
    expect(url.searchParams.get("collection")).toBe("Remix Editions");
    expect(url.searchParams.get("image")).toBe("https://cdn.test/scaled.png");
    expect(url.searchParams.get("subtitle")).toBe(
      "Remix Editions #7 | ReMemes"
    );
    expect(url.searchParams.get("title")).toBe("Community Remix");
  });

  it("uses Alchemy-style media objects for ReMeme detail card images", async () => {
    (fetchUrl as jest.Mock).mockResolvedValue({
      data: [
        {
          contract_opensea_data: {
            collectionName: "SEIZING",
            imageUrl: "https://cdn.test/collection.png",
          },
          image: "",
          media: {
            cachedUrl: "https://cdn.test/cached.gif",
            contentType: "image/gif",
            originalUrl: "https://arweave.test/original",
            pngUrl: "https://cdn.test/converted.png",
            size: 9908164,
            thumbnailUrl: "https://cdn.test/thumb.gif",
          },
          metadata: { name: "GDRC #2" },
          s3_image_original: "",
          s3_image_scaled: "",
        },
      ],
    });

    const metadata = await generateRememeDetailMetadata({
      params: Promise.resolve({
        contract: "0x869a96493d64ed5bbbfc24d96c5e84f95e558cf2",
        id: "39",
      }),
    });

    const image = getSocialImage(metadata);
    const url = new URL(image.url);

    expect(metadata.title).toBe("GDRC #2 | ReMemes");
    expect(metadata.twitter?.card).toBe("summary_large_image");
    expect(url.pathname).toBe(
      "/api/og-metadata/nfts/0x869a96493d64ed5bbbfc24d96c5e84f95e558cf2/39"
    );
    expect(url.searchParams.get("collection")).toBe("SEIZING");
    expect(url.searchParams.get("image")).toBe("https://cdn.test/thumb.gif");
    expect(url.searchParams.get("title")).toBe("GDRC #2");
  });

  it("falls back to a branded ReMeme NFT card when API data is missing", async () => {
    (fetchUrl as jest.Mock).mockResolvedValue({ data: [] });

    const metadata = await generateRememeDetailMetadata({
      params: Promise.resolve({ contract: "0xabc", id: "8" }),
    });

    expect(getAppCommonHeaders).toHaveBeenCalled();
    expect(fetchUrl).toHaveBeenCalledWith(
      expect.stringContaining("/api/rememes?contract=0xabc&id=8"),
      { headers: { "x-test": "1" } }
    );

    const image = getSocialImage(metadata);
    const url = new URL(image.url);

    expect(metadata.title).toBe("0xabc #8 | ReMemes");
    expect(url.pathname).toBe("/api/og-metadata/nfts/0xabc/8");
    expect(url.searchParams.get("badge")).toBe("ReMemes");
    expect(url.searchParams.get("collection")).toBe("ReMemes");
    expect(url.searchParams.get("image")).toBeNull();
    expect(url.searchParams.get("title")).toBe("0xabc #8");
  });
});
