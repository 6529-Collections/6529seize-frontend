import { render, screen } from "@testing-library/react";
import React from "react";

import { createNftMarketplacesHandler } from "@/components/drops/view/part/dropPartMarkdown/handlers/nftMarketplaces";

const mockNftMarketplacePreview = jest.fn(({ href }: any) => (
  <div data-testid="nft-marketplace-preview" data-href={href} />
));

jest.mock("@/components/waves/NftMarketplacePreview", () => ({
  __esModule: true,
  default: (props: any) => mockNftMarketplacePreview(props),
}));

describe("createNftMarketplacesHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("matches supported NFT marketplace item URLs", () => {
    const handler = createNftMarketplacesHandler();

    expect(
      handler.match(
        "https://superrare.com/artwork/eth/0x7db02Ef0B7Eaad11958Ed534287A74C8607376C4/4"
      )
    ).toBe(true);
    expect(
      handler.match(
        "https://foundation.app/mint/eth/0x5847Eaef547F1B01C0a23d8af615AB2f0bB235A4/8"
      )
    ).toBe(true);
    expect(
      handler.match(
        "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/31136811317196283853097434082447684930607990400663529852029007509349076041729"
      )
    ).toBe(true);
    expect(
      handler.match(
        "https://www.transient.xyz/nfts/ethereum/0xda48f4db41415fc2873efb487eec1068626fad60/7"
      )
    ).toBe(true);
  });

  it("does not match unsupported paths or lookalike domains", () => {
    const handler = createNftMarketplacesHandler();

    expect(handler.match("https://superrare.com/@rocketgirl")).toBe(false);
    expect(handler.match("https://foundation.app/collection/example")).toBe(
      false
    );
    expect(handler.match("https://opensea.io/collection/example")).toBe(false);
    expect(handler.match("https://transient.xyz/about")).toBe(false);
    expect(
      handler.match(
        "https://fake-opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/1"
      )
    ).toBe(false);
  });

  it("renders NftMarketplacePreview for matched URLs", () => {
    const handler = createNftMarketplacesHandler();
    const href =
      "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/31136811317196283853097434082447684930607990400663529852029007509349076041729";

    const element = handler.render(href);
    render(<>{element}</>);

    expect(mockNftMarketplacePreview).toHaveBeenCalledWith({
      href,
    });
    expect(screen.getByTestId("nft-marketplace-preview")).toHaveAttribute(
      "data-href",
      href
    );
  });
});
