import { containsOpenGraphPreviewLink } from "@/components/drops/view/part/dropPartMarkdown/linkPreviewDetection";

describe("linkPreviewDetection", () => {
  it("detects markdown links and bare urls that become OpenGraph previews", () => {
    expect(
      containsOpenGraphPreviewLink("[article](https://example.com/post)")
    ).toBe(true);
    expect(
      containsOpenGraphPreviewLink(
        "[wiki](https://en.wikipedia.org/wiki/Function_(mathematics))"
      )
    ).toBe(true);
    expect(containsOpenGraphPreviewLink("read https://example.com/post")).toBe(
      true
    );
    expect(containsOpenGraphPreviewLink("read www.example.com/post")).toBe(
      true
    );
  });

  it("ignores urls in code and direct image urls", () => {
    expect(containsOpenGraphPreviewLink("`https://example.com/post`")).toBe(
      false
    );
    expect(containsOpenGraphPreviewLink("https://example.com/image.png")).toBe(
      false
    );
    expect(
      containsOpenGraphPreviewLink("![preview](https://example.com/post)")
    ).toBe(false);
  });

  it("ignores urls handled by non-OpenGraph cards", () => {
    expect(
      containsOpenGraphPreviewLink(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      )
    ).toBe(false);
  });
});
