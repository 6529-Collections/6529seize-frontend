import { createFirstParty6529Plan } from "@/app/api/open-graph/6529/service";
import { MEMES_CONTRACT } from "@/constants/constants";
import { publicEnv } from "@/config/env";

const originalFetch = global.fetch;
const mockFetch = jest.fn();

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

describe("createFirstParty6529Plan", () => {
  const originalApiEndpoint = publicEnv.API_ENDPOINT;
  const originalBaseEndpoint = publicEnv.BASE_ENDPOINT;
  const originalStagingApiKey = publicEnv.STAGING_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
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
        return jsonResponse({}, 404);
      }

      return jsonResponse({}, 404);
    });

    const plan = createFirstParty6529Plan(
      new URL("https://6529.io/the-memes/509"),
      { apiAuth: "secret" }
    );

    expect(plan).not.toBeNull();
    expect(plan?.cacheKey).toBe("6529:auth:the-memes:/the-memes/509");

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

  it("builds NextGen previews with rarity and the three rarest traits", async () => {
    mockFetch.mockImplementation(async (input: RequestInfo | URL) => {
      const url = readFetchUrl(input);

      if (url.pathname === "/api/nextgen/tokens/10000000514") {
        return jsonResponse({
          id: 10000000514,
          pending: false,
          name: "Pebbles #514",
          collection_id: 1,
          collection_name: "Pebbles",
          mint_date: "2024-04-11T12:00:00.000Z",
          rarity_score_rank: 86,
          thumbnail_url: "https://cdn.6529.io/nextgen/514.png",
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

      return jsonResponse({}, 404);
    });

    const plan = createFirstParty6529Plan(
      new URL("https://6529.io/nextgen/token/10000000514")
    );

    expect(plan).not.toBeNull();

    const { data } = await plan!.execute();

    expect(data).toMatchObject({
      type: "6529.collection",
      kind: "nextgen-token",
      title: "Pebbles #514",
      kicker: "NextGen \u00b7 Pebbles",
      people: [{ label: "by", name: "Zeblocks", href: "/zeblocks" }],
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
  });
});
