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

const originalFetch = globalThis.fetch;

type GetHandler = typeof import("@/app/api/pepe/resolve/route").GET;
let GET: GetHandler;

beforeAll(async () => {
  ({ GET } = await import("@/app/api/pepe/resolve/route"));
});

describe("/api/pepe/resolve", () => {
  beforeEach(() => {
    nextResponseJson.mockClear();
    globalThis.fetch = originalFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const createTextResponse = (body: string, status = 200) => ({
    status,
    ok: status >= 200 && status < 300,
    text: async () => body,
    json: async () => JSON.parse(body),
  });

  const createJsonResponse = (value: unknown, status = 200) => ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => value,
    text: async () => JSON.stringify(value),
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

    const mockFetch = jest.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === "string" ? input : input.toString();
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
          return createJsonResponse({
            data: [{ satoshi_price: 2500 }, { satoshirate: 4000 }],
          });
        }
        if (
          url.startsWith("https://tokenscan.io/api/api/market") &&
          url.includes("BTC")
        ) {
          return createJsonResponse({ data: [{ price_sats: 1500 }] });
        }
        if (
          url.startsWith("https://tokenscan.io/api/api/market") &&
          url.includes("XCP")
        ) {
          return createJsonResponse({ data: [{ price: 1.5 }] });
        }

        try {
          const parsedUrl = new URL(url);
          if (parsedUrl.hostname === "api.coingecko.com") {
            return createJsonResponse({
              bitcoin: { eth: 15 },
              counterparty: { eth: 0.002 },
            });
          }
        } catch {}
        if (url === "https://wiki.pepe.wtf/rare-pepes/mtgox-pepe") {
          return { status: 404, ok: false } as Response;
        }
        if (url === "https://wiki.pepe.wtf/mtgox-pepe") {
          return { status: 200, ok: true } as Response;
        }
        throw new Error(`Unexpected fetch to ${url}`);
      }
    );

    globalThis.fetch = mockFetch as unknown as typeof fetch;

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
      links: { wiki: "https://wiki.pepe.wtf/mtgox-pepe" },
      market: expect.objectContaining({
        bestAskSats: 2500,
        lastSaleSats: 1500,
      }),
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
    expect(globalThis.fetch).toBe(originalFetch);
  });
});
