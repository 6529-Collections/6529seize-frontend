import { render, screen } from "@testing-library/react";
import React from "react";

import { createNftMarketplacesHandler } from "@/components/drops/view/part/dropPartMarkdown/handlers/nftMarketplaces";

const mockMarketplacePreview = jest.fn(({ href }: any) => (
  <div data-testid="marketplace-preview" data-href={href} />
));

jest.mock("@/components/waves/MarketplacePreview", () => ({
  __esModule: true,
  default: (props: any) => mockMarketplacePreview(props),
}));

describe("createNftMarketplacesHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("matches all allowlisted marketplace URL patterns", () => {
    const handler = createNftMarketplacesHandler();

    expect(
      handler.match(
        "https://superrare.com/artwork/eth/0x7db02Ef0B7Eaad11958Ed534287A74C8607376C4/4"
      )
    ).toBe(true);
    expect(
      handler.match(
        "https://transient.xyz/nfts/ethereum/0xda48f4db41415fc2873efb487eec1068626fad60/7"
      )
    ).toBe(true);
    expect(handler.match("https://transient.xyz/mint/edition-1")).toBe(true);
    expect(
      handler.match("https://manifold.xyz/@andrew-hooker/id/4098474224")
    ).toBe(true);
    expect(
      handler.match(
        "https://foundation.app/mint/eth/0x5847Eaef547F1B01C0a23d8af615AB2f0bB235A4/8"
      )
    ).toBe(true);
    expect(
      handler.match(
        "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/1"
      )
    ).toBe(true);
    expect(
      handler.match(
        "https://opensea.io/assets/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/2"
      )
    ).toBe(true);
  });

  it("matches allowlisted URLs on www hosts too", () => {
    const handler = createNftMarketplacesHandler();

    expect(
      handler.match(
        "https://www.superrare.com/artwork/eth/0x7db02Ef0B7Eaad11958Ed534287A74C8607376C4/4"
      )
    ).toBe(true);
    expect(
      handler.match(
        "https://www.transient.xyz/nfts/ethereum/0xda48f4db41415fc2873efb487eec1068626fad60/7"
      )
    ).toBe(true);
    expect(handler.match("https://www.transient.xyz/mint/edition-2")).toBe(
      true
    );
    expect(
      handler.match("https://www.manifold.xyz/@andrew-hooker/id/4098474224")
    ).toBe(true);
    expect(
      handler.match(
        "https://www.foundation.app/mint/eth/0x5847Eaef547F1B01C0a23d8af615AB2f0bB235A4/8"
      )
    ).toBe(true);
    expect(
      handler.match(
        "https://www.opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/1"
      )
    ).toBe(true);
    expect(
      handler.match(
        "https://www.opensea.io/assets/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/2"
      )
    ).toBe(true);
  });

  it("does not match unsupported protocol, path, chain, or host", () => {
    const handler = createNftMarketplacesHandler();

    expect(
      handler.match(
        "http://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/1"
      )
    ).toBe(false);
    expect(
      handler.match("https://superrare.com/artwork-v2/some-token-slug")
    ).toBe(false);
    expect(
      handler.match(
        "https://superrare.com/artwork/base/0x7db02Ef0B7Eaad11958Ed534287A74C8607376C4/4"
      )
    ).toBe(false);
    expect(
      handler.match(
        "https://transient.xyz/nfts/base/0xda48f4db41415fc2873efb487eec1068626fad60/7"
      )
    ).toBe(false);
    expect(handler.match("https://transient.xyz/mint/edition/2")).toBe(false);
    expect(handler.match("https://manifold.xyz/@andrew-hooker")).toBe(false);
    expect(
      handler.match(
        "https://foundation.app/mint/base/0x5847Eaef547F1B01C0a23d8af615AB2f0bB235A4/8"
      )
    ).toBe(false);
    expect(
      handler.match(
        "https://opensea.io/item/base/0x495f947276749ce646f68ac8c248420045cb7b5e/1"
      )
    ).toBe(false);
    expect(handler.match("https://opensea.io/collection/example")).toBe(false);
    expect(handler.match("https://transient.xyz/about")).toBe(false);
    expect(
      handler.match(
        "https://foo.opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/1"
      )
    ).toBe(false);
    expect(
      handler.match("https://fake-manifold.xyz/@andrew-hooker/id/4098474224")
    ).toBe(false);
    expect(
      handler.match(
        "https://fake-opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/1"
      )
    ).toBe(false);
  });

  it("renders MarketplacePreview for matched URLs", () => {
    const handler = createNftMarketplacesHandler();
    const href =
      "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/31136811317196283853097434082447684930607990400663529852029007509349076041729";

    const element = handler.render(href);
    render(<>{element}</>);

    expect(mockMarketplacePreview).toHaveBeenCalledWith({
      href,
      compact: true,
    });
    expect(screen.getByTestId("marketplace-preview")).toHaveAttribute(
      "data-href",
      href
    );
  });
});
