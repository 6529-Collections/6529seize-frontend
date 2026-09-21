jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { getTheMemesInitialData } from "@/app/the-memes/theMemesInitialData";

const mockAnonymousSsrFetch = jest.fn();
const meme = {
  id: 1,
  contract: "0x123",
  name: "Meme #1",
  thumbnail: "https://images.test/1.jpg",
  scaled: "https://images.test/1.jpg",
  meme_name: "Meme",
  image: null,
  animation: null,
  compressed_animation: null,
  mint_date: "2022-06-09T00:00:00Z",
};

jest.mock("@/lib/fetch/ssrFetch", () => ({
  anonymousSsrFetch: (...args: unknown[]) => mockAnonymousSsrFetch(...args),
}));

describe("getTheMemesInitialData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches the bounded anonymous default page without caching it", async () => {
    const data = [meme];
    mockAnonymousSsrFetch.mockResolvedValue({
      json: async () => ({ data, next: "https://api.test/next" }),
      ok: true,
    } as Response);

    await expect(getTheMemesInitialData({})).resolves.toEqual({
      nfts: data,
      nextPage: "https://api.test/next",
    });
    expect(mockAnonymousSsrFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/memes_extended_data?page_size=48&sort=mint_date&sort_direction=ASC"
      ),
      { cache: "no-store" }
    );
  });

  it("leaves filtered views on their existing client data path", async () => {
    await expect(getTheMemesInitialData({ szn: "1" })).resolves.toBeUndefined();

    expect(mockAnonymousSsrFetch).not.toHaveBeenCalled();
  });

  it.each([
    null,
    "not a card",
    {},
    { ...meme, id: "1" },
    { ...meme, id: -1 },
    { ...meme, name: {} },
    { ...meme, thumbnail: {} },
    { ...meme, animation: [] },
  ])(
    "rejects a malformed card anywhere in the first page: %j",
    async (item) => {
      mockAnonymousSsrFetch.mockResolvedValue({
        json: async () => ({ data: [meme, item], next: null }),
        ok: true,
      });

      await expect(getTheMemesInitialData({})).resolves.toBeUndefined();
    }
  );

  it("preserves a valid empty first page", async () => {
    mockAnonymousSsrFetch.mockResolvedValue({
      json: async () => ({ data: [], next: null }),
      ok: true,
    });

    await expect(getTheMemesInitialData({})).resolves.toEqual({
      nfts: [],
      nextPage: undefined,
    });
  });

  it("fails closed to the existing client loader when the upstream is unavailable", async () => {
    mockAnonymousSsrFetch.mockRejectedValue(new Error("unavailable"));

    await expect(getTheMemesInitialData({})).resolves.toBeUndefined();
  });
});
