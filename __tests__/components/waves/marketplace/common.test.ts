import { createTestQueryClient } from "../../../utils/reactQuery";
import {
  patchFromMediaLinkUpdate,
  primeMarketplacePreviewCacheFromNftLinks,
  type MarketplacePreviewData,
} from "@/components/waves/marketplace/common";
import type { ApiDropNftLink } from "@/generated/models/ApiDropNftLink";
import type { WsMediaLinkUpdatedData } from "@/helpers/Types";

const getMarketplacePreviewQueryKey = (href: string, mode: string) =>
  ["MARKETPLACE_PREVIEW", { href, mode }] as const;

const READY_MEDIA_PREVIEW_STATUS = "READY" as NonNullable<
  NonNullable<ApiDropNftLink["data"]>["media_preview"]
>["status"];
const PROCESSING_MEDIA_PREVIEW_STATUS = "PROCESSING" as NonNullable<
  NonNullable<ApiDropNftLink["data"]>["media_preview"]
>["status"];

const DEFAULT_NFT_LINK_DATA: NonNullable<ApiDropNftLink["data"]> = {
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
  price_currency: "ETH",
  last_successfully_updated: 1735689600,
  failed_since: null,
  media_preview: null,
};

const createNftLink = (
  overrides: Partial<ApiDropNftLink> = {}
): ApiDropNftLink => ({
  url_in_text: "https://opensea.io/assets/ethereum/0xabc/1",
  data: { ...DEFAULT_NFT_LINK_DATA },
  ...overrides,
});

const createNftLinkWithMediaUri = ({
  href,
  mediaUri,
}: {
  readonly href: string;
  readonly mediaUri: string;
}): ApiDropNftLink =>
  createNftLink({
    url_in_text: href,
    data: {
      ...DEFAULT_NFT_LINK_DATA,
      media_uri: mediaUri,
    },
  });

const createNftLinkWithMediaPreview = ({
  href,
  mediaUri,
  mediaPreview,
}: {
  readonly href: string;
  readonly mediaUri: string;
  readonly mediaPreview: NonNullable<
    NonNullable<ApiDropNftLink["data"]>["media_preview"]
  >;
}): ApiDropNftLink =>
  createNftLink({
    url_in_text: href,
    data: {
      ...DEFAULT_NFT_LINK_DATA,
      media_uri: mediaUri,
      media_preview: mediaPreview,
    },
  });

const createMediaLinkUpdatedPayload = (
  overrides: Partial<WsMediaLinkUpdatedData> = {}
): WsMediaLinkUpdatedData => ({
  canonical_id: "MANIFOLD:claim:1",
  platform: "MANIFOLD",
  chain: null,
  contract: null,
  token: null,
  name: null,
  description: null,
  media_uri: null,
  last_error_message: null,
  price: null,
  price_currency: null,
  last_successfully_updated: null,
  failed_since: null,
  ...overrides,
});

describe("patchFromMediaLinkUpdate", () => {
  const createCurrentData = (
    overrides: Partial<MarketplacePreviewData> = {}
  ): MarketplacePreviewData => ({
    href: "https://example.com/1",
    canonicalId: "manifold:claim:1",
    platform: "MANIFOLD",
    title: "Old title",
    description: "Old description",
    media: {
      url: "https://cdn.example.com/current-preview.webp",
      mimeType: "image/webp",
    },
    price: "1.0",
    priceCurrency: "ETH",
    ...overrides,
  });

  it("prefers preview urls from websocket payload over media_uri", () => {
    const patched = patchFromMediaLinkUpdate({
      current: createCurrentData(),
      update: createMediaLinkUpdatedPayload({
        media_uri: "https://cdn.example.com/full.jpg",
        media_preview: {
          card_url: "https://cdn.example.com/card-preview.avif",
          small_url: "https://cdn.example.com/small-preview.jpg",
          thumb_url: "https://cdn.example.com/thumb-preview.jpg",
          mime_type: "image/avif",
        },
      }),
    });

    expect(patched.media).toEqual({
      url: "https://cdn.example.com/card-preview.avif",
      mimeType: "image/avif",
    });
  });

  it("keeps existing cached preview media when websocket has only media_uri", () => {
    const current = createCurrentData();

    const patched = patchFromMediaLinkUpdate({
      current,
      update: createMediaLinkUpdatedPayload({
        media_uri: "https://cdn.example.com/full.jpg",
      }),
    });

    expect(patched.media).toEqual(current.media);
  });

  it("falls back to media_uri when cache has no media and websocket has no preview", () => {
    const patched = patchFromMediaLinkUpdate({
      current: createCurrentData({ media: null }),
      update: createMediaLinkUpdatedPayload({
        media_uri: "https://cdn.example.com/full.jpg",
      }),
    });

    expect(patched.media).toEqual({
      url: "https://cdn.example.com/full.jpg",
      mimeType: "image/jpeg",
    });
  });

  it("supports flat preview fields in websocket payload", () => {
    const patched = patchFromMediaLinkUpdate({
      current: createCurrentData(),
      update: createMediaLinkUpdatedPayload({
        media_uri: "https://cdn.example.com/full.jpg",
        media_preview_small_url: "https://cdn.example.com/small-preview.png",
      }),
    });

    expect(patched.media).toEqual({
      url: "https://cdn.example.com/small-preview.png",
      mimeType: "image/png",
    });
  });
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
        priceCurrency: "ETH",
        media: {
          url: "https://cdn.example.com/nft.png",
          mimeType: "image/png",
        },
      })
    );
    expect(sanitizedMode).toEqual(defaultMode);
  });

  it.each([
    ["mp4", "video/mp4"],
    ["webm", "video/webm"],
    ["mov", "video/quicktime"],
    ["ogv", "video/ogg"],
    ["m4v", "video/x-m4v"],
    ["mp3", "audio/mpeg"],
    ["ogg", "audio/ogg"],
    ["wav", "audio/wav"],
    ["flac", "audio/flac"],
    ["glb", "model/gltf-binary"],
    ["gltf", "model/gltf+json"],
    ["usdz", "model/vnd.usdz"],
  ])(
    "infers mime type from media_uri extension for %s",
    (extension, expectedMimeType) => {
      const queryClient = createTestQueryClient();
      const href = `https://opensea.io/assets/ethereum/0xabc/${extension}`;
      const mediaUri = `https://cdn.example.com/nft.${extension}?v=1`;

      primeMarketplacePreviewCacheFromNftLinks({
        queryClient,
        nftLinks: [createNftLinkWithMediaUri({ href, mediaUri })],
      });

      const seeded = queryClient.getQueryData<MarketplacePreviewData>(
        getMarketplacePreviewQueryKey(href, "default")
      );

      expect(seeded?.media).toEqual({
        url: mediaUri,
        mimeType: expectedMimeType,
      });
    }
  );

  it("falls back to image/* when media_uri extension is unknown", () => {
    const queryClient = createTestQueryClient();
    const href = "https://opensea.io/assets/ethereum/0xabc/unknown";
    const mediaUri = "https://cdn.example.com/nft.unknown?v=1";

    primeMarketplacePreviewCacheFromNftLinks({
      queryClient,
      nftLinks: [createNftLinkWithMediaUri({ href, mediaUri })],
    });

    const seeded = queryClient.getQueryData<MarketplacePreviewData>(
      getMarketplacePreviewQueryKey(href, "default")
    );

    expect(seeded?.media).toEqual({
      url: mediaUri,
      mimeType: "image/*",
    });
  });

  it("prefers READY media_preview urls over media_uri", () => {
    const queryClient = createTestQueryClient();
    const href = "https://opensea.io/assets/ethereum/0xabc/preview-first";
    const mediaUri = "https://cdn.example.com/fallback.png";
    const cardUrl = "https://cdn.example.com/card.webp";

    primeMarketplacePreviewCacheFromNftLinks({
      queryClient,
      nftLinks: [
        createNftLinkWithMediaPreview({
          href,
          mediaUri,
          mediaPreview: {
            status: READY_MEDIA_PREVIEW_STATUS,
            kind: "image",
            card_url: cardUrl,
            thumb_url: "https://cdn.example.com/thumb.jpg",
            small_url: "https://cdn.example.com/small.jpg",
            width: 1200,
            height: 1200,
            mime_type: "image/webp",
          },
        }),
      ],
    });

    const seeded = queryClient.getQueryData<MarketplacePreviewData>(
      getMarketplacePreviewQueryKey(href, "default")
    );

    expect(seeded?.media).toEqual({
      url: cardUrl,
      mimeType: "image/webp",
    });
  });

  it("falls back through media_preview small_url then thumb_url", () => {
    const queryClient = createTestQueryClient();
    const href = "https://opensea.io/assets/ethereum/0xabc/preview-fallback";
    const mediaUri = "https://cdn.example.com/fallback.png";
    const smallUrl = "https://cdn.example.com/small.jpg?v=1";

    primeMarketplacePreviewCacheFromNftLinks({
      queryClient,
      nftLinks: [
        createNftLinkWithMediaPreview({
          href,
          mediaUri,
          mediaPreview: {
            status: READY_MEDIA_PREVIEW_STATUS,
            kind: "image",
            card_url: null,
            thumb_url: "https://cdn.example.com/thumb.jpg",
            small_url: smallUrl,
            width: 1200,
            height: 1200,
            mime_type: null,
          },
        }),
      ],
    });

    const seeded = queryClient.getQueryData<MarketplacePreviewData>(
      getMarketplacePreviewQueryKey(href, "default")
    );

    expect(seeded?.media).toEqual({
      url: smallUrl,
      mimeType: "image/jpeg",
    });
  });

  it("uses media_uri when media_preview is not READY", () => {
    const queryClient = createTestQueryClient();
    const href =
      "https://opensea.io/assets/ethereum/0xabc/preview-processing-fallback";
    const mediaUri = "https://cdn.example.com/fallback.png";

    primeMarketplacePreviewCacheFromNftLinks({
      queryClient,
      nftLinks: [
        createNftLinkWithMediaPreview({
          href,
          mediaUri,
          mediaPreview: {
            status: PROCESSING_MEDIA_PREVIEW_STATUS,
            kind: "image",
            card_url: "https://cdn.example.com/card.webp",
            thumb_url: "https://cdn.example.com/thumb.jpg",
            small_url: "https://cdn.example.com/small.jpg",
            width: 1200,
            height: 1200,
            mime_type: "image/webp",
          },
        }),
      ],
    });

    const seeded = queryClient.getQueryData<MarketplacePreviewData>(
      getMarketplacePreviewQueryKey(href, "default")
    );

    expect(seeded?.media).toEqual({
      url: mediaUri,
      mimeType: "image/png",
    });
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
        priceCurrency: null,
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
        priceCurrency: "ETH",
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
