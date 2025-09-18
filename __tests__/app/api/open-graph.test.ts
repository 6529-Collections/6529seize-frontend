jest.mock("node:dns/promises", () => ({
  lookup: jest.fn(),
}));

import {
  buildGoogleWorkspaceResponse,
  buildResponse,
  ensureUrlIsPublic,
} from "../../../app/api/open-graph/utils";

const { lookup } = require("node:dns/promises") as {
  lookup: jest.Mock;
};

const originalFetch = global.fetch;

beforeEach(() => {
  lookup.mockReset();
  global.fetch = originalFetch;
});

afterEach(() => {
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

  it("rejects hex-encoded IPv4 hosts", async () => {
    await expect(
      ensureUrlIsPublic(new URL("http://0x7f000001"))
    ).rejects.toThrow("URL host is not allowed.");
  });

  it("allows domains that resolve to public addresses", async () => {
    lookup.mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }]);

    await expect(
      ensureUrlIsPublic(new URL("http://example.com"))
    ).resolves.toBeUndefined();
  });
});

describe("buildGoogleWorkspaceResponse", () => {
  const createFetchResponse = (html: string, ok = true) => ({
    ok,
    body: null,
    text: jest.fn().mockResolvedValue(html),
  });

  it("returns null for non-google hosts", async () => {
    const url = new URL("https://example.com/article");
    const result = await buildGoogleWorkspaceResponse(url, "", url);
    expect(result).toBeNull();
  });

  it("builds a Google Docs response with preview metadata", async () => {
    const previewHtml = "<html><head><title>Shared Doc</title></head><body></body></html>";
    const fetchMock = jest
      .fn()
      .mockResolvedValue(createFetchResponse(previewHtml));
    global.fetch = fetchMock as unknown as typeof fetch;

    const url = new URL("https://docs.google.com/document/d/FILE_ID/edit");
    const response = await buildGoogleWorkspaceResponse(url, "", url);

    expect(response).not.toBeNull();
    expect(response?.type).toBe("google.docs");
    expect(response?.title).toBe("Shared Doc");
    expect(response?.links.open).toBe(
      "https://docs.google.com/document/d/FILE_ID/edit"
    );
    expect(response?.links.preview).toBe(
      "https://docs.google.com/document/d/FILE_ID/preview"
    );
    expect(response?.links).toHaveProperty(
      "exportPdf",
      "https://docs.google.com/document/d/FILE_ID/export?format=pdf"
    );
    expect(response?.thumbnail).toBe(
      "https://drive.google.com/thumbnail?id=FILE_ID&sz=w1000"
    );
    expect(response?.availability).toBe("public");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://docs.google.com/document/d/FILE_ID/preview",
      expect.objectContaining({
        headers: expect.objectContaining({ "user-agent": expect.any(String) }),
      })
    );
  });

  it("builds a Sheets response preserving gid", async () => {
    const previewHtml = "<html><head><title>Sheet</title></head><body></body></html>";
    global.fetch = jest
      .fn()
      .mockResolvedValue(createFetchResponse(previewHtml)) as unknown as typeof fetch;

    const url = new URL(
      "https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=123"
    );
    const response = await buildGoogleWorkspaceResponse(url, "", url);

    expect(response).not.toBeNull();
    expect(response?.type).toBe("google.sheets");
    expect(response?.gid).toBe("123");
    expect(response?.links.preview).toBe(
      "https://docs.google.com/spreadsheets/d/SHEET_ID/htmlview?gid=123"
    );
    expect(response?.links.open).toBe(
      "https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=123"
    );
    expect(response?.links).not.toHaveProperty("embedPub");
  });

  it("includes embed url for published sheets", async () => {
    const previewHtml =
      "<html><head><title>Published Sheet</title></head><body></body></html>";
    global.fetch = jest
      .fn()
      .mockResolvedValue(createFetchResponse(previewHtml)) as unknown as typeof fetch;

    const url = new URL(
      "https://docs.google.com/spreadsheets/d/SHEET_ID/pubhtml?gid=0&range=A1:B2"
    );
    const response = await buildGoogleWorkspaceResponse(url, "", url);

    expect(response?.links.preview).toBe(
      "https://docs.google.com/spreadsheets/d/SHEET_ID/htmlview?gid=0&range=A1%3AB2"
    );
    expect(response?.links.embedPub).toBe(
      "https://docs.google.com/spreadsheets/d/SHEET_ID/pubhtml?widget=true&headers=false&gid=0&range=A1%3AB2"
    );
  });

  it("marks documents that require access as restricted", async () => {
    const restrictedHtml =
      "<html><head><title>Sign in - Google Accounts</title></head><body>You need permission</body></html>";
    global.fetch = jest
      .fn()
      .mockResolvedValue(createFetchResponse(restrictedHtml)) as unknown as typeof fetch;

    const url = new URL("https://docs.google.com/document/d/PRIVATE/edit");
    const response = await buildGoogleWorkspaceResponse(url, "", url);

    expect(response?.availability).toBe("restricted");
    expect(response?.title).toBe("Untitled Doc");
  });
});
