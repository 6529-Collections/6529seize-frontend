/**
 * Captures mocked JSON responses from the Pepe resolve route.
 */
const nextResponseJson = jest.fn(
  (
    body: unknown,
    init?: {
      status?: number | undefined;
      headers?: Headers | undefined;
    }
  ) => ({
    status: init?.status ?? 200,
    headers: init?.headers ?? new Headers(),
    body,
    json: async () => body,
  })
);

jest.mock("next/server", () => ({
  NextResponse: { json: nextResponseJson },
  NextRequest: class {},
}));

const mockFetchPublicUrl = jest.fn();

jest.mock("@/lib/security/urlGuard", () => {
  const actual = jest.requireActual("@/lib/security/urlGuard");
  return {
    ...actual,
    fetchPublicUrl: mockFetchPublicUrl,
  };
});

type PepeResolveRoute = typeof import("@/app/api/pepe/resolve/route");
let GET: PepeResolveRoute["GET"];
let HTML_RESPONSE_MAX_BYTES: PepeResolveRoute["HTML_RESPONSE_MAX_BYTES"];

beforeAll(async () => {
  ({ GET, HTML_RESPONSE_MAX_BYTES } =
    await import("@/app/api/pepe/resolve/route"));
});

describe("/api/pepe/resolve", () => {
  beforeEach(() => {
    nextResponseJson.mockClear();
    mockFetchPublicUrl.mockReset();
  });

  /**
   * Creates a single-read stream body for byte-limited response tests.
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
   * Creates a minimal fetch response shape with an optional stream body.
   */
  const createFetchResponse = (
    body: string | null,
    options: {
      status?: number | undefined;
      headers?: Record<string, string> | undefined;
    } = {}
  ): Response =>
    ({
      status: options.status ?? 200,
      ok: (options.status ?? 200) >= 200 && (options.status ?? 200) < 300,
      headers: new Headers(options.headers),
      body: body === null ? null : createBody(body),
    }) as unknown as Response;

  /**
   * Creates an HTML response for Pepe page and wiki fetch mocks.
   */
  const createTextResponse = (body: string, status = 200) =>
    createFetchResponse(body, {
      status,
      headers: { "content-type": "text/html" },
    });

  /**
   * Creates a JSON response for tokenscan and price fetch mocks.
   */
  const createJsonResponse = (body: unknown, status = 200) =>
    createFetchResponse(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });

  /**
   * Trims trailing URL slashes without a regex so static analysis stays quiet.
   */
  const trimTrailingSlashesForTest = (value: string): string => {
    let end = value.length;
    while (end > 0 && value.codePointAt(end - 1) === 47) {
      end -= 1;
    }
    return end === value.length ? value : value.slice(0, end);
  };

  /**
   * Converts a mocked fetchPublicUrl call into its requested URL string.
   */
  const fetchCallToUrlForTest = (call: readonly unknown[]): string => {
    const input = call[0];
    return typeof input === "string" ? input : String(input);
  };

  /**
   * Matches Pepe wiki URLs among fetchPublicUrl mock calls.
   */
  const isPepeWikiUrlForTest = (url: string): boolean =>
    url.startsWith("https://wiki.pepe.wtf/");

  /**
   * Matches rare-pepe wiki lookup URLs.
   */
  const isRarePepeWikiUrlForTest = (url: string): boolean =>
    url.includes("/rare-pepes/");

  /**
   * Extracts the final path segment from a wiki URL.
   */
  const extractLastPathPartForTest = (url: string): string =>
    url.split("/").pop() ?? "";

  /**
   * Slugifies Pepe names with the same broad shape as the route helper.
   */
  const slugifyNameForTest = (value: string) =>
    value
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  it("caches asset previews and sets cache headers", async () => {
    const nextData = {
      props: {
        pageProps: {
          asset: {
            name: "MtGox Pepe",
            asset: "GOXPEPE",
            artist: "Artist",
            collection: "Series 2",
            image: "https://images.example/gox.png",
            series: 2,
            card: 15,
          },
        },
      },
    };

    const html = `<!doctype html><html><head><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(
      nextData
    )}</script></head><body></body></html>`;

    const nameSlug = slugifyNameForTest(nextData.props.pageProps.asset.name);
    const assetSlug = slugifyNameForTest(nextData.props.pageProps.asset.asset);
    const expectedWikiSlugs = new Set([nameSlug, assetSlug]);

    mockFetchPublicUrl.mockImplementation(async (input: string | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.startsWith("https://pepe.wtf/asset/")) {
        return createTextResponse(html);
      }
      if (url.startsWith("https://wiki.pepe.wtf/")) {
        const wikiPath = trimTrailingSlashesForTest(
          url.slice("https://wiki.pepe.wtf/".length)
        );
        if (wikiPath.startsWith("rare-pepes/")) {
          const slug = wikiPath.split("/").pop() ?? "";
          if (!expectedWikiSlugs.has(slug)) {
            throw new Error(`Unexpected rare pepe slug ${slug}`);
          }
          return createFetchResponse(null, { status: 404 });
        }
        if (wikiPath.startsWith("book-of-kek/")) {
          const slug = wikiPath.split("/").pop() ?? "";
          if (!expectedWikiSlugs.has(slug)) {
            throw new Error(`Unexpected book of kek slug ${slug}`);
          }
          return createFetchResponse(null, { status: 404 });
        }
        if (!wikiPath.includes("/") && expectedWikiSlugs.has(wikiPath)) {
          return createFetchResponse(null);
        }
      }
      if (url === "https://tokenscan.io/api/api/asset/GOXPEPE") {
        return createJsonResponse({ supply: "1000" });
      }
      if (url === "https://tokenscan.io/api/api/holders/GOXPEPE") {
        return createJsonResponse({ data: [{}, {}] });
      }
      if (
        url === "https://tokenscan.io/api/api/dispensers/GOXPEPE?status=open"
      ) {
        return createJsonResponse({
          data: [{ satoshi_price: 2500 }, { satoshirate: 4000 }],
        });
      }
      if (url === "https://tokenscan.io/api/api/market/GOXPEPE/BTC/history") {
        return createJsonResponse({ data: [{ price_sats: 1500 }] });
      }
      if (url === "https://tokenscan.io/api/api/market/GOXPEPE/XCP/history") {
        return createJsonResponse({ data: [{ price: 1.5 }] });
      }
      if (url.startsWith("https://api.coingecko.com/")) {
        return createJsonResponse({
          bitcoin: { eth: 15 },
          counterparty: { eth: 0.002 },
        });
      }
      throw new Error(`Unexpected fetchPublicUrl call to ${url}`);
    });

    const request = {
      nextUrl: new URL(
        "https://app.local/api/pepe/resolve?kind=asset&slug=GOXPEPE"
      ),
    } as any;

    const response1 = await GET(request);
    expect(response1.status).toBe(200);
    const payload1 = await response1.json();
    expect(payload1).toMatchObject({
      kind: "asset",
      asset: "GOXPEPE",
      links: {
        horizon: "https://horizon.market/explorer/assets/GOXPEPE",
        xchain: "https://xchain.io/asset/GOXPEPE",
      },
    });
    expect(payload1.links).toHaveProperty("wiki");

    expect(payload1.market).toEqual(
      expect.objectContaining({
        bestAskSats: 2500,
        lastSaleSats: 1500,
        lastSaleXcp: 1.5,
        approxEthPerBtc: 15,
        approxEthPerXcp: 0.002,
      })
    );
    expect(typeof payload1.market?.updatedISO).toBe("string");
    expect(Number.isNaN(Date.parse(payload1.market?.updatedISO ?? ""))).toBe(
      false
    );

    expect(response1.headers.get("X-Cache")).toBe("MISS");
    expect(response1.headers.get("Cache-Control")).toContain("s-maxage=600");
    expect(mockFetchPublicUrl).toHaveBeenCalled();
    const wikiCallUrls = mockFetchPublicUrl.mock.calls
      .map(fetchCallToUrlForTest)
      .filter(isPepeWikiUrlForTest);

    expect(wikiCallUrls.length).toBeGreaterThan(0);
    expect(payload1.links?.wiki).toBe(`https://wiki.pepe.wtf/${nameSlug}`);

    expect(
      wikiCallUrls
        .filter(isRarePepeWikiUrlForTest)
        .map(extractLastPathPartForTest)
        .some(expectedWikiSlugs.has.bind(expectedWikiSlugs))
    ).toBe(true);
    const urlCallsAfterFirst = mockFetchPublicUrl.mock.calls.length;

    const response2 = await GET(request);
    expect(response2.status).toBe(200);
    const payload2 = await response2.json();
    expect(payload2).toEqual(payload1);
    expect(response2.headers.get("X-Cache")).toBe("HIT");
    expect(mockFetchPublicUrl.mock.calls.length).toBe(urlCallsAfterFirst);
  });

  it("returns 400 for invalid params", async () => {
    const request = {
      nextUrl: new URL("https://app.local/api/pepe/resolve"),
    } as any;

    const response = await GET(request);
    expect(response.status).toBe(400);
    expect(mockFetchPublicUrl).not.toHaveBeenCalled();
  });

  it("falls back safely when Pepe HTML exceeds the byte limit", async () => {
    mockFetchPublicUrl.mockImplementation(async (input: string | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.startsWith("https://pepe.wtf/collection/")) {
        return createFetchResponse("<html></html>", {
          headers: {
            "content-length": `${HTML_RESPONSE_MAX_BYTES + 1}`,
            "content-type": "text/html",
          },
        });
      }
      throw new Error(`Unexpected fetchPublicUrl call to ${url}`);
    });

    const request = {
      nextUrl: new URL(
        "https://app.local/api/pepe/resolve?kind=collection&slug=rare-pepes"
      ),
    } as any;

    const response = await GET(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      kind: "collection",
      image: null,
      name: "Rare Pepes",
    });
  });
});
