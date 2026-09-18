jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { getTheMemesInitialData } from "@/app/the-memes/theMemesInitialData";

const mockAnonymousSsrFetch = jest.fn();

jest.mock("@/lib/fetch/ssrFetch", () => ({
  anonymousSsrFetch: (...args: unknown[]) => mockAnonymousSsrFetch(...args),
}));

describe("getTheMemesInitialData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches the bounded anonymous default page without caching it", async () => {
    const data = [{ id: 1, name: "Meme #1" }];
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

  it("fails closed to the existing client loader when the upstream is unavailable", async () => {
    mockAnonymousSsrFetch.mockRejectedValue(new Error("unavailable"));

    await expect(getTheMemesInitialData({})).resolves.toBeUndefined();
  });
});
