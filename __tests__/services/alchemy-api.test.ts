/**
 * @jest-environment node
 */

jest.mock("@/config/alchemyEnv", () => ({
  getAlchemyApiKey: () => "test",
}));

import { getContractOverview, getTokensMetadata } from "@/services/alchemy-api";
const originalFetch = global.fetch;
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe("services/alchemy-api", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  function jsonResponse<T>(body: T, status = 200): Response {
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    } as Response;
  }

  describe("getContractOverview", () => {
    it("throws on invalid address", async () => {
      await expect(
        getContractOverview({ address: "invalid" as `0x${string}` })
      ).rejects.toThrow("Invalid contract address");
    });

    it("normalises contract metadata", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({
          contractMetadata: {
            name: "Example",
            tokenType: "ERC1155",
            totalSupply: "5000",
          },
          openSeaMetadata: {
            floorPrice: 0.5,
            safelistRequestStatus: "verified",
          },
          address: "0x1234567890abcdef1234567890abcdef12345678",
        })
      );

      const result = await getContractOverview({
        address: "0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`,
      });

      expect(result?.name).toBe("Example");
      expect(result?.floorPriceEth).toBe(0.5);
    });
  });

  describe("getTokensMetadata", () => {
    it("fetches batched token metadata", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({
          tokens: [
            {
              tokenId: "1",
              title: "Token 1",
              image: { cachedUrl: "https://example.com/1.png" },
            },
          ],
        })
      );

      const result = await getTokensMetadata({
        address: "0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`,
        tokenIds: ["1"],
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0]?.tokenId.toString()).toBe("1");
      expect(result[0]?.imageUrl).toBe("https://example.com/1.png");
    });
  });
});
