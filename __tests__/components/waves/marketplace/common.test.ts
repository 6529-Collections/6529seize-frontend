import { createTestQueryClient } from "../../../utils/reactQuery";
import {
  primeMarketplacePreviewCacheFromNftLinks,
  type MarketplacePreviewData,
} from "@/components/waves/marketplace/common";
import type { ApiDropNftLink } from "@/generated/models/ApiDropNftLink";

const getMarketplacePreviewQueryKey = (href: string, mode: string) =>
  ["MARKETPLACE_PREVIEW", { href, mode }] as const;

const createNftLink = (
  overrides: Partial<ApiDropNftLink> = {}
): ApiDropNftLink => ({
  url_in_text: "https://opensea.io/assets/ethereum/0xabc/1",
  data: {
    canonical_id: "ethereum:0xabc:1",
    platform: "opensea",
    chain: "ethereum",
    contract: "0xabc",
    token: "1",
    name: "Seeded NFT",
    description: "Seeded from drop nft_links",
    media_uri: "https://cdn.example.com/nft.png",
    last_error_message: null,
    price: "0.5 ETH",
    last_successfully_updated: 1735689600,
    failed_since: null,
  },
  ...overrides,
});

describe("primeMarketplacePreviewCacheFromNftLinks", () => {
  it("seeds marketplace preview cache for both preview modes", () => {
    const queryClient = createTestQueryClient();
    const nftLinks: ApiDropNftLink[] = [
      createNftLink({
        url_in_text: "  https://opensea.io/assets/ethereum/0xabc/1  ",
      }),
    ];

    primeMarketplacePreviewCacheFromNftLinks({
      queryClient,
      nftLinks,
    });

    const href = "https://opensea.io/assets/ethereum/0xabc/1";

    const defaultMode = queryClient.getQueryData<MarketplacePreviewData>(
      getMarketplacePreviewQueryKey(href, "default")
    );
    const sanitizedMode = queryClient.getQueryData<MarketplacePreviewData>(
      getMarketplacePreviewQueryKey(href, "opensea-sanitized")
    );

    expect(defaultMode).toEqual(
      expect.objectContaining({
        href,
        canonicalId: "ethereum:0xabc:1",
        platform: "opensea",
        title: "Seeded NFT",
        price: "0.5 ETH",
        media: {
          url: "https://cdn.example.com/nft.png",
          mimeType: "image/png",
        },
      })
    );
    expect(sanitizedMode).toEqual(defaultMode);
  });

  it("preserves existing populated fields while enriching missing fields", () => {
    const queryClient = createTestQueryClient();
    const href = "https://opensea.io/assets/ethereum/0xabc/1";
    queryClient.setQueryData<MarketplacePreviewData>(
      getMarketplacePreviewQueryKey(href, "default"),
      {
        href,
        canonicalId: "existing-canonical",
        platform: "existing-platform",
        title: "Existing title",
        description: null,
        media: null,
        price: null,
      }
    );

    primeMarketplacePreviewCacheFromNftLinks({
      queryClient,
      nftLinks: [createNftLink({ url_in_text: href })],
    });

    const seeded = queryClient.getQueryData<MarketplacePreviewData>(
      getMarketplacePreviewQueryKey(href, "default")
    );

    expect(seeded).toEqual(
      expect.objectContaining({
        href,
        canonicalId: "existing-canonical",
        platform: "existing-platform",
        title: "Existing title",
        description: "Seeded from drop nft_links",
        price: "0.5 ETH",
        media: {
          url: "https://cdn.example.com/nft.png",
          mimeType: "image/png",
        },
      })
    );
  });

  it("ignores blank urls", () => {
    const queryClient = createTestQueryClient();

    primeMarketplacePreviewCacheFromNftLinks({
      queryClient,
      nftLinks: [
        createNftLink({ url_in_text: "   " }),
        createNftLink({ url_in_text: "\n\t" }),
      ],
    });

    expect(queryClient.getQueryCache().findAll()).toHaveLength(0);
  });
});
