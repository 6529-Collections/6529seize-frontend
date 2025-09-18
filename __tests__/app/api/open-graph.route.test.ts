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

jest.mock("../../../app/api/open-graph/utils", () => ({
  buildResponse: jest.fn(),
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
    fetchPublicUrl: jest.fn(),
  };
});

jest.mock("../../../app/api/open-graph/compound/service", () => ({
  createCompoundPlan: jest.fn(() => null),
}));

type GetHandler = typeof import("../../../app/api/open-graph/route").GET;
let GET: GetHandler;

let utils: { buildResponse: jest.Mock };
let guard: {
  parsePublicUrl: jest.Mock;
  assertPublicUrl: jest.Mock;
  fetchPublicUrl: jest.Mock;
};
let compound: {
  createCompoundPlan: jest.Mock;
};
let UrlGuardError: typeof import("@/lib/security/urlGuard").UrlGuardError;

async function loadRoute(): Promise<void> {
  jest.resetModules();
  ({ GET } = await import("../../../app/api/open-graph/route"));
  ({ UrlGuardError } = jest.requireActual("@/lib/security/urlGuard"));
  utils = jest.requireMock("../../../app/api/open-graph/utils") as {
    buildResponse: jest.Mock;
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
}

describe("open-graph API route", () => {
  beforeEach(async () => {
    nextResponseJson.mockClear();
    jest.clearAllMocks();
    await loadRoute();
    guard.assertPublicUrl.mockResolvedValue(undefined);
    compound.createCompoundPlan.mockReturnValue(null);
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

    guard.fetchPublicUrl.mockResolvedValueOnce(fetchResponse);
    utils.buildResponse.mockReturnValue(responsePayload);

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
    expect(guard.fetchPublicUrl).toHaveBeenCalledTimes(1);
    expect(guard.assertPublicUrl.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(utils.buildResponse).toHaveBeenCalledWith(
      new URL("http://safe.example/article"),
      html,
      "text/html",
      "https://cdn.safe.example/page"
    );
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
    expect(guard.fetchPublicUrl).not.toHaveBeenCalled();
    expect(utils.buildResponse).not.toHaveBeenCalled();
  });

  it("propagates UrlGuardError from fetch", async () => {
    guard.fetchPublicUrl.mockImplementation(() => {
      throw new UrlGuardError("timeout", "timeout", 504);
    });

    const request = {
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=http://safe.example/article"
      ),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(504);
    expect(nextResponseJson).toHaveBeenCalledWith({ error: "timeout" }, { status: 504 });
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
});
