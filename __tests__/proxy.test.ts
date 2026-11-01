/**
 * @jest-environment node
 */

import type { NextRequest } from "next/server";

const mockNext = jest.fn(() => ({ kind: "next" }));
const mockRedirect = jest.fn((url: URL) => ({
  kind: "redirect",
  url: url.toString(),
}));
const mockRewrite = jest.fn((url: URL, init?: { status?: number }) => ({
  kind: "rewrite",
  url: url.toString(),
  status: init?.status,
}));

jest.mock("next/server", () => ({
  NextResponse: {
    next: () => mockNext(),
    redirect: (url: URL) => mockRedirect(url),
    rewrite: (url: URL, init?: { status?: number }) => mockRewrite(url, init),
  },
}));

type Proxy = typeof import("@/proxy").default;

const STAGING_BASE_ENDPOINT = "https://staging.6529.io";
const PRODUCTION_BASE_ENDPOINT = "https://6529.io";
const LOCAL_BASE_ENDPOINT = "http://localhost:3001";
const ORIGINAL_PUBLIC_RUNTIME = process.env["PUBLIC_RUNTIME"];

function loadProxy(baseEndpoint: string = STAGING_BASE_ENDPOINT): Proxy {
  const runtime = JSON.parse(ORIGINAL_PUBLIC_RUNTIME ?? "{}") as Record<
    string,
    unknown
  >;
  process.env["PUBLIC_RUNTIME"] = JSON.stringify({
    ...runtime,
    BASE_ENDPOINT: baseEndpoint,
    API_ENDPOINT: "https://api.staging.example",
  });

  let loaded: Proxy | undefined;
  jest.isolateModules(() => {
    loaded = (require("@/proxy") as { default: Proxy }).default;
  });
  if (!loaded) {
    throw new Error("proxy module did not load");
  }
  return loaded;
}

function createRequest(
  pathname: string,
  {
    nextUrlPathname = pathname,
    origin = STAGING_BASE_ENDPOINT,
    authCookie,
  }: {
    nextUrlPathname?: string;
    origin?: string;
    authCookie?: string;
  } = {}
): NextRequest {
  const requestUrl = new URL(`${origin}${pathname}`);
  const nextUrl = new URL(requestUrl);
  Object.assign(nextUrl, { clone: () => new URL(nextUrl) });
  nextUrl.pathname = nextUrlPathname;
  return {
    url: requestUrl.toString(),
    nextUrl,
    headers: {
      get: jest.fn((name: string) =>
        name.toLowerCase() === "host" ? requestUrl.host : ""
      ),
    },
    cookies: {
      get: jest.fn((name: string) =>
        name === "x-6529-auth" && authCookie !== undefined
          ? { name, value: authCookie }
          : undefined
      ),
    },
  } as unknown as NextRequest;
}

function mockFetchStatus(status: number) {
  return jest
    .spyOn(globalThis, "fetch")
    .mockImplementation(async () => new Response(null, { status }));
}

describe("proxy", () => {
  let proxy: Proxy;

  beforeEach(() => {
    mockNext.mockClear();
    mockRedirect.mockClear();
    mockRewrite.mockClear();
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    proxy = loadProxy();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env["PUBLIC_RUNTIME"] = ORIGINAL_PUBLIC_RUNTIME;
  });

  it.each([
    "",
    "tab=chat",
    "tab=leaderboard",
    "tab=winners&competition=older",
    "tab=configuration&competition=older",
    "serialNo=42&tab=leaderboard",
  ])(
    "preserves explicit wave destinations in the desktop alias (%s)",
    async (query) => {
      const request = createRequest("/my-stream");
      request.nextUrl.search = `?wave=wave${query ? `&${query}` : ""}`;
      jest
        .mocked(request.headers.get)
        .mockReturnValue("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)");
      await proxy(request);
      expect(mockRedirect).toHaveBeenCalledWith(
        new URL(`/waves/wave${query ? `?${query}` : ""}`, request.url)
      );
    }
  );

  it.each([
    ["drop=message///&tab=leaderboard", "drop=message&tab=leaderboard"],
    ["serialNo=42/&tab=leaderboard", "serialNo=42&tab=leaderboard"],
    [
      "drop=message///&serialNo=42/&entry=older&tab=leaderboard",
      "drop=message&serialNo=42&tab=leaderboard&entry=older",
    ],
  ])(
    "keeps normalized chat targets alongside explicit view keys (%s)",
    async (query, expected) => {
      const request = createRequest("/my-stream");
      request.nextUrl.search = `?wave=wave&${query}`;
      jest
        .mocked(request.headers.get)
        .mockReturnValue("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)");
      await proxy(request);
      expect(mockRedirect).toHaveBeenCalledWith(
        new URL(`/waves/wave?${expected}`, request.url)
      );
    }
  );

  it.each([
    "/pdfjs/5.4.296/pdf.worker.min.mjs",
    "/pdfjs/5.4.296/cmaps/Adobe-Japan1-UCS2.bcmap",
    "/help-index.json",
    "/llms.txt",
    "/glossary.json",
    "/robots.txt",
    "/sitemap.xml",
    "/sitemap-0.xml",
    "/favicon.ico",
    "/favicon.svg",
    "/apple-icon.png",
    "/manifest.webmanifest",
    "/icon-512-maskable.png",
    "/6529io.png",
    "/transient.avif",
    "/emojis/sgt_sob.webp",
    "/museum/research/editorial/example.png",
    "/profile-cms/templates/afterimage.png",
    "/api",
    "/api/version",
    "/_next/data/build/page.json",
    "/error",
  ])("serves %s without staging access-control fetches", async (path) => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("access control should not run"));

    const response = await proxy(createRequest(path));

    expect(response).toEqual({ kind: "next" });
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    "/reviews/6529-stream",
    "/reviews/6529-stream/reference",
    // Static-looking suffixes outside real public files stay gated.
    "/the-memes/1.png",
    "/punk6529/site/logo.svg",
    "/not-a-public-file.png",
    "/emojis/page",
    // Prefixes match whole segments only.
    "/apixyz",
    "/api-docs",
    "/errors",
    "/sitemap-guy",
    "/pdfjs-viewer",
    "/_nextish",
  ])("keeps %s behind staging access control", async (path) => {
    const fetchMock = mockFetchStatus(200);

    const response = await proxy(createRequest(path));

    expect(response).toEqual({ kind: "next" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it.each([
    "/.git/HEAD",
    "/.git/config",
    "/.env",
    "/.well-known/security.txt",
    "/.well-known/assetlinks.json",
    "/.well-known/apple-app-site-association/",
    "/.well-known/apple-app-site-association.json",
    "/%2Ewell-known/apple-app-site-association",
    "/%2Egit/HEAD",
    "/punk6529/.hidden",
    "/api/.env",
    "/review-data",
    "/review-data/6529-stream",
    "/review-data/6529-stream/index.json",
    "/review-data/6529-stream/versions/2026-07-27.1/reference-manifest.json",
    "/review-data/6529-stream/versions/2026-07-27.1/definitions/record-shard.json",
    "/review-data/6529-stream/versions/2026-09-09.1/sources/smart-contracts/core/StreamCore.sol",
    "/review-data/6529-stream/versions/2026-09-09.1/knowledge/manifest.json",
    "/review-data/other-review/index.json",
    "/review-data//6529-stream/index.json",
    "/review-data/6529-stream%2Fversions/index.json",
    "/Review-Data/6529-stream/index.json",
    "/%72eview-data/6529-stream/index.json",
    "//review-data/6529-stream/index.json",
  ])("answers %s with a plain 404 before any other work", async (path) => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("access control should not run"));

    const response = (await proxy(createRequest(path))) as Response;

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toBe(
      "text/plain; charset=utf-8"
    );
    expect(response.headers.get("cache-control")).toContain("no-store");
    await expect(response.text()).resolves.toBe("Not Found");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  describe("malformed wave ids", () => {
    const WAVE_ID = "5f207393-5418-4a75-8738-e40edb44a94d";

    async function expectRewrittenToNotFound(
      request: NextRequest,
      expectedSearch = ""
    ) {
      const fetchMock = jest
        .spyOn(globalThis, "fetch")
        .mockRejectedValue(new Error("access control should not run"));

      const response = await proxy(request);

      expect(response).toEqual({
        kind: "rewrite",
        url: `${new URL(request.url).origin}/wave-not-found${expectedSearch}`,
      });
      expect(mockRewrite).toHaveBeenCalledTimes(1);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    }

    it.each([
      "/waves/not-a-real-id",
      "/waves/not-a-real-id/",
      "/waves/5f207393-5418-4a75-8738-e40edb44a94",
      "/waves/not-a-real-id/competitions",
      "/waves/not-a-real-id/competitions/alpha",
      "/messages/not-a-real-id",
    ])(
      "rewrites %s to the not-found route before the staging gate",
      async (path) => {
        await expectRewrittenToNotFound(createRequest(path));
      }
    );

    it.each(["/waves", "/messages"])(
      "rewrites a malformed legacy ?wave= link on %s",
      async (path) => {
        const request = createRequest(path);
        request.nextUrl.search = "?wave=not-a-real-id&serialNo=4";

        await expectRewrittenToNotFound(
          request,
          "?wave=not-a-real-id&serialNo=4"
        );
      }
    );

    it("keeps the query on client navigations so the _rsc check still matches", async () => {
      const request = createRequest("/waves/not-a-real-id");
      request.nextUrl.search = "?_rsc=abc123";

      await expectRewrittenToNotFound(request, "?_rsc=abc123");
    });

    it("rewrites in production builds too", async () => {
      proxy = loadProxy(PRODUCTION_BASE_ENDPOINT);

      const response = await proxy(
        createRequest("/waves/not-a-real-id", {
          origin: PRODUCTION_BASE_ENDPOINT,
        })
      );

      expect(response).toEqual({
        kind: "rewrite",
        url: "https://6529.io/wave-not-found",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("does not rewrite the not-found route itself", async () => {
      const fetchMock = mockFetchStatus(200);

      const response = await proxy(createRequest("/wave-not-found"));

      expect(response).toEqual({ kind: "next" });
      expect(mockRewrite).not.toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it.each([
      `/waves/${WAVE_ID}`,
      `/waves/${WAVE_ID.toUpperCase()}`,
      `/waves/${WAVE_ID}/competitions/alpha`,
      `/messages/${WAVE_ID}`,
      "/waves/create",
      "/messages/create",
    ])("keeps %s behind staging access control", async (path) => {
      const fetchMock = mockFetchStatus(200);

      const response = await proxy(createRequest(path));

      expect(response).toEqual({ kind: "next" });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("leaves a drop deep link on a valid wave to the app", async () => {
      const fetchMock = mockFetchStatus(200);
      const request = createRequest(`/waves/${WAVE_ID}`);
      request.nextUrl.search = "?drop=not-a-uuid&serialNo=abc";

      const response = await proxy(request);

      expect(response).toEqual({ kind: "next" });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("leaves a valid legacy ?wave= link to the page redirect", async () => {
      const fetchMock = mockFetchStatus(200);
      const request = createRequest("/waves");
      request.nextUrl.search = `?wave=${WAVE_ID}`;

      const response = await proxy(request);

      expect(response).toEqual({ kind: "next" });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  it.each([STAGING_BASE_ENDPOINT, PRODUCTION_BASE_ENDPOINT])(
    "passes the apple-app-site-association to its route without the gate on %s",
    async (baseEndpoint) => {
      proxy = loadProxy(baseEndpoint);
      const fetchMock = jest
        .spyOn(globalThis, "fetch")
        .mockRejectedValue(new Error("access control should not run"));

      const response = await proxy(
        createRequest("/.well-known/apple-app-site-association", {
          origin: baseEndpoint,
        })
      );

      expect(response).toEqual({ kind: "next" });
      expect(fetchMock).not.toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    }
  );

  describe("staging access gate", () => {
    it("forwards the staging auth cookie to the probe", async () => {
      const fetchMock = mockFetchStatus(200);

      await proxy(createRequest("/waves", { authCookie: "team-code" }));

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.staging.example/api/",
        expect.objectContaining({ headers: { "x-6529-auth": "team-code" } })
      );
    });

    it("probes with the visitor's cookie only, never a server-held key", async () => {
      process.env["STAGING_API_KEY"] = "server-staging-key";
      try {
        const fetchMock = mockFetchStatus(401);

        const response = await proxy(createRequest("/waves"));

        expect(fetchMock).toHaveBeenCalledWith(
          "https://api.staging.example/api/",
          expect.objectContaining({ headers: { "x-6529-auth": "" } })
        );
        expect(response).toEqual({
          kind: "redirect",
          url: "https://staging.6529.io/access",
        });
      } finally {
        delete process.env["STAGING_API_KEY"];
      }
    });

    it("redirects to /access when the API answers 401", async () => {
      mockFetchStatus(401);
      const request = createRequest("/waves");
      request.nextUrl.search = "?tab=chat";

      const response = await proxy(request);

      expect(response).toEqual({
        kind: "redirect",
        url: "https://staging.6529.io/access",
      });
    });

    it("redirects to /restricted when the API answers 403", async () => {
      mockFetchStatus(403);

      const response = await proxy(createRequest("/waves"));

      expect(response).toEqual({
        kind: "redirect",
        url: "https://staging.6529.io/restricted",
      });
    });

    it.each(["/access", "/restricted"])("never probes on %s", async (path) => {
      const fetchMock = mockFetchStatus(401);

      const response = await proxy(createRequest(path));

      expect(response).toEqual({ kind: "next" });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("reuses a cached verdict instead of probing on every request", async () => {
      const fetchMock = mockFetchStatus(200);

      await proxy(createRequest("/waves", { authCookie: "team-code" }));
      await proxy(createRequest("/network", { authCookie: "team-code" }));
      await proxy(createRequest("/the-memes", { authCookie: "team-code" }));

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledTimes(3);
    });

    it("does not share a cached verdict across different cookies", async () => {
      const fetchMock = jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(async (_url, init) => {
          const headers = init?.headers as Record<string, string>;
          const status = headers["x-6529-auth"] === "team-code" ? 200 : 401;
          return new Response(null, { status });
        });

      const allowed = await proxy(
        createRequest("/waves", { authCookie: "team-code" })
      );
      const denied = await proxy(
        createRequest("/waves", { authCookie: "guess" })
      );

      expect(allowed).toEqual({ kind: "next" });
      expect(denied).toEqual({
        kind: "redirect",
        url: "https://staging.6529.io/access",
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it.each([
      ["a 5xx answer", () => mockFetchStatus(502)],
      [
        "a network error",
        () =>
          jest
            .spyOn(globalThis, "fetch")
            .mockRejectedValue(new TypeError("fetch failed")),
      ],
      [
        "a timeout",
        () =>
          jest
            .spyOn(globalThis, "fetch")
            .mockRejectedValue(
              new DOMException("The operation timed out.", "TimeoutError")
            ),
      ],
    ])("fails closed with a plain 503 on %s", async (_label, mockProbe) => {
      const fetchMock = mockProbe();

      const response = (await proxy(createRequest("/waves"))) as Response;
      const retry = (await proxy(createRequest("/waves"))) as Response;

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(503);
      expect(response.headers.get("cache-control")).toContain("no-store");
      expect(retry.status).toBe(503);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRedirect).not.toHaveBeenCalled();
    });
  });

  describe("outside staging deployments", () => {
    it.each([PRODUCTION_BASE_ENDPOINT, LOCAL_BASE_ENDPOINT])(
      "never calls the API from a %s build",
      async (baseEndpoint) => {
        proxy = loadProxy(baseEndpoint);
        const fetchMock = mockFetchStatus(401);

        const response = await proxy(
          createRequest("/waves", { origin: baseEndpoint })
        );

        expect(response).toEqual({ kind: "next" });
        expect(fetchMock).not.toHaveBeenCalled();
      }
    );

    it("keeps the production build ungated when the Host claims staging", async () => {
      proxy = loadProxy(PRODUCTION_BASE_ENDPOINT);
      const fetchMock = mockFetchStatus(401);

      const response = await proxy(
        createRequest("/waves", { origin: STAGING_BASE_ENDPOINT })
      );

      expect(response).toEqual({ kind: "next" });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("keeps the staging build gated when the Host claims production", async () => {
      const fetchMock = mockFetchStatus(401);

      const response = await proxy(
        createRequest("/waves", { origin: PRODUCTION_BASE_ENDPOINT })
      );

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(response).toEqual({
        kind: "redirect",
        url: "https://6529.io/access",
      });
    });

    it("answers a TDH verification day that cannot exist with the TDH not-found view and a 404", async () => {
      jest.useFakeTimers({ now: new Date("2026-10-16T12:00:00Z") });
      const fetchMock = jest.spyOn(globalThis, "fetch").mockImplementation(
        async () =>
          new Response(
            JSON.stringify({
              days: [{ cycleDay: 20_742 }, { cycleDay: 20_740 }],
            }),
            { status: 200 }
          )
      );
      try {
        proxy = loadProxy(PRODUCTION_BASE_ENDPOINT);

        const unknown = await proxy(
          createRequest("/network/tdh/verification/abc", {
            origin: PRODUCTION_BASE_ENDPOINT,
          })
        );
        const published = await proxy(
          createRequest("/network/tdh/verification/20740", {
            origin: PRODUCTION_BASE_ENDPOINT,
          })
        );
        // Inside the range, but not in the feed's index: the same 404.
        const unlisted = await proxy(
          createRequest("/network/tdh/verification/20741", {
            origin: PRODUCTION_BASE_ENDPOINT,
          })
        );

        // The address's text never reaches the view.
        expect(unknown).toEqual({
          kind: "rewrite",
          url: "https://6529.io/network/tdh/verification/day-not-found",
          status: 404,
        });
        expect(published).toEqual({ kind: "next" });
        expect(unlisted).toEqual({
          kind: "rewrite",
          url: "https://6529.io/network/tdh/verification/day-not-found?day=20741",
          status: 404,
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
          "https://d379duzqnomz3w.cloudfront.net/index.json"
        );
      } finally {
        jest.useRealTimers();
      }
    });

    it("leaves a TDH day to the page when the feed's index cannot be read", async () => {
      jest.useFakeTimers({ now: new Date("2026-10-16T12:00:00Z") });
      jest
        .spyOn(globalThis, "fetch")
        .mockImplementation(async () => new Response(null, { status: 503 }));
      try {
        proxy = loadProxy(PRODUCTION_BASE_ENDPOINT);
        const response = await proxy(
          createRequest("/network/tdh/verification/20741", {
            origin: PRODUCTION_BASE_ENDPOINT,
          })
        );
        expect(response).toEqual({ kind: "next" });
      } finally {
        jest.useRealTimers();
      }
    });

    it("still answers dot-prefixed paths with a plain 404 in production", async () => {
      proxy = loadProxy(PRODUCTION_BASE_ENDPOINT);

      const response = (await proxy(
        createRequest("/.git/HEAD", { origin: PRODUCTION_BASE_ENDPOINT })
      )) as Response;

      expect(response.status).toBe(404);
    });

    it.each([PRODUCTION_BASE_ENDPOINT, LOCAL_BASE_ENDPOINT])(
      "answers retired review data with a plain 404 on %s",
      async (baseEndpoint) => {
        proxy = loadProxy(baseEndpoint);

        const response = (await proxy(
          createRequest(
            "/review-data/6529-stream/versions/2026-09-09.1/sources/smart-contracts/core/StreamCore.sol",
            { origin: baseEndpoint }
          )
        )) as Response;

        expect(response.status).toBe(404);
        expect(mockNext).not.toHaveBeenCalled();
      }
    );
  });
});
