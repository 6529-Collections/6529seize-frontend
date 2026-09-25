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
});

it("recognizes GIF paths in IPFS URLs without mistaking the CID for a filename", () => {
  expect(isGifImageUrl("ipfs://bafyexample/art.GIF")).toBe(true);
  expect(isGifImageUrl("ipfs://bafyexample?name=art.gif")).toBe(false);
});
