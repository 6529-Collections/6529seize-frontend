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
    const mockNfts = [
      {
        tokenId: "1",
        tokenType: "ERC721",
        name: "Test NFT",
        tokenUri: "https://example.com/1",
        image: null,
      },
    ];

    it("should return data from primary endpoint when successful", async () => {
      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNfts),
      });

      const result = await fetchOwnerNfts(1, "0x123", "0xowner");

      expect(result).toEqual(mockNfts);
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
          json: () => Promise.resolve(mockNfts),
        });

      const result = await fetchOwnerNfts(1, "0x123", "0xowner");

      expect(result).toEqual(mockNfts);
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
          json: () => Promise.resolve(mockNfts),
        });

      const result = await fetchOwnerNfts(1, "0x123", "0xowner");

      expect(result).toEqual(mockNfts);
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
        json: () => Promise.resolve(mockNfts),
      });

      await fetchOwnerNfts(1, "0x123", "0xowner", controller.signal);

      expect(globalThis.fetch).toHaveBeenCalledWith(expect.any(String), {
        signal: controller.signal,
      });
    });

    it("should handle different chain IDs correctly", async () => {
      globalThis.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockNfts),
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
  });
});
