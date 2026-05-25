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

  it("ignores exact CloudFront-origin links allowed by chat restrictions", () => {
    expect(
      containsOpenGraphPreviewLink(
        "uploaded https://d3lqz0a4bldqgf.cloudfront.net/drops/asset.mp4"
      )
    ).toBe(false);
    expect(
      containsOpenGraphPreviewLink(
        "[download](https://d3lqz0a4bldqgf.cloudfront.net/drops/asset.html)"
      )
    ).toBe(false);
    expect(
      containsOpenGraphPreviewLink(
        "https://d3lqz0a4bldqgf.cloudfront.net/drops/asset"
      )
    ).toBe(false);
  });

  it("does not ignore CloudFront lookalike hosts", () => {
    expect(
      containsOpenGraphPreviewLink(
        "https://d3lqz0a4bldqgf.cloudfront.net.evil/drops/asset.mp4"
      )
    ).toBe(true);
  });
});
