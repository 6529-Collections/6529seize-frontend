import { render, waitFor } from "@testing-library/react";
import React from "react";

import MarketplaceOpenseaAssetPreview from "@/components/waves/marketplace/MarketplaceOpenseaAssetPreview";

const mockMarketplacePreviewPlaceholder = jest.fn(() => (
  <div data-testid="marketplace-placeholder" />
));
const mockMarketplaceUnavailableCard = jest.fn(() => (
  <div data-testid="marketplace-unavailable" />
));
const mockMarketplaceItemPreviewCard = jest.fn(() => (
  <div data-testid="marketplace-item-card" />
));

jest.mock(
  "@/components/waves/marketplace/MarketplacePreviewPlaceholder",
  () => ({
    __esModule: true,
    default: (props: any) => mockMarketplacePreviewPlaceholder(props),
  })
);

jest.mock("@/components/waves/marketplace/MarketplaceUnavailableCard", () => ({
  __esModule: true,
  default: (props: any) => mockMarketplaceUnavailableCard(props),
}));

jest.mock("@/components/waves/MarketplaceItemPreviewCard", () => ({
  __esModule: true,
  default: (props: any) => mockMarketplaceItemPreviewCard(props),
}));

jest.mock("@/services/api/link-preview-api", () => ({
  fetchLinkPreview: jest.fn(),
}));

jest.mock("@/services/api/nft-link-api", () => ({
  fetchNftLink: jest.fn(),
}));

describe("MarketplaceOpenseaAssetPreview", () => {
  const { fetchLinkPreview } = require("@/services/api/link-preview-api");
  const { fetchNftLink } = require("@/services/api/nft-link-api");

  beforeEach(() => {
    jest.clearAllMocks();
    fetchNftLink.mockResolvedValue({
      is_enrichable: true,
      validation_error: null,
      data: null,
    });
  });

  it("prefers non-overlay image when blocked and non-blocked candidates both exist", async () => {
    const href =
      "https://opensea.io/assets/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/42";
    fetchLinkPreview.mockResolvedValue({
      image: {
        url: "https://opensea.io/item/test/opengraph-image?ts=1",
        type: "image/png",
      },
      images: [
        {
          url: "https://opensea.io/item/test/opengraph-image?ts=1",
          type: "image/png",
        },
        {
          url: "https://i.seadn.io/s/raw/files/radar-dome.png",
          type: "image/png",
        },
      ],
    });

    render(<MarketplaceOpenseaAssetPreview href={href} />);

    await waitFor(() =>
      expect(mockMarketplaceItemPreviewCard).toHaveBeenCalledWith(
        expect.objectContaining({
          href,
          mediaUrl: "https://i.seadn.io/s/raw/files/radar-dome.png",
          mediaMimeType: "image/png",
        })
      )
    );
    expect(fetchNftLink).toHaveBeenCalledWith(href);
    expect(fetchLinkPreview).toHaveBeenCalledWith(href);
  });

  it("skips open-graph fallback when nft-link media is available", async () => {
    const href =
      "https://opensea.io/assets/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/42";

    fetchNftLink.mockResolvedValue({
      is_enrichable: true,
      validation_error: null,
      data: {
        canonical_id: "opensea:42",
        platform: "opensea",
        chain: "ethereum",
        contract: "0x123",
        token: "42",
        media_uri: "https://cdn.example.com/nft-image.png",
        last_error_message: null,
        price: "0.5 ETH",
        last_successfully_updated: 1735689600,
        failed_since: null,
      },
    });

    render(<MarketplaceOpenseaAssetPreview href={href} />);

    await waitFor(() =>
      expect(mockMarketplaceItemPreviewCard).toHaveBeenCalledWith(
        expect.objectContaining({
          href,
          mediaUrl: "https://cdn.example.com/nft-image.png",
          mediaMimeType: "image/png",
          price: "0.5 ETH",
        })
      )
    );
    expect(fetchLinkPreview).not.toHaveBeenCalled();
    expect(
      mockMarketplaceItemPreviewCard.mock.calls[0][0].title
    ).toBeUndefined();
  });
});
