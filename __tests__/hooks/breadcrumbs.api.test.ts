import { MEMELAB_CONTRACT, MEMES_CONTRACT } from "../../constants";
import {
  fetchCollectionName,
  fetchGradientName,
  fetchMemeLabName,
  fetchMemeName,
  fetchNextgenName,
  fetchProfileHandle,
  fetchRememeName,
  fetchWaveName,
} from "../../hooks/breadcrumbs.api";
import { commonApiFetch } from "../../services/api/common-api";

// Mock dependencies
jest.mock("../../services/api/common-api");
jest.mock("../../constants", () => ({
  MEMELAB_CONTRACT: "test-memelab-contract",
  MEMES_CONTRACT: "test-memes-contract",
}));

const mockCommonApiFetch = commonApiFetch as jest.MockedFunction<
  typeof commonApiFetch
>;

describe("breadcrumbs.api", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("fetchGradientName", () => {
    it("returns gradient name when API call succeeds", async () => {
      mockCommonApiFetch.mockResolvedValueOnce({
        data: [{ name: "Test Gradient" }],
      });

      const result = await fetchGradientName("123");

      expect(result).toEqual({ name: "Test Gradient" });
      expect(mockCommonApiFetch).toHaveBeenCalledWith({
        endpoint: "nfts/gradients",
        params: { id: "123" },
      });
    });

    it("returns null for invalid input", async () => {
      expect(await fetchGradientName("")).toBeNull();
      expect(await fetchGradientName(null as any)).toBeNull();
      expect(await fetchGradientName(123 as any)).toBeNull();
    });

    it("returns fallback name on API error", async () => {
      mockCommonApiFetch.mockRejectedValueOnce(new Error("API Error"));

      const result = await fetchGradientName("123");

      expect(result).toEqual({ name: "Gradient 123" });
      expect(console.error).toHaveBeenCalledWith(
        "Error fetching gradient name:",
        expect.any(Error)
      );
    });

    it("returns null when no data in response", async () => {
      mockCommonApiFetch.mockResolvedValueOnce({ data: [] });

      const result = await fetchGradientName("123");

      expect(result).toBeNull();
    });
  });

  describe("fetchProfileHandle", () => {
    it("returns handle when valid input provided", async () => {
      const result = await fetchProfileHandle("testhandle");

      expect(result).toEqual({ handle: "testhandle" });
    });

    it("returns null for invalid input", async () => {
      expect(await fetchProfileHandle("")).toBeNull();
      expect(await fetchProfileHandle(null as any)).toBeNull();
      expect(await fetchProfileHandle(123 as any)).toBeNull();
    });

    it("handles errors gracefully", async () => {
      // Simulate error by throwing in the delay
      jest.spyOn(global, "setTimeout").mockImplementationOnce(() => {
        throw new Error("Timer error");
      });

      const result = await fetchProfileHandle("testhandle");

      expect(result).toEqual({ handle: "testhandle" });
      expect(console.error).toHaveBeenCalledWith(
        "Error fetching profile handle:",
        expect.any(Error)
      );
    });
  });

  describe("fetchWaveName", () => {
    it("returns wave name when API call succeeds", async () => {
      mockCommonApiFetch.mockResolvedValueOnce({ name: "Test Wave" });

      const result = await fetchWaveName("wave-123");

      expect(result).toEqual({ name: "Test Wave" });
      expect(mockCommonApiFetch).toHaveBeenCalledWith({
        endpoint: "waves/wave-123",
      });
    });

    it("returns null for invalid input", async () => {
      expect(await fetchWaveName("")).toBeNull();
      expect(await fetchWaveName(null as any)).toBeNull();
      expect(await fetchWaveName(123 as any)).toBeNull();
    });

    it("returns fallback name on API error", async () => {
      mockCommonApiFetch.mockRejectedValueOnce(new Error("API Error"));

      const result = await fetchWaveName("wave-123");

      expect(result).toEqual({ name: "Wave wave-123" });
      expect(console.error).toHaveBeenCalledWith(
        "Error fetching wave name:",
        expect.any(Error)
      );
    });

    it("returns null when no response", async () => {
      mockCommonApiFetch.mockResolvedValueOnce(null);

      const result = await fetchWaveName("wave-123");

      expect(result).toBeNull();
    });
  });

  describe("fetchMemeName", () => {
    it("returns meme name when API call succeeds", async () => {
      mockCommonApiFetch.mockResolvedValueOnce({
        data: [{ name: "Test Meme" }],
      });

      const result = await fetchMemeName("123");

      expect(result).toEqual({ name: "Test Meme" });
      expect(mockCommonApiFetch).toHaveBeenCalledWith({
        endpoint: "nfts",
        params: { contract: MEMES_CONTRACT, id: "123" },
      });
    });

    it("returns null for invalid input", async () => {
      expect(await fetchMemeName("")).toBeNull();
      expect(await fetchMemeName("mint")).toBeNull();
      expect(await fetchMemeName(null as any)).toBeNull();
      expect(await fetchMemeName(123 as any)).toBeNull();
    });

    it("returns fallback name on API error", async () => {
      mockCommonApiFetch.mockRejectedValueOnce(new Error("API Error"));

      const result = await fetchMemeName("123");

      expect(result).toEqual({ name: "Meme 123" });
      expect(console.error).toHaveBeenCalledWith(
        "Error fetching meme name:",
        expect.any(Error)
      );
    });

    it("returns null when no name in response", async () => {
      mockCommonApiFetch.mockResolvedValueOnce({
        data: [{}],
      });

      const result = await fetchMemeName("123");

      expect(result).toBeNull();
    });
  });

  describe("fetchNextgenName", () => {
    it("returns nextgen name when API call succeeds", async () => {
      mockCommonApiFetch.mockResolvedValueOnce({ name: "Test Nextgen" });

      const result = await fetchNextgenName("123", true);

      expect(result).toEqual({ name: "Test Nextgen" });
      expect(mockCommonApiFetch).toHaveBeenCalledWith({
        endpoint: "nextgen/collections/123",
      });
    });

    it("returns null for invalid input", async () => {
      expect(await fetchNextgenName("")).toBeNull();
      expect(await fetchNextgenName(null as any)).toBeNull();
      expect(await fetchNextgenName(123 as any)).toBeNull();
    });

    it("returns fallback name on API error", async () => {
      mockCommonApiFetch.mockRejectedValueOnce(new Error("API Error"));

      const result = await fetchNextgenName("123");

      expect(result).toEqual({ name: "Nextgen 123" });
      expect(console.error).toHaveBeenCalledWith(
        "Error fetching nextgen name:",
        expect.any(Error)
      );
    });
  });

  describe("fetchRememeName", () => {
    it("returns rememe name when API call succeeds", async () => {
      mockCommonApiFetch.mockResolvedValueOnce({
        data: [{ metadata: { name: "Test Rememe" } }],
      });

      const result = await fetchRememeName("contract123", "456");

      expect(result).toEqual({ name: "Test Rememe" });
      expect(mockCommonApiFetch).toHaveBeenCalledWith({
        endpoint: "rememes",
        params: { contract: "contract123", id: "456" },
      });
    });

    it("returns null for invalid input", async () => {
      expect(await fetchRememeName("contract", "")).toBeNull();
      expect(await fetchRememeName("contract", null as any)).toBeNull();
      expect(await fetchRememeName("contract", 123 as any)).toBeNull();
    });

    it("returns fallback name on API error", async () => {
      mockCommonApiFetch.mockRejectedValueOnce(new Error("API Error"));

      const result = await fetchRememeName("contract123", "456");

      expect(result).toEqual({ name: "Rememe 456" });
      expect(console.error).toHaveBeenCalledWith(
        "Error fetching rememe name:",
        expect.any(Error)
      );
    });

    it("returns fallback when no data", async () => {
      mockCommonApiFetch.mockResolvedValueOnce({ data: [] });

      const result = await fetchRememeName("contract123", "456");

      expect(result).toEqual({ name: "Rememe 456" });
    });
  });

  describe("fetchMemeLabName", () => {
    it("returns meme lab name when API call succeeds", async () => {
      mockCommonApiFetch.mockResolvedValueOnce({
        data: [{ name: "Test Meme Lab" }],
      });

      const result = await fetchMemeLabName("123");

      expect(result).toEqual({ name: "Test Meme Lab" });
      expect(mockCommonApiFetch).toHaveBeenCalledWith({
        endpoint: "nfts_memelab",
        params: { contract: MEMELAB_CONTRACT, id: "123" },
      });
    });

    it("returns null for invalid input", async () => {
      expect(await fetchMemeLabName("")).toBeNull();
      expect(await fetchMemeLabName(null as any)).toBeNull();
      expect(await fetchMemeLabName(123 as any)).toBeNull();
    });

    it("returns fallback name on API error", async () => {
      mockCommonApiFetch.mockRejectedValueOnce(new Error("API Error"));

      const result = await fetchMemeLabName("123");

      expect(result).toEqual({ name: "Meme Lab 123" });
      expect(console.error).toHaveBeenCalledWith(
        "Error fetching meme lab name:",
        expect.any(Error)
      );
    });
  });

  describe("fetchCollectionName", () => {
    it("returns collection name when API call succeeds", async () => {
      mockCommonApiFetch.mockResolvedValueOnce({
        data: [{ name: "Test Collection" }],
      });

      const result = await fetchCollectionName("123");

      expect(result).toEqual({ name: "Test Collection" });
      expect(mockCommonApiFetch).toHaveBeenCalledWith({
        endpoint: "collections",
        params: { id: "123" },
      });
    });

    it("returns null for invalid input", async () => {
      expect(await fetchCollectionName("")).toBeNull();
      expect(await fetchCollectionName(null as any)).toBeNull();
      expect(await fetchCollectionName(123 as any)).toBeNull();
    });

    it("returns fallback name on API error", async () => {
      mockCommonApiFetch.mockRejectedValueOnce(new Error("API Error"));

      const result = await fetchCollectionName("123");

      expect(result).toEqual({ name: "Collection 123" });
      expect(console.error).toHaveBeenCalledWith(
        "Error fetching collection name:",
        expect.any(Error)
      );
    });

    it("returns null when no name in response", async () => {
      mockCommonApiFetch.mockResolvedValueOnce({
        data: [{}],
      });

      const result = await fetchCollectionName("123");

      expect(result).toBeNull();
    });
  });
});
