import { render, waitFor } from "@testing-library/react";
import React from "react";

import ManifoldPreview from "@/components/waves/ManifoldPreview";

const mockOpenGraphPreview = jest.fn(() => <div data-testid="placeholder" />);
const mockManifoldItemPreviewCard = jest.fn((props: any) => (
  <div data-testid="manifold-item-card" data-title={props.title} />
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

describe("ManifoldPreview", () => {
  const { fetchLinkPreview } = require("@/services/api/link-preview-api");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders manifold item card when listing has title and image", async () => {
    fetchLinkPreview.mockResolvedValue({
      type: "manifold.listing",
      title: "The Big Bang",
      image: { url: "https://arweave.net/test-image.webp", type: "image/webp" },
      manifold: {
        priceEth: "0.35",
      },
    });

    render(
      <ManifoldPreview href="https://manifold.xyz/@andrew-hooker/id/4098474224" />
    );

    await waitFor(() =>
      expect(mockManifoldItemPreviewCard).toHaveBeenCalledWith(
        expect.objectContaining({
          href: "https://manifold.xyz/@andrew-hooker/id/4098474224",
          title: "The Big Bang",
          mediaUrl: "https://arweave.net/test-image.webp",
          mediaMimeType: "image/webp",
        })
      )
    );
  });

  it("defaults media mime type when listing image type is missing", async () => {
    fetchLinkPreview.mockResolvedValue({
      type: "manifold.listing",
      title: "Mime Fallback",
      image: { url: "https://arweave.net/test-image" },
      manifold: {
        listingId: "123",
      },
    });

    render(
      <ManifoldPreview href="https://manifold.xyz/@andrew-hooker/id/4098474224" />
    );

    await waitFor(() =>
      expect(mockManifoldItemPreviewCard).toHaveBeenCalledWith(
        expect.objectContaining({
          href: "https://manifold.xyz/@andrew-hooker/id/4098474224",
          title: "Mime Fallback",
          mediaUrl: "https://arweave.net/test-image",
          mediaMimeType: "image/*",
        })
      )
    );
  });

  it("falls back to generic open graph preview when listing image is missing", async () => {
    fetchLinkPreview.mockResolvedValue({
      type: "manifold.listing",
      title: "Image Missing",
      manifold: {
        listingId: "123",
      },
    });

    render(
      <ManifoldPreview href="https://manifold.xyz/@andrew-hooker/id/4098474224" />
    );

    await waitFor(() =>
      expect(mockOpenGraphPreview).toHaveBeenCalledWith(
        expect.objectContaining({
          href: "https://manifold.xyz/@andrew-hooker/id/4098474224",
          preview: expect.objectContaining({
            type: "manifold.listing",
            title: "Image Missing",
          }),
        })
      )
    );
  });
});
