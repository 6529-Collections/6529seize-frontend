import { render, waitFor } from "@testing-library/react";
import React from "react";

import MarketplaceManifoldListingPreview from "@/components/waves/marketplace/MarketplaceManifoldListingPreview";

const mockMarketplacePreviewPlaceholder = jest.fn(() => (
  <div data-testid="marketplace-placeholder" />
));
const mockMarketplaceUnavailableCard = jest.fn(() => (
  <div data-testid="marketplace-unavailable" />
));
const mockMarketplaceItemPreviewCard = jest.fn((props: any) => (
  <div data-testid="marketplace-item-card" data-title={props.title} />
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

describe("MarketplaceManifoldListingPreview", () => {
  const { fetchLinkPreview } = require("@/services/api/link-preview-api");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders marketplace card and forwards compact", async () => {
    const href = "https://manifold.xyz/@andrew-hooker/id/4098474224";

    fetchLinkPreview.mockResolvedValue({
      type: "manifold.listing",
      title: "The Big Bang",
      image: { url: "https://arweave.net/test-image.webp", type: "image/webp" },
      manifold: {
        listingId: "123",
      },
    });

    render(<MarketplaceManifoldListingPreview href={href} compact={true} />);

    await waitFor(() =>
      expect(mockMarketplaceItemPreviewCard).toHaveBeenCalledWith(
        expect.objectContaining({
          href,
          title: "The Big Bang",
          mediaUrl: "https://arweave.net/test-image.webp",
          mediaMimeType: "image/webp",
          compact: true,
          hideActions: true,
        })
      )
    );
  });

  it("renders unavailable card when image is missing", async () => {
    const href = "https://manifold.xyz/@andrew-hooker/id/4098474224";
    fetchLinkPreview.mockResolvedValue({
      type: "manifold.listing",
      title: "The Big Bang",
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
  });

  it("defaults media mime type when image type is missing", async () => {
    const href = "https://manifold.xyz/@andrew-hooker/id/4098474224";

    fetchLinkPreview.mockResolvedValue({
      type: "manifold.listing",
      title: "The Big Bang",
      image: {
        url: "https://arweave.net/test-image",
      },
      manifold: {
        listingId: "123",
      },
    });

    render(<MarketplaceManifoldListingPreview href={href} />);

    await waitFor(() =>
      expect(mockMarketplaceItemPreviewCard).toHaveBeenCalledWith(
        expect.objectContaining({
          href,
          title: "The Big Bang",
          mediaUrl: "https://arweave.net/test-image",
          mediaMimeType: "image/*",
        })
      )
    );
  });
});
