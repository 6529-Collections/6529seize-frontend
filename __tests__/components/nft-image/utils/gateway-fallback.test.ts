jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrlSync: (url: string) =>
    url.startsWith("ipfs://")
      ? `https://ipfs.6529.io/ipfs/${url.slice("ipfs://".length)}`
      : url,
}));

jest.mock("@/helpers/Helpers", () => ({
  parseIpfsUrl: (url: string) =>
    url.startsWith("ipfs://")
      ? `https://ipfs.io/ipfs/${url.slice("ipfs://".length)}`
      : url,
}));

jest.mock("@/lib/media/ipfs-gateways", () => ({
  getConfiguredIpfsGatewayHost: () => "ipfs.6529.io",
}));

jest.mock("@/lib/media/arweave-gateways", () => ({
  ARWEAVE_FALLBACK_HOSTS: ["arweave.net", "ardrive.net", "gateway.arweave.net"],
  canonicalizeArweaveGatewayHostname: (hostname: string) =>
    hostname.toLowerCase(),
  isArweaveGatewayRuntimeHost: (hostname: string) =>
    ["arweave.net", "ardrive.net", "gateway.arweave.net"].includes(
      hostname.toLowerCase()
    ),
}));

import {
  getMediaGatewayFallbackUrls,
  shouldUseIframeFallbackTimeout,
} from "@/components/nft-image/utils/gateway-fallback";

describe("gateway fallback helpers", () => {
  it("prefers the configured gateway for ipfs protocol urls", () => {
    expect(getMediaGatewayFallbackUrls("ipfs://bafy-test")).toEqual([
      "https://ipfs.6529.io/ipfs/bafy-test",
      "https://ipfs.io/ipfs/bafy-test",
    ]);
  });

  it("normalizes ipfs gateway urls back to configured gateway first", () => {
    expect(
      getMediaGatewayFallbackUrls("https://ipfs.io/ipfs/bafy-test")
    ).toEqual([
      "https://ipfs.6529.io/ipfs/bafy-test",
      "https://ipfs.io/ipfs/bafy-test",
    ]);
  });

  it("uses timeout fallback for approved arweave gateways", () => {
    expect(
      shouldUseIframeFallbackTimeout("https://arweave.net/transaction-id")
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
