import { buildFacebookPreview, shouldHandleFacebook } from "../../../app/api/open-graph/facebook";
import type { LinkPreviewResponse } from "../../../services/api/link-preview-api";

describe("buildFacebookPreview", () => {
  const createBaseResponse = (overrides: Partial<LinkPreviewResponse> = {}): LinkPreviewResponse => ({
    requestUrl: "https://example.com",
    url: "https://facebook.com/Page/posts/12345",
    title: "Example Page",
    description: "This is an example post",
    siteName: "ExamplePage",
    mediaType: null,
    contentType: "text/html",
    favicon: null,
    favicons: [],
    image: { url: "https://cdn.facebook.com/image.jpg" },
    images: [
      { url: "https://cdn.facebook.com/image.jpg" },
      { url: "https://cdn.facebook.com/image2.jpg" },
    ],
    ...overrides,
  });

  it("creates a facebook post payload from metadata", () => {
    const metadata = createBaseResponse();
    const result = buildFacebookPreview(
      new URL("https://www.facebook.com/Page/posts/12345?ref=bookmark"),
      metadata
    );

    if (!result) {
      throw new Error("Expected facebook preview");
    }

    expect(result.type).toBe("facebook.post");
    expect(result.canonicalUrl).toBe("https://facebook.com/Page/posts/12345");
    expect(result.post).toEqual(
      expect.objectContaining({
        page: "Page",
        postId: "12345",
        text: "This is an example post",
      })
    );
    expect(result.post?.images).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: "https://cdn.facebook.com/image.jpg" }),
        expect.objectContaining({ url: "https://cdn.facebook.com/image2.jpg" }),
      ])
    );
  });

  it("flags login-gated content as unavailable", () => {
    const metadata = createBaseResponse({ title: "Log into Facebook" });
    const result = buildFacebookPreview(
      new URL("https://facebook.com/Page/posts/999"),
      metadata
    );

    expect(result).toEqual(
      expect.objectContaining({
        type: "facebook.unavailable",
        reason: "login_required",
        canonicalUrl: "https://facebook.com/Page/posts/999",
      })
    );
  });

  it("builds a facebook video payload", () => {
    const metadata = createBaseResponse({
      url: "https://facebook.com/Page/videos/5678",
      title: "Sample Video",
      description: null,
    });

    const result = buildFacebookPreview(
      new URL("https://m.facebook.com/Page/videos/5678/?ref=sharing"),
      metadata
    );

    if (!result) {
      throw new Error("Expected facebook video preview");
    }

    expect(result.type).toBe("facebook.video");
    expect(result.canonicalUrl).toBe("https://facebook.com/Page/videos/5678");
    expect(result.video).toEqual(
      expect.objectContaining({
        videoId: "5678",
        title: "Sample Video",
        thumbnail: "https://cdn.facebook.com/image.jpg",
      })
    );
  });
});

describe("shouldHandleFacebook", () => {
  it("detects standard facebook hosts", () => {
    expect(shouldHandleFacebook(new URL("https://facebook.com/Page/posts/1"))).toBe(true);
    expect(shouldHandleFacebook(new URL("https://m.facebook.com/watch/?v=2"))).toBe(true);
  });

  it("follows l.facebook.com redirectors", () => {
    const url = new URL(
      "https://l.facebook.com/l.php?u=https%3A%2F%2Ffacebook.com%2FPage%2Fposts%2F123"
    );
    expect(shouldHandleFacebook(url)).toBe(true);
  });

  it("detects fb.watch short links", () => {
    expect(shouldHandleFacebook(new URL("https://fb.watch/abc123/"))).toBe(true);
  });
});
