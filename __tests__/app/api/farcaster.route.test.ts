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

jest.mock("@/lib/security/urlGuard", () => {
  const actual = jest.requireActual("@/lib/security/urlGuard");
  return {
    ...actual,
    parsePublicUrl: jest.fn((value: string | null) => {
      if (!value) {
        throw new actual.UrlGuardError("missing", "missing-url", 400);
      }
      return new URL(value);
    }),
    assertPublicUrl: jest.fn(),
  };
});

const { parsePublicUrl, assertPublicUrl } = jest.requireMock(
  "@/lib/security/urlGuard"
) as {
  parsePublicUrl: jest.Mock;
  assertPublicUrl: jest.Mock;
};

const originalFetch = global.fetch;
const mockFetch = jest.fn();

let GET: typeof import("../../app/api/farcaster/route").GET;
let UrlGuardError: typeof import("@/lib/security/urlGuard").UrlGuardError;

const loadRoute = async () => {
  jest.resetModules();
  ({ UrlGuardError } = jest.requireActual("@/lib/security/urlGuard"));
  ({ GET } = await import("../../../app/api/farcaster/route"));
};

describe("farcaster API route", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
    await loadRoute();
    assertPublicUrl.mockResolvedValue(undefined);
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("returns 400 when url is missing", async () => {
    parsePublicUrl.mockImplementationOnce(() => {
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
    mockFetch.mockResolvedValueOnce(
      Promise.resolve({
        ok: true,
        status: 200,
        text: async () => `
          <html>
            <head>
              <meta name="fc:frame" content="1" />
              <meta name="fc:frame:image" content="/image.png" />
              <meta name="fc:frame:button:1" content="Open" />
            </head>
          </html>
        `,
        headers: {
          get: () => null,
        },
      })
    );

    const request = {
      nextUrl: new URL("https://api.local/farcaster?url=https://example.com/frame"),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual(
      expect.objectContaining({
        type: "frame",
        frame: expect.objectContaining({ frameUrl: "https://example.com/frame" }),
      })
    );
  });
});
