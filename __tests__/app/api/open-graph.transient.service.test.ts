import { createTransientPlan } from "@/app/api/open-graph/transient/service";
import { getAlchemyApiKey } from "@/config/alchemyEnv";

jest.mock("@/config/alchemyEnv", () => ({
  getAlchemyApiKey: jest.fn(),
}));

describe("createTransientPlan", () => {
  const fetchHtml = jest.fn();
  const assertPublicUrl = jest.fn();
  const mockedGetAlchemyApiKey = getAlchemyApiKey as jest.MockedFunction<
    typeof getAlchemyApiKey
  >;
  const originalFetch = global.fetch;
  const mockFetch = jest.fn();
  const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    fetchHtml.mockReset();
    assertPublicUrl.mockReset();
    mockFetch.mockReset();
    mockedGetAlchemyApiKey.mockReset();
    assertPublicUrl.mockResolvedValue(undefined);
    mockedGetAlchemyApiKey.mockReturnValue("test-alchemy-key");
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
    warnSpy.mockRestore();
  });

  it("creates a plan for Transient NFT URLs", () => {
    const plan = createTransientPlan(
      new URL(
        "https://www.transient.xyz/nfts/ethereum/0xda48f4db41415fc2873efb487eec1068626fad60/7"
      ),
      { fetchHtml, assertPublicUrl }
    );

    expect(plan).not.toBeNull();
    expect(plan?.cacheKey).toContain("transient:nft:v1:");
  });

  it("returns null for unsupported Transient URLs", () => {
    expect(
      createTransientPlan(new URL("https://www.transient.xyz/about"), {
        fetchHtml,
        assertPublicUrl,
      })
    ).toBeNull();
    expect(
      createTransientPlan(
        new URL(
          "https://fake-transient.xyz/nfts/ethereum/0xda48f4db41415fc2873efb487eec1068626fad60/7"
        ),
        {
          fetchHtml,
          assertPublicUrl,
        }
      )
    ).toBeNull();
  });

  it("returns Alchemy-backed preview with normalized media URL", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        name: "Stitched",
        description: "Alchemy description",
        image: {
          originalUrl: "ipfs://QmExampleHash/stitched.png",
          contentType: "image/png",
        },
      }),
    });

    const url =
      "https://www.transient.xyz/nfts/ethereum/0xda48f4db41415fc2873efb487eec1068626fad60/7";

    const plan = createTransientPlan(new URL(url), {
      fetchHtml,
      assertPublicUrl,
    });
    const result = await plan?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "transient.nft",
        requestUrl: url,
        url,
        title: "Stitched",
        description: "Alchemy description",
        siteName: "Transient Labs",
        image: expect.objectContaining({
          url: "https://ipfs.io/ipfs/QmExampleHash/stitched.png",
          type: "image/png",
        }),
      })
    );
    expect(fetchHtml).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("falls back to token URI image when direct Alchemy image fields are empty", async () => {
    const contractAddress = "0xda48f4db41415fc2873efb487eec1068626fad60";
    const tokenId = "7";
    const tokenUri = `https://api.transient.xyz/metadata/${contractAddress}/0x{id}`;

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          name: "Token with token URI fallback",
          tokenUri,
          image: {
            originalUrl: null,
            cachedUrl: null,
            pngUrl: null,
            thumbnailUrl: null,
            gateway: null,
            raw: null,
            contentType: null,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          name: "Token with token URI fallback",
          image: "ipfs://QmExampleHash/token-uri-image.png",
        }),
      });

    const url = `https://www.transient.xyz/nfts/ethereum/${contractAddress}/${tokenId}`;
    const plan = createTransientPlan(new URL(url), {
      fetchHtml,
      assertPublicUrl,
    });
    const result = await plan?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "transient.nft",
        title: "Token with token URI fallback",
        image: expect.objectContaining({
          url: "https://ipfs.io/ipfs/QmExampleHash/token-uri-image.png",
        }),
      })
    );
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[1]?.[0]).toBe(
      `https://api.transient.xyz/metadata/${contractAddress}/0x0000000000000000000000000000000000000000000000000000000000000007`
    );
    expect(assertPublicUrl).toHaveBeenCalledTimes(1);
    expect(assertPublicUrl.mock.calls[0]?.[0]?.toString()).toBe(
      `https://api.transient.xyz/metadata/${contractAddress}/0x0000000000000000000000000000000000000000000000000000000000000007`
    );
    expect(fetchHtml).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("uses Transient OpenGraph image when Alchemy has no usable image", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        name: "Alchemy title",
        description: "Alchemy description",
      }),
    });
    fetchHtml.mockResolvedValue({
      html: `
        <html>
          <head>
            <meta property="og:title" content="OG title" />
            <meta property="og:description" content="OG description" />
            <meta property="og:image" content="https://cdn.transient.xyz/og/fallback.png" />
          </head>
        </html>
      `,
      contentType: "text/html; charset=utf-8",
      finalUrl:
        "https://www.transient.xyz/nfts/ethereum/0xda48f4db41415fc2873efb487eec1068626fad60/7",
    });

    const url =
      "https://www.transient.xyz/nfts/ethereum/0xda48f4db41415fc2873efb487eec1068626fad60/7";
    const plan = createTransientPlan(new URL(url), {
      fetchHtml,
      assertPublicUrl,
    });
    const result = await plan?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "transient.nft",
        title: "Alchemy title",
        description: "Alchemy description",
        image: expect.objectContaining({
          url: "https://cdn.transient.xyz/og/fallback.png",
        }),
      })
    );
    expect(fetchHtml).toHaveBeenCalledTimes(1);
    expect(assertPublicUrl).toHaveBeenCalledTimes(1);
    expect(assertPublicUrl.mock.calls[0]?.[0]?.toString()).toBe(url);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("falls back to OpenGraph preview when API key is unavailable", async () => {
    mockedGetAlchemyApiKey.mockImplementation(() => {
      throw new Error("ALCHEMY_API_KEY missing");
    });
    fetchHtml.mockResolvedValue({
      html: `
        <html>
          <head>
            <meta property="og:title" content="Transient OG title" />
            <meta property="og:image" content="https://cdn.transient.xyz/og/missing-key.png" />
          </head>
        </html>
      `,
      contentType: "text/html",
      finalUrl:
        "https://www.transient.xyz/nfts/ethereum/0xda48f4db41415fc2873efb487eec1068626fad60/8",
    });

    const url =
      "https://www.transient.xyz/nfts/ethereum/0xda48f4db41415fc2873efb487eec1068626fad60/8";
    const plan = createTransientPlan(new URL(url), {
      fetchHtml,
      assertPublicUrl,
    });
    const result = await plan?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "transient.nft",
        title: "Transient OG title",
        image: expect.objectContaining({
          url: "https://cdn.transient.xyz/og/missing-key.png",
        }),
      })
    );
    expect(mockFetch).not.toHaveBeenCalled();
    expect(fetchHtml).toHaveBeenCalledTimes(1);
    expect(assertPublicUrl).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Unable to resolve Transient media (missing_api_key)"
      ),
      expect.objectContaining({
        requestUrl: url,
        reason: "missing_api_key",
      })
    );
  });

  it("falls back to OpenGraph preview for unsupported chain segments", async () => {
    fetchHtml.mockResolvedValue({
      html: `
        <html>
          <head>
            <meta property="og:title" content="Unsupported chain fallback" />
            <meta property="og:image" content="https://cdn.transient.xyz/og/unsupported-chain.png" />
          </head>
        </html>
      `,
      contentType: "text/html",
      finalUrl:
        "https://www.transient.xyz/nfts/solana/0xda48f4db41415fc2873efb487eec1068626fad60/9",
    });

    const url =
      "https://www.transient.xyz/nfts/solana/0xda48f4db41415fc2873efb487eec1068626fad60/9";
    const plan = createTransientPlan(new URL(url), {
      fetchHtml,
      assertPublicUrl,
    });
    const result = await plan?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "transient.nft",
        title: "Unsupported chain fallback",
        image: expect.objectContaining({
          url: "https://cdn.transient.xyz/og/unsupported-chain.png",
        }),
      })
    );
    expect(mockFetch).not.toHaveBeenCalled();
    expect(fetchHtml).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Unable to resolve Transient media (unsupported_chain)"
      ),
      expect.objectContaining({
        requestUrl: url,
        reason: "unsupported_chain",
      })
    );
  });

  it("returns minimal Transient preview when Alchemy and OpenGraph fallback fail", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({}),
    });
    fetchHtml.mockRejectedValue(new Error("fetch failed"));

    const url =
      "https://www.transient.xyz/nfts/ethereum/0xda48f4db41415fc2873efb487eec1068626fad60/3";
    const plan = createTransientPlan(new URL(url), {
      fetchHtml,
      assertPublicUrl,
    });
    const result = await plan?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "transient.nft",
        title: "NFT #3",
        image: null,
        images: [],
      })
    );
    expect(fetchHtml).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Unable to resolve Transient media (alchemy_http_error)"
      ),
      expect.objectContaining({
        requestUrl: url,
        reason: "alchemy_http_error",
        status: 429,
      })
    );
  });
});
