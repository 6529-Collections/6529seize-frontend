import {
  getMediaGatewayFallbackUrls,
  shouldUseIframeFallbackTimeout,
} from "@/components/nft-image/utils/gateway-fallback";

describe("gateway fallback helpers", () => {
  it("prefers the 6529 resolver for ipfs protocol urls", () => {
    expect(getMediaGatewayFallbackUrls("ipfs://bafy-test").slice(0, 3)).toEqual(
      [
        "https://media.6529.io/ipfs/bafy-test",
        "https://ipfs.io/ipfs/bafy-test",
        "https://cf-ipfs.com/ipfs/bafy-test",
      ]
    );
  });

  it("normalizes ipfs gateway urls back to the 6529 resolver first", () => {
    expect(
      getMediaGatewayFallbackUrls("https://ipfs.io/ipfs/bafy-test").slice(0, 3)
    ).toEqual([
      "https://media.6529.io/ipfs/bafy-test",
      "https://ipfs.io/ipfs/bafy-test",
      "https://cf-ipfs.com/ipfs/bafy-test",
    ]);
  });

  it("uses timeout fallback for approved arweave gateways and the 6529 resolver", () => {
    expect(
      shouldUseIframeFallbackTimeout("https://arweave.net/transaction-id")
    ).toBe(true);
    expect(
      shouldUseIframeFallbackTimeout(
        "https://media.6529.io/arweave/transaction-id"
      )
    ).toBe(true);
  });

  it("does not use timeout fallback for empty urls", () => {
    expect(shouldUseIframeFallbackTimeout("")).toBe(false);
  });

  it("does not use timeout fallback for ipfs protocol urls", () => {
    expect(shouldUseIframeFallbackTimeout("ipfs://bafy-test")).toBe(false);
  });

  it("does not use timeout fallback for ipfs gateways", () => {
    expect(
      shouldUseIframeFallbackTimeout("https://ipfs.6529.io/ipfs/bafy-test")
    ).toBe(false);
    expect(
      shouldUseIframeFallbackTimeout("https://ipfs.io/ipfs/bafy-test")
    ).toBe(false);
  });
});
