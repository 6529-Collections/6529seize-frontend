jest.mock("node:dns/promises", () => ({
  lookup: jest.fn(),
}));

import { buildResponse, ensureUrlIsPublic } from "../../../app/api/open-graph/utils";

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
      ensureUrlIsPublic(new URL("http://localhost/resource"))
    ).rejects.toThrow("URL host is not allowed.");
  });

  it("rejects domains that resolve to private addresses", async () => {
    lookup.mockResolvedValueOnce([{ address: "127.0.0.1", family: 4 }]);

    await expect(
      ensureUrlIsPublic(new URL("http://example.internal"))
    ).rejects.toThrow("Resolved host is not reachable.");
  });

  it("allows domains that resolve to public addresses", async () => {
    lookup.mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }]);

    await expect(
      ensureUrlIsPublic(new URL("http://example.com"))
    ).resolves.toBeUndefined();
  });
});
