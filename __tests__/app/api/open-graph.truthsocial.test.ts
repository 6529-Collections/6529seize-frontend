import {
  buildTruthSocialResponse,
  buildTruthSocialUnavailableResponse,
  detectTruthSocialTarget,
  type TruthSocialTarget,
} from "../../../app/api/open-graph/truthsocial";

const proxyBase = "https://images.6529.io/open-graph";

const proxied = (url: string) => `${proxyBase}?url=${encodeURIComponent(url)}`;

describe("Truth Social handler", () => {
  it("detects Truth Social post URLs", () => {
    const url = new URL("https://truthsocial.com/@alice/posts/12345?utm_source=test#fragment");
    const target = detectTruthSocialTarget(url);

    expect(target).toEqual({
      kind: "post",
      handle: "alice",
      postId: "12345",
      canonicalUrl: "https://truthsocial.com/@alice/posts/12345",
      cacheKey: "truth:https://truthsocial.com/@alice/posts/12345",
    });
  });

  it("detects Truth Social profile URLs", () => {
    const url = new URL("https://truthsocial.com/@alice");
    const target = detectTruthSocialTarget(url);

    expect(target).toEqual({
      kind: "profile",
      handle: "alice",
      canonicalUrl: "https://truthsocial.com/@alice",
      cacheKey: "truth:https://truthsocial.com/@alice",
    });
  });

  it("builds post response from metadata", () => {
    const target: TruthSocialTarget = {
      kind: "post",
      handle: "alice",
      postId: "123",
      canonicalUrl: "https://truthsocial.com/@alice/posts/123",
      cacheKey: "truth:https://truthsocial.com/@alice/posts/123",
    };

    const html = `
      <html>
        <head>
          <meta property="og:description" content="Breaking news &amp; updates" />
          <meta property="og:title" content="Alice on Truth Social" />
          <meta property="og:image" content="https://cdn.truthsocial.com/post-main.jpg" />
          <meta property="og:url" content="https://truthsocial.com/@alice/posts/123" />
          <meta property="article:published_time" content="2024-01-02T03:04:05Z" />
          <meta name="twitter:image" content="https://cdn.truthsocial.com/post-alt.jpg" />
          <script type="application/ld+json">
            {
              "@type": "SocialMediaPosting",
              "author": {
                "name": "Alice",
                "image": "https://cdn.truthsocial.com/avatar.jpg"
              },
              "datePublished": "2024-01-02T03:04:05Z",
              "image": ["https://cdn.truthsocial.com/post-main.jpg"],
              "articleBody": "Hello Truth!"
            }
          </script>
        </head>
      </html>
    `;

    const response = buildTruthSocialResponse(target, html, "text/html", target.canonicalUrl);

    expect(response.type).toBe("truth.post");
    expect(response.canonicalUrl).toBe("https://truthsocial.com/@alice/posts/123");
    expect(response.contentType).toBe("text/html");
    expect(response.post).toBeDefined();
    expect(response.post?.text).toBe("Breaking news & updates");
    expect(response.post?.createdAt).toBe("2024-01-02T03:04:05Z");
    expect(response.post?.author.displayName).toBe("Alice");
    expect(response.post?.author.avatar).toBe(proxied("https://cdn.truthsocial.com/avatar.jpg"));
    expect(response.post?.images).toHaveLength(2);
    expect(response.post?.images?.[0]?.url).toBe(proxied("https://cdn.truthsocial.com/post-main.jpg"));
    expect(response.post?.images?.[0]?.alt).toBe("Image from @alice's post");
  });

  it("builds profile response from metadata", () => {
    const target: TruthSocialTarget = {
      kind: "profile",
      handle: "alice",
      canonicalUrl: "https://truthsocial.com/@alice",
      cacheKey: "truth:https://truthsocial.com/@alice",
    };

    const html = `
      <html>
        <head>
          <title>Alice Wonderland</title>
          <meta property="og:description" content="Bio <strong>bold</strong>" />
          <meta property="og:image" content="https://cdn.truthsocial.com/avatar.png" />
          <meta name="twitter:image" content="https://cdn.truthsocial.com/banner.png" />
          <script type="application/ld+json">
            {
              "@type": "Person",
              "name": "Alice Wonderland",
              "image": "https://cdn.truthsocial.com/avatar.png",
              "description": "Profile bio"
            }
          </script>
        </head>
      </html>
    `;

    const response = buildTruthSocialResponse(target, html, null, target.canonicalUrl);

    expect(response.type).toBe("truth.profile");
    expect(response.profile).toBeDefined();
    expect(response.profile?.displayName).toBe("Alice Wonderland");
    expect(response.profile?.avatar).toBe(proxied("https://cdn.truthsocial.com/avatar.png"));
    expect(response.profile?.banner).toBe(proxied("https://cdn.truthsocial.com/banner.png"));
    expect(response.profile?.bio).toBe("Bio bold");
  });

  it("builds unavailable response", () => {
    const target: TruthSocialTarget = {
      kind: "post",
      handle: "alice",
      postId: "123",
      canonicalUrl: "https://truthsocial.com/@alice/posts/123",
      cacheKey: "truth:https://truthsocial.com/@alice/posts/123",
    };

    const response = buildTruthSocialUnavailableResponse(target, target.canonicalUrl);

    expect(response.type).toBe("truth.post");
    expect(response.post?.unavailable).toBe(true);
    expect(response.post?.images).toEqual([]);
    expect(response.post?.text).toBeNull();
  });
});
