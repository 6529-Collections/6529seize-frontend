jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { createOpenSeaPlan } from "@/app/api/open-graph/opensea/service";
import { BodyTooLargeError } from "@/lib/fetch/limitedBody";
import { getAlchemyApiKey } from "@/config/alchemyEnv";
import { publicEnv } from "@/config/env";
import { getStagingApiKey } from "@/config/serverEnv";

jest.mock("@/config/alchemyEnv", () => ({
  getAlchemyApiKey: jest.fn(),
}));

jest.mock("@/config/serverEnv", () => ({
  getStagingApiKey: jest.fn(),
}));

describe("createOpenSeaPlan", () => {
  const fetchHtml = jest.fn();
  const assertPublicUrl = jest.fn();
  const fetchTokenMetadata = jest.fn();
  const mockedGetAlchemyApiKey = getAlchemyApiKey as jest.MockedFunction<
    typeof getAlchemyApiKey
  >;
  const originalFetch = global.fetch;
  const mockFetch = jest.fn();
  // Alchemy bodies are read through the byte-limited stream reader, so give
  // the `json()` mocks a matching stream body.
  const fetchWithStreamBody = async (...args: unknown[]) => {
    const response = await mockFetch(...args);
    if (typeof response?.json !== "function" || response.body) {
      return response;
    }
    const text = JSON.stringify(await response.json());
    return {
      ...response,
      headers: new Headers(),
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(text));
          controller.close();
        },
      }),
    };
  };
  const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    fetchHtml.mockReset();
    assertPublicUrl.mockReset();
    mockFetch.mockReset();
    mockedGetAlchemyApiKey.mockReset();
    assertPublicUrl.mockResolvedValue(undefined);
    fetchTokenMetadata.mockReset();
    fetchTokenMetadata.mockImplementation(async (url: URL) => {
      await assertPublicUrl(url);
      const response = await mockFetch(url.toString());
      if (!response.ok) throw new Error("Metadata unavailable");
      return response.json();
    });
    mockedGetAlchemyApiKey.mockReturnValue("test-alchemy-key");
    jest.mocked(getStagingApiKey).mockReturnValue(undefined);
    global.fetch = fetchWithStreamBody as unknown as typeof fetch;
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
        fetchTokenMetadata,
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
        fetchTokenMetadata,
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
        fetchTokenMetadata,
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
        fetchTokenMetadata,
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
      fetchTokenMetadata,
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
          url: "ipfs://QmExampleHash/radar.png",
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
      fetchTokenMetadata,
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
      fetchTokenMetadata,
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
      fetchTokenMetadata,
    });
    const result = await plan?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "opensea.nft",
        title: "Template token",
        image: expect.objectContaining({
          url: "ipfs://QmExampleHash/template.png",
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

  it("falls back to OpenGraph image and title when Alchemy image is missing", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        name: "Token without image",
      }),
    });
    fetchHtml.mockResolvedValue({
      html: `
        <html>
          <head>
            <meta property="og:title" content="OpenGraph token name" />
            <meta property="og:image" content="https://i.seadn.io/s/raw/files/opengraph-token.png" />
          </head>
        </html>
      `,
      contentType: "text/html; charset=utf-8",
      finalUrl:
        "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/1",
    });

    const plan = createOpenSeaPlan(
      new URL(
        "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/1"
      ),
      {
        fetchHtml,
        assertPublicUrl,
        fetchTokenMetadata,
      }
    );
    const result = await plan?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "opensea.nft",
        title: "OpenGraph token name",
        image: expect.objectContaining({
          url: "https://i.seadn.io/s/raw/files/opengraph-token.png",
        }),
        images: [
          expect.objectContaining({
            url: "https://i.seadn.io/s/raw/files/opengraph-token.png",
          }),
        ],
      })
    );
    expect(fetchHtml).toHaveBeenCalledTimes(1);
    expect(assertPublicUrl).toHaveBeenCalledTimes(1);
    expect(assertPublicUrl.mock.calls[0]?.[0]?.toString()).toBe(
      "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/1"
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });

  describe("oversized token metadata", () => {
    const itemUrl =
      "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/1";
    const pageMetadata = {
      html: `
        <html>
          <head>
            <meta property="og:title" content="OpenGraph token name" />
            <meta property="og:image" content="https://i.seadn.io/s/raw/files/opengraph-token.png" />
          </head>
        </html>
      `,
      contentType: "text/html; charset=utf-8",
      finalUrl: itemUrl,
    };
    const expectPagePreview = (data: unknown) =>
      expect(data).toEqual(
        expect.objectContaining({
          type: "opensea.nft",
          title: "OpenGraph token name",
          image: expect.objectContaining({
            url: "https://i.seadn.io/s/raw/files/opengraph-token.png",
          }),
        })
      );

    it("falls back to the page metadata when the token URI document is over the cap", async () => {
      const tokenUri = "https://metadata.example/token/1";
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ tokenUri, raw: { tokenUri, metadata: {} } }),
      });
      fetchTokenMetadata.mockRejectedValueOnce(
        new BodyTooLargeError(1024 * 1024)
      );
      fetchHtml.mockResolvedValue(pageMetadata);

      const plan = createOpenSeaPlan(new URL(itemUrl), {
        fetchHtml,
        assertPublicUrl,
        fetchTokenMetadata,
      });
      const result = await plan?.execute();

      expect(fetchTokenMetadata).toHaveBeenCalledTimes(1);
      expectPagePreview(result?.data);
    });

    it("does not parse an Alchemy response over 1 MiB and answers as for an Alchemy error", async () => {
      const parse = jest.spyOn(JSON, "parse");
      const cancel = jest.fn();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ "content-length": String(1024 * 1024 + 1) }),
        body: new ReadableStream<Uint8Array>({ cancel }),
      });

      try {
        const plan = createOpenSeaPlan(new URL(itemUrl), {
          fetchHtml,
          assertPublicUrl,
          fetchTokenMetadata,
        });
        const result = await plan?.execute();

        expect(cancel).toHaveBeenCalledTimes(1);
        expect(parse).not.toHaveBeenCalled();
        expect(result?.data).toEqual(
          expect.objectContaining({
            type: "opensea.nft",
            title: "NFT #1",
            image: null,
          })
        );
      } finally {
        parse.mockRestore();
      }
    });
  });

  it("uses the backend proxy for Ethereum when the API key is unavailable", async () => {
    mockedGetAlchemyApiKey.mockImplementation(() => {
      throw new Error("ALCHEMY_API_KEY missing");
    });
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        tokens: [
          {
            name: "Radar dome",
            description: "A clear sky",
            image: {
              originalUrl: "ipfs://QmExampleHash/radar.png",
              contentType: "image/png",
            },
          },
        ],
      }),
    });
    const url =
      "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/2";

    const plan = createOpenSeaPlan(new URL(url), {
      fetchHtml,
      assertPublicUrl,
      fetchTokenMetadata,
    });
    const result = await plan?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "opensea.nft",
        title: "Radar dome",
        image: expect.objectContaining({
          url: "ipfs://QmExampleHash/radar.png",
        }),
      })
    );
    expect(mockFetch).toHaveBeenCalledWith(
      `${publicEnv.API_ENDPOINT}/alchemy-proxy/token-metadata`,
      expect.objectContaining({ method: "POST" })
    );
    const request = mockFetch.mock.calls[0]?.[1] as {
      body: string;
      headers: Record<string, string>;
    };
    expect(JSON.parse(request.body)).toEqual({
      address: "0x495f947276749ce646f68ac8c248420045cb7b5e",
      tokenIds: ["2"],
      chain: "ethereum",
    });
    expect(request.headers).not.toHaveProperty("x-6529-auth");
    expect(fetchHtml).not.toHaveBeenCalled();
  });

  it("authenticates the backend proxy with the server-only staging key", async () => {
    mockedGetAlchemyApiKey.mockImplementation(() => {
      throw new Error("ALCHEMY_API_KEY missing");
    });
    jest.mocked(getStagingApiKey).mockReturnValue("server-staging-key");
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        tokens: [
          {
            name: "Radar dome",
            image: { originalUrl: "ipfs://QmExampleHash/radar.png" },
          },
        ],
      }),
    });

    const plan = createOpenSeaPlan(
      new URL(
        "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/2"
      ),
      { fetchHtml, assertPublicUrl, fetchTokenMetadata }
    );
    await plan?.execute();

    const request = mockFetch.mock.calls[0]?.[1] as {
      headers: Record<string, string>;
    };
    expect(request.headers["x-6529-auth"]).toBe("server-staging-key");
  });

  it("falls back to OpenGraph preview when API key is unavailable", async () => {
    mockedGetAlchemyApiKey.mockImplementation(() => {
      throw new Error("ALCHEMY_API_KEY missing");
    });
    fetchHtml.mockResolvedValue({
      html: `
        <html>
          <head>
            <meta property="og:title" content="Missing key fallback title" />
            <meta property="og:image" content="https://i.seadn.io/s/raw/files/missing-key-fallback.png" />
          </head>
        </html>
      `,
      contentType: "text/html",
      finalUrl:
        "https://opensea.io/item/base/0x495f947276749ce646f68ac8c248420045cb7b5e/2",
    });

    const plan = createOpenSeaPlan(
      new URL(
        "https://opensea.io/item/base/0x495f947276749ce646f68ac8c248420045cb7b5e/2"
      ),
      {
        fetchHtml,
        assertPublicUrl,
        fetchTokenMetadata,
      }
    );
    const result = await plan?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "opensea.nft",
        title: "Missing key fallback title",
        image: expect.objectContaining({
          url: "https://i.seadn.io/s/raw/files/missing-key-fallback.png",
        }),
        images: [
          expect.objectContaining({
            url: "https://i.seadn.io/s/raw/files/missing-key-fallback.png",
          }),
        ],
      })
    );
    expect(mockFetch).not.toHaveBeenCalled();
    expect(fetchHtml).toHaveBeenCalledTimes(1);
    expect(assertPublicUrl).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Unable to resolve OpenSea media (missing_api_key)"
      ),
      expect.objectContaining({
        requestUrl:
          "https://opensea.io/item/base/0x495f947276749ce646f68ac8c248420045cb7b5e/2",
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
        fetchTokenMetadata,
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
    expect(fetchHtml).toHaveBeenCalledTimes(1);
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
      fetchTokenMetadata,
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

  it("falls back to OpenGraph image when Alchemy image resolves to blocked OpenSea overlay", async () => {
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
    fetchHtml.mockResolvedValue({
      html: `
        <html>
          <head>
            <meta property="og:title" content="Overlay fallback token" />
            <meta property="og:image" content="https://i.seadn.io/s/raw/files/overlay-fallback.png" />
          </head>
        </html>
      `,
      contentType: "text/html",
      finalUrl:
        "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/8",
    });

    const url =
      "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/8";

    const plan = createOpenSeaPlan(new URL(url), {
      fetchHtml,
      assertPublicUrl,
      fetchTokenMetadata,
    });
    const result = await plan?.execute();

    expect(result?.data).toEqual(
      expect.objectContaining({
        type: "opensea.nft",
        title: "Overlay fallback token",
        image: expect.objectContaining({
          url: "https://i.seadn.io/s/raw/files/overlay-fallback.png",
        }),
        images: [
          expect.objectContaining({
            url: "https://i.seadn.io/s/raw/files/overlay-fallback.png",
          }),
        ],
      })
    );
    expect(fetchHtml).toHaveBeenCalledTimes(1);
    expect(assertPublicUrl).toHaveBeenCalledTimes(1);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
