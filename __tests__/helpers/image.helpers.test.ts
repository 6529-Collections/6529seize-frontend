import {
  getScaledImageUri,
  getAnimatedImagePreviewUri,
  getLegacyGifPreviewUri,
  isGifImageUrl,
  getScaledResolvedImageUri,
  ImageScale,
} from "@/helpers/image.helpers";

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

describe("getScaledResolvedImageUri", () => {
  it("does not re-resolve already concrete urls", () => {
    const url = "https://ipfs.io/ipfs/QmConcrete";
    expect(getScaledResolvedImageUri(url, ImageScale.W_AUTO_H_50)).toBe(url);
  });
});

describe("animation preserving previews", () => {
  it.each(["art.gif", "art.GIF?download=1"])(
    "versions GIF derivatives for %s",
    (file) => {
      const base = "https://d3lqz0a4bldqgf.cloudfront.net/drops/author/";
      const preview = getAnimatedImagePreviewUri(
        base + file,
        ImageScale.AUTOx800
      );
      expect(preview).toBe(`${base}AUTOx800_gifv2/${file}`);
      expect(getLegacyGifPreviewUri(preview)).toBe(`${base}AUTOx800/${file}`);
    }
  );
  it("leaves external GIF URLs and ordinary image scaling unchanged", () => {
    expect(
      getAnimatedImagePreviewUri(
        "https://example.com/art.gif",
        ImageScale.AUTOx800
      )
    ).toBe("https://example.com/art.gif");
    const png = "https://d3lqz0a4bldqgf.cloudfront.net/drops/a.png";
    expect(getAnimatedImagePreviewUri(png, ImageScale.AUTOx450)).toBe(
      getScaledImageUri(png, ImageScale.AUTOx450)
    );
    expect(isGifImageUrl("https://example.com/art.png?other=art.gif")).toBe(
      false
    );
  });
});

it("recognizes GIF paths in IPFS URLs without mistaking the CID for a filename", () => {
  expect(isGifImageUrl("ipfs://bafyexample/art.GIF")).toBe(true);
  expect(isGifImageUrl("ipfs://bafyexample?name=art.gif")).toBe(false);
});
