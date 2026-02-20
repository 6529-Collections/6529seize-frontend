import { fetchNftLink } from "@/services/api/nft-link-api";

describe("fetchNftLink", () => {
  const fetchMock = global.fetch as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock.mockReset();
  });

  it("returns object response when /nft-link payload shape is valid", async () => {
    const response = {
      is_enrichable: true,
      validation_error: null,
      data: null,
    };

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => response,
    });

    const result = await fetchNftLink(" https://opensea.io/item/test ");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.test.6529.io/api/nft-link?url=https%3A%2F%2Fopensea.io%2Fitem%2Ftest",
      expect.objectContaining({
        method: "GET",
      })
    );
    expect(result).toEqual(response);
  });

  it("throws when /nft-link returns an array payload", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          is_enrichable: true,
          validation_error: null,
          data: null,
        },
      ],
    });

    await expect(fetchNftLink("https://opensea.io/item/test")).rejects.toThrow(
      "Invalid /nft-link response shape: expected an object response."
    );
  });
});
