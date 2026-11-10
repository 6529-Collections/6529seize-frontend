import { resolvePreviewHref } from "@/components/waves/marketplace/MarketplaceItemPreviewCard.utils";

describe("resolvePreviewHref", () => {
  it("opens a link on this site in the current tab", () => {
    expect(
      resolvePreviewHref("https://test.6529.io/the-memes/1?tab=activity#top")
    ).toEqual({ href: "/the-memes/1?tab=activity#top" });
  });

  it.each([
    "https://manifold.xyz/@andrew-hooker/id/4098474224",
    "https://test.6529.io//other.example/path",
    "https://test.6529.io/\\other.example/path",
    "https://test.6529.io.other.example/path",
  ])("opens %s in a new tab", (href) => {
    expect(resolvePreviewHref(href)).toEqual({
      href,
      target: "_blank",
      rel: "noopener noreferrer",
    });
  });
});
