import { shouldUseOpenGraphPreview } from "@/components/drops/view/part/dropPartMarkdown/linkUtils";

jest.mock("@/lib/ens/detect", () => ({
  isLikelyEnsTarget: jest.fn(() => false),
}));

describe("shouldUseOpenGraphPreview", () => {
  it("disables previews for Art Blocks project pages on the root domain", () => {
    expect(
      shouldUseOpenGraphPreview("https://artblocks.io/project/662000")
    ).toBe(false);
  });

  it("disables previews for Art Blocks project pages on subdomains", () => {
    expect(
      shouldUseOpenGraphPreview("https://www.artblocks.io/project/662000")
    ).toBe(false);

    expect(
      shouldUseOpenGraphPreview("https://live.artblocks.io/project/662000")
    ).toBe(false);
  });

  it("continues to allow previews for lookalike domains", () => {
    expect(
      shouldUseOpenGraphPreview("https://evilartblocks.io/project/662000")
    ).toBe(true);
  });

  it("falls back for other paths on Art Blocks domains", () => {
    expect(
      shouldUseOpenGraphPreview("https://artblocks.io/token/662000")
    ).toBe(false);
  });

  it("allows shared previews for supported YouTube video URLs", () => {
    expect(
      shouldUseOpenGraphPreview("https://youtu.be/abc123XYZ_0")
    ).toBe(true);
    expect(
      shouldUseOpenGraphPreview(
        "https://music.youtube.com/watch?v=abc123XYZ_0&t=42"
      )
    ).toBe(true);
    expect(
      shouldUseOpenGraphPreview(
        "https://www.youtube-nocookie.com/embed/abc123XYZ_0?start=30"
      )
    ).toBe(true);
  });

  it("does not fall through to generic previews for unsupported YouTube URLs", () => {
    expect(
      shouldUseOpenGraphPreview("https://www.youtube.com/channel/UC123456789")
    ).toBe(false);
  });
});
