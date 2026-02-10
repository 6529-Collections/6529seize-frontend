import { parseTikTokLink } from "@/components/drops/view/part/dropPartMarkdown/tiktok";

describe("parseTikTokLink", () => {
  it("returns profile info for profile URLs", () => {
    const result = parseTikTokLink("https://www.tiktok.com/@creator");
    expect(result).toEqual({ href: "https://www.tiktok.com/@creator", kind: "profile" });
  });

  it("returns video info for user video URLs", () => {
    const result = parseTikTokLink("https://www.tiktok.com/@creator/video/1234567890");
    expect(result).toEqual({
      href: "https://www.tiktok.com/@creator/video/1234567890",
      kind: "video",
    });
  });

  it("returns video info for legacy video URLs", () => {
    const result = parseTikTokLink("https://www.tiktok.com/video/1234567890");
    expect(result).toEqual({ href: "https://www.tiktok.com/video/1234567890", kind: "video" });
  });

  it("accepts vm.tiktok.com short links", () => {
    const result = parseTikTokLink("https://vm.tiktok.com/ZM1234567/");
    expect(result).toEqual({ href: "https://vm.tiktok.com/ZM1234567/", kind: "short" });
  });

  it("rejects unsupported subpaths", () => {
    expect(parseTikTokLink("https://www.tiktok.com/@creator/live")).toBeNull();
  });

  it("rejects non-TikTok hosts", () => {
    expect(parseTikTokLink("https://example.com/video/1234567890")).toBeNull();
  });
});
