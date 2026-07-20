jest.mock("node:dns/promises", () => ({
  lookup: jest.fn(),
}));

const mockUndiciFetch = jest.fn();

jest.mock("undici", () => ({
  Agent: jest.fn(() => ({
    close: jest.fn(),
    destroy: jest.fn(),
    dispatch: jest.fn(),
  })),
  fetch: (...args: unknown[]) => mockUndiciFetch(...args),
}));

import {
  buildGoogleWorkspaceResponse,
  buildResponse,
} from "@/app/api/open-graph/utils";
import { assertPublicUrl } from "@/lib/security/urlGuard";

const { lookup } = require("node:dns/promises") as {
  lookup: jest.Mock;
};

const originalFetch = global.fetch;
const mockFetch = jest.fn();

const createMockFetchResponse = (status: number, body: string, url: string) => {
  const headerMap = new Map<string, string>();
  headerMap.set("content-type", "text/html");
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {
      get: (name: string) => headerMap.get(name.toLowerCase()) ?? null,
    },
    text: async () => body,
    url,
  } as unknown as Response;
};

beforeEach(() => {
  lookup.mockReset();
  lookup.mockResolvedValue([{ address: "142.250.72.14", family: 4 }]);
  mockFetch.mockReset();
  mockUndiciFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
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
          <meta name="twitter:image" content="/twitter-image.jpg" />
          <meta name="twitter:image:alt" content="Twitter-only alt" />
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
    expect(result.image?.alt).toBeNull();
    expect(result.images?.[0]?.secureUrl).toBe(
      "https://example.com/og-image.jpg"
    );
    expect(result.images?.[1]?.secureUrl).toBe(
      "https://example.com/twitter-image.jpg"
    );
    expect(result.favicon).toBe("https://example.com/favicon.ico");
    expect(result.contentType).toBe("text/html");
  });

  it("applies Twitter image alt only when the Twitter image is primary", () => {
    const html = `
      <html>
        <head>
          <title>Twitter Image</title>
          <meta name="twitter:image" content="/twitter-image.jpg" />
          <meta name="twitter:image:alt" content="Twitter image alt" />
        </head>
        <body></body>
      </html>
    `;

    const result = buildResponse(baseUrl, html, "text/html");

    expect(result.image?.url).toBe("https://example.com/twitter-image.jpg");
    expect(result.image?.alt).toBe("Twitter image alt");
  });

  it("falls back to document title and canonical link", () => {
    const html = `
      <html>
        <head>
          <title>Plain Title</title>
          <meta name="description" content="Plain Description" />
          <link rel="canonical" href="/canonical" />
          <link rel="apple-touch-icon" href="/apple.png" />
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

  it("ignores oversized JSON-LD blocks", () => {
    const oversizedJsonLd = JSON.stringify({
      "@type": "Article",
      headline: "Oversized JSON-LD Title",
      description: "x".repeat(140 * 1024),
    });
    const html = `
      <html>
        <head>
          <title>Fallback Title</title>
          <script type="application/ld+json">${oversizedJsonLd}</script>
        </head>
        <body></body>
      </html>
    `;

    const result = buildResponse(baseUrl, html, "text/html");

    expect(result.title).toBe("Fallback Title");
  });

  it("bounds deeply nested JSON-LD traversal", () => {
    const deepJsonLd = JSON.stringify(
      Array.from({ length: 20 }).reduce<unknown>((value) => [value], {
        "@type": "Article",
        headline: "Too Deep",
      })
    );
    const html = `
      <html>
        <head>
          <title>Safe Fallback</title>
          <script type="application/ld+json">${deepJsonLd}</script>
        </head>
        <body></body>
      </html>
    `;

    const result = buildResponse(baseUrl, html, "text/html");

    expect(result.title).toBe("Safe Fallback");
  });

  it("bounds deeply nested JSON-LD image arrays", () => {
    const deepImage = Array.from({ length: 20 }).reduce<unknown>(
      (value) => [value],
      "/deep-image.jpg"
    );
    const html = `
      <html>
        <head>
          <title>Deep Image Fallback</title>
          <script type="application/ld+json">${JSON.stringify({
            "@type": "Article",
            headline: "Deep Image Fallback",
            image: deepImage,
          })}</script>
        </head>
        <body></body>
      </html>
    `;

    const result = buildResponse(baseUrl, html, "text/html");

    expect(result.title).toBe("Deep Image Fallback");
    expect(result.image).toBeNull();
  });

  it("builds a Google Docs preview with public availability", async () => {
    const initialHtml =
      "<html><head><title>Doc Title</title></head><body></body></html>";
    const previewHtml =
      "<html><head><title>Preview Title</title></head><body></body></html>";

    mockUndiciFetch.mockResolvedValueOnce(
      Promise.resolve(
        createMockFetchResponse(
          200,
          previewHtml,
          "https://docs.google.com/document/d/abc/preview"
        )
      )
    );

    const resolvedUrl = new URL("https://docs.google.com/document/d/abc/edit");
    const result = await buildGoogleWorkspaceResponse(
      resolvedUrl,
      initialHtml,
      new URL("https://docs.google.com/document/d/abc/edit")
    );

    expect(result).toMatchObject({
      type: "google.docs",
      availability: "public",
      title: "Preview Title",
      fileId: "abc",
      links: {
        open: "https://docs.google.com/document/d/abc/edit",
        preview: "https://docs.google.com/document/d/abc/preview",
      },
    });

    expect(mockUndiciFetch).toHaveBeenCalledWith(
      "https://docs.google.com/document/d/abc/preview",
      expect.objectContaining({ redirect: "manual" })
    );
    const headers = mockUndiciFetch.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("user-agent")).toContain("6529seize-link-preview");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("avoids fetching previews for non-canonical Google Docs identifiers", async () => {
    const resolvedUrl = new URL(
      "https://docs.google.com/document/d/abc%2Fdef/edit"
    );

    const result = await buildGoogleWorkspaceResponse(
      resolvedUrl,
      "<html><head><title>Fallback</title></head></html>",
      resolvedUrl
    );

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockUndiciFetch).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      type: "google.docs",
      availability: "restricted",
      title: "Untitled Doc",
    });
  });

  it("builds a Google Sheets preview and marks restricted access on failure", async () => {
    mockUndiciFetch.mockResolvedValueOnce(
      Promise.resolve(
        createMockFetchResponse(
          403,
          "",
          "https://docs.google.com/spreadsheets/d/def/htmlview"
        )
      )
    );

    const resolvedUrl = new URL(
      "https://docs.google.com/spreadsheets/d/def/pubhtml?gid=123"
    );
    const result = await buildGoogleWorkspaceResponse(
      resolvedUrl,
      "<html><head><title>Sheet</title></head></html>",
      new URL("https://docs.google.com/spreadsheets/d/def/edit")
    );

    expect(result).toMatchObject({
      type: "google.sheets",
      availability: "restricted",
      gid: "123",
      links: {
        preview: expect.stringContaining("htmlview"),
        embedPub: expect.stringContaining("pubhtml"),
      },
    });
  });

  it("returns null for non Google workspace URLs", async () => {
    const result = await buildGoogleWorkspaceResponse(
      new URL("https://example.com/page"),
      "<html></html>",
      new URL("https://example.com/page")
    );

    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
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
    await expect(assertPublicUrl(new URL("http://0x7f000001"))).rejects.toThrow(
      "URL host is not allowed."
    );
  });

  it("allows domains that resolve to public addresses", async () => {
    lookup.mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }]);

    await expect(
      assertPublicUrl(new URL("http://example.com"))
    ).resolves.toBeUndefined();
  });
});
