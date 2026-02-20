import {
  getMarketplaceUrlKind,
  isNftMarketplaceLink,
} from "@/components/waves/marketplace/urlKind";

describe("marketplace url kind", () => {
  it.each([
    ["https://manifold.xyz/@andrew-hooker/id/4098474224", "manifold.listing"],
    [
      "https://superrare.com/artwork/eth/0x7db02Ef0B7Eaad11958Ed534287A74C8607376C4/4",
      "superrare.artwork",
    ],
    [
      "https://foundation.app/mint/eth/0x5847Eaef547F1B01C0a23d8af615AB2f0bB235A4/8",
      "foundation.mint",
    ],
    [
      "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/1",
      "opensea.item",
    ],
    [
      "https://opensea.io/assets/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/2",
      "opensea.asset",
    ],
    [
      "https://transient.xyz/nfts/ethereum/0xda48f4db41415fc2873efb487eec1068626fad60/7",
      "transient.nft",
    ],
    ["https://transient.xyz/mint/edition-1", "transient.mint"],
    [
      "https://www.manifold.xyz/@andrew-hooker/id/4098474224",
      "manifold.listing",
    ],
    [
      "https://www.opensea.io/assets/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/2",
      "opensea.asset",
    ],
  ])("classifies %s as %s", (href, kind) => {
    expect(getMarketplaceUrlKind(href)).toBe(kind);
    expect(isNftMarketplaceLink(href)).toBe(true);
  });

  it.each([
    "http://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/1",
    "https://opensea.io/item/base/0x495f947276749ce646f68ac8c248420045cb7b5e/1",
    "https://opensea.io/collection/example",
    "https://transient.xyz/about",
    "https://fake-opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/1",
    "https://foo.opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/1",
    "not-a-url",
  ])("returns null for unsupported URL %s", (href) => {
    expect(getMarketplaceUrlKind(href)).toBeNull();
    expect(isNftMarketplaceLink(href)).toBe(false);
  });
});
