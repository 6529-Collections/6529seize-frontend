/** @jest-environment node */

import { ReadableStream } from "node:stream/web";
import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
  NEXTGEN_CONTRACT,
} from "@/constants/constants";

jest.mock("@/config/env", () => ({
  publicEnv: {
    API_ENDPOINT: "https://api.6529.test",
  },
}));

import {
  fetchNftCardMetadata,
  getFallbackNftCardMetadata,
} from "@/app/api/og-metadata/nfts/[contract]/[id]/metadata";
import { publicEnv } from "@/config/env";

const mockFetch = jest.fn();
const originalFetch = globalThis.fetch;
const imageUrl = "https://d3lqz0a4bldqgf.cloudfront.net/card.png";
const REMEME_CONTRACT = "0x869a96493d64ed5bbbfc24d96c5e84f95e558cf2";
const jsonResponse = (data: unknown) => ({
  ok: true,
  headers: new Headers({ "content-type": "application/json" }),
  body: new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(JSON.stringify(data)));
      controller.close();
    },
  }),
});

describe("NFT preview metadata fallback", () => {
  beforeEach(() => {
    globalThis.fetch = mockFetch;
    mockFetch.mockReset();
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    delete process.env["STAGING_API_KEY"];
  });
  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it("uses configured staging access only on the trusted API request", async () => {
    process.env["STAGING_API_KEY"] = "test-staging-key";
    mockFetch.mockResolvedValue(jsonResponse({ data: [] }));
    await fetchNftCardMetadata(MEMES_CONTRACT, "542");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/^https:\/\/api\.6529\.test\/api\/nfts\?/),
      expect.objectContaining({
        headers: {
          Accept: "application/json",
          "x-6529-auth": "test-staging-key",
        },
        redirect: "error",
      })
    );
  });

  it.each([401, 403])(
    "retries staging %s once on the fixed public API without credentials",
    async (status) => {
      jest.replaceProperty(
        publicEnv,
        "API_ENDPOINT",
        "https://api.staging.6529.io"
      );
      process.env["STAGING_API_KEY"] = "test-staging-key";
      const cancel = jest.fn().mockResolvedValue(undefined);
      mockFetch
        .mockResolvedValueOnce({ ok: false, status, body: { cancel } })
        .mockResolvedValueOnce(
          jsonResponse({
            data: [
              {
                id: 542,
                contract: MEMES_CONTRACT,
                name: "Open Source",
                scaled: imageUrl,
              },
            ],
          })
        );
      await expect(
        fetchNftCardMetadata(MEMES_CONTRACT, "542")
      ).resolves.toMatchObject({ title: "Open Source", imageUrl });
      expect(cancel).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/^https:\/\/api\.6529\.io\/api\/nfts\?/),
        expect.objectContaining({
          headers: { Accept: "application/json" },
          redirect: "error",
        })
      );
      expect(mockFetch.mock.calls[0]?.[1].signal).toBe(
        mockFetch.mock.calls[1]?.[1].signal
      );
    }
  );

  it.each([
    ["https://api.staging.6529.io", 404],
    ["https://api.staging.6529.io", 500],
    ["https://api.staging.6529.io", 302],
    ["https://api.6529.io", 401],
    ["https://api.6529.test", 401],
    ["https://api.staging.6529.io.example.com", 403],
    ["http://api.staging.6529.io", 401],
  ])(
    "does not retry metadata from %s with status %s",
    async (origin, status) => {
      jest.replaceProperty(publicEnv, "API_ENDPOINT", origin);
      mockFetch.mockResolvedValue({ ok: false, status, body: null });
      await expect(
        fetchNftCardMetadata(MEMES_CONTRACT, "542")
      ).resolves.toBeNull();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    }
  );

  it("does not retry a failed public fallback", async () => {
    jest.replaceProperty(
      publicEnv,
      "API_ENDPOINT",
      "https://api.staging.6529.io"
    );
    process.env["STAGING_API_KEY"] = "test-staging-key";
    mockFetch.mockResolvedValue({ ok: false, status: 401, body: null });
    await expect(
      fetchNftCardMetadata(MEMES_CONTRACT, "542")
    ).resolves.toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/^https:\/\/api\.6529\.io\/api\/nfts\?/),
      expect.objectContaining({ headers: { Accept: "application/json" } })
    );
  });

  it("keeps subsequent NextGen collection metadata on the public API after fallback", async () => {
    jest.replaceProperty(
      publicEnv,
      "API_ENDPOINT",
      "https://api.staging.6529.io"
    );
    process.env["STAGING_API_KEY"] = "test-staging-key";
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 401, body: null })
      .mockResolvedValueOnce(
        jsonResponse({
          id: 10000000315,
          normalised_id: 315,
          collection_id: 1,
          name: "Pebbles #315",
          image_url: imageUrl,
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({ id: 1, name: "Pebbles", artist: "Zeblocks" })
      );
    await expect(
      fetchNftCardMetadata(NEXTGEN_CONTRACT, "10000000315")
    ).resolves.toMatchObject({
      title: "Pebbles #315",
      artist: "Zeblocks",
      displayId: "315",
    });
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch).toHaveBeenNthCalledWith(
      3,
      "https://api.6529.io/api/nextgen/collections/1",
      expect.objectContaining({ headers: { Accept: "application/json" } })
    );
  });

  it("shares the five-second deadline with the public fallback", async () => {
    jest.useFakeTimers();
    jest.replaceProperty(
      publicEnv,
      "API_ENDPOINT",
      "https://api.staging.6529.io"
    );
    mockFetch
      .mockImplementationOnce(async () => {
        await new Promise((resolve) => setTimeout(resolve, 4_000));
        return { ok: false, status: 401, body: null };
      })
      .mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener(
              "abort",
              () => reject(new Error("aborted")),
              { once: true }
            );
          })
      );
    const result = fetchNftCardMetadata(MEMES_CONTRACT, "542");
    await jest.advanceTimersByTimeAsync(4_000);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(1_000);
    await expect(result).resolves.toBeNull();
  });

  it.each([
    [MEMES_CONTRACT, "The Memes", "nfts"],
    [GRADIENT_CONTRACT, "6529 Gradient", "nfts"],
    [MEMELAB_CONTRACT, "Meme Lab", "nfts_memelab"],
  ])(
    "loads only the matching %s token from its trusted endpoint",
    async (contract, collection, endpoint) => {
      mockFetch.mockResolvedValue(
        jsonResponse({
          data: [
            {
              id: 542,
              contract,
              name: "Open Source",
              artist: "vertigo",
              scaled: imageUrl,
              image: "https://cdn.test/original.png",
            },
          ],
        })
      );
      await expect(
        fetchNftCardMetadata(contract.toLowerCase(), "542")
      ).resolves.toEqual({
        title: "Open Source",
        artist: "vertigo",
        collection,
        badge: collection,
        displayId: null,
        imageUrl,
      });
      const query = new URLSearchParams({ contract, id: "542" });
      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.6529.test/api/${endpoint}?${query}`,
        expect.objectContaining({
          redirect: "error",
          headers: { Accept: "application/json" },
          signal: expect.any(AbortSignal),
          next: { revalidate: 3600 },
        })
      );
    }
  );

  it("loads a full NextGen token ID and its artist without traits requests", async () => {
    const id = "10000000001";
    mockFetch
      .mockResolvedValueOnce(
        jsonResponse({
          id: 10000000001,
          normalised_id: 1,
          collection_id: 1,
          name: "Pebbles #1",
          collection_name: "Pebbles",
          image_url: imageUrl,
          pending: false,
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({ id: 1, name: "Pebbles", artist: "artist" })
      );
    await expect(fetchNftCardMetadata(NEXTGEN_CONTRACT, id)).resolves.toEqual({
      title: "Pebbles #1",
      artist: "artist",
      collection: "Pebbles",
      badge: "NextGen",
      displayId: "1",
      imageUrl,
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      "https://api.6529.test/api/nextgen/collections/1",
      expect.any(Object)
    );
  });

  it("does not accept a normalized display ID as the full token identity", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        id: 10000000001,
        normalised_id: 1,
        collection_id: 1,
        image_url: imageUrl,
      })
    );
    await expect(
      fetchNftCardMetadata(NEXTGEN_CONTRACT, "1")
    ).resolves.toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["https://untrusted.test", "542"],
    ["0xabc", "542"],
    [MEMES_CONTRACT, "../542"],
    [MEMES_CONTRACT, "542?contract=other"],
    [MEMES_CONTRACT, "-1"],
    [MEMES_CONTRACT, "9007199254740992"],
    [MEMES_CONTRACT, "..%2f"],
    [MEMES_CONTRACT, "1@evil.com"],
    [MEMES_CONTRACT, "https://evil.test/1"],
    [MEMES_CONTRACT, "//evil.test"],
    [MEMES_CONTRACT, "1&contract=other"],
    [REMEME_CONTRACT, "..%2f"],
    [REMEME_CONTRACT, "1@evil.com"],
    [REMEME_CONTRACT, "1/../2"],
    [REMEME_CONTRACT, "https://evil.test/1"],
    [NEXTGEN_CONTRACT, "1/../2"],
    [`${REMEME_CONTRACT}%2f..`, "1"],
    [`${REMEME_CONTRACT}@evil.com`, "1"],
    ["https://evil.test/0x869a96493d64ed5bbbfc24d96c5e84f95e558cf2", "1"],
    ["//evil.test", "1"],
    ["@evil.com", "1"],
  ])("does not fetch unsupported identity %s / %s", async (contract, id) => {
    await expect(fetchNftCardMetadata(contract, id)).resolves.toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it.each([
    { data: [] },
    { data: [{ id: 543, contract: MEMES_CONTRACT, scaled: imageUrl }] },
    { data: [{ id: 542, contract: GRADIENT_CONTRACT, scaled: imageUrl }] },
    { data: "invalid" },
    null,
  ])(
    "does not substitute unrelated or malformed NFT data (%j)",
    async (data) => {
      mockFetch.mockResolvedValue(jsonResponse(data));
      await expect(
        fetchNftCardMetadata(MEMES_CONTRACT, "542")
      ).resolves.toBeNull();
    }
  );

  it.each([
    { id: 10000000002, normalised_id: 2, collection_id: 1 },
    { id: 10000000001, collection_id: "../other" },
    { id: 10000000001, collection_id: 1, pending: true },
  ])(
    "does not load a collection for invalid NextGen data (%j)",
    async (data) => {
      mockFetch.mockResolvedValue(jsonResponse(data));
      await expect(
        fetchNftCardMetadata(NEXTGEN_CONTRACT, "10000000001")
      ).resolves.toBeNull();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    }
  );

  it("rejects a response that exceeds the metadata byte limit", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ data: "x".repeat(256 * 1024) }));
    await expect(
      fetchNftCardMetadata(MEMES_CONTRACT, "542")
    ).resolves.toBeNull();
  });

  it.each(["network", "redirect", "content-type"])(
    "gracefully rejects %s failures",
    async (failure) => {
      if (failure === "content-type") {
        mockFetch.mockResolvedValue({
          ok: true,
          headers: new Headers({ "content-type": "text/html" }),
        });
      } else {
        mockFetch.mockRejectedValue(new Error(failure));
      }
      await expect(
        fetchNftCardMetadata(MEMES_CONTRACT, "542")
      ).resolves.toBeNull();
    }
  );

  it("aborts slow metadata requests within five seconds", async () => {
    jest.useFakeTimers();
    mockFetch.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener(
            "abort",
            () => reject(new Error("aborted")),
            { once: true }
          );
        })
    );
    const result = fetchNftCardMetadata(MEMES_CONTRACT, "542");
    await jest.advanceTimersByTimeAsync(5_000);
    await expect(result).resolves.toBeNull();
  });

  it("propagates request cancellation", async () => {
    const controller = new AbortController();
    mockFetch.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener(
            "abort",
            () => reject(new Error("aborted")),
            { once: true }
          );
        })
    );
    const result = fetchNftCardMetadata(
      MEMES_CONTRACT,
      "542",
      controller.signal
    );
    controller.abort();
    await expect(result).resolves.toBeNull();
  });

  describe("ReMeme lookups", () => {
    const rememe = (overrides: Record<string, unknown> = {}) => ({
      contract: REMEME_CONTRACT,
      id: "39",
      metadata: { name: "GDRC #2" },
      contract_opensea_data: {
        collectionName: "SEIZING",
        imageUrl: "https://cdn.test/collection.png",
      },
      ...overrides,
    });

    it("loads the matching ReMeme from the fixed rememes endpoint", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({ data: [rememe({ s3_image_scaled: imageUrl })] })
      );

      await expect(
        fetchNftCardMetadata(
          REMEME_CONTRACT.toUpperCase().replace("0X", "0x"),
          "39"
        )
      ).resolves.toEqual({
        title: "GDRC #2",
        artist: null,
        collection: "SEIZING",
        badge: "ReMemes",
        displayId: null,
        imageUrl,
      });
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.6529.test/api/rememes?contract=${REMEME_CONTRACT}&id=39`,
        expect.objectContaining({
          redirect: "error",
          headers: { Accept: "application/json" },
          next: { revalidate: 3600 },
        })
      );
    });

    it("prefers stored artwork and skips empty image fields", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({
          data: [
            rememe({
              s3_image_scaled: "  ",
              s3_image_original: "https://cdn.test/original.png",
              image: "https://cdn.test/raw.png",
              media: [{ gateway: "https://cdn.test/gateway.png" }],
            }),
          ],
        })
      );
      await expect(
        fetchNftCardMetadata(REMEME_CONTRACT, "39")
      ).resolves.toMatchObject({ imageUrl: "https://cdn.test/original.png" });
    });

    it.each([
      [
        "an array of media gateways",
        { media: [{ gateway: "" }, { gateway: "https://cdn.test/gw.png" }] },
        "https://cdn.test/gw.png",
      ],
      [
        "Alchemy-style media objects",
        {
          media: {
            cachedUrl: "https://cdn.test/cached.gif",
            pngUrl: "https://cdn.test/converted.png",
            thumbnailUrl: "https://cdn.test/thumb.gif",
          },
        },
        "https://cdn.test/thumb.gif",
      ],
      [
        "the collection image",
        { media: [], image: "" },
        "https://cdn.test/collection.png",
      ],
    ])("falls back to %s", async (_name, overrides, expected) => {
      mockFetch.mockResolvedValue(
        jsonResponse({ data: [rememe({ image: "", ...overrides })] })
      );
      await expect(
        fetchNftCardMetadata(REMEME_CONTRACT, "39")
      ).resolves.toMatchObject({ imageUrl: expected });
    });

    it("uses neutral text when the ReMeme has no name or collection", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({
          data: [rememe({ metadata: {}, contract_opensea_data: null })],
        })
      );
      await expect(
        fetchNftCardMetadata(REMEME_CONTRACT, "39")
      ).resolves.toMatchObject({
        title: "0x869a...8cf2 #39",
        collection: "ReMemes",
        badge: "ReMemes",
        imageUrl: null,
      });
    });

    it("accepts full-width ERC-721 token IDs", async () => {
      const id = "9".repeat(78);
      mockFetch.mockResolvedValue(jsonResponse({ data: [rememe({ id })] }));
      await expect(
        fetchNftCardMetadata(REMEME_CONTRACT, id)
      ).resolves.toMatchObject({ title: "GDRC #2" });
    });

    it.each([
      { data: [] },
      { data: [rememe({ id: "40" })] },
      { data: [rememe({ contract: MEMES_CONTRACT })] },
      { data: "invalid" },
      null,
    ])("does not substitute unrelated ReMeme data (%j)", async (data) => {
      mockFetch.mockResolvedValue(jsonResponse(data));
      await expect(
        fetchNftCardMetadata(REMEME_CONTRACT, "39")
      ).resolves.toBeNull();
    });

    it("does not look up ReMemes for malformed identities", async () => {
      await expect(
        fetchNftCardMetadata(REMEME_CONTRACT, "9".repeat(79))
      ).resolves.toBeNull();
      await expect(
        fetchNftCardMetadata(`${REMEME_CONTRACT}00`, "39")
      ).resolves.toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("fallback card details", () => {
    it.each([
      [MEMES_CONTRACT, "The Memes"],
      [MEMES_CONTRACT.toLowerCase(), "The Memes"],
      [GRADIENT_CONTRACT, "6529 Gradient"],
      [MEMELAB_CONTRACT, "Meme Lab"],
      [NEXTGEN_CONTRACT, "NextGen"],
    ])("names the known collection for %s", (contract, name) => {
      expect(getFallbackNftCardMetadata(contract, "7")).toEqual({
        title: `${name} #7`,
        artist: null,
        collection: name,
        badge: name,
        displayId: null,
        imageUrl: null,
      });
    });

    it("has no details for other contracts", () => {
      expect(getFallbackNftCardMetadata(REMEME_CONTRACT, "7")).toBeNull();
    });
  });
});
