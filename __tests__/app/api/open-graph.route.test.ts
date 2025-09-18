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

jest.mock("../../../app/api/open-graph/utils", () => {
  return {
    buildResponse: jest.fn(),
    ensureUrlIsPublic: jest.fn(),
    validateUrl: jest.fn((value: string | null) => {
      if (!value) {
        throw new Error("missing url");
      }
      return new URL(value);
    }),
  };
});

jest.mock("../../../app/api/open-graph/compound/service", () => ({
  createCompoundPlan: jest.fn(() => null),
}));

const utils = jest.requireMock("../../../app/api/open-graph/utils") as {
  buildResponse: jest.Mock;
  ensureUrlIsPublic: jest.Mock;
};

const compound = jest.requireMock("../../../app/api/open-graph/compound/service") as {
  createCompoundPlan: jest.Mock;
};

const originalFetch = global.fetch;
type GetHandler = typeof import("../../../app/api/open-graph/route").GET;
let GET: GetHandler;

beforeAll(async () => {
  ({ GET } = await import("../../../app/api/open-graph/route"));
});

describe("open-graph API route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = originalFetch;
    nextResponseJson.mockClear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const createResponse = (
    status: number,
    options: { headers?: Record<string, string>; body?: string } = {}
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
    };
  };

  it("rejects redirects to private targets before following them", async () => {
    const ensureUrlIsPublic = utils.ensureUrlIsPublic;
    ensureUrlIsPublic.mockImplementation(async (url: URL) => {
      if (url.hostname === "safe.example") {
        return;
      }
      if (url.hostname === "169.254.0.1") {
        throw new Error("URL host is not allowed.");
      }
      throw new Error(`unexpected host: ${url.hostname}`);
    });

    const redirectResponse = createResponse(302, {
      headers: { location: "http://169.254.0.1/internal" },
    });

    global.fetch = jest.fn().mockResolvedValueOnce(redirectResponse) as jest.MockedFunction<
      typeof fetch
    >;

    const request = {
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=http://safe.example/article"
      ),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(502);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(utils.buildResponse).not.toHaveBeenCalled();
    expect(compound.createCompoundPlan).toHaveBeenCalled();
  });

  it("follows safe redirects after validating each hop", async () => {
    const ensureUrlIsPublic = utils.ensureUrlIsPublic;
    ensureUrlIsPublic.mockImplementation(async (url: URL) => {
      if (["safe.example", "cdn.safe.example"].includes(url.hostname)) {
        return;
      }
      throw new Error(`unexpected host: ${url.hostname}`);
    });

    const html = "<html><head><title>ok</title></head><body></body></html>";
    const redirectResponse = createResponse(302, {
      headers: { location: "https://cdn.safe.example/page" },
    });
    const successResponse = createResponse(200, {
      headers: { "content-type": "text/html" },
      body: html,
    });

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(redirectResponse)
      .mockResolvedValueOnce(successResponse) as jest.MockedFunction<typeof fetch>;

    global.fetch = fetchMock;

    const previewPayload = {
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

    utils.buildResponse.mockReturnValue(previewPayload);

    const request = {
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=http://safe.example/article"
      ),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(previewPayload);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://safe.example/article",
      expect.objectContaining({ redirect: "manual" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://cdn.safe.example/page",
      expect.objectContaining({ redirect: "manual" })
    );
    expect(utils.buildResponse).toHaveBeenCalledWith(
      new URL("http://safe.example/article"),
      html,
      "text/html"
    );
    expect(compound.createCompoundPlan).toHaveBeenCalled();
  });
});
