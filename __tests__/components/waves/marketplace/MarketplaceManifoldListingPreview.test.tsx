import { render, waitFor } from "@testing-library/react";
import React from "react";

import MarketplaceManifoldListingPreview from "@/components/waves/marketplace/MarketplaceManifoldListingPreview";

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

describe("MarketplaceManifoldListingPreview", () => {
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

  it("renders marketplace card from nft-link media and skips open-graph", async () => {
    const href = "https://manifold.xyz/@andrew-hooker/id/4098474224";

    fetchNftLink.mockResolvedValue({
      is_enrichable: true,
      validation_error: null,
      data: {
        canonical_id: "manifold:123",
        platform: "manifold",
        chain: "ethereum",
        contract: "0x123",
        token: "1",
        media_uri: "https://cdn.example.com/nft-image.png",
        last_error_message: null,
        price: "1.25 ETH",
        last_successfully_updated: 1735689600,
        failed_since: null,
      },
    });

    render(<MarketplaceManifoldListingPreview href={href} compact={true} />);

    await waitFor(() =>
      expect(mockMarketplaceItemPreviewCard).toHaveBeenCalledWith(
        expect.objectContaining({
          href,
          mediaUrl: "https://cdn.example.com/nft-image.png",
          mediaMimeType: "image/png",
          price: "1.25 ETH",
          compact: true,
          hideActions: true,
        })
      )
    );
    expect(fetchLinkPreview).not.toHaveBeenCalled();
    expect(
      mockMarketplaceItemPreviewCard.mock.calls[0][0].title
    ).toBeUndefined();
  });

  it("renders unavailable card when nft-link and fallback provide no media", async () => {
    const href = "https://manifold.xyz/@andrew-hooker/id/4098474224";

    fetchLinkPreview.mockResolvedValue({
      type: "manifold.listing",
      description: "No preview media available",
      manifold: {
        listingId: "123",
      },
    });

    render(<MarketplaceManifoldListingPreview href={href} />);

    await waitFor(() =>
      expect(mockMarketplaceUnavailableCard).toHaveBeenCalledWith({
        href,
        compact: false,
      })
    );
    expect(fetchNftLink).toHaveBeenCalledWith(href);
    expect(fetchLinkPreview).toHaveBeenCalledWith(href);
  });

  it("defaults media mime type when nft-link media type cannot be inferred", async () => {
    const href = "https://manifold.xyz/@andrew-hooker/id/4098474224";

    fetchNftLink.mockResolvedValue({
      is_enrichable: true,
      validation_error: null,
      data: {
        canonical_id: "manifold:123",
        platform: "manifold",
        chain: "ethereum",
        contract: "0x123",
        token: "1",
        media_uri: "https://arweave.net/test-image",
        last_error_message: null,
        price: null,
        last_successfully_updated: 1735689600,
        failed_since: null,
      },
    });

    render(<MarketplaceManifoldListingPreview href={href} />);

    await waitFor(() =>
      expect(mockMarketplaceItemPreviewCard).toHaveBeenCalledWith(
        expect.objectContaining({
          href,
          mediaUrl: "https://arweave.net/test-image",
          mediaMimeType: "image/*",
        })
      )
    );
    expect(fetchLinkPreview).not.toHaveBeenCalled();
  });

  it("falls back to link preview media when nft-link has no data", async () => {
    const href = "https://manifold.xyz/@andrew-hooker/id/4098474224";

    fetchLinkPreview.mockResolvedValue({
      type: "manifold.listing",
      image: { url: "https://arweave.net/test-image.webp", type: "image/webp" },
      manifold: {
        listingId: "123",
      },
    });

    fetchNftLink.mockResolvedValue({
      is_enrichable: true,
      validation_error: null,
      data: null,
    });

    render(<MarketplaceManifoldListingPreview href={href} />);

    await waitFor(() =>
      expect(mockMarketplaceItemPreviewCard).toHaveBeenCalledWith(
        expect.objectContaining({
          href,
          mediaUrl: "https://arweave.net/test-image.webp",
          mediaMimeType: "image/webp",
          price: undefined,
        })
      )
    );
    expect(fetchLinkPreview).toHaveBeenCalledWith(href);
  });

  it("falls back to link preview media when nft-link request fails", async () => {
    const href = "https://manifold.xyz/@andrew-hooker/id/4098474224";

    fetchNftLink.mockRejectedValue(new Error("nft-link failed"));
    fetchLinkPreview.mockResolvedValue({
      type: "manifold.listing",
      image: { url: "https://arweave.net/test-image.webp", type: "image/webp" },
      manifold: {
        listingId: "123",
      },
    });

    render(<MarketplaceManifoldListingPreview href={href} />);

    await waitFor(() =>
      expect(mockMarketplaceItemPreviewCard).toHaveBeenCalledWith(
        expect.objectContaining({
          href,
          mediaUrl: "https://arweave.net/test-image.webp",
          mediaMimeType: "image/webp",
          price: undefined,
        })
      )
    );
    expect(fetchLinkPreview).toHaveBeenCalledWith(href);
  });
});
