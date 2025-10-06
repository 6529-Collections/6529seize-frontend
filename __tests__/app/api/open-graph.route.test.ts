import { publicEnv } from "@/config/env";

const mockFetchPublicUrl = jest.fn();

const nextResponseJsonRoute = jest.fn(
  (body: unknown, init?: { status?: number }) => ({
    status: init?.status ?? 200,
    json: async () => body,
  })
);

const nextResponseJson = nextResponseJsonRoute;

jest.mock("next/server", () => ({
  NextResponse: { json: nextResponseJsonRoute },
  NextRequest: class {},
}));

jest.mock("@/app/api/open-graph/utils", () => ({
  buildResponse: jest.fn(),
  buildGoogleWorkspaceResponse: jest.fn(),
  HTML_ACCEPT_HEADER:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  LINK_PREVIEW_USER_AGENT:
    "6529seize-link-preview/1.0 (+https://6529.io; Fetching public OpenGraph data)",
}));

jest.mock("@/lib/security/urlGuard", () => {
  const actual = jest.requireActual("@/lib/security/urlGuard");
  return {
    ...actual,
    parsePublicUrl: jest.fn((value: string | null) => {
      if (!value) {
        throw new actual.UrlGuardError("missing url", "missing-url");
      }
      return new URL(value);
    }),
    assertPublicUrl: jest.fn(),
    fetchPublicUrl: mockFetchPublicUrl,
  };
});

jest.mock("@/app/api/open-graph/compound/service", () => ({
  createCompoundPlan: jest.fn(() => null),
}));

jest.mock("@/app/api/open-graph/ens", () => ({
  detectEnsTarget: jest.fn(),
  fetchEnsPreview: jest.fn(),
}));

type GetHandler = typeof import("../../../app/api/open-graph/route").GET;
let GET: GetHandler;

let utils: {
  buildResponse: jest.Mock;
  buildGoogleWorkspaceResponse: jest.Mock;
};
let guard: {
  parsePublicUrl: jest.Mock;
  assertPublicUrl: jest.Mock;
  fetchPublicUrl: jest.Mock;
};
let compound: {
  createCompoundPlan: jest.Mock;
};
let UrlGuardError: typeof import("@/lib/security/urlGuard").UrlGuardError;
let ensRouteModule: {
  detectEnsTarget: jest.Mock;
  fetchEnsPreview: jest.Mock;
};

const DEFAULT_USER_AGENT =
  "6529seize-link-preview/1.0 (+https://6529.io; Fetching public OpenGraph data)";

const originalFetch = global.fetch;
const mockFetch = jest.fn();

async function loadRoute(): Promise<void> {
  jest.resetModules();
  ({ GET } = await import("../../../app/api/open-graph/route"));
  ({ UrlGuardError } = jest.requireActual("@/lib/security/urlGuard"));
  utils = jest.requireMock("../../../app/api/open-graph/utils") as {
    buildResponse: jest.Mock;
    buildGoogleWorkspaceResponse: jest.Mock;
  };
  guard = jest.requireMock("@/lib/security/urlGuard") as {
    parsePublicUrl: jest.Mock;
    assertPublicUrl: jest.Mock;
    fetchPublicUrl: jest.Mock;
  };
  compound = jest.requireMock(
    "../../../app/api/open-graph/compound/service"
  ) as {
    createCompoundPlan: jest.Mock;
  };
  ensRouteModule = jest.requireMock("@/app/api/open-graph/ens") as {
    detectEnsTarget: jest.Mock;
    fetchEnsPreview: jest.Mock;
  };
}

describe("open-graph API route", () => {
  const originalBaseEndpoint = publicEnv.BASE_ENDPOINT;
  const originalProcessBaseEndpoint = process.env.BASE_ENDPOINT;

  beforeEach(async () => {
    nextResponseJson.mockClear();
    jest.clearAllMocks();
    await loadRoute();
    guard.assertPublicUrl.mockResolvedValue(undefined);
    mockFetchPublicUrl.mockReset();
    compound.createCompoundPlan.mockReturnValue(null);
    utils.buildGoogleWorkspaceResponse.mockResolvedValue(null);
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
    publicEnv.BASE_ENDPOINT = "https://6529.io";
    process.env.BASE_ENDPOINT = "https://6529.io";
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  afterEach(() => {
    publicEnv.BASE_ENDPOINT = originalBaseEndpoint;
    if (originalProcessBaseEndpoint === undefined) {
      delete process.env.BASE_ENDPOINT;
    } else {
      process.env.BASE_ENDPOINT = originalProcessBaseEndpoint;
    }
  });

  const createResponse = (
    status: number,
    options: { headers?: Record<string, string>; body?: string; url?: string } = {}
  ) => {
    const headerEntries = Object.entries(options.headers ?? {}).reduce(
      (map, [key, value]) => map.set(key.toLowerCase(), value),
      new Map<string, string>()
    );

    return {
      status,
      ok: status >= 200 && status < 300,
      headers: {
        get: (name: string) => headerEntries.get(name.toLowerCase()) ?? null,
      },
      text: async () => options.body ?? "",
      url: options.url ?? "https://example.com/final",
    };
  };

  it("returns 400 when the URL is missing", async () => {
    guard.parsePublicUrl.mockImplementation(() => {
      throw new UrlGuardError("missing", "missing-url", 400);
    });

    const request = {
      nextUrl: new URL("https://app.local/api/open-graph"),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(nextResponseJson).toHaveBeenCalledWith({ error: "missing" }, { status: 400 });
  });

  it("returns preview data and caches successive requests", async () => {
    const html = "<html><head><title>ok</title></head><body></body></html>";
    const responsePayload = {
      requestUrl: "http://safe.example/article",
      url: "https://cdn.safe.example/page",
      title: "ok",
      description: null,
      siteName: null,
      mediaType: null,
      contentType: "text/html",
      favicon: null,
      favicons: [],
      image: null,
      images: [],
    };

    const fetchResponse = createResponse(200, {
      headers: { "content-type": "text/html" },
      body: html,
      url: "https://cdn.safe.example/page",
    });

    mockFetch.mockResolvedValueOnce(fetchResponse);
    mockFetchPublicUrl.mockImplementationOnce(async (url, init = {}, options = {}) => {
      expect(url).toEqual(new URL("http://safe.example/article"));
      expect(options).toEqual(
        expect.objectContaining({ fetchImpl: expect.any(Function) })
      );
      const result = await options.fetchImpl?.(url, init);
      return (result ?? fetchResponse) as any;
    });
    utils.buildResponse.mockReturnValue(responsePayload);
    utils.buildGoogleWorkspaceResponse.mockResolvedValueOnce(null);

    const request = {
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=http://safe.example/article"
      ),
    } as any;

    const first = await GET(request);
    const second = await GET(request);

    expect(compound.createCompoundPlan).toHaveBeenCalledWith(
      new URL("http://safe.example/article")
    );
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual(responsePayload);
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual(responsePayload);
    expect(mockFetchPublicUrl).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[0].toString()).toBe("http://safe.example/article");
    const headers = fetchCall[1]?.headers as Headers;
    expect(headers.get("accept")).toBe(
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
    );
    expect(headers.get("user-agent")).toBe(DEFAULT_USER_AGENT);
    expect(guard.assertPublicUrl.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(utils.buildResponse).toHaveBeenCalledWith(
      new URL("https://cdn.safe.example/page"),
      html,
      "text/html",
      "https://cdn.safe.example/page"
    );
  });

  it("applies host-specific overrides for facebook", async () => {
    const html = "<html></html>";
    const responsePayload = {
      requestUrl: "https://www.facebook.com/some-post",
    };

    const fetchResponse = createResponse(200, {
      headers: { "content-type": "text/html" },
      body: html,
      url: "https://www.facebook.com/some-post",
    });

    mockFetch.mockResolvedValueOnce(fetchResponse);
    mockFetchPublicUrl.mockImplementationOnce(async (url, init = {}, options = {}) => {
      expect(url).toEqual(
        new URL(
          "https://www.facebook.com/20531316728/posts/10154009990506729/"
        )
      );
      const result = await options.fetchImpl?.(url, init);
      return (result ?? fetchResponse) as any;
    });
    utils.buildResponse.mockReturnValue(responsePayload);
    utils.buildGoogleWorkspaceResponse.mockResolvedValueOnce(null);

    const request = {
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=https://www.facebook.com/20531316728/posts/10154009990506729/"
      ),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockFetchPublicUrl).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const fbFetchCall = mockFetch.mock.calls[0];
    expect(fbFetchCall[0].toString()).toBe(
      "https://www.facebook.com/20531316728/posts/10154009990506729/"
    );
    const fbHeaders = fbFetchCall[1]?.headers as Headers;
    expect(fbHeaders.get("referer")).toBe("https://www.facebook.com/");
    expect(fbHeaders.get("accept")).toBe(
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    );
    expect(fbHeaders.get("sec-fetch-mode")).toBeNull();
    expect(fbHeaders.get("user-agent")).toBe(
      "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"
    );
  });

  it("returns google workspace preview when available", async () => {
    const html = "<html><head><title>Doc</title></head><body></body></html>";
    const googlePayload = {
      type: "google.docs",
      requestUrl: "https://docs.google.com/document/d/abc/edit",
      url: "https://docs.google.com/document/d/abc/edit",
      title: "Doc",
      description: null,
      siteName: "Google Docs",
      mediaType: null,
      contentType: null,
      favicon: null,
      favicons: [],
      image: null,
      images: [],
      thumbnail: "https://drive.google.com/thumbnail?id=abc",
      fileId: "abc",
      availability: "public",
      links: {
        open: "https://docs.google.com/document/d/abc/edit",
        preview: "https://docs.google.com/document/d/abc/preview",
        exportPdf: "https://docs.google.com/document/d/abc/export?format=pdf",
      },
    };

    const fetchResponse = createResponse(200, {
      headers: { "content-type": "text/html" },
      body: html,
      url: "https://docs.google.com/document/d/abc/edit",
    });

    mockFetch.mockResolvedValueOnce(fetchResponse);
    mockFetchPublicUrl.mockImplementationOnce(async (url, init = {}, options = {}) => {
      const result = await options.fetchImpl?.(url, init);
      return (result ?? fetchResponse) as any;
    });
    utils.buildGoogleWorkspaceResponse.mockResolvedValueOnce(googlePayload);

    const request = {
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=https://docs.google.com/document/d/abc/edit"
      ),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(googlePayload);
    expect(utils.buildResponse).not.toHaveBeenCalled();
    expect(mockFetchPublicUrl).toHaveBeenCalledTimes(1);
  });

  it("uses compound plan when available", async () => {
    const compoundData = { kind: "compound", value: 123 } as any;
    const execute = jest.fn(async () => ({ data: compoundData, ttl: 45_000 }));
    compound.createCompoundPlan.mockReturnValue({
      cacheKey: "compound:test",
      execute,
    });

    const request = {
      nextUrl: new URL("https://app.local/api/open-graph?url=https://compound.finance"),
    } as any;

    const first = await GET(request);
    const second = await GET(request);

    expect(first.status).toBe(200);
    expect(await first.json()).toEqual(compoundData);
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual(compoundData);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(mockFetchPublicUrl).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(utils.buildResponse).not.toHaveBeenCalled();
  });

  it("returns 502 when fetch fails unexpectedly", async () => {
    mockFetchPublicUrl.mockRejectedValueOnce(new Error("Failed to fetch URL."));

    const request = {
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=http://safe.example/article"
      ),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(502);
    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "Failed to fetch URL." },
      { status: 502 }
    );
    expect(mockFetchPublicUrl).toHaveBeenCalledTimes(1);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 502 when plan execution fails", async () => {
    const execute = jest.fn(async () => {
      throw new Error("boom");
    });
    compound.createCompoundPlan.mockReturnValue({
      cacheKey: "compound:error",
      execute,
    });

    const request = {
      nextUrl: new URL("https://app.local/api/open-graph?url=https://compound.finance"),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(502);
    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "boom" },
      { status: 502 }
    );
  });

  it("handles ENS previews when detected", async () => {
    const previewPayload = { type: "ens.name", name: "vitalik.eth" };
    ensRouteModule.detectEnsTarget.mockReturnValue({
      kind: "name",
      input: "vitalik.eth",
    });
    ensRouteModule.fetchEnsPreview.mockResolvedValue(previewPayload);

    const request = {
      nextUrl: new URL("https://app.local/api/open-graph?url=vitalik.eth"),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(previewPayload);
    expect(ensRouteModule.fetchEnsPreview).toHaveBeenCalledWith({
      kind: "name",
      input: "vitalik.eth",
    });
    expect(utils.buildResponse).not.toHaveBeenCalled();
  });
});
