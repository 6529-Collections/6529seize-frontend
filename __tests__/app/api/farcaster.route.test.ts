const nextResponseJson = jest.fn(
  (body: unknown, init?: { status?: number }) => ({
    status: init?.status ?? 200,
    json: async () => body,
  })
);

jest.mock("next/server", () => ({
  NextResponse: { json: nextResponseJson },
  NextRequest: class {},
}));

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

const resetUrlGuardMocks = () => {
  parsePublicUrlMock.mockReset();
  parsePublicUrlMock.mockImplementation(createDefaultParsePublicUrl);
  assertPublicUrlMock.mockReset();
  assertPublicUrlMock.mockResolvedValue(undefined);
  mockFetchPublicUrl.mockReset();
};

const loadRoute = async () => {
  jest.resetModules();
  resetUrlGuardMocks();
  ({ GET } = await import("@/app/api/farcaster/route"));
};

describe("farcaster API route", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockFetch.mockReset();
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
    expect(nextResponseJson).toHaveBeenCalledWith({ error: "missing" }, { status: 400 });
  });

  it("returns cast preview", async () => {
    mockFetch.mockResolvedValueOnce(
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
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
        }),
      })
    );

    const request = {
      nextUrl: new URL("https://api.local/farcaster?url=https://warpcast.com/alice/0xabc"),
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
    expect(init?.headers).toEqual(
      expect.objectContaining({ "user-agent": expect.any(String) })
    );
  });

  it("returns profile preview", async () => {
    mockFetch.mockResolvedValueOnce(
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          result: {
            user: {
              fid: 2,
              username: "bob",
              displayName: "Bob",
              pfp: { url: "https://cdn.warpcast.com/bob.png" },
              profile: { bio: { text: "GM" } },
            },
          },
        }),
      })
    );

    const request = {
      nextUrl: new URL("https://api.local/farcaster?url=https://warpcast.com/bob"),
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

      return {
        ok: true,
        url: "https://example.com/frame",
        text: async () => html,
      };
    });

    const request = {
      nextUrl: new URL("https://api.local/farcaster?url=https://example.com/frame"),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(mockFetchPublicUrl).toHaveBeenCalled();
    expect(payload).toEqual(
      expect.objectContaining({
        type: "frame",
        frame: expect.objectContaining({ frameUrl: "https://example.com/frame" }),
      })
    );
    const [calledUrl, init, options] = mockFetchPublicUrl.mock.calls[0];
    expect(calledUrl).toEqual(new URL("https://example.com/frame"));
    expect(init).toEqual(expect.objectContaining({ method: "GET" }));
    expect(options).toEqual(expect.objectContaining({ userAgent: expect.any(String) }));
  });

  it("returns error when frame fetch fails", async () => {
    mockFetchPublicUrl.mockRejectedValueOnce(new Error("network failure"));

    const request = {
      nextUrl: new URL("https://api.local/farcaster?url=https://example.com/frame"),
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
      nextUrl: new URL("https://api.local/farcaster?url=https://example.com/frame"),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(403);
    const payload = await response.json();
    expect(payload).toEqual({ error: "blocked" });
  });
});
