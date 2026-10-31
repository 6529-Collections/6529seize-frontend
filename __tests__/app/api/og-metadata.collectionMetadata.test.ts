import { ReadableStream } from "node:stream/web";

jest.mock("@/config/env", () => ({
  publicEnv: {
    API_ENDPOINT: "https://api.6529.test",
  },
}));

jest.mock("@/config/serverEnv", () => ({
  getStagingApiKey: jest.fn(),
}));

import {
  fetchLatestMemeMintTitle,
  fetchNextgenCollectionCard,
} from "@/app/api/og-metadata/collections/[collection]/metadata";

const mockFetch = jest.fn();
const originalFetch = globalThis.fetch;

const jsonResponse = (data: unknown) => ({
  ok: true,
  status: 200,
  headers: new Headers({ "content-type": "application/json" }),
  body: new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(JSON.stringify(data)));
      controller.close();
    },
  }),
});

describe("collection card metadata", () => {
  beforeEach(() => {
    globalThis.fetch = mockFetch;
    mockFetch.mockReset();
  });
  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  describe("fetchNextgenCollectionCard", () => {
    it("loads the matching collection from the fixed endpoint", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({
          id: 7,
          name: "Pebbles",
          banner: "https://cdn.test/banner.png",
          image: "https://cdn.test/image.png",
        })
      );

      await expect(fetchNextgenCollectionCard("7")).resolves.toEqual({
        name: "Pebbles",
        imageUrl: "https://cdn.test/banner.png",
      });
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.6529.test/api/nextgen/collections/7",
        expect.objectContaining({ redirect: "error" })
      );
    });

    it.each([
      "..%2f",
      "../7",
      "7/../8",
      "@evil.com",
      "https://evil.test/7",
      "//evil.test",
      "7?admin=1",
      "7#",
      "abc",
      "-1",
      "",
      "1234567890",
    ])("never requests the invalid collection ID %j", async (id) => {
      await expect(fetchNextgenCollectionCard(id)).resolves.toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it.each([
      { id: 8, name: "Other" },
      { id: 7 },
      { id: 7, name: "   " },
      "invalid",
      null,
    ])("rejects a mismatched or malformed response (%j)", async (data) => {
      mockFetch.mockResolvedValue(jsonResponse(data));

      await expect(fetchNextgenCollectionCard("7")).resolves.toBeNull();
    });

    it("returns null when the request fails", async () => {
      mockFetch.mockRejectedValue(new Error("network"));

      await expect(fetchNextgenCollectionCard("7")).resolves.toBeNull();
    });
  });

  describe("fetchLatestMemeMintTitle", () => {
    it("builds the mint title from the latest meme", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({ id: 491, name: "Seize the Memes" })
      );

      await expect(fetchLatestMemeMintTitle()).resolves.toBe(
        "Mint #491 | Seize the Memes | The Memes"
      );
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.6529.test/api/memes_latest",
        expect.objectContaining({ redirect: "error" })
      );
    });

    it.each([{ id: 491 }, { name: "Seize the Memes" }, { id: "491" }, null])(
      "returns null for an incomplete response (%j)",
      async (data) => {
        mockFetch.mockResolvedValue(jsonResponse(data));

        await expect(fetchLatestMemeMintTitle()).resolves.toBeNull();
      }
    );
  });
});
