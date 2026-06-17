import { createFirstParty6529Plan } from "@/app/api/open-graph/6529/service";
import { MEMELAB_CONTRACT, MEMES_CONTRACT } from "@/constants/constants";
import { publicEnv } from "@/config/env";

jest.mock("viem", () => {
  const readContract = jest.fn();

  return {
    createPublicClient: jest.fn(() => ({ readContract })),
    fallback: jest.fn((transports) => transports),
    http: jest.fn((url?: string) => ({ url })),
    __mockReadContract: readContract,
  };
});

const originalFetch = global.fetch;
const mockFetch = jest.fn();
const mockManifoldReadContract = (
  jest.requireMock("viem") as { __mockReadContract: jest.Mock }
).__mockReadContract;

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function readFetchUrl(input: RequestInfo | URL): URL {
  if (typeof input === "string") {
    return new URL(input);
  }

  if (input instanceof URL) {
    return input;
  }

  if (typeof Request !== "undefined" && input instanceof Request) {
    return new URL(input.url);
  }

  const requestUrl = (input as { readonly url?: unknown }).url;
  if (typeof requestUrl === "string") {
    return new URL(requestUrl);
  }

  return new URL(String(input));
}

function readFetchHeaders(init: RequestInit | undefined): Record<string, string> {
  return Object.fromEntries(new Headers(init?.headers).entries());
}

function mockFreshTheMemesLiveCountApis(): void {
  mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
    const url = readFetchUrl(input);

    if (url.pathname === "/api/nfts") {
      return jsonResponse({
        data: [
          {
            id: 509,
            name: "The Collective Synapse",
            supply: 173,
            artist: "elnaz555",
            artist_seize_handle: "elnaz555",
            hodl_rate: 22.7803,
            mint_date: "2026-06-15T09:23:23.000Z",
            thumbnail: "https://cdn.6529.io/memes/509.png",
            metadata: {
              attributes: [{ trait_type: "Type - Season", value: 15 }],
            },
          },
        ],
      });
    }

    if (url.pathname === "/api/memes_extended_data") {
      return jsonResponse({
        data: [{ id: 509, edition_size: 173, season: 15 }],
      });
    }

    if (
      url.pathname === `/api/minting-claims/${MEMES_CONTRACT}/claims/509`
    ) {
      return jsonResponse({ message: "Unauthorized" }, 401);
    }

    if (url.pathname === "/api/memes-mint-stats/509") {
      return jsonResponse({
        mint_date: "2026-06-15T09:23:23.000Z",
        total_count: 94,
      });
    }

    return jsonResponse({}, 404);
  });
}

function productionTheMemesResponse(url: URL): Response | null {
  if (url.pathname === "/api/nfts") {
    return jsonResponse({
      data: [
        {
          id: 509,
          name: "The Collective Synapse",
          supply: 173,
          artist: "elnaz555",
          artist_seize_handle: "elnaz555",
          hodl_rate: 22.7803,
          mint_date: "2026-06-15T09:23:23.000Z",
          thumbnail: "https://cdn.6529.io/memes/509.png",
          metadata: {
            attributes: [{ trait_type: "Type - Season", value: 15 }],
          },
        },
      ],
    });
  }

  if (url.pathname === "/api/memes_extended_data") {
    return jsonResponse({
      data: [{ id: 509, edition_size: 173, season: 15 }],
    });
  }

  if (url.pathname === `/api/minting-claims/${MEMES_CONTRACT}/claims/509`) {
    return jsonResponse({
      name: "The Collective Synapse",
      edition_size: 328,
    });
  }

  if (url.pathname === "/api/memes-mint-stats/509") {
    return jsonResponse({
      mint_date: "2026-06-15T09:23:23.000Z",
      total_count: 94,
    });
  }

  return null;
}

describe("createFirstParty6529Plan", () => {
  const originalApiEndpoint = publicEnv.API_ENDPOINT;
  const originalBaseEndpoint = publicEnv.BASE_ENDPOINT;
  const originalStagingApiKey = publicEnv.STAGING_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    mockManifoldReadContract.mockReset();
    mockManifoldReadContract.mockResolvedValue(undefined);
    global.fetch = mockFetch as unknown as typeof fetch;
    publicEnv.API_ENDPOINT = "https://api.test";
    publicEnv.BASE_ENDPOINT = "https://6529.io";
    publicEnv.STAGING_API_KEY = undefined;
  });

  afterEach(() => {
    publicEnv.API_ENDPOINT = originalApiEndpoint;
    publicEnv.BASE_ENDPOINT = originalBaseEndpoint;
    publicEnv.STAGING_API_KEY = originalStagingApiKey;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("builds The Memes previews from richer internal API data", async () => {
    let claimAuthHeader: string | null = null;

    mockFetch.mockImplementation(async (input: RequestInfo | URL, init) => {
      const url = readFetchUrl(input);
      const headers = new Headers(init?.headers);

      if (url.pathname === "/api/nfts") {
        return jsonResponse({
          data: [
            {
              id: 509,
              name: "The Collective Synapse",
              supply: 158,
              artist: "Elnaz555",
              artist_seize_handle: "elnaz555",
              hodl_rate: 25.1019,
              mint_date: "2026-06-01T00:00:00.000Z",
              thumbnail: "https://cdn.6529.io/memes/509.png",
              metadata: {
                attributes: [{ trait_type: "Type - Season", value: 15 }],
              },
            },
          ],
        });
      }

      if (url.pathname === "/api/memes_extended_data") {
        return jsonResponse({
          data: [{ id: 509, edition_size: 158, season: 15 }],
        });
      }

      if (
        url.pathname ===
        `/api/minting-claims/${MEMES_CONTRACT}/claims/509`
      ) {
        claimAuthHeader = headers.get("x-6529-auth");
        return jsonResponse({
          name: "The Collective Synapse",
          edition_size: 328,
          image_url: "https://cdn.6529.io/memes/509-claim.png",
        });
      }

      if (url.pathname === "/api/memes-mint-stats/509") {
        return jsonResponse({
          mint_date: new Date().toISOString(),
          total_count: 94,
        });
      }

      return jsonResponse({}, 404);
    });

    const plan = createFirstParty6529Plan(
      new URL("https://6529.io/the-memes/509"),
      { apiAuth: "secret" }
    );

    expect(plan).not.toBeNull();
    expect(plan?.cacheKey).toMatch(
      /^6529:auth:[a-f0-9]{24}:the-memes:\/the-memes\/509$/
    );

    const { data } = await plan!.execute();

    expect(claimAuthHeader).toBe("secret");
    const fetchUrls = mockFetch.mock.calls.map((call) =>
      readFetchUrl(call[0]).toString()
    );
    expect(fetchUrls).toEqual(
      expect.arrayContaining([
        `https://api.test/api/nfts?contract=${MEMES_CONTRACT}&id=509`,
        "https://api.test/api/memes_extended_data?id=509",
        `https://api.test/api/minting-claims/${MEMES_CONTRACT}/claims/509`,
        "https://api.test/api/memes-mint-stats/509",
      ])
    );
    expect(data).toMatchObject({
      type: "6529.collection",
      kind: "the-memes",
      title: "The Collective Synapse",
      kicker: "The Memes #509",
      people: [{ label: "by", name: "elnaz555", href: "/elnaz555" }],
      image: {
        url: "https://cdn.6529.io/memes/509.png",
        secureUrl: "https://cdn.6529.io/memes/509.png",
      },
    });
    expect(data.facts).toEqual([
      { label: "Edition size", value: "328" },
      { label: "TDH rate", value: "25.1" },
      { label: "Season", value: "15" },
      { label: "Mint date", value: "1 Jun 2026" },
    ]);
  });

  it("uses The Memes claim edition size when the server can fetch claims", async () => {
    let claimAuthHeader: string | null = null;

    mockFetch.mockImplementation(async (input: RequestInfo | URL, init) => {
      const url = readFetchUrl(input);
      const headers = new Headers(init?.headers);

      if (url.pathname === "/api/nfts") {
        return jsonResponse({
          data: [
            {
              id: 509,
              name: "The Collective Synapse",
              supply: 173,
              artist: "elnaz555",
              artist_seize_handle: "elnaz555",
              hodl_rate: 22.7803,
              mint_date: "2026-06-15T09:23:23.000Z",
              thumbnail: "https://cdn.6529.io/memes/509.png",
              metadata: {
                attributes: [{ trait_type: "Type - Season", value: 15 }],
              },
            },
          ],
        });
      }

      if (url.pathname === "/api/memes_extended_data") {
        return jsonResponse({
          data: [{ id: 509, edition_size: 173, season: 15 }],
        });
      }

      if (
        url.pathname ===
        `/api/minting-claims/${MEMES_CONTRACT}/claims/509`
      ) {
        claimAuthHeader = headers.get("x-6529-auth");
        return jsonResponse({
          name: "The Collective Synapse",
          edition_size: 328,
        });
      }

      if (url.pathname === "/api/memes-mint-stats/509") {
        return jsonResponse({
          mint_date: "2026-06-15T09:23:23.000Z",
          total_count: 94,
        });
      }

      return jsonResponse({}, 404);
    });

    const plan = createFirstParty6529Plan(
      new URL("https://6529.io/the-memes/509")
    );
    const { data } = await plan!.execute();

    expect(claimAuthHeader).toBeNull();
    expect(mockManifoldReadContract).not.toHaveBeenCalled();
    expect(data.facts).toEqual([
      { label: "Edition size", value: "328" },
      { label: "TDH rate", value: "22.78" },
      { label: "Season", value: "15" },
      { label: "Mint date", value: "15 Jun 2026" },
    ]);
  });

  it("uses The Memes Manifold totalMax when public APIs only expose live mint counts", async () => {
    mockManifoldReadContract.mockResolvedValue([
      509n,
      {
        total: 173,
        totalMax: 328,
      },
    ]);
    mockFreshTheMemesLiveCountApis();

    const plan = createFirstParty6529Plan(
      new URL("https://6529.io/the-memes/509")
    );
    const { data } = await plan!.execute();

    expect(mockManifoldReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "getClaimForToken",
        args: [MEMES_CONTRACT, 509n],
      })
    );
    expect(data.facts).toEqual([
      { label: "Edition size", value: "328" },
      { label: "TDH rate", value: "22.78" },
      { label: "Season", value: "15" },
      { label: "Mint date", value: "15 Jun 2026" },
    ]);
  });

  it("falls back to the production public API when the configured staging API fails", async () => {
    publicEnv.API_ENDPOINT = "https://api.staging.6529.io";
    publicEnv.STAGING_API_KEY = "staging-secret";
    const productionFallbackAuthHeaders: Array<string | null> = [];

    mockFetch.mockImplementation(async (input: RequestInfo | URL, init) => {
      const url = readFetchUrl(input);
      const headers = new Headers(init?.headers);

      if (url.hostname === "api.staging.6529.io") {
        return jsonResponse({ message: "staging unavailable" }, 503);
      }

      if (url.hostname === "api.6529.io") {
        productionFallbackAuthHeaders.push(headers.get("x-6529-auth"));
        const response = productionTheMemesResponse(url);
        if (response) {
          return response;
        }
      }

      return jsonResponse({}, 404);
    });

    const plan = createFirstParty6529Plan(
      new URL("https://6529.io/the-memes/509")
    );
    const { data } = await plan!.execute();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("https://api.staging.6529.io/api/nfts"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-6529-auth": "staging-secret",
        }),
      })
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("https://api.6529.io/api/nfts"),
      expect.objectContaining({
        headers: { accept: "application/json" },
      })
    );
    expect(productionFallbackAuthHeaders).toEqual([null, null, null, null]);
    expect(data).toMatchObject({
      type: "6529.collection",
      kind: "the-memes",
      title: "The Collective Synapse",
      kicker: "The Memes #509",
    });
    expect(data.facts).toEqual([
      { label: "Edition size", value: "328" },
      { label: "TDH rate", value: "22.78" },
      { label: "Season", value: "15" },
      { label: "Mint date", value: "15 Jun 2026" },
    ]);
  });

  it("falls back to the production public API after a primary network error", async () => {
    publicEnv.API_ENDPOINT = "https://api.staging.6529.io";

    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = readFetchUrl(input);

      if (url.hostname === "api.staging.6529.io") {
        throw new Error("primary timeout");
      }

      if (url.hostname === "api.6529.io") {
        const response = productionTheMemesResponse(url);
        if (response) {
          return response;
        }
      }

      return jsonResponse({}, 404);
    });

    const plan = createFirstParty6529Plan(
      new URL("https://6529.io/the-memes/509")
    );
    const { data } = await plan!.execute();

    expect(data.facts).toEqual([
      { label: "Edition size", value: "328" },
      { label: "TDH rate", value: "22.78" },
      { label: "Season", value: "15" },
      { label: "Mint date", value: "15 Jun 2026" },
    ]);
  });

  it("falls back to the production public API for anonymous staging auth gates", async () => {
    publicEnv.API_ENDPOINT = "https://api.staging.6529.io";

    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = readFetchUrl(input);

      if (url.hostname === "api.staging.6529.io") {
        return jsonResponse({ message: "Unauthorized" }, 401);
      }

      if (url.hostname === "api.6529.io") {
        const response = productionTheMemesResponse(url);
        if (response) {
          return response;
        }
      }

      return jsonResponse({}, 404);
    });

    const plan = createFirstParty6529Plan(
      new URL("https://6529.io/the-memes/509")
    );
    const { data } = await plan!.execute();

    expect(data.title).toBe("The Collective Synapse");
    expect(data.facts).toEqual([
      { label: "Edition size", value: "328" },
      { label: "TDH rate", value: "22.78" },
      { label: "Season", value: "15" },
      { label: "Mint date", value: "15 Jun 2026" },
    ]);
    expect(
      mockFetch.mock.calls.some(
        (call) =>
          readFetchUrl(call[0]).hostname === "api.6529.io" &&
          readFetchHeaders(call[1])["x-6529-auth"] !== undefined
      )
    ).toBe(false);
  });

  it("does not retry production fallback for authenticated primary auth failures", async () => {
    publicEnv.API_ENDPOINT = "https://api.staging.6529.io";

    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = readFetchUrl(input);

      if (url.hostname === "api.6529.io") {
        throw new Error("production fallback should not be called");
      }

      return jsonResponse({ message: "Unauthorized" }, 401);
    });

    const plan = createFirstParty6529Plan(
      new URL("https://6529.io/the-memes/509"),
      { apiAuth: "bad-staging-auth" }
    );

    await expect(plan!.execute()).rejects.toThrow("The Memes card was not found.");
    expect(
      mockFetch.mock.calls.some(
        (call) => readFetchUrl(call[0]).hostname === "api.6529.io"
      )
    ).toBe(false);
  });

  it("does not add a production fallback when the configured API is production", async () => {
    publicEnv.API_ENDPOINT = "https://API.6529.io/";

    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = readFetchUrl(input);
      const response = productionTheMemesResponse(url);
      return response ?? jsonResponse({}, 404);
    });

    const plan = createFirstParty6529Plan(
      new URL("https://6529.io/the-memes/509")
    );
    await plan!.execute();

    const fetchHosts = mockFetch.mock.calls.map((call) =>
      readFetchUrl(call[0]).host
    );
    expect(fetchHosts).toEqual([
      "api.6529.io",
      "api.6529.io",
      "api.6529.io",
      "api.6529.io",
    ]);
  });

  it("tries the production fallback for primary server errors", async () => {
    publicEnv.API_ENDPOINT = "https://api.staging.6529.io";

    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = readFetchUrl(input);
      return jsonResponse({}, url.hostname === "api.staging.6529.io" ? 503 : 404);
    });

    const plan = createFirstParty6529Plan(
      new URL("https://6529.io/the-memes/509")
    );

    await expect(plan!.execute()).rejects.toThrow("The Memes card was not found.");
    expect(
      mockFetch.mock.calls.some(
        (call) => readFetchUrl(call[0]).hostname === "api.6529.io"
      )
    ).toBe(true);
  });

  it("does not label live The Memes counts when Manifold fallback fails", async () => {
    mockManifoldReadContract.mockRejectedValue(new Error("RPC unavailable"));
    mockFreshTheMemesLiveCountApis();

    const plan = createFirstParty6529Plan(
      new URL("https://6529.io/the-memes/509")
    );
    const { data } = await plan!.execute();

    expect(mockManifoldReadContract).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "getClaimForToken",
        args: [MEMES_CONTRACT, 509n],
      })
    );
    expect(data.facts).toEqual([
      { label: "TDH rate", value: "22.78" },
      { label: "Season", value: "15" },
      { label: "Mint date", value: "15 Jun 2026" },
    ]);
  });

  it("ignores malformed Manifold edition-size responses", async () => {
    mockManifoldReadContract.mockResolvedValue({ claim: { totalMax: "soon" } });
    mockFreshTheMemesLiveCountApis();

    const plan = createFirstParty6529Plan(
      new URL("https://6529.io/the-memes/509")
    );
    const { data } = await plan!.execute();

    expect(data.facts).toEqual([
      { label: "TDH rate", value: "22.78" },
      { label: "Season", value: "15" },
      { label: "Mint date", value: "15 Jun 2026" },
    ]);
  });

  it("ignores non-decimal The Memes path ids", () => {
    const plan = createFirstParty6529Plan(
      new URL("https://6529.io/the-memes/0x1fd")
    );

    expect(plan).toBeNull();
    expect(mockManifoldReadContract).not.toHaveBeenCalled();
  });

  it("isolates authenticated collection preview cache keys by auth token", () => {
    const url = new URL("https://6529.io/the-memes/509");
    const publicPlan = createFirstParty6529Plan(url);
    const firstAuthPlan = createFirstParty6529Plan(url, { apiAuth: "alpha" });
    const secondAuthPlan = createFirstParty6529Plan(url, { apiAuth: "beta" });

    publicEnv.STAGING_API_KEY = "staging-secret";
    const stagingPlan = createFirstParty6529Plan(url);

    expect(publicPlan?.cacheKey).toBe("6529:public:the-memes:/the-memes/509");
    expect(firstAuthPlan?.cacheKey).toMatch(
      /^6529:auth:[a-f0-9]{24}:the-memes:\/the-memes\/509$/
    );
    expect(secondAuthPlan?.cacheKey).toMatch(
      /^6529:auth:[a-f0-9]{24}:the-memes:\/the-memes\/509$/
    );
    expect(firstAuthPlan?.cacheKey).not.toBe(secondAuthPlan?.cacheKey);
    expect(stagingPlan?.cacheKey).toBe("6529:staging:the-memes:/the-memes/509");
  });

  it("does not label fresh public supply as The Memes edition size", async () => {
    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = readFetchUrl(input);

      if (url.pathname === "/api/nfts") {
        return jsonResponse({
          data: [
            {
              id: 509,
              name: "The Collective Synapse",
              supply: 173,
              artist: "elnaz555",
              artist_seize_handle: "elnaz555",
              hodl_rate: 22.7803,
              mint_date: new Date().toISOString(),
              thumbnail: "https://cdn.6529.io/memes/509.png",
              metadata: {
                attributes: [{ trait_type: "Type - Season", value: 15 }],
              },
            },
          ],
        });
      }

      if (url.pathname === "/api/memes_extended_data") {
        return jsonResponse({
          data: [{ id: 509, edition_size: 173, season: 15 }],
        });
      }

      if (
        url.pathname ===
        `/api/minting-claims/${MEMES_CONTRACT}/claims/509`
      ) {
        return jsonResponse("Unauthorized", 401);
      }

      if (url.pathname === "/api/memes-mint-stats/509") {
        return jsonResponse({}, 404);
      }

      return jsonResponse({}, 404);
    });

    const plan = createFirstParty6529Plan(
      new URL("https://6529.io/the-memes/509")
    );
    const { data } = await plan!.execute();

    expect(data.facts).toEqual([
      { label: "TDH rate", value: "22.78" },
      { label: "Season", value: "15" },
      {
        label: "Mint date",
        value: new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date()),
      },
    ]);
  });

  it("only matches exact 6529 hosts and subdomains", () => {
    expect(
      createFirstParty6529Plan(new URL("https://6529.io/the-memes/509"))
    ).not.toBeNull();
    expect(
      createFirstParty6529Plan(new URL("https://staging.6529.io/the-memes/509"))
    ).not.toBeNull();
    expect(
      createFirstParty6529Plan(new URL("https://6529.io.evil.com/the-memes/509"))
    ).toBeNull();
    expect(
      createFirstParty6529Plan(new URL("https://evil6529.io/the-memes/509"))
    ).toBeNull();
  });

  it("skips unsafe image schemes and uses the next safe image candidate", async () => {
    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = readFetchUrl(input);

      if (url.pathname === "/api/nfts") {
        return jsonResponse({
          data: [
            {
              id: 509,
              name: "The Collective Synapse",
              artist_seize_handle: "elnaz555",
              hodl_rate: 25.1019,
              mint_date: "2026-06-01T00:00:00.000Z",
              thumbnail: "javascript:alert(1)",
              scaled: "https://cdn.6529.io/memes/509-safe.png",
              metadata: {
                image: "data:image/svg+xml;base64,PHN2Zy8+",
                attributes: [{ trait_type: "Type - Season", value: 15 }],
              },
            },
          ],
        });
      }

      if (url.pathname === "/api/memes_extended_data") {
        return jsonResponse({ data: [] });
      }

      if (
        url.pathname ===
        `/api/minting-claims/${MEMES_CONTRACT}/claims/509`
      ) {
        return jsonResponse({}, 404);
      }

      if (url.pathname === "/api/memes-mint-stats/509") {
        return jsonResponse({}, 404);
      }

      return jsonResponse({}, 404);
    });

    const plan = createFirstParty6529Plan(
      new URL("https://6529.io/the-memes/509")
    );
    const { data } = await plan!.execute();

    expect(data.image).toEqual({
      url: "https://cdn.6529.io/memes/509-safe.png",
      secureUrl: "https://cdn.6529.io/memes/509-safe.png",
    });
    expect(data.images).toEqual([data.image]);
  });

  it("builds Meme Lab previews with artist and edition size", async () => {
    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = readFetchUrl(input);

      if (url.pathname === "/api/nfts_memelab") {
        return jsonResponse({
          data: [
            {
              id: 71,
              name: "The Outsiders Companion",
              artist: "Artist 6529",
              artist_seize_handle: "artist6529",
              mint_date: "2025-03-02T00:00:00.000Z",
              thumbnail: "https://cdn.6529.io/memelab/71.png",
            },
          ],
        });
      }

      if (url.pathname === "/api/lab_extended_data") {
        return jsonResponse({
          data: [{ id: 71, edition_size: 420 }],
        });
      }

      return jsonResponse({}, 404);
    });

    const plan = createFirstParty6529Plan(
      new URL("https://6529.io/meme-lab/71")
    );
    const { data } = await plan!.execute();

    const fetchUrls = mockFetch.mock.calls.map((call) =>
      readFetchUrl(call[0]).toString()
    );
    expect(fetchUrls).toEqual(
      expect.arrayContaining([
        `https://api.test/api/nfts_memelab?contract=${MEMELAB_CONTRACT}&id=71`,
        "https://api.test/api/lab_extended_data?id=71",
      ])
    );
    expect(data).toMatchObject({
      type: "6529.collection",
      kind: "meme-lab",
      title: "The Outsiders Companion",
      kicker: "Meme Lab #71",
      people: [{ label: "by", name: "artist6529", href: "/artist6529" }],
    });
    expect(data.facts).toEqual([
      { label: "Edition size", value: "420" },
      { label: "Mint date", value: "2 Mar 2025" },
    ]);
  });

  it("builds Gradient previews with artist, collector, TDH, and mint date", async () => {
    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = readFetchUrl(input);

      if (url.pathname === "/api/nfts/gradients") {
        return jsonResponse({
          data: [
            {
              id: 92,
              name: "6529 Gradient #92",
              artist: "6529er",
              artist_seize_handle: "6529er",
              owner: "0x000000000000000000000000000000000000dEaD",
              owner_display: "punk6529",
              hodl_rate: 13.456,
              mint_date: "2022-09-10T00:00:00.000Z",
              thumbnail: "https://cdn.6529.io/gradients/92.png",
            },
          ],
        });
      }

      if (url.pathname === "/api/identities/punk6529") {
        return jsonResponse({ handle: "punk6529" });
      }

      return jsonResponse({}, 404);
    });

    const plan = createFirstParty6529Plan(
      new URL("https://6529.io/6529-gradient/92")
    );
    const { data } = await plan!.execute();

    expect(data).toMatchObject({
      type: "6529.collection",
      kind: "6529-gradient",
      title: "6529 Gradient #92",
      people: [
        { label: "Artist", name: "6529er", href: "/6529er" },
        { label: "Collector", name: "punk6529", href: "/punk6529" },
      ],
    });
    expect(data.kicker).toBeNull();
    expect(data.facts).toEqual([
      { label: "TDH rate", value: "13.46" },
      { label: "Mint date", value: "10 Sept 2022" },
    ]);
  });

  it("builds ReMemes previews with creator, references, edition size, and replicas", async () => {
    const contract = "0x1234567890abcdef1234567890abcdef12345678";

    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = readFetchUrl(input);

      if (url.pathname === "/api/rememes") {
        return jsonResponse({
          data: [
            {
              contract,
              id: 1,
              added_by: "fallback6529",
              s3_image_thumbnail: "https://cdn.6529.io/rememes/1.png",
              meme_references: [509],
              replicas: [{ id: 1 }, { id: 2 }],
              metadata: {
                name: "Touch the OM",
                attributes: [
                  { trait_type: "SEIZE Artist Profile", value: "artist6529" },
                  { trait_type: "Edition Size", value: 88 },
                ],
              },
            },
          ],
        });
      }

      if (url.pathname === "/api/identities/artist6529") {
        return jsonResponse({ handle: "artist6529" });
      }

      return jsonResponse({}, 404);
    });

    const plan = createFirstParty6529Plan(
      new URL(`https://6529.io/rememes/${contract}/1`)
    );
    const { data } = await plan!.execute();

    expect(data).toMatchObject({
      type: "6529.collection",
      kind: "rememes",
      title: "Touch the OM",
      kicker: "ReMemes",
      people: [{ label: "by", name: "artist6529", href: "/artist6529" }],
    });
    expect(data.facts).toEqual([
      { label: "References", value: "The Memes #509" },
      { label: "Edition size", value: "88" },
      { label: "Replicas", value: "2" },
    ]);
  });

  it("builds NextGen previews with rarity and the three rarest traits", async () => {
    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = readFetchUrl(input);

      if (url.pathname === "/api/nextgen/tokens/514") {
        return jsonResponse({}, 404);
      }

      if (url.pathname === "/api/nextgen/collections") {
        return jsonResponse({
          data: [
            {
              id: 1,
              name: "Pebbles",
              artist: "Zeblocks",
              total_supply: 1000,
            },
          ],
        });
      }

      if (url.pathname === "/api/nextgen/tokens/10000000514") {
        return jsonResponse({
          id: 10000000514,
          normalised_id: 514,
          pending: false,
          name: "Pebbles #514",
          collection_id: 1,
          collection_name: "Pebbles",
          mint_date: "2024-04-11T12:00:00.000Z",
          rarity_score_rank: 86,
          thumbnail_url: "https://cdn.6529.io/nextgen/514.png",
          owner: "0x06e13bd0a3cba08e61028f2326b9ea2ca2539900",
        });
      }

      if (url.pathname === "/api/nextgen/tokens/10000000514/traits") {
        return jsonResponse([
          {
            trait: "Collection Name",
            value: "Pebbles",
            token_count: 1000,
            trait_count: 1000,
            value_count: 1000,
          },
          {
            trait: "Flow",
            value: "Long",
            token_count: 1000,
            trait_count: 900,
            value_count: 935,
          },
          {
            trait: "Color Density",
            value: "Sparse",
            token_count: 1000,
            trait_count: 200,
            value_count: 143,
          },
          {
            trait: "Mint Type",
            value: "Public",
            token_count: 1000,
            trait_count: 100,
            value_count: 50,
          },
          {
            trait: "Palette",
            value: "Blueprint",
            token_count: 1000,
            trait_count: 40,
            value_count: 21,
          },
        ]);
      }

      if (url.pathname === "/api/nextgen/collections/1") {
        return jsonResponse({
          id: 1,
          name: "Pebbles",
          artist: "Zeblocks",
          total_supply: 1000,
        });
      }

      if (url.pathname === "/api/identities/zeblocks") {
        return jsonResponse({ handle: "zeblocks" });
      }

      if (
        url.pathname ===
        "/api/identities/0x06e13bd0a3cba08e61028f2326b9ea2ca2539900"
      ) {
        return jsonResponse({
          handle: "perilousvault",
          display: "perilousvault.eth",
        });
      }

      return jsonResponse({}, 404);
    });

    const plan = createFirstParty6529Plan(
      new URL("https://6529.io/nextgen/token/514")
    );

    expect(plan).not.toBeNull();

    const { data } = await plan!.execute();

    expect(data).toMatchObject({
      type: "6529.collection",
      kind: "nextgen-token",
      title: "Pebbles #514",
      kicker: "NextGen \u00b7 Pebbles",
      requestUrl: "https://6529.io/nextgen/token/10000000514",
      url: "https://6529.io/nextgen/token/10000000514",
      people: [
        { label: "by", name: "Zeblocks", href: "/zeblocks" },
        {
          label: "Collector",
          name: "perilousvault.eth",
          href: "/perilousvault",
        },
      ],
    });
    expect(data.facts).toEqual([
      { label: "Rarity", value: "#86 / 1,000" },
      { label: "Mint date", value: "11 Apr 2024" },
    ]);
    expect(data.traits).toEqual([
      { label: "Palette", value: "Blueprint" },
      { label: "Mint Type", value: "Public" },
      { label: "Color Density", value: "Sparse" },
    ]);
    expect(
      mockFetch.mock.calls.map((call) => readFetchUrl(call[0]).toString())
    ).toEqual(
      expect.arrayContaining([
        "https://api.test/api/nextgen/tokens/514",
        "https://api.test/api/nextgen/collections?page_size=5",
        "https://api.test/api/nextgen/tokens/10000000514",
      ])
    );
  });

  it("caps NextGen normalized-token expansion probes", async () => {
    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = readFetchUrl(input);

      if (url.pathname === "/api/nextgen/tokens/42") {
        return jsonResponse({}, 404);
      }

      if (url.pathname === "/api/nextgen/collections") {
        return jsonResponse({
          data: [
            { id: 1 },
            { id: 2 },
            { id: 3 },
            { id: 4 },
            { id: 5 },
            { id: 6 },
            { id: 7 },
          ],
        });
      }

      if (url.pathname.startsWith("/api/nextgen/tokens/")) {
        return jsonResponse({}, 404);
      }

      return jsonResponse({}, 404);
    });

    const plan = createFirstParty6529Plan(
      new URL("https://6529.io/nextgen/token/42")
    );

    await expect(plan!.execute()).rejects.toThrow("NextGen token was not found.");

    const fetchUrls = mockFetch.mock.calls.map((call) =>
      readFetchUrl(call[0]).toString()
    );
    expect(fetchUrls).toEqual(
      expect.arrayContaining([
        "https://api.test/api/nextgen/tokens/42",
        "https://api.test/api/nextgen/collections?page_size=5",
        "https://api.test/api/nextgen/tokens/10000000042",
        "https://api.test/api/nextgen/tokens/20000000042",
        "https://api.test/api/nextgen/tokens/30000000042",
        "https://api.test/api/nextgen/tokens/40000000042",
        "https://api.test/api/nextgen/tokens/50000000042",
      ])
    );
    expect(fetchUrls).not.toContain(
      "https://api.test/api/nextgen/tokens/60000000042"
    );
  });
});
