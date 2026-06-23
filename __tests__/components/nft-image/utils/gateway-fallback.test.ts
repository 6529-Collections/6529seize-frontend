import {
  getMediaGatewayFallbackUrls,
  shouldUseIframeFallbackTimeout,
} from "@/components/nft-image/utils/gateway-fallback";

const IPFS_CID = "bafybeigdyrztu5bq5q6kq6kq6kq6kq6kq6kq6kq6kq6kq6kq";
const ARWEAVE_TX_ID = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ";

describe("gateway fallback helpers", () => {
  it("prefers the 6529 resolver for ipfs protocol urls", () => {
    expect(getMediaGatewayFallbackUrls(`ipfs://${IPFS_CID}`).slice(0, 3)).toEqual(
      [
        `https://media.6529.io/ipfs/${IPFS_CID}`,
        `https://ipfs.io/ipfs/${IPFS_CID}`,
        `https://cf-ipfs.com/ipfs/${IPFS_CID}`,
      ]
    );
  });

  it("normalizes ipfs gateway urls back to the 6529 resolver first", () => {
    expect(
      getMediaGatewayFallbackUrls(`https://ipfs.io/ipfs/${IPFS_CID}`).slice(
        0,
        3
      )
    ).toEqual([
      `https://media.6529.io/ipfs/${IPFS_CID}`,
      `https://ipfs.io/ipfs/${IPFS_CID}`,
      `https://cf-ipfs.com/ipfs/${IPFS_CID}`,
    ]);
  });

  it("uses timeout fallback for approved arweave gateways and the 6529 resolver", () => {
    expect(
      shouldUseIframeFallbackTimeout(`https://arweave.net/${ARWEAVE_TX_ID}`)
    ).toBe(true);
    expect(
      shouldUseIframeFallbackTimeout(
        `https://media.6529.io/arweave/${ARWEAVE_TX_ID}`
      )
    ).toBe(true);
  });

  it("does not use timeout fallback for empty urls", () => {
    expect(shouldUseIframeFallbackTimeout("")).toBe(false);
  });

  it("does not use timeout fallback for ipfs protocol urls", () => {
    expect(shouldUseIframeFallbackTimeout(`ipfs://${IPFS_CID}`)).toBe(false);
  });

  it("does not use timeout fallback for ipfs gateways", () => {
    expect(
      shouldUseIframeFallbackTimeout(`https://ipfs.6529.io/ipfs/${IPFS_CID}`)
    ).toBe(false);
    expect(
      shouldUseIframeFallbackTimeout(`https://ipfs.io/ipfs/${IPFS_CID}`)
    ).toBe(false);
  });
});
