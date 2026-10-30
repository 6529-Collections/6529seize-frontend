jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

/**
 * Captures mocked JSON responses from the Farcaster route.
 */
const nextResponseJson = jest.fn(
  (body: unknown, init?: { status?: number | undefined }) => ({
    status: init?.status ?? 200,
    json: async () => body,
  })
);

jest.mock("next/server", () => ({
  NextResponse: { json: nextResponseJson },
  NextRequest: class {},
}));

let mockWarpcastApiKey: string | undefined;

jest.mock("@/config/serverEnv", () => ({
  getFarcasterWarpcastApiKey: () => mockWarpcastApiKey,
}));

/**
 * Mock URL guard error used to exercise guard failure handling.
 */
class MockUrlGuardError extends Error {
  readonly kind: string;
  readonly statusCode: number;

  constructor(message: string, kind: string, statusCode = 400) {
    super(message);
    this.name = "UrlGuardError";
    this.kind = kind;
    this.statusCode = statusCode;
  }
}

/**
 * Parses default public URL test inputs or throws the mocked guard error.
 */
const createDefaultParsePublicUrl = (value: string | null) => {
  if (!value) {
    throw new MockUrlGuardError("missing", "missing-url", 400);
  }
  return new URL(value);
};

const parsePublicUrlMock = jest.fn(createDefaultParsePublicUrl);
const assertPublicUrlMock = jest.fn();
const mockFetchPublicUrl = jest.fn();

jest.mock("@/lib/security/urlGuard", () => ({
  UrlGuardError: MockUrlGuardError,
  parsePublicUrl: parsePublicUrlMock,
  assertPublicUrl: assertPublicUrlMock,
  fetchPublicUrl: mockFetchPublicUrl,
}));

const UrlGuardError = MockUrlGuardError;

const originalFetch = global.fetch;
const mockFetch = jest.fn();

let GET: typeof import("@/app/api/farcaster/route").GET;

/**
 * Creates a single-read stream body for Farcaster response mocks.
 */
const createBody = (body: string): ReadableStream<Uint8Array> => {
  const bytes = new TextEncoder().encode(body);
  let consumed = false;

  return {
    getReader: () => ({
      read: async () => {
        if (consumed) {
          return { done: true, value: undefined };
        }
        consumed = true;
        return { done: false, value: bytes };
      },
      cancel: async () => {
        consumed = true;
      },
      releaseLock: () => undefined,
    }),
  } as unknown as ReadableStream<Uint8Array>;
};

/**
 * Creates a minimal response with stream-backed HTML or JSON content.
 */
const createResponse = (
  body: string,
  options: {
    status?: number | undefined;
    headers?: Record<string, string> | undefined;
    url?: string | undefined;
  } = {}
): Response =>
  ({
    status: options.status ?? 200,
    ok: (options.status ?? 200) >= 200 && (options.status ?? 200) < 300,
    headers: new Headers(options.headers),
    body: createBody(body),
    url: options.url ?? "",
  }) as unknown as Response;

/**
 * Creates a JSON response body for Warpcast API mocks.
 */
const createJsonResponse = (body: unknown): Response =>
  createResponse(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
  });

/**
 * Resets URL guard mocks to their successful defaults between route loads.
 */
const resetUrlGuardMocks = () => {
  parsePublicUrlMock.mockReset();
  parsePublicUrlMock.mockImplementation(createDefaultParsePublicUrl);
  assertPublicUrlMock.mockReset();
  assertPublicUrlMock.mockResolvedValue(undefined);
  mockFetchPublicUrl.mockReset();
};

/**
 * Loads the Farcaster route after refreshing its mocked URL guard module.
 */
const loadRoute = async () => {
  jest.resetModules();
  resetUrlGuardMocks();
  ({ GET } = await import("@/app/api/farcaster/route"));
};

describe("farcaster API route", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    mockWarpcastApiKey = undefined;
    global.fetch = mockFetch as unknown as typeof fetch;
    await loadRoute();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("returns 400 when url is missing", async () => {
    parsePublicUrlMock.mockImplementationOnce(() => {
      throw new UrlGuardError("missing", "missing-url", 400);
    });

    const request = {
      nextUrl: new URL("https://api.local/farcaster"),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "missing" },
      { status: 400 }
    );
  });

  it("returns cast preview", async () => {
    mockFetch.mockResolvedValueOnce(
      createJsonResponse({
        result: {
          cast: {
            hash: "0xabc",
            text: "Hello",
            timestamp: "2024-01-01T00:00:00Z",
            author: {
              fid: 1,
              username: "alice",
              displayName: "Alice",
              pfp: { url: "https://cdn.warpcast.com/alice.png" },
            },
            reactions: { likes: 5, recasts: 2 },
          },
        },
      })
    );

    const request = {
      nextUrl: new URL(
        "https://api.local/farcaster?url=https://warpcast.com/alice/0xabc"
      ),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual(
      expect.objectContaining({
        type: "cast",
        canonicalUrl: "https://warpcast.com/alice/0xabc",
        cast: expect.objectContaining({ text: "Hello" }),
      })
    );
    const [requestUrl, init] = mockFetch.mock.calls[0];
    expect(requestUrl.toString()).toContain("/v2/cast");
    expect(new URL(requestUrl.toString()).searchParams.has("key")).toBe(false);
    expect(init?.headers).toEqual(
      expect.objectContaining({ "user-agent": expect.any(String) })
    );
  });

  it("adds the server-only Warpcast API key to Warpcast API requests", async () => {
    mockWarpcastApiKey = "server-warpcast-key";
    mockFetch.mockResolvedValueOnce(
      createJsonResponse({
        result: {
          cast: {
            hash: "0xabc",
            text: "Hello",
            author: { fid: 1, username: "alice" },
          },
        },
      })
    );

    await GET({
      nextUrl: new URL(
        "https://api.local/farcaster?url=https://warpcast.com/alice/0xabc"
      ),
    } as unknown as Parameters<typeof GET>[0]);

    const [requestUrl] = mockFetch.mock.calls[0];
    expect(new URL(requestUrl.toString()).searchParams.get("key")).toBe(
      "server-warpcast-key"
    );
  });

  it("returns profile preview", async () => {
    mockFetch.mockResolvedValueOnce(
      createJsonResponse({
        result: {
          user: {
            fid: 2,
            username: "bob",
            displayName: "Bob",
            pfp: { url: "https://cdn.warpcast.com/bob.png" },
            profile: { bio: { text: "GM" } },
          },
        },
      })
    );

    const request = {
      nextUrl: new URL(
        "https://api.local/farcaster?url=https://warpcast.com/bob"
      ),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual(
      expect.objectContaining({
        type: "profile",
        profile: expect.objectContaining({ username: "bob", bio: "GM" }),
      })
    );
  });

  it("detects frame previews for generic URLs", async () => {
    mockFetchPublicUrl.mockImplementation(async (input) => {
      const requestedUrl = typeof input === "string" ? input : input.toString();
      expect(requestedUrl).toBe("https://example.com/frame");
      const html = `
        <html>
          <head>
            <meta name="fc:frame" content="1" />
            <meta name="fc:frame:image" content="/image.png" />
            <meta name="fc:frame:button:1" content="Open" />
            <meta name="og:title" content="Example Frame" />
          </head>
        </html>
      `;

      return createResponse(html, {
        headers: { "content-type": "text/html" },
        url: "https://example.com/frame",
      });
    });

    const request = {
      nextUrl: new URL(
        "https://api.local/farcaster?url=https://example.com/frame"
      ),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(mockFetchPublicUrl).toHaveBeenCalled();
    expect(payload).toEqual(
      expect.objectContaining({
        type: "frame",
        frame: expect.objectContaining({
          frameUrl: "https://example.com/frame",
        }),
      })
    );
    const [calledUrl, init, options] = mockFetchPublicUrl.mock.calls[0];
    expect(calledUrl).toEqual(new URL("https://example.com/frame"));
    expect(init).toEqual(expect.objectContaining({ method: "GET" }));
    expect(options).toEqual(
      expect.objectContaining({ userAgent: expect.any(String) })
    );
  });

  it("reads frame metadata from large, deeply nested documents", async () => {
    mockFetchPublicUrl.mockResolvedValueOnce(
      createResponse(
        `<html><head><title>Frame &amp; Title</title><meta property="fc:frame" content="vNext"></head><body>${"<div>".repeat(150_000)}<meta content="/frame.png" property="fc:frame:image"><meta property="fc:frame:button:1" content="Mint"></body></html>`,
        {
          headers: { "content-type": "text/html" },
          url: "https://example.com/frame",
        }
      )
    );

    const response = await GET({
      nextUrl: new URL(
        "https://api.local/farcaster?url=https://example.com/frame"
      ),
    } as any);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      type: "frame",
      canonicalUrl: "https://example.com/frame",
      frame: {
        frameUrl: "https://example.com/frame",
        title: "Frame & Title",
        siteName: undefined,
        imageUrl: "https://example.com/frame.png",
        buttons: ["Mint"],
      },
    });
  });

  it("returns unsupported for documents of unterminated tags", async () => {
    mockFetchPublicUrl.mockResolvedValueOnce(
      createResponse(`<meta ${"<meta ".repeat(200_000)}`, {
        headers: { "content-type": "text/html" },
        url: "https://example.com/broken",
      })
    );

    const response = await GET({
      nextUrl: new URL(
        "https://api.local/farcaster?url=https://example.com/broken"
      ),
    } as any);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      type: "unsupported",
      canonicalUrl: "https://example.com/broken",
      reason: "Unsupported Farcaster URL",
    });
  });

  it("returns unsupported for non-HTML generic URLs", async () => {
    mockFetchPublicUrl.mockResolvedValueOnce(
      createResponse("png", {
        headers: { "content-type": "image/png" },
        url: "https://example.com/image.png",
      })
    );

    const request = {
      nextUrl: new URL(
        "https://api.local/farcaster?url=https://example.com/image.png"
      ),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      type: "unsupported",
      canonicalUrl: "https://example.com/image.png",
      reason: "Farcaster frame URL did not return readable HTML metadata.",
    });
  });

  it("returns unsupported for oversized frame HTML responses", async () => {
    mockFetchPublicUrl.mockResolvedValueOnce(
      createResponse("<html></html>", {
        headers: {
          "content-length": `${8 * 1024 * 1024 + 1}`,
          "content-type": "text/html",
        },
        url: "https://example.com/large-frame",
      })
    );

    const request = {
      nextUrl: new URL(
        "https://api.local/farcaster?url=https://example.com/large-frame"
      ),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      type: "unsupported",
      canonicalUrl: "https://example.com/large-frame",
      reason: "Farcaster frame response is too large to process safely.",
    });
  });

  it("returns error when frame fetch fails", async () => {
    mockFetchPublicUrl.mockRejectedValueOnce(new Error("network failure"));

    const request = {
      nextUrl: new URL(
        "https://api.local/farcaster?url=https://example.com/frame"
      ),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(502);
    const payload = await response.json();
    expect(payload).toEqual({ error: "network failure" });
    expect(mockFetchPublicUrl).toHaveBeenCalled();
  });

  it("propagates guard errors for blocked hosts", async () => {
    parsePublicUrlMock.mockImplementationOnce(() => {
      throw new UrlGuardError("blocked", "host-not-allowed", 403);
    });

    const request = {
      nextUrl: new URL(
        "https://api.local/farcaster?url=https://example.com/frame"
      ),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(403);
    const payload = await response.json();
    expect(payload).toEqual({ error: "blocked" });
  });
});
