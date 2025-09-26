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

const mockFetchPublicUrl = jest.fn();
const mockFetchPublicJson = jest.fn();

jest.mock("@/lib/security/urlGuard", () => {
  const actual = jest.requireActual("@/lib/security/urlGuard");
  return {
    ...actual,
    fetchPublicUrl: mockFetchPublicUrl,
    fetchPublicJson: mockFetchPublicJson,
  };
});

type GetHandler = typeof import("@/app/api/pepe/resolve/route").GET;
let GET: GetHandler;

beforeAll(async () => {
  ({ GET } = await import("@/app/api/pepe/resolve/route"));
});

describe("/api/pepe/resolve", () => {
  beforeEach(() => {
    nextResponseJson.mockClear();
    mockFetchPublicUrl.mockReset();
    mockFetchPublicJson.mockReset();
  });

  const createTextResponse = (body: string, status = 200) =>
    new Response(body, {
      status,
      headers: new Headers({ "content-type": "text/html" }),
    });

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
        const wikiPath = url.replace("https://wiki.pepe.wtf/", "").replace(/\/+$/, "");
        if (wikiPath.startsWith("rare-pepes/")) {
          const slug = wikiPath.split("/").pop() ?? "";
          if (!expectedWikiSlugs.has(slug)) {
            throw new Error(`Unexpected rare pepe slug ${slug}`);
          }
          return new Response(null, { status: 404 });
        }
        if (wikiPath.startsWith("book-of-kek/")) {
          const slug = wikiPath.split("/").pop() ?? "";
          if (!expectedWikiSlugs.has(slug)) {
            throw new Error(`Unexpected book of kek slug ${slug}`);
          }
          return new Response(null, { status: 404 });
        }
        if (!wikiPath.includes("/") && expectedWikiSlugs.has(wikiPath)) {
          return new Response(null, { status: 200 });
        }
      }
      throw new Error(`Unexpected fetchPublicUrl call to ${url}`);
    });

    mockFetchPublicJson.mockImplementation(async (input: string | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url === "https://tokenscan.io/api/api/asset/GOXPEPE") {
        return { supply: "1000" };
      }
      if (url === "https://tokenscan.io/api/api/holders/GOXPEPE") {
        return { data: [{}, {}] };
      }
      if (url === "https://tokenscan.io/api/api/dispensers/GOXPEPE?status=open") {
        return { data: [{ satoshi_price: 2500 }, { satoshirate: 4000 }] };
      }
      if (url === "https://tokenscan.io/api/api/market/GOXPEPE/BTC/history") {
        return { data: [{ price_sats: 1500 }] };
      }
      if (url === "https://tokenscan.io/api/api/market/GOXPEPE/XCP/history") {
        return { data: [{ price: 1.5 }] };
      }
      if (url.startsWith("https://api.coingecko.com/")) {
        return { bitcoin: { eth: 15 }, counterparty: { eth: 0.002 } };
      }
      throw new Error(`Unexpected fetchPublicJson call to ${url}`);
    });

    const request = {
      nextUrl: new URL("https://app.local/api/pepe/resolve?kind=asset&slug=GOXPEPE"),
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
    expect(Number.isNaN(Date.parse(payload1.market?.updatedISO ?? ""))).toBe(false);

    expect(response1.headers.get("X-Cache")).toBe("MISS");
    expect(response1.headers.get("Cache-Control")).toContain("s-maxage=600");
    expect(mockFetchPublicUrl).toHaveBeenCalled();
    expect(mockFetchPublicJson).toHaveBeenCalled();
    const wikiCallResults = mockFetchPublicUrl.mock.calls
      .map(([input], index) => {
        const url = typeof input === "string" ? input : input.toString();
        return {
          url,
          result: mockFetchPublicUrl.mock.results[index],
        };
      })
      .filter(({ url }) => url.startsWith("https://wiki.pepe.wtf/"));

    expect(wikiCallResults.length).toBeGreaterThan(0);

    const successfulWikiProbe = wikiCallResults.find(
      ({ result }) => result.type === "return" && Boolean(result.value?.ok)
    );
    if (successfulWikiProbe) {
      expect(payload1.links?.wiki).toBe(successfulWikiProbe.url);
      const wikiSlug = successfulWikiProbe.url.replace("https://wiki.pepe.wtf/", "").replace(/\/+$/, "");
      expect(expectedWikiSlugs.has(wikiSlug)).toBe(true);
    } else {
      expect(payload1.links?.wiki).toBeUndefined();
    }

    expect(
      wikiCallResults.some(({ url }) => {
        if (!url.includes("/rare-pepes/")) {
          return false;
        }
        const slug = url.split("/").pop() ?? "";
        return expectedWikiSlugs.has(slug);
      })
    ).toBe(true);
    const urlCallsAfterFirst = mockFetchPublicUrl.mock.calls.length;
    const jsonCallsAfterFirst = mockFetchPublicJson.mock.calls.length;

    const response2 = await GET(request);
    expect(response2.status).toBe(200);
    const payload2 = await response2.json();
    expect(payload2).toEqual(payload1);
    expect(response2.headers.get("X-Cache")).toBe("HIT");
    expect(mockFetchPublicUrl.mock.calls.length).toBe(urlCallsAfterFirst);
    expect(mockFetchPublicJson.mock.calls.length).toBe(jsonCallsAfterFirst);
  });

  it("returns 400 for invalid params", async () => {
    const request = {
      nextUrl: new URL("https://app.local/api/pepe/resolve"),
    } as any;

    const response = await GET(request);
    expect(response.status).toBe(400);
    expect(mockFetchPublicUrl).not.toHaveBeenCalled();
    expect(mockFetchPublicJson).not.toHaveBeenCalled();
  });
});
