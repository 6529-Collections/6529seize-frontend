import { getVideoPosterSrc } from "@/components/nft-image/utils/video-poster";

describe("getVideoPosterSrc", () => {
  it("uses the first non-empty image candidate", () => {
    expect(
      getVideoPosterSrc([null, 42, " ", " poster.jpg ", "backup.png"])
    ).toBe("poster.jpg");
  });

  it.each([
    "art.MP4?download=1#frame",
    "art.mov",
    "art.webm",
    "art.m3u8",
    "art.html",
    "art.glb",
    "data:video/mp4;base64,AAAA",
    "DATA:video/mp4;base64,AAAA",
  ])("skips a non-image candidate: %s", (src) => {
    expect(getVideoPosterSrc([src, "poster.png"])).toBe("poster.png");
  });

  it.each([
    "data:image/png;base64,AAAA",
    "https://arweave.net/extensionless-asset",
    "https://example.com/art.png?name=video.mp4",
  ])("accepts image URLs without requiring a file extension: %s", (src) => {
    expect(getVideoPosterSrc([src])).toBe(src);
  });

  it("omits the poster when there is no image candidate", () => {
    expect(getVideoPosterSrc([undefined, "", "art.mp4"])).toBeUndefined();
  });
});
