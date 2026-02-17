import { render, waitFor } from "@testing-library/react";
import React from "react";

import MarketplaceManifoldListingPreview from "@/components/waves/marketplace/MarketplaceManifoldListingPreview";

const mockOpenGraphPreview = jest.fn(() => <div data-testid="placeholder" />);
const mockManifoldItemPreviewCard = jest.fn((props: any) => (
  <div data-testid="marketplace-item-card" data-title={props.title} />
));

jest.mock("@/components/waves/OpenGraphPreview", () => ({
  __esModule: true,
  default: (props: any) => mockOpenGraphPreview(props),
}));

jest.mock("@/components/waves/ManifoldItemPreviewCard", () => ({
  __esModule: true,
  default: (props: any) => mockManifoldItemPreviewCard(props),
}));

jest.mock("@/services/api/link-preview-api", () => ({
  fetchLinkPreview: jest.fn(),
}));

describe("MarketplaceManifoldListingPreview", () => {
  const { fetchLinkPreview } = require("@/services/api/link-preview-api");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders marketplace card and forwards imageOnly", async () => {
    const href = "https://manifold.xyz/@andrew-hooker/id/4098474224";

    fetchLinkPreview.mockResolvedValue({
      type: "manifold.listing",
      title: "The Big Bang",
      image: { url: "https://arweave.net/test-image.webp", type: "image/webp" },
      manifold: {
        listingId: "123",
      },
    });

    render(<MarketplaceManifoldListingPreview href={href} imageOnly={true} />);

    await waitFor(() =>
      expect(mockManifoldItemPreviewCard).toHaveBeenCalledWith(
        expect.objectContaining({
          href,
          title: "The Big Bang",
          mediaUrl: "https://arweave.net/test-image.webp",
          mediaMimeType: "image/webp",
          imageOnly: true,
          hideActions: true,
        })
      )
    );
  });

  it("falls back to open graph preview when image is missing", async () => {
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
      expect(mockOpenGraphPreview).toHaveBeenCalledWith(
        expect.objectContaining({
          href,
          preview: expect.objectContaining({
            title: "The Big Bang",
          }),
          imageOnly: false,
          hideActions: false,
        })
      )
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
      expect(mockManifoldItemPreviewCard).toHaveBeenCalledWith(
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
