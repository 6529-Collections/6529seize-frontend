import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

import MarketplacePreview from "@/components/waves/MarketplacePreview";

const mockUseInView = jest.fn();
const mockMarketplacePreviewPlaceholder = jest.fn(() => (
  <div data-testid="marketplace-placeholder" />
));
const mockMarketplaceUnavailableCard = jest.fn(() => (
  <div data-testid="marketplace-unavailable" />
));
const mockMarketplaceManifoldListingPreview = jest.fn(() => (
  <div data-testid="manifold-listing" />
));
const mockMarketplaceSuperrareArtworkPreview = jest.fn(() => (
  <div data-testid="superrare-artwork" />
));
const mockMarketplaceFoundationMintPreview = jest.fn(() => (
  <div data-testid="foundation-mint" />
));
const mockMarketplaceOpenseaItemPreview = jest.fn(() => (
  <div data-testid="opensea-item" />
));
const mockMarketplaceOpenseaAssetPreview = jest.fn(() => (
  <div data-testid="opensea-asset" />
));
const mockMarketplaceTransientNftPreview = jest.fn(() => (
  <div data-testid="transient-nft" />
));
const mockMarketplaceTransientMintPreview = jest.fn(() => (
  <div data-testid="transient-mint" />
));

jest.mock("@/hooks/useInView", () => ({
  __esModule: true,
  useInView: (...args: any[]) => mockUseInView(...args),
}));

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

jest.mock(
  "@/components/waves/marketplace/MarketplaceManifoldListingPreview",
  () => ({
    __esModule: true,
    default: (props: any) => mockMarketplaceManifoldListingPreview(props),
  })
);

jest.mock(
  "@/components/waves/marketplace/MarketplaceSuperrareArtworkPreview",
  () => ({
    __esModule: true,
    default: (props: any) => mockMarketplaceSuperrareArtworkPreview(props),
  })
);

jest.mock(
  "@/components/waves/marketplace/MarketplaceFoundationMintPreview",
  () => ({
    __esModule: true,
    default: (props: any) => mockMarketplaceFoundationMintPreview(props),
  })
);

jest.mock(
  "@/components/waves/marketplace/MarketplaceOpenseaItemPreview",
  () => ({
    __esModule: true,
    default: (props: any) => mockMarketplaceOpenseaItemPreview(props),
  })
);

jest.mock(
  "@/components/waves/marketplace/MarketplaceOpenseaAssetPreview",
  () => ({
    __esModule: true,
    default: (props: any) => mockMarketplaceOpenseaAssetPreview(props),
  })
);

jest.mock(
  "@/components/waves/marketplace/MarketplaceTransientNftPreview",
  () => ({
    __esModule: true,
    default: (props: any) => mockMarketplaceTransientNftPreview(props),
  })
);

jest.mock(
  "@/components/waves/marketplace/MarketplaceTransientMintPreview",
  () => ({
    __esModule: true,
    default: (props: any) => mockMarketplaceTransientMintPreview(props),
  })
);

describe("MarketplacePreview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInView.mockReturnValue([{ current: null }, true]);
  });

  it.each([
    [
      "manifold listing URLs",
      "https://manifold.xyz/@andrew-hooker/id/4098474224",
      mockMarketplaceManifoldListingPreview,
    ],
    [
      "superrare artwork URLs",
      "https://superrare.com/artwork/eth/0x7db02Ef0B7Eaad11958Ed534287A74C8607376C4/4",
      mockMarketplaceSuperrareArtworkPreview,
    ],
    [
      "foundation mint URLs",
      "https://foundation.app/mint/eth/0x5847Eaef547F1B01C0a23d8af615AB2f0bB235A4/8",
      mockMarketplaceFoundationMintPreview,
    ],
    [
      "opensea item URLs",
      "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/1",
      mockMarketplaceOpenseaItemPreview,
    ],
    [
      "opensea asset URLs",
      "https://opensea.io/assets/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/2",
      mockMarketplaceOpenseaAssetPreview,
    ],
    [
      "transient nft URLs",
      "https://transient.xyz/nfts/ethereum/0xda48f4db41415fc2873efb487eec1068626fad60/7",
      mockMarketplaceTransientNftPreview,
    ],
    [
      "transient mint URLs",
      "https://transient.xyz/mint/edition-1",
      mockMarketplaceTransientMintPreview,
    ],
  ])(
    "routes %s to matching marketplace component when visible",
    (_, href: string, targetMock: any) => {
      render(<MarketplacePreview href={href} compact={true} />);

      expect(targetMock).toHaveBeenCalledWith({ href, compact: true });
      expect(mockMarketplacePreviewPlaceholder).not.toHaveBeenCalled();
      expect(mockMarketplaceUnavailableCard).not.toHaveBeenCalled();
    }
  );

  it("renders placeholder when marketplace preview is out of viewport", () => {
    const href = "https://manifold.xyz/@andrew-hooker/id/4098474224";
    mockUseInView.mockReturnValue([{ current: null }, false]);

    render(<MarketplacePreview href={href} />);

    expect(mockMarketplacePreviewPlaceholder).toHaveBeenCalledWith({
      href,
      compact: false,
    });
    expect(screen.getByTestId("marketplace-placeholder")).toBeInTheDocument();
    expect(mockMarketplaceManifoldListingPreview).not.toHaveBeenCalled();
  });

  it("renders marketplace unavailable card for unsupported URLs when visible", () => {
    const href = "not-a-marketplace-link";

    render(<MarketplacePreview href={href} />);

    expect(mockMarketplaceUnavailableCard).toHaveBeenCalledWith({
      href,
      compact: false,
    });
    expect(screen.getByTestId("marketplace-unavailable")).toBeInTheDocument();
  });

  it("uses marketplace viewport preload options", () => {
    render(<MarketplacePreview href="https://transient.xyz/mint/edition-1" />);

    expect(mockUseInView).toHaveBeenCalledWith({
      rootMargin: "500px 0px",
      threshold: 0,
    });
  });

  it("stops click propagation to parent containers", () => {
    const onParentClick = jest.fn();

    render(
      <div onClick={onParentClick}>
        <MarketplacePreview href="https://manifold.xyz/@andrew-hooker/id/4098474224" />
      </div>
    );

    fireEvent.click(screen.getByTestId("manifold-listing"));

    expect(onParentClick).not.toHaveBeenCalled();
  });
});
