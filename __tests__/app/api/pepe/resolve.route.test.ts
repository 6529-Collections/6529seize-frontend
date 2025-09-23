const nextResponseJson = jest.fn(
  (
    body: unknown,
    init?: {
      status?: number;
      headers?: Headers;
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

const originalFetch = global.fetch;
const originalEnv = process.env;

type GetHandler = typeof import("@/app/api/pepe/resolve/route").GET;
let GET: GetHandler;

beforeAll(async () => {
  process.env = {
    ...originalEnv,
    PEPE_CACHE_TTL_MINUTES: "10",
    PEPE_CACHE_MAX_ITEMS: "500",
    IPFS_GATEWAY: "https://ipfs.io/ipfs/",
  };

  ({ GET } = await import("@/app/api/pepe/resolve/route"));
});

afterAll(() => {
  process.env = originalEnv;
});

describe("/api/pepe/resolve", () => {
  beforeEach(() => {
    nextResponseJson.mockClear();
    global.fetch = originalFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const createTextResponse = (body: string, status = 200) =>
    new Response(body, {
      status,
      headers: new Headers({ "content-type": "text/html" }),
    });

  const createJsonResponse = (value: unknown, status = 200) =>
    new Response(JSON.stringify(value), {
      status,
      headers: new Headers({ "content-type": "application/json" }),
    });

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

    const mockFetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : typeof (input as { url?: string }).url === "string"
            ? (input as { url: string }).url
            : String(input);
      if (url.startsWith("https://pepe.wtf/asset/")) {
        return createTextResponse(html);
      }
      if (url.startsWith("https://tokenscan.io/api/api/asset")) {
        return createJsonResponse({ supply: "1000" });
      }
      if (url.startsWith("https://tokenscan.io/api/api/holders")) {
        return createJsonResponse({ data: [{}, {}] });
      }
      if (url.startsWith("https://tokenscan.io/api/api/dispensers")) {
        return createJsonResponse({ data: [{ satoshi_price: 2500 }, { satoshirate: 4000 }] });
      }
      if (url.startsWith("https://tokenscan.io/api/api/market") && url.includes("BTC")) {
        return createJsonResponse({ data: [{ price_sats: 1500 }] });
      }
      if (url.startsWith("https://tokenscan.io/api/api/market") && url.includes("XCP")) {
        return createJsonResponse({ data: [{ price: 1.5 }] });
      }
      try {
        const parsed = new URL(url);
        if (parsed.hostname === "api.coingecko.com") {
          return createJsonResponse({ bitcoin: { eth: 15 }, counterparty: { eth: 0.002 } });
        }
      } catch {
        // ignore URL parsing issues so other mocks can handle the input
      }
      if (url === "https://wiki.pepe.wtf/rare-pepes/mtgox-pepe") {
        return new Response(null, { status: 404 });
      }
      if (url === "https://wiki.pepe.wtf/mtgox-pepe") {
        return new Response(null, { status: 200 });
      }
      throw new Error(`Unexpected fetch to ${url}`);
    });

    global.fetch = mockFetch as unknown as typeof fetch;

    const request = {
      nextUrl: new URL("https://app.local/api/pepe/resolve?kind=asset&slug=GOXPEPE"),
    } as any;

    const response1 = await GET(request);
    expect(response1.status).toBe(200);
    const payload1 = await response1.json();
    expect(payload1).toMatchObject({
      kind: "asset",
      asset: "GOXPEPE",
      links: { wiki: "https://wiki.pepe.wtf/mtgox-pepe" },
      market: expect.objectContaining({ bestAskSats: 2500, lastSaleSats: 1500 }),
    });

    expect(response1.headers.get("X-Cache")).toBe("MISS");
    expect(response1.headers.get("Cache-Control")).toContain("s-maxage=600");
    expect(mockFetch).toHaveBeenCalled();
    const callsAfterFirst = mockFetch.mock.calls.length;

    const response2 = await GET(request);
    expect(response2.status).toBe(200);
    const payload2 = await response2.json();
    expect(payload2).toEqual(payload1);
    expect(response2.headers.get("X-Cache")).toBe("HIT");
    expect(mockFetch.mock.calls.length).toBe(callsAfterFirst);
  });

  it("returns 400 for invalid params", async () => {
    const request = {
      nextUrl: new URL("https://app.local/api/pepe/resolve"),
    } as any;

    const response = await GET(request);
    expect(response.status).toBe(400);
    expect(global.fetch).toBe(originalFetch);
  });
});
