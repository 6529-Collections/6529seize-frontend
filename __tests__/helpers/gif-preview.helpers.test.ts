import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import {
  getAnimatedImagePreviewUri,
  getLegacyGifPreviewUri,
  isGifImageUrl,
} from "@/helpers/gif-preview.helpers";

jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrlSync: (url: string) => {
    if (url.startsWith("ipfs://")) {
      return `https://ipfs-gateway.test/ipfs/${url.slice(7)}`;
    }
    return url;
  },
}));

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

  it.each(["AUTOx800", "AUTOx800_gifv2"])(
    "preserves the parent folder %s while changing only the derivative segment",
    (folder) => {
      const base = `https://d3lqz0a4bldqgf.cloudfront.net/drops/author/${folder}/`;
      const suffix = "?redirect=/AUTOx800_gifv2/art.gif&token=a%2Fb#preview/path";
      const preview = getAnimatedImagePreviewUri(
        `${base}art.gif${suffix}`,
        ImageScale.AUTOx800
      );
      expect(preview).toBe(`${base}AUTOx800_gifv2/art.gif${suffix}`);
      expect(getLegacyGifPreviewUri(preview)).toBe(
        `${base}AUTOx800/art.gif${suffix}`
      );
    }
  );

  it("does not remove a version marker from an ordinary parent folder or query", () => {
    const url =
      "https://d3lqz0a4bldqgf.cloudfront.net/drops/AUTOx800_gifv2/author/art.gif?path=/AUTOx800_gifv2/art.gif";
    expect(getLegacyGifPreviewUri(url)).toBe(url);
  });

  it("preserves fragment-only GIF URLs and external GIF query strings", () => {
    const base = "https://d3lqz0a4bldqgf.cloudfront.net/drops/author/";
    expect(
      getAnimatedImagePreviewUri(`${base}art.gif#frame/1`, ImageScale.AUTOx800)
    ).toBe(`${base}AUTOx800_gifv2/art.gif#frame/1`);
    const external = "ipfs://bafyexample/art.gif?path=/AUTOx800/a.gif#preview";
    expect(getAnimatedImagePreviewUri(external, ImageScale.AUTOx800)).toBe(
      "https://ipfs-gateway.test/ipfs/bafyexample/art.gif?path=/AUTOx800/a.gif#preview"
    );
    expect(getLegacyGifPreviewUri(external)).toBe(external);
  });
});

it("recognizes GIF paths in IPFS URLs without mistaking the CID for a filename", () => {
  expect(isGifImageUrl("ipfs://bafyexample/art.GIF")).toBe(true);
  expect(isGifImageUrl("ipfs://bafyexample?name=art.gif")).toBe(false);
});
