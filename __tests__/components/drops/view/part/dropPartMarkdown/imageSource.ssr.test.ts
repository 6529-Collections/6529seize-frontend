/** @jest-environment node */
// A server render: no window, and no BASE_ENDPOINT to name the site.
jest.mock("@/config/env", () => ({
  publicEnv: { BASE_ENDPOINT: undefined },
}));

import { isAllowedMarkdownImageSource } from "@/components/drops/view/part/dropPartMarkdown/imageSource";

describe("isAllowedMarkdownImageSource without a known site origin", () => {
  it("runs without a window", () => {
    expect(typeof globalThis.window).toBe("undefined");
  });

  it.each([
    "/api/profile",
    "/api/image.png",
    "/_next/image?url=x",
    "/images/a.png?size=2",
    "/waves/123",
    "../api/drops",
  ])("treats the relative path %s as same-site and refuses it", (src) => {
    expect(isAllowedMarkdownImageSource(src)).toBe(false);
  });

  it.each(["/images/a.png", "pictures/b.webp"])(
    "still loads the same-site image file %s",
    (src) => {
      expect(isAllowedMarkdownImageSource(src)).toBe(true);
    }
  );

  it.each([
    "https://images.example/a.png?size=2",
    "//images.example/api/b",
    "data:image/png;base64,AAAA",
  ])("leaves %s from another site to the existing checks", (src) => {
    expect(isAllowedMarkdownImageSource(src)).toBe(true);
  });
});
