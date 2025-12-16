import { fetchOwnerNfts } from "@/hooks/useAlchemyNftQueries";

const MOCK_API_ENDPOINT = "https://api.example.com";

jest.mock("@/config/env", () => ({
  publicEnv: {
    API_ENDPOINT: "https://api.example.com",
    BASE_ENDPOINT: "https://example.com",
    ALLOWLIST_API_ENDPOINT: "https://allowlist.example.com",
  },
}));

describe("useAlchemyNftQueries", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("fetchOwnerNfts", () => {
    const mockAlchemyResponse = {
      ownedNfts: [
        {
          tokenId: "1",
          tokenType: "ERC721",
          name: "Test NFT",
          tokenUri: "https://example.com/1",
          image: null,
        },
      ],
      pageKey: undefined,
    };

    const expectedProcessedResult = [
      {
        tokenId: "1",
        tokenType: "ERC721",
        name: "Test NFT",
        tokenUri: "https://example.com/1",
        image: null,
      },
    ];

    it("should return processed data from primary endpoint when successful", async () => {
      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAlchemyResponse),
      });

      const result = await fetchOwnerNfts(1, "0x123", "0xowner");

      expect(result).toEqual(expectedProcessedResult);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/alchemy/owner-nfts?chainId=1&contract=0x123&owner=0xowner",
        { signal: undefined }
      );
    });

    it("should fallback to backend proxy when primary endpoint fails with non-ok response", async () => {
      globalThis.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAlchemyResponse),
        });

      const result = await fetchOwnerNfts(1, "0x123", "0xowner");

      expect(result).toEqual(expectedProcessedResult);
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
      expect(globalThis.fetch).toHaveBeenNthCalledWith(
        1,
        "/api/alchemy/owner-nfts?chainId=1&contract=0x123&owner=0xowner",
        { signal: undefined }
      );
      expect(globalThis.fetch).toHaveBeenNthCalledWith(
        2,
        `${MOCK_API_ENDPOINT}/alchemy-proxy/owner-nfts?chainId=1&contract=0x123&owner=0xowner`,
        { signal: undefined }
      );
    });

    it("should fallback to backend proxy when primary endpoint throws network error", async () => {
      globalThis.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAlchemyResponse),
        });

      const result = await fetchOwnerNfts(1, "0x123", "0xowner");

      expect(result).toEqual(expectedProcessedResult);
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it("should throw error when both primary and fallback fail", async () => {
      globalThis.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

      await expect(fetchOwnerNfts(1, "0x123", "0xowner")).rejects.toThrow(
        "Request failed with status 500"
      );
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it("should pass abort signal to fetch calls", async () => {
      const controller = new AbortController();
      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAlchemyResponse),
      });

      await fetchOwnerNfts(1, "0x123", "0xowner", controller.signal);

      expect(globalThis.fetch).toHaveBeenCalledWith(expect.any(String), {
        signal: controller.signal,
      });
    });

    it("should handle different chain IDs correctly", async () => {
      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAlchemyResponse),
      });

      await fetchOwnerNfts(11155111, "0x123", "0xowner");

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/alchemy/owner-nfts?chainId=11155111&contract=0x123&owner=0xowner",
        { signal: undefined }
      );
    });

    it("should NOT fallback when request is aborted via AbortController", async () => {
      const abortError = new DOMException(
        "The operation was aborted.",
        "AbortError"
      );
      globalThis.fetch = jest.fn().mockRejectedValueOnce(abortError);

      await expect(fetchOwnerNfts(1, "0x123", "0xowner")).rejects.toThrow();
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it("should NOT fallback when request throws Error with name AbortError", async () => {
      const abortError = new Error("The operation was aborted.");
      abortError.name = "AbortError";
      globalThis.fetch = jest.fn().mockRejectedValueOnce(abortError);

      await expect(fetchOwnerNfts(1, "0x123", "0xowner")).rejects.toThrow();
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it("should process raw Alchemy response correctly", async () => {
      const rawAlchemyResponse = {
        ownedNfts: [
          {
            tokenId: "123",
            tokenType: "ERC1155",
            name: null,
            tokenUri: null,
            image: { thumbnailUrl: "https://img.example.com/123.png" },
          },
          {
            tokenId: "456",
            tokenType: "ERC721",
            name: "Cool NFT",
            tokenUri: "https://metadata.example.com/456",
            image: null,
          },
        ],
      };

      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rawAlchemyResponse),
      });

      const result = await fetchOwnerNfts(1, "0x123", "0xowner");

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        tokenId: "123",
        tokenType: "ERC1155",
        name: null,
        tokenUri: null,
        image: { thumbnailUrl: "https://img.example.com/123.png" },
      });
      expect(result[1]).toEqual({
        tokenId: "456",
        tokenType: "ERC721",
        name: "Cool NFT",
        tokenUri: "https://metadata.example.com/456",
        image: null,
      });
    });
  });
});
