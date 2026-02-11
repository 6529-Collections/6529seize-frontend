import { render, waitFor } from "@testing-library/react";
import React from "react";

import NftMarketplacePreview from "@/components/waves/NftMarketplacePreview";

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

describe("NftMarketplacePreview", () => {
  const { fetchLinkPreview } = require("@/services/api/link-preview-api");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders image+title card when marketplace preview has title and image", async () => {
    const href =
      "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/31136811317196283853097434082447684930607990400663529852029007509349076041729";
    fetchLinkPreview.mockResolvedValue({
      title: "Radar dome - Earth Spaces | OpenSea",
      image: {
        url: "https://opensea.io/item/test/opengraph-image?ts=1",
        type: "image/png",
      },
    });

    render(<NftMarketplacePreview href={href} />);

    await waitFor(() =>
      expect(mockManifoldItemPreviewCard).toHaveBeenCalledWith(
        expect.objectContaining({
          href,
          title: "Radar dome - Earth Spaces | OpenSea",
          mediaUrl: "https://opensea.io/item/test/opengraph-image?ts=1",
          mediaMimeType: "image/png",
        })
      )
    );
  });

  it("defaults media mime type when image type is missing", async () => {
    const href =
      "https://foundation.app/mint/eth/0x5847Eaef547F1B01C0a23d8af615AB2f0bB235A4/8";
    fetchLinkPreview.mockResolvedValue({
      title: "ALONE | Foundation",
      image: {
        url: "https://foundation.app/api/og/nft/1/0x5847Eaef547F1B01C0a23d8af615AB2f0bB235A4/8",
      },
    });

    render(<NftMarketplacePreview href={href} />);

    await waitFor(() =>
      expect(mockManifoldItemPreviewCard).toHaveBeenCalledWith(
        expect.objectContaining({
          href,
          title: "ALONE | Foundation",
          mediaUrl:
            "https://foundation.app/api/og/nft/1/0x5847Eaef547F1B01C0a23d8af615AB2f0bB235A4/8",
          mediaMimeType: "image/*",
        })
      )
    );
  });

  it("falls back to open graph preview when image is missing", async () => {
    const href =
      "https://www.transient.xyz/nfts/ethereum/0xda48f4db41415fc2873efb487eec1068626fad60/7";
    fetchLinkPreview.mockResolvedValue({
      title: "Stitched by @graffitiongrave | Transient Labs",
      description: "Beauty is the thread we use to sew our secrets shut.",
    });

    render(<NftMarketplacePreview href={href} />);

    await waitFor(() =>
      expect(mockOpenGraphPreview).toHaveBeenCalledWith(
        expect.objectContaining({
          href,
          preview: expect.objectContaining({
            title: "Stitched by @graffitiongrave | Transient Labs",
          }),
        })
      )
    );
  });
});
