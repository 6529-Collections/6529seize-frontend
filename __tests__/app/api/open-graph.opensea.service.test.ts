import { createOpenSeaPlan } from "@/app/api/open-graph/opensea/service";
import { getAlchemyApiKey } from "@/config/alchemyEnv";

jest.mock("@/config/alchemyEnv", () => ({
  getAlchemyApiKey: jest.fn(),
}));

describe("createOpenSeaPlan", () => {
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

  it("creates a plan for OpenSea item URLs", () => {
    const plan = createOpenSeaPlan(
      new URL(
        "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/31136811317196283853097434082447684930607990400663529852029007509349076041729"
      ),
      {
        fetchHtml,
        assertPublicUrl,
      }
    );

    expect(plan).not.toBeNull();
    expect(plan?.cacheKey).toContain("opensea:nft:");
  });

  it("creates a plan for legacy OpenSea assets URLs", () => {
    const plan = createOpenSeaPlan(
      new URL(
        "https://opensea.io/assets/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/123"
      ),
      {
        fetchHtml,
        assertPublicUrl,
      }
    );

    expect(plan).not.toBeNull();
  });

  it("returns null for non-item OpenSea URLs", () => {
    const plan = createOpenSeaPlan(
      new URL("https://opensea.io/collection/some-collection"),
      {
        fetchHtml,
        assertPublicUrl,
      }
    );

    expect(plan).toBeNull();
  });

  it("returns null for lookalike domains", () => {
    const plan = createOpenSeaPlan(
      new URL(
        "https://fake-opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/1"
      ),
      {
        fetchHtml,
        assertPublicUrl,
      }
    );

    expect(plan).toBeNull();
  });

  it("returns Alchemy-backed OpenSea preview with normalized media URL", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        name: "Radar dome",
        description: "A clear sky",
        image: {
          originalUrl: "ipfs://QmExampleHash/radar.png",
          contentType: "image/png",
        },
      }),
    });

    const url =
      "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/31136811317196283853097434082447684930607990400663529852029007509349076041729";

    const plan = createOpenSeaPlan(new URL(url), {
      fetchHtml,
      assertPublicUrl,
    });
    const result = await plan?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "opensea.nft",
        requestUrl: url,
        url,
        title: "Radar dome",
        description: "A clear sky",
        siteName: "OpenSea",
        image: expect.objectContaining({
          url: "https://ipfs.io/ipfs/QmExampleHash/radar.png",
          type: "image/png",
        }),
      })
    );
    expect(fetchHtml).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("extracts metadata from Alchemy nft envelope shape", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        nft: {
          name: "Envelope token",
          image: {
            cachedUrl: "https://i.seadn.io/s/raw/files/envelope.png",
            contentType: "image/png",
          },
        },
      }),
    });

    const url =
      "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/42";

    const plan = createOpenSeaPlan(new URL(url), {
      fetchHtml,
      assertPublicUrl,
    });
    const result = await plan?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "opensea.nft",
        title: "Envelope token",
        image: expect.objectContaining({
          url: "https://i.seadn.io/s/raw/files/envelope.png",
          type: "image/png",
        }),
      })
    );
    expect(fetchHtml).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("retries Alchemy with hex token id when decimal response has no metadata", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ nft: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          nft: {
            name: "Hex token",
            image: {
              originalUrl: "https://i.seadn.io/s/raw/files/hex-token.png",
              contentType: "image/png",
            },
          },
        }),
      });

    const url =
      "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/255";

    const plan = createOpenSeaPlan(new URL(url), {
      fetchHtml,
      assertPublicUrl,
    });
    const result = await plan?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "opensea.nft",
        title: "Hex token",
        image: expect.objectContaining({
          url: "https://i.seadn.io/s/raw/files/hex-token.png",
        }),
      })
    );
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(
      new URL(mockFetch.mock.calls[0]?.[0] as string).searchParams.get(
        "tokenId"
      )
    ).toBe("255");
    expect(
      new URL(mockFetch.mock.calls[1]?.[0] as string).searchParams.get(
        "tokenId"
      )
    ).toBe("0xff");
    expect(fetchHtml).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("fetches token URI metadata when Alchemy image fields are empty", async () => {
    const contractAddress = "0x495f947276749ce646f68ac8c248420045cb7b5e";
    const tokenId = "11";
    const tokenUri = `https://api.opensea.io/api/v1/metadata/${contractAddress}/0x{id}`;

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          name: "Template token",
          tokenUri,
          image: {
            originalUrl: null,
            cachedUrl: null,
            pngUrl: null,
            thumbnailUrl: null,
            gateway: null,
            raw: null,
            contentType: null,
            size: null,
          },
          raw: {
            tokenUri,
            metadata: {},
            error: "Token uri responded with a non 200 response code",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          name: "Template token",
          image: "ipfs://QmExampleHash/template.png",
        }),
      });

    const url = `https://opensea.io/item/ethereum/${contractAddress}/${tokenId}`;
    const plan = createOpenSeaPlan(new URL(url), {
      fetchHtml,
      assertPublicUrl,
    });
    const result = await plan?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "opensea.nft",
        title: "Template token",
        image: expect.objectContaining({
          url: "https://ipfs.io/ipfs/QmExampleHash/template.png",
        }),
      })
    );
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[1]?.[0]).toBe(
      `https://api.opensea.io/api/v1/metadata/${contractAddress}/0x000000000000000000000000000000000000000000000000000000000000000b`
    );
    expect(assertPublicUrl).toHaveBeenCalledTimes(1);
    expect(assertPublicUrl.mock.calls[0]?.[0]?.toString()).toBe(
      `https://api.opensea.io/api/v1/metadata/${contractAddress}/0x000000000000000000000000000000000000000000000000000000000000000b`
    );
    expect(fetchHtml).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("returns image-less OpenSea preview when Alchemy image is missing", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        name: "Token without image",
      }),
    });

    const plan = createOpenSeaPlan(
      new URL(
        "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/1"
      ),
      {
        fetchHtml,
        assertPublicUrl,
      }
    );
    const result = await plan?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "opensea.nft",
        title: "Token without image",
        image: null,
        images: [],
      })
    );
    expect(fetchHtml).not.toHaveBeenCalled();
    expect(assertPublicUrl).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("returns minimal OpenSea preview when API key is unavailable", async () => {
    mockedGetAlchemyApiKey.mockImplementation(() => {
      throw new Error("ALCHEMY_API_KEY missing");
    });

    const plan = createOpenSeaPlan(
      new URL(
        "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/2"
      ),
      {
        fetchHtml,
        assertPublicUrl,
      }
    );
    const result = await plan?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "opensea.nft",
        title: "NFT #2",
        image: null,
        images: [],
      })
    );
    expect(mockFetch).not.toHaveBeenCalled();
    expect(fetchHtml).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Unable to resolve OpenSea media (missing_api_key)"
      ),
      expect.objectContaining({
        requestUrl:
          "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/2",
        reason: "missing_api_key",
      })
    );
  });

  it("returns minimal OpenSea preview when Alchemy returns HTTP error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({}),
    });

    const plan = createOpenSeaPlan(
      new URL(
        "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/3"
      ),
      {
        fetchHtml,
        assertPublicUrl,
      }
    );
    const result = await plan?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "opensea.nft",
        title: "NFT #3",
        image: null,
        images: [],
      })
    );
    expect(fetchHtml).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Unable to resolve OpenSea media (alchemy_http_error)"
      ),
      expect.objectContaining({
        requestUrl:
          "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/3",
        reason: "alchemy_http_error",
        status: 429,
      })
    );
  });

  it("uses gateway image field when original/cached are missing", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        name: "Gateway token",
        image: {
          gateway: "https://nft-cdn.alchemy.com/eth-mainnet/gateway-image.png",
          contentType: "image/png",
        },
      }),
    });

    const url =
      "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/7";

    const plan = createOpenSeaPlan(new URL(url), {
      fetchHtml,
      assertPublicUrl,
    });
    const result = await plan?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "opensea.nft",
        title: "Gateway token",
        image: expect.objectContaining({
          url: "https://nft-cdn.alchemy.com/eth-mainnet/gateway-image.png",
        }),
      })
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("rejects OpenSea opengraph-like image URLs and returns image-less preview", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        name: "Overlay-like token",
        image: {
          originalUrl: "https://opensea.io/item/test/opengraph-image?ts=1",
          contentType: "image/png",
        },
      }),
    });

    const url =
      "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/8";

    const plan = createOpenSeaPlan(new URL(url), {
      fetchHtml,
      assertPublicUrl,
    });
    const result = await plan?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "opensea.nft",
        title: "Overlay-like token",
        image: null,
        images: [],
      })
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
