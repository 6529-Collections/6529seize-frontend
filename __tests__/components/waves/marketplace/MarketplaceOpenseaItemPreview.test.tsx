import { render, waitFor } from "@testing-library/react";
import React from "react";

import MarketplaceOpenseaItemPreview from "@/components/waves/marketplace/MarketplaceOpenseaItemPreview";

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

describe("MarketplaceOpenseaItemPreview", () => {
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

  it("uses OpenSea overlay image as last resort when no alternative exists", async () => {
    const href =
      "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/31136811317196283853097434082447684930607990400663529852029007509349076041729";
    fetchLinkPreview.mockResolvedValue({
      image: {
        url: "https://opensea.io/item/test/opengraph-image?ts=1",
        type: "image/png",
      },
    });

    render(<MarketplaceOpenseaItemPreview href={href} />);

    await waitFor(() =>
      expect(mockMarketplaceItemPreviewCard).toHaveBeenCalledWith(
        expect.objectContaining({
          href,
          mediaUrl: "https://opensea.io/item/test/opengraph-image?ts=1",
          mediaMimeType: "image/png",
        })
      )
    );
    expect(fetchNftLink).toHaveBeenCalledWith(href);
    expect(fetchLinkPreview).toHaveBeenCalledWith(href);
  });

  it("prefers non-overlay image when blocked and non-blocked candidates both exist", async () => {
    const href =
      "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/31136811317196283853097434082447684930607990400663529852029007509349076041729";
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

    render(<MarketplaceOpenseaItemPreview href={href} />);

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
    expect(
      mockMarketplaceItemPreviewCard.mock.calls[0][0].title
    ).toBeUndefined();
  });
});
