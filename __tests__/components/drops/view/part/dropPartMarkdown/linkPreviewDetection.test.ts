import { containsDisallowedLink } from "@/components/drops/view/part/dropPartMarkdown/linkPreviewDetection";

describe("linkPreviewDetection", () => {
  it("detects markdown links and bare urls blocked by chat restrictions", () => {
    expect(containsDisallowedLink("[article](https://example.com/post)")).toBe(
      true
    );
    expect(
      containsDisallowedLink(
        "[wiki](https://en.wikipedia.org/wiki/Function_(mathematics))"
      )
    ).toBe(true);
    expect(containsDisallowedLink("read https://example.com/post")).toBe(true);
    expect(containsDisallowedLink("read www.example.com/post")).toBe(true);
  });

  it("ignores urls in code", () => {
    expect(containsDisallowedLink("`https://example.com/post`")).toBe(false);
  });

  it("ignores non-url markdown image placeholders", () => {
    expect(containsDisallowedLink("![Seize](loading)")).toBe(false);
  });

  it("blocks non-allowed direct media urls", () => {
    expect(containsDisallowedLink("https://example.com/image.png")).toBe(true);
    expect(containsDisallowedLink("https://example.com/video.mp4")).toBe(true);
    expect(
      containsDisallowedLink("![preview](https://example.com/image.jpg)")
    ).toBe(true);
  });

  it("blocks urls handled by non-OpenGraph cards", () => {
    expect(
      containsDisallowedLink("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    ).toBe(true);
  });

  it("ignores exact CloudFront-origin links allowed by chat restrictions", () => {
    expect(
      containsDisallowedLink(
        "uploaded https://d3lqz0a4bldqgf.cloudfront.net/drops/asset.mp4"
      )
    ).toBe(false);
    expect(
      containsDisallowedLink(
        "[download](https://d3lqz0a4bldqgf.cloudfront.net/drops/asset.html)"
      )
    ).toBe(false);
    expect(
      containsDisallowedLink(
        "https://d3lqz0a4bldqgf.cloudfront.net/drops/asset"
      )
    ).toBe(false);
  });

  it("ignores allowed GIF provider media links", () => {
    expect(
      containsDisallowedLink("https://media.tenor.com/abc/tenor.gif")
    ).toBe(false);
    expect(
      containsDisallowedLink("https://media.tenor.com/abc/tenor.mp4")
    ).toBe(false);
    expect(containsDisallowedLink("https://c.tenor.com/abc/tenor.jpg")).toBe(
      false
    );
    expect(containsDisallowedLink("https://c.tenor.com/abc/tenor.webp")).toBe(
      false
    );
    expect(
      containsDisallowedLink("https://media.tenor.com/abc/tenor.gif?itemid=1")
    ).toBe(false);
    expect(
      containsDisallowedLink("![gif](https://media.tenor.com/abc/tenor.gif)")
    ).toBe(false);
    expect(
      containsDisallowedLink("https://media.giphy.com/media/abc/giphy.gif")
    ).toBe(false);
    expect(
      containsDisallowedLink("https://media1.giphy.com/media/abc/giphy.gif")
    ).toBe(false);
    expect(
      containsDisallowedLink("https://media2.giphy.com/media/abc/giphy.mp4")
    ).toBe(false);
  });

  it("blocks GIF provider urls without allowed media extensions", () => {
    expect(containsDisallowedLink("https://c.tenor.com/abc/tenor.webm")).toBe(
      true
    );
    expect(containsDisallowedLink("https://tenor.com/view/funny-cat-123")).toBe(
      true
    );
    expect(
      containsDisallowedLink("https://www.tenor.com/view/funny-cat-123")
    ).toBe(true);
    expect(
      containsDisallowedLink("https://media.giphy.com/media/abc/giphy.webm")
    ).toBe(true);
    expect(containsDisallowedLink("https://giphy.com/gifs/abc")).toBe(true);
  });

  it("does not ignore CloudFront or GIF provider lookalike hosts", () => {
    expect(
      containsDisallowedLink(
        "https://d3lqz0a4bldqgf.cloudfront.net.evil/drops/asset.mp4"
      )
    ).toBe(true);
    expect(
      containsDisallowedLink("https://media.tenor.com.evil/abc/tenor.gif")
    ).toBe(true);
    expect(
      containsDisallowedLink("https://media.giphy.com.evil/abc/giphy.gif")
    ).toBe(true);
  });

  it("blocks non-Tenor Google API urls", () => {
    expect(
      containsDisallowedLink("https://tenor.googleapis.com/v2/search?q=cat")
    ).toBe(true);
  });
});
