import { render, waitFor } from "@testing-library/react";
import React from "react";

import MarketplaceOpenseaAssetPreview from "@/components/waves/marketplace/MarketplaceOpenseaAssetPreview";

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

describe("MarketplaceOpenseaAssetPreview", () => {
  const { fetchLinkPreview } = require("@/services/api/link-preview-api");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("prefers non-overlay image when blocked and non-blocked candidates both exist", async () => {
    const href =
      "https://opensea.io/assets/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/42";
    fetchLinkPreview.mockResolvedValue({
      title: "Radar dome - Earth Spaces | OpenSea",
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
      expect(mockManifoldItemPreviewCard).toHaveBeenCalledWith(
        expect.objectContaining({
          href,
          title: "Radar dome - Earth Spaces | OpenSea",
          mediaUrl: "https://i.seadn.io/s/raw/files/radar-dome.png",
          mediaMimeType: "image/png",
        })
      )
    );
  });
});
