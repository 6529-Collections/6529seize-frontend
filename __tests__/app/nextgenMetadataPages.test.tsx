import { generateMetadata as generateNextGenCollectionMetadata } from "@/app/nextgen/collection/[collection]/[[...view]]/page";
import { generateNextgenCollectionMetadata } from "@/app/nextgen/collection/[collection]/page-utils";
import { generateMetadata as generateNextGenMetadata } from "@/app/nextgen/[[...view]]/page";
import { generateMetadata as generateNextGenAdminMetadata } from "@/app/nextgen/manager/page";
import { generateMetadata as generateNextGenTokenMetadata } from "@/app/nextgen/token/[token]/[[...view]]/page";
import { NEXTGEN_CONTRACT } from "@/constants/constants";
import { commonApiFetch } from "@/services/api/common-api";
import type { NextGenCollection, NextGenToken } from "@/entities/INextgen";
import type { Metadata } from "next";

jest.mock("@/helpers/server.app.helpers", () => ({
  getAppCommonHeaders: jest.fn().mockResolvedValue({ "x-test": "1" }),
}));

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));

jest.mock("@/app/nextgen/[[...view]]/NextGenPageClient", () => ({
  __esModule: true,
  default: () => <div data-testid="nextgen-page" />,
}));

jest.mock(
  "@/app/nextgen/token/[token]/[[...view]]/NextGenTokenPageClient",
  () => ({
    __esModule: true,
    default: () => <div data-testid="nextgen-token" />,
  })
);

jest.mock(
  "@/components/nextGen/collections/collectionParts/NextGenCollection",
  () => ({
    __esModule: true,
    default: () => <div data-testid="nextgen-collection" />,
  })
);

jest.mock("@/components/nextGen/admin/NextGenAdmin", () => ({
  __esModule: true,
  default: () => <div data-testid="nextgen-admin" />,
}));

const collection: NextGenCollection = {
  allowlist_end: 0,
  allowlist_start: 0,
  artist: "6529er",
  artist_address: "0xartist",
  artist_signature: "0xsig",
  banner: "https://cdn.test/pebbles-banner.png",
  base_uri: "https://generator.test/",
  created_at: "2024-01-01T00:00:00Z",
  dependency_script: "",
  description: "Pebbles description",
  distribution_plan: "Random",
  final_supply_after_mint: 100,
  id: 1,
  image: "https://cdn.test/pebbles.png",
  library: "p5js",
  licence: "CC0",
  max_purchases: 1,
  merkle_root: "0xroot",
  mint_count: 10,
  name: "Pebbles",
  on_chain: true,
  opensea_link: "https://opensea.test/pebbles",
  public_end: 0,
  public_start: 0,
  total_supply: 100,
  updated_at: "2024-01-01T00:00:00Z",
  website: "https://pebbles.test",
};

const token: NextGenToken = {
  animation_url: "https://cdn.test/animation.html",
  blur_price: 0,
  burnt: false,
  collection_id: 1,
  collection_name: "Pebbles",
  created_at: "2024-01-01T00:00:00Z",
  handle: "6529er",
  hodl_rate: 0,
  icon_url: "https://cdn.test/icon.png",
  id: 10000000042,
  image_url: "https://cdn.test/token.png",
  last_sale_date: new Date("2024-01-01T00:00:00Z"),
  last_sale_value: 0,
  level: 1,
  max_sale_date: new Date("2024-01-01T00:00:00Z"),
  max_sale_value: 0,
  me_price: 0,
  me_royalty: 0,
  metadata_url: "https://cdn.test/token.json",
  mint_data: "{}",
  mint_date: new Date("2024-01-01T00:00:00Z"),
  mint_price: 0,
  name: "Pebble #42",
  normalised_handle: "6529er",
  normalised_id: 42,
  opensea_price: 0,
  opensea_royalty: 0,
  owner: "0xowner",
  pending: false,
  price: 0,
  rarity_score: 0,
  rarity_score_normalised: 0,
  rarity_score_normalised_rank: 0,
  rarity_score_rank: 0,
  rarity_score_trait_count: 0,
  rarity_score_trait_count_normalised: 0,
  rarity_score_trait_count_normalised_rank: 0,
  rarity_score_trait_count_rank: 0,
  rep_score: 0,
  single_trait_rarity_score: 0,
  single_trait_rarity_score_normalised: 0,
  single_trait_rarity_score_normalised_rank: 0,
  single_trait_rarity_score_rank: 0,
  single_trait_rarity_score_trait_count: 0,
  single_trait_rarity_score_trait_count_normalised: 0,
  single_trait_rarity_score_trait_count_normalised_rank: 0,
  single_trait_rarity_score_trait_count_rank: 0,
  statistical_score: 0,
  statistical_score_normalised: 0,
  statistical_score_normalised_rank: 0,
  statistical_score_rank: 0,
  statistical_score_trait_count: 0,
  statistical_score_trait_count_normalised: 0,
  statistical_score_trait_count_normalised_rank: 0,
  statistical_score_trait_count_rank: 0,
  tdh: 0,
  thumbnail_url: "https://cdn.test/thumb.png",
  updated_at: "2024-01-01T00:00:00Z",
};

const getSocialImage = (metadata: Metadata) => {
  const [image] = metadata.openGraph?.images as {
    alt: string;
    height: number;
    url: string;
    width: number;
  }[];
  return image;
};

const mockNextgenFetches = () => {
  (commonApiFetch as jest.Mock).mockImplementation(
    ({ endpoint }: { endpoint: string }) => {
      if (endpoint === "nextgen/tokens/10000000042") {
        return Promise.resolve(token);
      }
      if (endpoint === "nextgen/tokens/10000000042/traits") {
        return Promise.resolve([{ token_count: 100 }]);
      }
      if (
        endpoint === "nextgen/collections/1" ||
        endpoint === "nextgen/collections/pebbles"
      ) {
        return Promise.resolve(collection);
      }
      return Promise.reject(new Error(`Unexpected endpoint ${endpoint}`));
    }
  );
};

describe("NextGen metadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [undefined, "NextGen"],
    ["collections", "Collections | NextGen"],
    ["artists", "Artists | NextGen"],
    ["about", "About | NextGen"],
  ])(
    "uses consistent metadata for the %s landing view",
    async (view, title) => {
      const metadata = await generateNextGenMetadata({
        params: Promise.resolve({ view: view ? [view] : undefined }),
      });
      const image = getSocialImage(metadata);
      const url = new URL(image.url);

      expect(metadata.title).toBe(title);
      expect(metadata.openGraph?.title).toBe(title);
      expect(metadata.twitter?.card).toBe("summary_large_image");
      expect(image).toMatchObject({
        alt: `${title} social card`,
        height: 630,
        width: 1200,
      });
      expect(url.pathname).toBe("/api/og-metadata/collections/nextgen");
      expect(url.searchParams.get("subtitle")).toBe(
        "Generative art collections from 6529"
      );
      expect(url.searchParams.get("title")).toBe(title);
    }
  );

  it("uses a route-specific NextGen collection card for admin metadata", async () => {
    const metadata = await generateNextGenAdminMetadata();
    const image = getSocialImage(metadata);
    const url = new URL(image.url);

    expect(metadata.title).toBe("NextGen Admin");
    expect(metadata.twitter?.card).toBe("summary_large_image");
    expect(url.pathname).toBe("/api/og-metadata/collections/nextgen");
    expect(url.searchParams.get("subtitle")).toBe("Manage NextGen collections");
    expect(url.searchParams.get("title")).toBe("NextGen Admin");
  });

  it.each([
    [undefined, "Pebbles | NextGen", "Pebbles"],
    ["about", "About | Pebbles", "About | Pebbles"],
    ["provenance", "Provenance | Pebbles", "Provenance | Pebbles"],
    ["rarity", "Rarity | Pebbles", "Rarity | Pebbles"],
    ["top-trait-sets", "Trait Sets | Pebbles", "Trait Sets | Pebbles"],
  ])(
    "uses collection facts in the %s collection view card",
    async (view, documentTitle, cardTitle) => {
      mockNextgenFetches();

      const metadata = await generateNextGenCollectionMetadata({
        params: Promise.resolve({
          collection: "pebbles",
          view: view ? [view] : undefined,
        }),
      });
      const image = getSocialImage(metadata);
      const url = new URL(image.url);

      expect(metadata.title).toBe(documentTitle);
      expect(metadata.openGraph?.title).toBe(documentTitle);
      expect(metadata.twitter?.card).toBe("summary_large_image");
      expect(image).toMatchObject({
        alt: `${cardTitle} social card`,
        height: 630,
        width: 1200,
      });
      expect(url.pathname).toBe("/api/og-metadata/collections/nextgen");
      expect(url.searchParams.get("image")).toBe(
        "https://cdn.test/pebbles-banner.png"
      );
      expect(url.searchParams.get("subtitle")).toBe("Pebbles | NextGen");
      expect(url.searchParams.get("title")).toBe(cardTitle);
    }
  );

  it.each(["Art", "Mint", "Trait Sets", "Distribution Plan"])(
    "uses collection facts in the %s subpage card",
    async (page) => {
      mockNextgenFetches();

      const metadata = await generateNextgenCollectionMetadata({
        collection: "pebbles",
        headers: { "x-test": "1" },
        page,
      });
      const image = getSocialImage(metadata);
      const url = new URL(image.url);
      const title = `${page} | Pebbles`;

      expect(metadata.title).toBe(title);
      expect(metadata.openGraph?.title).toBe(title);
      expect(image.alt).toBe(`${title} social card`);
      expect(url.pathname).toBe("/api/og-metadata/collections/nextgen");
      expect(url.searchParams.get("image")).toBe(
        "https://cdn.test/pebbles-banner.png"
      );
      expect(url.searchParams.get("title")).toBe(title);
    }
  );

  it.each([
    [undefined, "Pebble #42"],
    ["provenance", "Provenance | Pebble #42"],
    ["display-center", "Display Center | Pebble #42"],
    ["rarity", "Rarity | Pebble #42"],
  ])("uses branded NFT metadata for the %s token view", async (view, title) => {
    mockNextgenFetches();

    const metadata = await generateNextGenTokenMetadata({
      params: Promise.resolve({
        token: "10000000042",
        view: view ? [view] : undefined,
      }),
    });
    const image = getSocialImage(metadata);
    const url = new URL(image.url);

    expect(metadata.title).toBe(title);
    expect(metadata.openGraph?.title).toBe(title);
    expect(metadata.twitter?.card).toBe("summary_large_image");
    expect(image).toMatchObject({
      alt: `${title} social card`,
      height: 630,
      width: 1200,
    });
    expect(url.pathname).toBe(
      `/api/og-metadata/nfts/${NEXTGEN_CONTRACT}/10000000042`
    );
    expect(url.searchParams.get("artist")).toBe("6529er");
    expect(url.searchParams.get("badge")).toBe("NextGen");
    expect(url.searchParams.get("collection")).toBe("Pebbles");
    expect(url.searchParams.get("displayId")).toBe("42");
    expect(url.searchParams.get("image")).toBe("https://cdn.test/thumb.png");
    expect(url.searchParams.get("subtitle")).toBe("Pebbles #42 | NextGen");
    expect(url.searchParams.get("title")).toBe(title);
  });

  it("falls back to a branded NextGen token card when token data is missing", async () => {
    (commonApiFetch as jest.Mock).mockRejectedValue(new Error("missing"));

    const metadata = await generateNextGenTokenMetadata({
      params: Promise.resolve({ token: "999" }),
    });
    const image = getSocialImage(metadata);
    const url = new URL(image.url);

    expect(metadata.title).toBe("NextGen Token");
    expect(url.pathname).toBe(`/api/og-metadata/nfts/${NEXTGEN_CONTRACT}/999`);
    expect(url.searchParams.get("badge")).toBe("NextGen");
    expect(url.searchParams.get("collection")).toBe("NextGen");
    expect(url.searchParams.get("image")).toBeNull();
    expect(url.searchParams.get("title")).toBe("NextGen #999");
  });
});
