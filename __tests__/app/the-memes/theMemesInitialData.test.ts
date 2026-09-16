jest.mock("server-only", () => ({}), { virtual: true });

import { getTheMemesInitialData } from "@/app/the-memes/theMemesInitialData";

const originalFetch = globalThis.fetch;

describe("getTheMemesInitialData", () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches the bounded anonymous default page without caching it", async () => {
    const data = [{ id: 1, name: "Meme #1" }];
    jest.mocked(globalThis.fetch).mockResolvedValue({
      json: async () => ({ data, next: "https://api.test/next" }),
      ok: true,
    } as Response);

    await expect(getTheMemesInitialData({})).resolves.toEqual({
      nfts: data,
      nextPage: "https://api.test/next",
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/memes_extended_data?page_size=48&sort=mint_date&sort_direction=ASC"
      ),
      { cache: "no-store" }
    );
  });

  it("leaves filtered views on their existing client data path", async () => {
    await expect(
      getTheMemesInitialData({ szn: "1" })
    ).resolves.toBeUndefined();

    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("fails closed to the existing client loader when the upstream is unavailable", async () => {
    jest.mocked(globalThis.fetch).mockRejectedValue(new Error("unavailable"));

    await expect(getTheMemesInitialData({})).resolves.toBeUndefined();
  });
});
