import type { NextRequest } from "next/server";
import { ReadableStream as NodeReadableStream } from "node:stream/web";
import { MessagePort as NodeMessagePort } from "node:worker_threads";

import { publicEnv } from "@/config/env";

if (typeof globalThis.ReadableStream === "undefined") {
  Object.defineProperty(globalThis, "ReadableStream", {
    value: NodeReadableStream,
  });
}

if (typeof globalThis.MessagePort === "undefined") {
  Object.defineProperty(globalThis, "MessagePort", {
    value: NodeMessagePort,
  });
}

const mockFetchPublicUrl = jest.fn();

/**
 * Captures mocked JSON responses from the OpenGraph route.
 */
const nextResponseJsonRoute = jest.fn(
  (body: unknown, init?: { status?: number | undefined }) => ({
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

jest.mock("@/app/api/open-graph/manifold/service", () => ({
  createManifoldPlan: jest.fn(() => null),
}));

jest.mock("@/app/api/open-graph/foundation/service", () => ({
  createFoundationPlan: jest.fn(() => null),
}));

jest.mock("@/app/api/open-graph/opensea/service", () => ({
  createOpenSeaPlan: jest.fn(() => null),
}));

jest.mock("@/app/api/open-graph/transient/service", () => ({
  createTransientPlan: jest.fn(() => null),
}));

jest.mock("@/app/api/open-graph/6529/service", () => ({
  createFirstParty6529Plan: jest.fn(() => null),
}));

jest.mock("@/app/api/open-graph/ens", () => ({
  detectEnsTarget: jest.fn(),
  fetchEnsPreview: jest.fn(),
}));

type GetHandler = typeof import("../../../app/api/open-graph/route").GET;
type PostHandler = typeof import("../../../app/api/open-graph/route").POST;
let GET: GetHandler;
let POST: PostHandler;

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
let manifold: {
  createManifoldPlan: jest.Mock;
};
let foundation: {
  createFoundationPlan: jest.Mock;
};
let opensea: {
  createOpenSeaPlan: jest.Mock;
};
let transient: {
  createTransientPlan: jest.Mock;
};
let firstParty6529: {
  createFirstParty6529Plan: jest.Mock;
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

/**
 * Creates a single-read stream body for OpenGraph request and response mocks.
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
 * Loads the route after resetting modules so mocked dependencies are fresh.
 */
async function loadRoute(): Promise<void> {
  jest.resetModules();
  ({ GET, POST } = await import("../../../app/api/open-graph/route"));
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
  manifold = jest.requireMock(
    "../../../app/api/open-graph/manifold/service"
  ) as {
    createManifoldPlan: jest.Mock;
  };
  foundation = jest.requireMock(
    "../../../app/api/open-graph/foundation/service"
  ) as {
    createFoundationPlan: jest.Mock;
  };
  opensea = jest.requireMock("../../../app/api/open-graph/opensea/service") as {
    createOpenSeaPlan: jest.Mock;
  };
  transient = jest.requireMock(
    "../../../app/api/open-graph/transient/service"
  ) as {
    createTransientPlan: jest.Mock;
  };
  firstParty6529 = jest.requireMock("@/app/api/open-graph/6529/service") as {
    createFirstParty6529Plan: jest.Mock;
  };
  ensRouteModule = jest.requireMock("@/app/api/open-graph/ens") as {
    detectEnsTarget: jest.Mock;
    fetchEnsPreview: jest.Mock;
  };
}

describe("open-graph API route", () => {
  const originalBaseEndpoint = publicEnv.BASE_ENDPOINT;
  const originalProcessBaseEndpoint = process.env["BASE_ENDPOINT"];

  beforeEach(async () => {
    nextResponseJson.mockClear();
    jest.clearAllMocks();
    await loadRoute();
    guard.assertPublicUrl.mockResolvedValue(undefined);
    mockFetchPublicUrl.mockReset();
    manifold.createManifoldPlan.mockReturnValue(null);
    foundation.createFoundationPlan.mockReturnValue(null);
    opensea.createOpenSeaPlan.mockReturnValue(null);
    transient.createTransientPlan.mockReturnValue(null);
    firstParty6529.createFirstParty6529Plan.mockReturnValue(null);
    compound.createCompoundPlan.mockReturnValue(null);
    utils.buildGoogleWorkspaceResponse.mockResolvedValue(null);
    mockFetch.mockReset();
    global.fetch = mockFetch as unknown as typeof fetch;
    publicEnv.BASE_ENDPOINT = "https://6529.io";
    process.env["BASE_ENDPOINT"] = "https://6529.io";
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  afterEach(() => {
    publicEnv.BASE_ENDPOINT = originalBaseEndpoint;
    if (originalProcessBaseEndpoint === undefined) {
      delete process.env["BASE_ENDPOINT"];
    } else {
      process.env["BASE_ENDPOINT"] = originalProcessBaseEndpoint;
    }
  });

  /**
   * Creates a response object for guarded OpenGraph fetch mocks.
   */
  const createResponse = (
    status: number,
    options: {
      headers?: Record<string, string> | undefined;
      body?: string | undefined;
      url?: string | undefined;
    } = {}
  ): Response =>
    ({
      status,
      ok: status >= 200 && status < 300,
      headers: new Headers(options.headers),
      body: createBody(options.body ?? ""),
      url: options.url ?? "https://example.com/final",
    }) as unknown as Response;

  /**
   * Creates a JSON batch request with a stream-backed body.
   */
  const createJsonRequest = (body: unknown): NextRequest =>
    createStreamRequest(JSON.stringify(body), {
      "content-type": "application/json",
    });

  /**
   * Creates a request-like object with caller-specified content headers.
   */
  const createStreamRequest = (
    body: string,
    headers: Record<string, string>
  ): NextRequest =>
    ({
      headers: new Headers(headers),
      body: createBody(body),
    }) as unknown as NextRequest;

  it("returns 400 when the URL is missing", async () => {
    guard.parsePublicUrl.mockImplementation(() => {
      throw new UrlGuardError("missing", "missing-url", 400);
    });

    const request = {
      nextUrl: new URL("https://app.local/api/open-graph"),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "missing" },
      { status: 400 }
    );
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
    mockFetchPublicUrl.mockImplementationOnce(
      async (url, init = {}, options = {}) => {
        expect(url).toEqual(new URL("http://safe.example/article"));
        expect(options).toEqual(
          expect.objectContaining({ fetchImpl: expect.any(Function) })
        );
        const result = await options.fetchImpl?.(url, init);
        return (result ?? fetchResponse) as any;
      }
    );
    utils.buildResponse.mockReturnValue(responsePayload);
    utils.buildGoogleWorkspaceResponse.mockResolvedValueOnce(null);

    const request = {
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=http://safe.example/article"
      ),
    } as any;

    const first = await GET(request);
    const second = await GET(request);

    expect(firstParty6529.createFirstParty6529Plan).toHaveBeenCalledWith(
      new URL("http://safe.example/article"),
      { apiAuth: null }
    );
    expect(compound.createCompoundPlan).toHaveBeenCalledWith(
      new URL("http://safe.example/article")
    );
    expect(manifold.createManifoldPlan).toHaveBeenCalledWith(
      new URL("http://safe.example/article"),
      expect.objectContaining({
        fetchHtml: expect.any(Function),
        assertPublicUrl: expect.any(Function),
      })
    );
    expect(foundation.createFoundationPlan).toHaveBeenCalledWith(
      new URL("http://safe.example/article"),
      expect.objectContaining({
        fetchHtml: expect.any(Function),
        assertPublicUrl: expect.any(Function),
      })
    );
    expect(opensea.createOpenSeaPlan).toHaveBeenCalledWith(
      new URL("http://safe.example/article"),
      expect.objectContaining({
        fetchHtml: expect.any(Function),
        assertPublicUrl: expect.any(Function),
      })
    );
    expect(transient.createTransientPlan).toHaveBeenCalledWith(
      new URL("http://safe.example/article"),
      expect.objectContaining({
        fetchHtml: expect.any(Function),
        assertPublicUrl: expect.any(Function),
      })
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

  it("passes through richer generic article metadata from the parser", async () => {
    const html =
      "<html><head><title>Article</title></head><body></body></html>";
    const responsePayload = {
      requestUrl: "https://news.example/articles/richer-card",
      url: "https://news.example/articles/richer-card",
      title: "A richer generic link preview",
      description: "Article dek from destination metadata.",
      siteName: "Example News",
      mediaType: "article",
      contentType: "text/html; charset=utf-8",
      favicon: "https://news.example/favicon.ico",
      favicons: ["https://news.example/favicon.ico"],
      image: {
        url: "https://news.example/images/richer-card.jpg",
        secureUrl: "https://news.example/images/richer-card.jpg",
        alt: "Article hero image",
      },
      images: [
        {
          url: "https://news.example/images/richer-card.jpg",
          secureUrl: "https://news.example/images/richer-card.jpg",
          alt: "Article hero image",
        },
      ],
      author: "Example Reporter",
      publishedTime: "2026-06-16T12:00:00.000Z",
    };

    const fetchResponse = createResponse(200, {
      headers: { "content-type": "text/html; charset=utf-8" },
      body: html,
      url: "https://news.example/articles/richer-card",
    });

    mockFetch.mockResolvedValueOnce(fetchResponse);
    mockFetchPublicUrl.mockImplementationOnce(
      async (url, init = {}, options = {}) => {
        expect(url).toEqual(
          new URL("https://news.example/articles/richer-card")
        );
        const result = await options.fetchImpl?.(url, init);
        return (result ?? fetchResponse) as any;
      }
    );
    utils.buildGoogleWorkspaceResponse.mockResolvedValueOnce(null);
    utils.buildResponse.mockReturnValue(responsePayload);

    const request = {
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=https://news.example/articles/richer-card"
      ),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(responsePayload);
    expect(utils.buildResponse).toHaveBeenCalledWith(
      new URL("https://news.example/articles/richer-card"),
      html,
      "text/html; charset=utf-8",
      "https://news.example/articles/richer-card"
    );
  });

  it("returns typed Farcaster Mini App previews from fc:miniapp metadata", async () => {
    const miniAppMetadata = {
      version: "1",
      imageUrl: "https://mini.example/preview.png",
      button: {
        title: "Launch",
        action: {
          type: "launch_miniapp",
          name: "Example Mini",
          url: "/launch",
          splashImageUrl: "https://mini.example/splash.png",
          splashBackgroundColor: "#855dcd",
        },
      },
    };
    const html = `
      <html>
        <head>
          <meta name='fc:miniapp' content='${JSON.stringify(
            miniAppMetadata
          )}' />
          <meta property="og:title" content="OG Example Mini" />
          <meta property="og:description" content="Launch the example app" />
        </head>
      </html>
    `;
    mockFetchPublicUrl.mockResolvedValueOnce(
      createResponse(200, {
        headers: { "content-type": "text/html" },
        body: html,
        url: "https://mini.example/app",
      })
    );
    utils.buildResponse.mockReturnValue({
      requestUrl: "https://mini.example/app",
      url: "https://mini.example/app",
      title: "OG Example Mini",
      description: "Launch the example app",
      siteName: "Mini Example",
      source: "mini.example",
      image: null,
      images: [],
    });

    const response = await GET({
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=https://mini.example/app"
      ),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        type: "farcaster.miniapp",
        embedKind: "miniapp",
        title: "Example Mini",
        appName: "Example Mini",
        buttonTitle: "Launch",
        actionType: "launch_miniapp",
        actionUrl: "https://mini.example/launch",
        imageUrl: "https://mini.example/preview.png",
        splashImageUrl: "https://mini.example/splash.png",
        splashBackgroundColor: "#855dcd",
        mediaType: "application",
      })
    );
    expect(body.image).toEqual({
      url: "https://mini.example/preview.png",
      secureUrl: "https://mini.example/preview.png",
    });
    expect(body.images).toEqual([body.image]);
    expect(guard.assertPublicUrl).toHaveBeenCalledWith(
      new URL("https://mini.example/preview.png"),
      expect.any(Object)
    );
    expect(guard.assertPublicUrl).toHaveBeenCalledWith(
      new URL("https://mini.example/launch"),
      expect.any(Object)
    );
    expect(guard.assertPublicUrl).toHaveBeenCalledWith(
      new URL("https://mini.example/splash.png"),
      expect.any(Object)
    );
  });

  it("uses JSON fc:frame metadata as a backward-compatible Mini App preview", async () => {
    const frameMetadata = {
      version: "1",
      imageUrl: "https://frame.example/frame.png",
      button: {
        title: "Start",
        action: {
          type: "launch_frame",
          name: "Frame Thing",
          url: "https://frame.example/play",
        },
      },
    };
    const html = `
      <html>
        <head>
          <meta name='fc:frame' content='${JSON.stringify(frameMetadata)}' />
          <title>Frame fallback title</title>
        </head>
      </html>
    `;
    mockFetchPublicUrl.mockResolvedValueOnce(
      createResponse(200, {
        headers: { "content-type": "text/html" },
        body: html,
        url: "https://frame.example/app",
      })
    );
    utils.buildResponse.mockReturnValue({
      requestUrl: "https://frame.example/app",
      url: "https://frame.example/app",
      title: "Frame fallback title",
      description: null,
      siteName: "Frame Example",
      source: "frame.example",
      image: null,
      images: [],
    });

    const response = await GET({
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=https://frame.example/app"
      ),
    } as any);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        type: "farcaster.miniapp",
        embedKind: "frame",
        title: "Frame Thing",
        buttonTitle: "Start",
        actionUrl: "https://frame.example/play",
      })
    );
  });

  it("returns typed previews for legacy Farcaster frame metadata", async () => {
    const html = `
      <html>
        <head>
          <meta name="fc:frame" content="vNext" />
          <meta name="fc:frame:image" content="/legacy.png" />
          <meta name="fc:frame:button:1" content="Mint" />
          <meta name="fc:frame:button:1:action" content="link" />
          <meta name="fc:frame:button:1:target" content="/mint" />
          <meta property="og:title" content="Legacy Frame" />
        </head>
      </html>
    `;
    mockFetchPublicUrl.mockResolvedValueOnce(
      createResponse(200, {
        headers: { "content-type": "text/html" },
        body: html,
        url: "https://legacy.example/frame",
      })
    );
    utils.buildResponse.mockReturnValue({
      requestUrl: "https://legacy.example/frame",
      url: "https://legacy.example/frame",
      title: "Legacy Frame",
      description: null,
      siteName: "Legacy Example",
      source: "legacy.example",
      image: null,
      images: [],
    });

    const response = await GET({
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=https://legacy.example/frame"
      ),
    } as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        type: "farcaster.frame",
        embedKind: "legacy-frame",
        title: "Legacy Frame",
        appName: "Legacy Example",
        buttonTitle: "Mint",
        actionUrl: "https://legacy.example/mint",
        imageUrl: "https://legacy.example/legacy.png",
        buttons: ["Mint"],
      })
    );
  });

  it("uses only link-action targets for legacy Farcaster frame navigation", async () => {
    const html = `
      <html>
        <head>
          <meta name="fc:frame" content="vNext" />
          <meta name="fc:frame:image" content="/legacy.png" />
          <meta name="fc:frame:button:1" content="Vote" />
          <meta name="fc:frame:button:1:action" content="post" />
          <meta name="fc:frame:button:1:target" content="/vote" />
          <meta name="fc:frame:button:2" content="View" />
          <meta name="fc:frame:button:2:action" content="link" />
          <meta name="fc:frame:button:2:target" content="/view" />
          <meta property="og:title" content="Legacy Frame" />
        </head>
      </html>
    `;
    mockFetchPublicUrl.mockResolvedValueOnce(
      createResponse(200, {
        headers: { "content-type": "text/html" },
        body: html,
        url: "https://legacy.example/frame",
      })
    );
    utils.buildResponse.mockReturnValue({
      requestUrl: "https://legacy.example/frame",
      url: "https://legacy.example/frame",
      title: "Legacy Frame",
      description: null,
      siteName: "Legacy Example",
      source: "legacy.example",
      image: null,
      images: [],
    });

    const response = await GET({
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=https://legacy.example/frame"
      ),
    } as any);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        type: "farcaster.frame",
        embedKind: "legacy-frame",
        buttonTitle: "View",
        actionUrl: "https://legacy.example/view",
        buttons: ["Vote", "View"],
      })
    );
  });

  it("falls back to the Mini App URL when action schemes are unsafe", async () => {
    const miniAppMetadata = {
      version: "1",
      imageUrl: "https://mini.example/preview.png",
      button: {
        title: "Launch",
        action: {
          type: "launch_miniapp",
          name: "Unsafe Action Mini",
          url: "javascript:alert(1)",
        },
      },
    };
    const html = `
      <html>
        <head>
          <meta name='fc:miniapp' content='${JSON.stringify(
            miniAppMetadata
          )}' />
          <meta property="og:title" content="Unsafe Action Mini" />
        </head>
      </html>
    `;
    mockFetchPublicUrl.mockResolvedValueOnce(
      createResponse(200, {
        headers: { "content-type": "text/html" },
        body: html,
        url: "https://mini.example/app",
      })
    );
    utils.buildResponse.mockReturnValue({
      requestUrl: "https://mini.example/app",
      url: "https://mini.example/app",
      title: "Unsafe Action Mini",
      description: null,
      siteName: "Mini Example",
      source: "mini.example",
      image: null,
      images: [],
    });

    const response = await GET({
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=https://mini.example/app"
      ),
    } as any);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        type: "farcaster.miniapp",
        actionUrl: "https://mini.example/app",
      })
    );
  });

  it("drops Mini App splash images when they are not public", async () => {
    const miniAppMetadata = {
      version: "1",
      imageUrl: "https://mini.example/preview.png",
      button: {
        title: "Launch",
        action: {
          type: "launch_miniapp",
          name: "Private Splash Mini",
          url: "https://mini.example/launch",
          splashImageUrl: "http://127.0.0.1/splash.png",
        },
      },
    };
    const html = `
      <html>
        <head>
          <meta name='fc:miniapp' content='${JSON.stringify(
            miniAppMetadata
          )}' />
          <meta property="og:title" content="Private Splash Mini" />
        </head>
      </html>
    `;
    guard.assertPublicUrl.mockImplementation(async (url: URL) => {
      if (url.hostname === "127.0.0.1") {
        throw new UrlGuardError("private URL", "private-url", 400);
      }
    });
    mockFetchPublicUrl.mockResolvedValueOnce(
      createResponse(200, {
        headers: { "content-type": "text/html" },
        body: html,
        url: "https://mini.example/app",
      })
    );
    utils.buildResponse.mockReturnValue({
      requestUrl: "https://mini.example/app",
      url: "https://mini.example/app",
      title: "Private Splash Mini",
      description: null,
      siteName: "Mini Example",
      source: "mini.example",
      image: null,
      images: [],
    });

    const response = await GET({
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=https://mini.example/app"
      ),
    } as any);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        type: "farcaster.miniapp",
        splashImageUrl: null,
      })
    );
  });

  it("falls back to generic metadata when Mini App JSON is malformed", async () => {
    const html = `
      <html>
        <head>
          <meta name="fc:miniapp" content="{not json" />
          <meta property="og:title" content="Plain Page" />
        </head>
      </html>
    `;
    const genericPayload = {
      requestUrl: "https://plain.example/app",
      url: "https://plain.example/app",
      title: "Plain Page",
      description: null,
      siteName: "Plain Example",
      source: "plain.example",
      image: null,
      images: [],
    };
    mockFetchPublicUrl.mockResolvedValueOnce(
      createResponse(200, {
        headers: { "content-type": "text/html" },
        body: html,
        url: "https://plain.example/app",
      })
    );
    utils.buildResponse.mockReturnValue(genericPayload);

    const response = await GET({
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=https://plain.example/app"
      ),
    } as any);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(genericPayload);
  });

  it("drops Mini App metadata when media URLs are not public", async () => {
    const miniAppMetadata = {
      version: "1",
      imageUrl: "http://127.0.0.1/preview.png",
      button: {
        title: "Launch",
        action: {
          type: "launch_miniapp",
          name: "Private Media Mini",
          url: "https://private-media.example/launch",
        },
      },
    };
    const html = `
      <html>
        <head>
          <meta name='fc:miniapp' content='${JSON.stringify(
            miniAppMetadata
          )}' />
          <meta property="og:title" content="Private Media Mini" />
        </head>
      </html>
    `;
    const genericPayload = {
      requestUrl: "https://private-media.example/app",
      url: "https://private-media.example/app",
      title: "Private Media Mini",
      description: null,
      siteName: "Private Media Example",
      source: "private-media.example",
      image: null,
      images: [],
    };
    guard.assertPublicUrl.mockImplementation(async (url: URL) => {
      if (url.hostname === "127.0.0.1") {
        throw new UrlGuardError("private URL", "private-url", 400);
      }
    });
    mockFetchPublicUrl.mockResolvedValueOnce(
      createResponse(200, {
        headers: { "content-type": "text/html" },
        body: html,
        url: "https://private-media.example/app",
      })
    );
    utils.buildResponse.mockReturnValue(genericPayload);

    const response = await GET({
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=https://private-media.example/app"
      ),
    } as any);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(genericPayload);
  });

  it("returns typed YouTube video previews before generic metadata", async () => {
    const oembedPayload = {
      title: "A Good Video",
      author_name: "Channel 6529",
      author_url: "https://www.youtube.com/@6529",
      provider_name: "YouTube",
      provider_url: "https://www.youtube.com/",
      thumbnail_url: "https://i.ytimg.com/vi/abc123XYZ_0/hqdefault.jpg",
      thumbnail_width: 480,
      thumbnail_height: 360,
    };
    mockFetchPublicUrl.mockResolvedValueOnce(
      createResponse(200, {
        headers: { "content-type": "application/json" },
        body: JSON.stringify(oembedPayload),
        url: "https://www.youtube.com/oembed",
      })
    );

    const youtubeUrl =
      "https://music.youtube.com/watch?v=abc123XYZ_0&t=1m30s&list=PL123456&index=4";
    const request = {
      nextUrl: new URL(
        `https://app.local/api/open-graph?url=${encodeURIComponent(youtubeUrl)}`
      ),
    } as any;

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      type: "youtube.video",
      requestUrl:
        "https://music.youtube.com/watch?v=abc123XYZ_0&t=1m30s&list=PL123456&index=4",
      url: "https://www.youtube.com/watch?v=abc123XYZ_0&list=PL123456&index=4&t=90s",
      title: "A Good Video",
      description: null,
      siteName: "YouTube",
      mediaType: "video",
      source: "YouTube",
      provider: "YouTube",
      providerUrl: "https://www.youtube.com/",
      videoId: "abc123XYZ_0",
      watchUrl:
        "https://www.youtube.com/watch?v=abc123XYZ_0&list=PL123456&index=4&t=90s",
      embedUrl:
        "https://www.youtube-nocookie.com/embed/abc123XYZ_0?rel=0&playsinline=1&list=PL123456&index=4&start=90",
      thumbnailUrl: "https://i.ytimg.com/vi/abc123XYZ_0/hqdefault.jpg",
      thumbnailWidth: 480,
      thumbnailHeight: 360,
      image: {
        url: "https://i.ytimg.com/vi/abc123XYZ_0/hqdefault.jpg",
        secureUrl: "https://i.ytimg.com/vi/abc123XYZ_0/hqdefault.jpg",
        width: 480,
        height: 360,
      },
      images: [
        {
          url: "https://i.ytimg.com/vi/abc123XYZ_0/hqdefault.jpg",
          secureUrl: "https://i.ytimg.com/vi/abc123XYZ_0/hqdefault.jpg",
          width: 480,
          height: 360,
        },
      ],
      author: "Channel 6529",
      authorName: "Channel 6529",
      authorUrl: "https://www.youtube.com/@6529",
      playlistId: "PL123456",
      playlistIndex: "4",
      startSeconds: 90,
    });
    expect(mockFetchPublicUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        href: "https://www.youtube.com/oembed?format=json&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Dabc123XYZ_0%26list%3DPL123456%26index%3D4",
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          accept: "application/json",
        }),
      })
    );
    expect(utils.buildResponse).not.toHaveBeenCalled();
    expect(manifold.createManifoldPlan).not.toHaveBeenCalled();
    expect(foundation.createFoundationPlan).not.toHaveBeenCalled();
    expect(opensea.createOpenSeaPlan).not.toHaveBeenCalled();
    expect(transient.createTransientPlan).not.toHaveBeenCalled();
    expect(compound.createCompoundPlan).not.toHaveBeenCalled();
  });

  it("drops untrusted YouTube thumbnail hosts from oEmbed responses", async () => {
    mockFetchPublicUrl.mockResolvedValueOnce(
      createResponse(200, {
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Thumbnail Host Check",
          author_name: "Channel 6529",
          thumbnail_url: "https://preview.evil.example/hqdefault.jpg",
          thumbnail_width: 480,
          thumbnail_height: 360,
        }),
        url: "https://www.youtube.com/oembed",
      })
    );

    const youtubeUrl = "https://youtu.be/thumb12345";
    const request = {
      nextUrl: new URL(
        `https://app.local/api/open-graph?url=${encodeURIComponent(youtubeUrl)}`
      ),
    } as any;

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        type: "youtube.video",
        title: "Thumbnail Host Check",
        thumbnailUrl: null,
        image: null,
        images: [],
      })
    );
  });

  it("returns an error when YouTube oEmbed is unavailable", async () => {
    mockFetchPublicUrl.mockResolvedValueOnce(
      createResponse(404, {
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "not found" }),
        url: "https://www.youtube.com/oembed",
      })
    );

    const youtubeUrl = "https://youtu.be/missing123";
    const request = {
      nextUrl: new URL(
        `https://app.local/api/open-graph?url=${encodeURIComponent(youtubeUrl)}`
      ),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(502);
    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "YouTube preview unavailable." },
      { status: 502 }
    );
  });

  it("does not cache empty successful YouTube oEmbed responses", async () => {
    mockFetchPublicUrl
      .mockResolvedValueOnce(
        createResponse(200, {
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
          url: "https://www.youtube.com/oembed",
        })
      )
      .mockResolvedValueOnce(
        createResponse(200, {
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title: "Recovered Video",
            thumbnail_url: "https://i.ytimg.com/vi/recover123/hqdefault.jpg",
          }),
          url: "https://www.youtube.com/oembed",
        })
      );

    const youtubeUrl = "https://youtu.be/recover123";
    const firstResponse = await GET({
      nextUrl: new URL(
        `https://app.local/api/open-graph?url=${encodeURIComponent(youtubeUrl)}`
      ),
    } as any);
    const secondResponse = await GET({
      nextUrl: new URL(
        `https://app.local/api/open-graph?url=${encodeURIComponent(youtubeUrl)}`
      ),
    } as any);

    expect(firstResponse.status).toBe(502);
    expect(secondResponse.status).toBe(200);
    expect(await secondResponse.json()).toEqual(
      expect.objectContaining({
        type: "youtube.video",
        title: "Recovered Video",
        thumbnailUrl: "https://i.ytimg.com/vi/recover123/hqdefault.jpg",
      })
    );
    expect(mockFetchPublicUrl).toHaveBeenCalledTimes(2);
  });

  it("rejects oversized YouTube oEmbed bodies", async () => {
    mockFetchPublicUrl.mockResolvedValueOnce(
      createResponse(200, {
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Oversized",
          padding: "x".repeat(70 * 1024),
        }),
        url: "https://www.youtube.com/oembed",
      })
    );

    const youtubeUrl = "https://youtu.be/oversized1";
    const request = {
      nextUrl: new URL(
        `https://app.local/api/open-graph?url=${encodeURIComponent(youtubeUrl)}`
      ),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(413);
    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "Preview response is too large to process safely." },
      { status: 413 }
    );
  });

  it("keeps separate final cache entries but shares oEmbed fetches for YouTube start times", async () => {
    mockFetchPublicUrl.mockResolvedValueOnce(
      createResponse(200, {
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Shared Video",
          thumbnail_url: "https://i.ytimg.com/vi/cache12345/hqdefault.jpg",
        }),
        url: "https://www.youtube.com/oembed",
      })
    );

    const firstUrl = "https://youtu.be/cache12345?t=42";
    const secondUrl = "https://youtu.be/cache12345?t=90";
    const firstResponse = await GET({
      nextUrl: new URL(
        `https://app.local/api/open-graph?url=${encodeURIComponent(firstUrl)}`
      ),
    } as any);
    const secondResponse = await GET({
      nextUrl: new URL(
        `https://app.local/api/open-graph?url=${encodeURIComponent(secondUrl)}`
      ),
    } as any);

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(await firstResponse.json()).toEqual(
      expect.objectContaining({
        title: "Shared Video",
        startSeconds: 42,
        watchUrl: "https://www.youtube.com/watch?v=cache12345&t=42s",
      })
    );
    expect(await secondResponse.json()).toEqual(
      expect.objectContaining({
        title: "Shared Video",
        startSeconds: 90,
        watchUrl: "https://www.youtube.com/watch?v=cache12345&t=90s",
      })
    );
    expect(mockFetchPublicUrl).toHaveBeenCalledTimes(1);
  });

  it("uses first-party 6529 plans before provider and generic plans", async () => {
    const firstPartyData = {
      type: "6529.collection",
      kind: "the-memes",
      title: "The Collective Synapse",
      kicker: "The Memes #509",
    };
    const execute = jest.fn(async () => ({
      data: firstPartyData,
      ttl: 45_000,
    }));
    const cookies = {
      get: jest.fn(() => ({ value: "cookie-secret" })),
    };

    firstParty6529.createFirstParty6529Plan.mockReturnValue({
      cacheKey: "6529:auth:the-memes:/the-memes/509",
      execute,
    });

    const request = {
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=https://6529.io/the-memes/509"
      ),
      cookies,
      headers: new Headers({ "x-6529-auth": "header-secret" }),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(firstPartyData);
    expect(firstParty6529.createFirstParty6529Plan).toHaveBeenCalledWith(
      new URL("https://6529.io/the-memes/509"),
      { apiAuth: "cookie-secret" }
    );
    expect(execute).toHaveBeenCalledTimes(1);
    expect(guard.assertPublicUrl).not.toHaveBeenCalled();
    expect(manifold.createManifoldPlan).not.toHaveBeenCalled();
    expect(foundation.createFoundationPlan).not.toHaveBeenCalled();
    expect(opensea.createOpenSeaPlan).not.toHaveBeenCalled();
    expect(transient.createTransientPlan).not.toHaveBeenCalled();
    expect(compound.createCompoundPlan).not.toHaveBeenCalled();
    expect(mockFetchPublicUrl).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("falls back to generic metadata when first-party 6529 enrichment fails", async () => {
    const html =
      "<html><head><title>The Collective Synapse</title></head><body></body></html>";
    const fallbackData = {
      requestUrl: "https://6529.io/the-memes/509",
      url: "https://6529.io/the-memes/509",
      title: "The Collective Synapse",
      description: "The Memes #509 | Collections | 6529.io",
      siteName: "6529.io",
      image: {
        url: "https://cdn.6529.io/memes/509.png",
        secureUrl: "https://cdn.6529.io/memes/509.png",
      },
      images: [],
    };
    const execute = jest.fn(async () => {
      throw new Error("The Memes card was not found.");
    });
    const fetchResponse = createResponse(200, {
      headers: { "content-type": "text/html" },
      body: html,
      url: "https://6529.io/the-memes/509",
    });

    firstParty6529.createFirstParty6529Plan.mockReturnValue({
      cacheKey: "6529:staging:the-memes:/the-memes/509",
      execute,
    });
    mockFetch.mockResolvedValueOnce(fetchResponse);
    mockFetchPublicUrl.mockImplementationOnce(
      async (url, init = {}, options = {}) => {
        expect(url).toEqual(new URL("https://6529.io/the-memes/509"));
        const result = await options.fetchImpl?.(url, init);
        return (result ?? fetchResponse) as any;
      }
    );
    utils.buildGoogleWorkspaceResponse.mockResolvedValueOnce(null);
    utils.buildResponse.mockReturnValue(fallbackData);

    const request = {
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=https://6529.io/the-memes/509"
      ),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(fallbackData);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(guard.assertPublicUrl).toHaveBeenCalledWith(
      new URL("https://6529.io/the-memes/509"),
      expect.any(Object)
    );
    expect(mockFetchPublicUrl).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(utils.buildResponse).toHaveBeenCalledWith(
      new URL("https://6529.io/the-memes/509"),
      html,
      "text/html",
      "https://6529.io/the-memes/509"
    );
  });

  it("does not trust caller-supplied auth headers for first-party 6529 plans", async () => {
    const firstPartyData = {
      type: "6529.collection",
      kind: "the-memes",
      title: "The Collective Synapse",
    };
    const execute = jest.fn(async () => ({
      data: firstPartyData,
      ttl: 45_000,
    }));

    firstParty6529.createFirstParty6529Plan.mockReturnValue({
      cacheKey: "6529:public:the-memes:/the-memes/509",
      execute,
    });

    const request = {
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=https://6529.io/the-memes/509"
      ),
      headers: new Headers({ "x-6529-auth": "header-secret" }),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(firstPartyData);
    expect(firstParty6529.createFirstParty6529Plan).toHaveBeenCalledWith(
      new URL("https://6529.io/the-memes/509"),
      { apiAuth: null }
    );
    expect(execute).toHaveBeenCalledTimes(1);
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
    mockFetchPublicUrl.mockImplementationOnce(
      async (url, init = {}, options = {}) => {
        expect(url).toEqual(
          new URL(
            "https://www.facebook.com/20531316728/posts/10154009990506729/"
          )
        );
        const result = await options.fetchImpl?.(url, init);
        return (result ?? fetchResponse) as any;
      }
    );
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
    mockFetchPublicUrl.mockImplementationOnce(
      async (url, init = {}, options = {}) => {
        const result = await options.fetchImpl?.(url, init);
        return (result ?? fetchResponse) as any;
      }
    );
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

  it("rejects oversized HTML responses before parsing metadata", async () => {
    const fetchResponse = createResponse(200, {
      headers: {
        "content-length": `${8 * 1024 * 1024 + 1}`,
        "content-type": "text/html",
      },
      body: "<html></html>",
      url: "https://large.example/page",
    });

    mockFetch.mockResolvedValueOnce(fetchResponse);
    mockFetchPublicUrl.mockImplementationOnce(
      async (url, init = {}, options = {}) => {
        const result = await options.fetchImpl?.(url, init);
        return (result ?? fetchResponse) as any;
      }
    );

    const request = {
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=https://large.example/page"
      ),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      error: "Preview response is too large to process safely.",
    });
    expect(utils.buildResponse).not.toHaveBeenCalled();
  });

  it("rejects non-HTML preview responses", async () => {
    const fetchResponse = createResponse(200, {
      headers: { "content-type": "image/png" },
      body: "png",
      url: "https://image.example/file.png",
    });

    mockFetch.mockResolvedValueOnce(fetchResponse);
    mockFetchPublicUrl.mockImplementationOnce(
      async (url, init = {}, options = {}) => {
        const result = await options.fetchImpl?.(url, init);
        return (result ?? fetchResponse) as any;
      }
    );

    const request = {
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=https://image.example/file.png"
      ),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(415);
    expect(await response.json()).toEqual({
      error: "Preview URL did not return readable HTML metadata.",
    });
    expect(utils.buildResponse).not.toHaveBeenCalled();
  });

  it("uses compound plan when available", async () => {
    const compoundData = { kind: "compound", value: 123 } as any;
    const execute = jest.fn(async () => ({ data: compoundData, ttl: 45_000 }));
    compound.createCompoundPlan.mockReturnValue({
      cacheKey: "compound:test",
      execute,
    });

    const request = {
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=https://compound.finance"
      ),
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

  it("uses foundation plan before compound when available", async () => {
    const foundationData = {
      type: "foundation.nft",
      title: "ALONE | Foundation",
    } as any;
    const foundationExecute = jest.fn(async () => ({
      data: foundationData,
      ttl: 45_000,
    }));

    foundation.createFoundationPlan.mockReturnValue({
      cacheKey: "foundation:test",
      execute: foundationExecute,
    });
    compound.createCompoundPlan.mockReturnValue({
      cacheKey: "compound:test",
      execute: jest.fn(async () => ({
        data: { kind: "compound" },
        ttl: 45_000,
      })),
    });

    const request = {
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=https://foundation.app/mint/eth/0x5847Eaef547F1B01C0a23d8af615AB2f0bB235A4/8"
      ),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(foundationData);
    expect(foundationExecute).toHaveBeenCalledTimes(1);
    expect(compound.createCompoundPlan).not.toHaveBeenCalled();
    expect(mockFetchPublicUrl).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("uses OpenSea plan before compound when available", async () => {
    const openSeaData = {
      type: "opensea.nft",
      title: "Radar dome",
    } as any;
    const openSeaExecute = jest.fn(async () => ({
      data: openSeaData,
      ttl: 45_000,
    }));

    opensea.createOpenSeaPlan.mockReturnValue({
      cacheKey: "opensea:test",
      execute: openSeaExecute,
    });
    compound.createCompoundPlan.mockReturnValue({
      cacheKey: "compound:test",
      execute: jest.fn(async () => ({
        data: { kind: "compound" },
        ttl: 45_000,
      })),
    });

    const request = {
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/31136811317196283853097434082447684930607990400663529852029007509349076041729"
      ),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(openSeaData);
    expect(openSeaExecute).toHaveBeenCalledTimes(1);
    expect(compound.createCompoundPlan).not.toHaveBeenCalled();
    expect(mockFetchPublicUrl).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("uses transient plan before compound when available", async () => {
    const transientData = {
      type: "transient.nft",
      title: "Stitched",
    } as any;
    const transientExecute = jest.fn(async () => ({
      data: transientData,
      ttl: 45_000,
    }));

    transient.createTransientPlan.mockReturnValue({
      cacheKey: "transient:test",
      execute: transientExecute,
    });
    compound.createCompoundPlan.mockReturnValue({
      cacheKey: "compound:test",
      execute: jest.fn(async () => ({
        data: { kind: "compound" },
        ttl: 45_000,
      })),
    });

    const request = {
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=https://www.transient.xyz/nfts/ethereum/0xda48f4db41415fc2873efb487eec1068626fad60/7"
      ),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(transientData);
    expect(transientExecute).toHaveBeenCalledTimes(1);
    expect(compound.createCompoundPlan).not.toHaveBeenCalled();
    expect(mockFetchPublicUrl).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("uses manifold plan before compound when available", async () => {
    const manifoldData = {
      type: "manifold.listing",
      title: "The Big Bang",
    } as any;
    const manifoldExecute = jest.fn(async () => ({
      data: manifoldData,
      ttl: 45_000,
    }));

    manifold.createManifoldPlan.mockReturnValue({
      cacheKey: "manifold:test",
      execute: manifoldExecute,
    });
    compound.createCompoundPlan.mockReturnValue({
      cacheKey: "compound:test",
      execute: jest.fn(async () => ({
        data: { kind: "compound" },
        ttl: 45_000,
      })),
    });

    const request = {
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=https://manifold.xyz/@artist/id/123"
      ),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(manifoldData);
    expect(manifoldExecute).toHaveBeenCalledTimes(1);
    expect(compound.createCompoundPlan).not.toHaveBeenCalled();
    expect(mockFetchPublicUrl).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
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
      nextUrl: new URL(
        "https://app.local/api/open-graph?url=https://compound.finance"
      ),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(502);
    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "boom" },
      { status: 502 }
    );
  });

  it("returns batch preview data for valid POST urls", async () => {
    compound.createCompoundPlan.mockImplementation((url: URL) => ({
      cacheKey: `compound:${url.toString()}`,
      execute: jest.fn(async () => ({
        data: {
          requestUrl: url.toString(),
          title: `Preview ${url.hostname}`,
        },
        ttl: 45_000,
      })),
    }));

    const request = createJsonRequest({
      urls: [" https://one.example/article ", "https://two.example/article"],
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      results: {
        "https://one.example/article": {
          requestUrl: "https://one.example/article",
          title: "Preview one.example",
        },
        "https://two.example/article": {
          requestUrl: "https://two.example/article",
          title: "Preview two.example",
        },
      },
      errors: {},
    });
  });

  it("returns typed YouTube previews from batch requests", async () => {
    mockFetchPublicUrl.mockResolvedValueOnce(
      createResponse(200, {
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "Batch Video",
          author_name: "Batch Channel",
          thumbnail_url: "https://i.ytimg.com/vi/batch12345/hqdefault.jpg",
        }),
        url: "https://www.youtube.com/oembed",
      })
    );

    const url = "https://youtu.be/batch12345?t=42";
    const request = createJsonRequest({
      urls: [url],
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      results: {
        [url]: expect.objectContaining({
          type: "youtube.video",
          title: "Batch Video",
          videoId: "batch12345",
          watchUrl: "https://www.youtube.com/watch?v=batch12345&t=42s",
          embedUrl:
            "https://www.youtube-nocookie.com/embed/batch12345?rel=0&playsinline=1&start=42",
        }),
      },
      errors: {},
    });
  });

  it("dedupes duplicate POST urls before resolving previews", async () => {
    const execute = jest.fn(async () => ({
      data: {
        requestUrl: "https://one.example/article",
        title: "Preview one.example",
      },
      ttl: 45_000,
    }));
    compound.createCompoundPlan.mockReturnValue({
      cacheKey: "compound:deduped",
      execute,
    });

    const request = createJsonRequest({
      urls: ["https://one.example/article", " https://one.example/article "],
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      results: {
        "https://one.example/article": {
          requestUrl: "https://one.example/article",
          title: "Preview one.example",
        },
      },
      errors: {},
    });
    expect(compound.createCompoundPlan).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("returns per-url POST errors without failing the whole batch", async () => {
    guard.parsePublicUrl.mockImplementation((value: string | null) => {
      if (value === "bad-url") {
        throw new UrlGuardError("Invalid or forbidden URL", "invalid-url", 400);
      }
      if (!value) {
        throw new UrlGuardError("missing", "missing-url", 400);
      }
      return new URL(value);
    });
    compound.createCompoundPlan.mockImplementation((url: URL) => ({
      cacheKey: `compound:${url.toString()}`,
      execute: jest.fn(async () => ({
        data: {
          requestUrl: url.toString(),
          title: "Good preview",
        },
        ttl: 45_000,
      })),
    }));

    const request = createJsonRequest({
      urls: ["https://good.example/article", "bad-url"],
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      results: {
        "https://good.example/article": {
          requestUrl: "https://good.example/article",
          title: "Good preview",
        },
      },
      errors: {
        "bad-url": "Invalid or forbidden URL",
      },
    });
  });

  it("returns 400 for invalid POST batch bodies", async () => {
    const request = createJsonRequest({
      urls: "https://one.example/article",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "A urls array is required." },
      { status: 400 }
    );
  });

  it("returns 400 when POST includes more than 5 unique urls", async () => {
    const request = createJsonRequest({
      urls: [
        "https://one.example/article",
        "https://two.example/article",
        "https://three.example/article",
        "https://four.example/article",
        "https://five.example/article",
        "https://six.example/article",
      ],
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(nextResponseJson).toHaveBeenCalledWith(
      { error: "A maximum of 5 urls can be requested." },
      { status: 400 }
    );
    expect(compound.createCompoundPlan).not.toHaveBeenCalled();
  });

  it("handles ENS previews in POST batches", async () => {
    const previewPayload = { type: "ens.name", name: "vitalik.eth" };
    const ensTarget = {
      kind: "name",
      input: "vitalik.eth",
    };
    ensRouteModule.detectEnsTarget.mockImplementation((input: string) =>
      input === "vitalik.eth" ? ensTarget : null
    );
    ensRouteModule.fetchEnsPreview.mockResolvedValue(previewPayload);

    const request = createJsonRequest({
      urls: ["vitalik.eth"],
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      results: {
        "vitalik.eth": previewPayload,
      },
      errors: {},
    });
    expect(ensRouteModule.fetchEnsPreview).toHaveBeenCalledWith(ensTarget);
    expect(guard.parsePublicUrl).not.toHaveBeenCalled();
  });

  it("rejects oversized POST bodies", async () => {
    const request = createStreamRequest("{}", {
      "content-length": `${64 * 1024 + 1}`,
      "content-type": "application/json",
    });

    const response = await POST(request);

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({
      error: "Open graph batch request body is too large.",
    });
  });

  it("rejects non-JSON POST bodies", async () => {
    const request = createStreamRequest("{}", {
      "content-type": "text/plain",
    });

    const response = await POST(request);

    expect(response.status).toBe(415);
    expect(await response.json()).toEqual({
      error: "Open graph batch request body must be JSON.",
    });
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
