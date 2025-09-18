jest.mock("node:dns/promises", () => ({
  lookup: jest.fn(),
}));

import { buildResponse } from "../../../app/api/open-graph/utils";
import { assertPublicUrl } from "@/lib/security/urlGuard";

const { lookup } = require("node:dns/promises") as {
  lookup: jest.Mock;
};

beforeEach(() => {
  lookup.mockReset();
});

describe("open-graph route helpers", () => {
  const baseUrl = new URL("https://example.com/article");

  it("extracts metadata from standard open graph tags", () => {
    const html = `
      <!doctype html>
      <html>
        <head>
          <title>Fallback Title</title>
          <meta property="og:title" content="OG Title" />
          <meta property="og:description" content="OG Description" />
          <meta property="og:image" content="/og-image.jpg" />
          <meta property="og:url" content="https://example.com/page" />
          <meta property="og:site_name" content="Example Site" />
          <meta property="og:type" content="article" />
          <link rel="icon" href="/favicon.ico" />
        </head>
        <body></body>
      </html>
    `;

    const result = buildResponse(baseUrl, html, "text/html");

    expect(result.title).toBe("OG Title");
    expect(result.description).toBe("OG Description");
    expect(result.siteName).toBe("Example Site");
    expect(result.url).toBe("https://example.com/page");
    expect(result.mediaType).toBe("article");
    expect(result.image?.url).toBe("https://example.com/og-image.jpg");
    expect(result.images?.[0]?.secureUrl).toBe("https://example.com/og-image.jpg");
    expect(result.favicon).toBe("https://example.com/favicon.ico");
    expect(result.contentType).toBe("text/html");
  });

  it("falls back to document title and canonical link", () => {
    const html = `
      <html>
        <head>
          <title>Plain Title</title>
          <meta name="description" content="Plain Description" />
          <link rel="canonical" href="/canonical" />
          <link rel="shortcut icon" href="https://cdn.example.com/icon.png" />
        </head>
        <body></body>
      </html>
    `;

    const result = buildResponse(baseUrl, html, null);

    expect(result.title).toBe("Plain Title");
    expect(result.description).toBe("Plain Description");
    expect(result.url).toBe("https://example.com/canonical");
    expect(result.favicon).toBe("https://cdn.example.com/icon.png");
  });

  it("rejects localhost URLs", async () => {
    await expect(
      assertPublicUrl(new URL("http://localhost/resource"))
    ).rejects.toThrow("URL host is not allowed.");
  });

  it("rejects domains that resolve to private addresses", async () => {
    lookup.mockResolvedValueOnce([{ address: "127.0.0.1", family: 4 }]);

    await expect(
      assertPublicUrl(new URL("http://example.internal"))
    ).rejects.toThrow("Resolved host is not reachable.");
  });

  it("rejects hex-encoded IPv4 hosts", async () => {
    await expect(
      assertPublicUrl(new URL("http://0x7f000001"))
    ).rejects.toThrow("URL host is not allowed.");
  });

  it("allows domains that resolve to public addresses", async () => {
    lookup.mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }]);

    await expect(
      assertPublicUrl(new URL("http://example.com"))
    ).resolves.toBeUndefined();
  });

  it("builds a Weibo post response when metadata is present", () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="测试用户的微博" />
          <meta property="og:description" content="这是正文" />
          <meta property="og:image" content="https://wx1.sinaimg.cn/large/post-image.jpg" />
          <meta property="article:published_time" content="2024-01-02T03:04:05Z" />
        </head>
        <body></body>
      </html>
    `;

    const url = new URL("https://weibo.com/123456/AbCdE");
    const result = buildResponse(url, html, "text/html", "https://weibo.com/123456/AbCdE?refer=foo");

    expect(result).toMatchObject({
      type: "weibo.post",
      canonicalUrl: "https://weibo.com/123456/AbCdE",
    });
    expect((result as any).post.uid).toBe("123456");
    expect((result as any).post.mid).toBe("AbCdE");
    expect((result as any).post.text).toContain("这是正文");
    expect((result as any).post.images?.[0]?.url).toContain(
      "/api/open-graph/proxy-image?url="
    );
  });

  it("returns an unavailable response when Weibo login wall is detected", () => {
    const html = `
      <html>
        <head><title>Sina Visitor System</title></head>
        <body>Sina Visitor System</body>
      </html>
    `;

    const url = new URL("https://weibo.com/123456/AbCdE");
    const result = buildResponse(url, html, "text/html");

    expect(result).toMatchObject({
      type: "weibo.unavailable",
      reason: "login_required",
    });
  });
});
