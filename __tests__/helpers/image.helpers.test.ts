import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";

jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrlSync: (url: string) => {
    if (url.startsWith("ipfs://")) {
      return `https://ipfs-gateway.test/ipfs/${url.slice(7)}`;
    }
    return url;
  },
}));

describe("getScaledImageUri", () => {
  it("returns original url for non scalable prefix", () => {
    const url = "https://example.com/image.png";
    expect(getScaledImageUri(url, ImageScale.W_AUTO_H_50)).toBe(url);
  });

  it("scales known prefix images", () => {
    const url = "https://d3lqz0a4bldqgf.cloudfront.net/pfp/user/avatar.png?x=1";
    expect(getScaledImageUri(url, ImageScale.W_200_H_200)).toBe(
      `https://d3lqz0a4bldqgf.cloudfront.net/pfp/user/${ImageScale.W_200_H_200}/avatar.png?x=1`
    );
  });

  it("returns original url for unsupported extension", () => {
    const url = "https://d3lqz0a4bldqgf.cloudfront.net/pfp/user/file.svg";
    expect(getScaledImageUri(url, ImageScale.AUTOx450)).toBe(url);
  });

  it("resolves ipfs:// urls to gateway urls", () => {
    const ipfsUrl = "ipfs://QmVdHEkqhPqjBCzS2cSNDhRwz4X2TicEzQtP9ep5Lspyc8";
    expect(getScaledImageUri(ipfsUrl, ImageScale.W_AUTO_H_50)).toBe(
      "https://ipfs-gateway.test/ipfs/QmVdHEkqhPqjBCzS2cSNDhRwz4X2TicEzQtP9ep5Lspyc8"
    );
  });
});
