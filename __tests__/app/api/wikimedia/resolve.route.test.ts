const nextResponseJson = jest.fn((body: unknown, init?: { status?: number }) => ({
  status: init?.status ?? 200,
  json: async () => body,
}));

jest.mock("next/server", () => ({
  NextResponse: { json: nextResponseJson },
  NextRequest: class {},
}));

jest.mock("@/app/api/wikimedia/resolve/service", () => {
  class WikimediaUnsupportedError extends Error {}
  return {
    WikimediaUnsupportedError,
    getWikimediaPreview: jest.fn(),
  };
});

const { getWikimediaPreview, WikimediaUnsupportedError } = jest.requireMock(
  "@/app/api/wikimedia/resolve/service"
) as {
  getWikimediaPreview: jest.Mock;
  WikimediaUnsupportedError: new (...args: any[]) => Error;
};

let GET: typeof import("@/app/api/wikimedia/resolve/route").GET;

describe("wikimedia resolve API route", () => {
  beforeAll(async () => {
    ({ GET } = await import("@/app/api/wikimedia/resolve/route"));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requires a url parameter", async () => {
    const request = { nextUrl: new URL("https://app.local/api/wikimedia/resolve") } as any;

    const response = await GET(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({ error: "Missing url parameter." });
  });

  it("returns preview data", async () => {
    getWikimediaPreview.mockResolvedValue({
      kind: "article",
      source: "wikipedia",
      canonicalUrl: "https://en.wikipedia.org/wiki/Alan_Turing",
      originalUrl: "https://en.wikipedia.org/wiki/Alan_Turing",
      lang: "en",
      title: "Alan Turing",
      description: null,
      extract: null,
      thumbnail: null,
      coordinates: null,
      section: null,
      lastModified: null,
    });

    const request = {
      nextUrl: new URL("https://app.local/api/wikimedia/resolve?url=https://en.wikipedia.org/wiki/Alan_Turing"),
      headers: { get: () => null },
      signal: undefined,
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(expect.objectContaining({ title: "Alan Turing" }));
    expect(getWikimediaPreview).toHaveBeenCalledWith(
      "https://en.wikipedia.org/wiki/Alan_Turing",
      expect.objectContaining({ acceptLanguage: undefined })
    );
  });

  it("returns 502 for other failures", async () => {
    getWikimediaPreview.mockRejectedValue(new Error("upstream"));

    const request = {
      nextUrl: new URL("https://app.local/api/wikimedia/resolve?url=https://en.wikipedia.org/wiki/Alan_Turing"),
      headers: { get: () => null },
      signal: undefined,
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(502);
  });
});
