import { lookupNft } from "@/lib/structured-data/nft";
import { fetchUrl } from "@/services/6529api";

jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn(),
}));

jest.mock("@/config/env", () => ({
  publicEnv: {
    API_ENDPOINT: "https://api.test.6529.io",
    BASE_ENDPOINT: "https://6529.io",
  },
}));

const mockFetchUrl = fetchUrl as jest.Mock;
const contract = "0x0C58Ef43fF3032005e472cB5709f8908aCb00205";

describe("lookupNft", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("returns the token when the API knows it", async () => {
    const nft = { id: 12, contract, name: "6529 Gradient #12" };
    mockFetchUrl.mockResolvedValue({ data: [nft] });

    await expect(lookupNft({ contract, id: "12" })).resolves.toEqual({
      status: "found",
      nft,
    });
    expect(mockFetchUrl).toHaveBeenCalledWith(
      `https://api.test.6529.io/api/nfts?contract=${contract}&id=12`
    );
  });

  it("reports a token the API does not know as missing", async () => {
    mockFetchUrl.mockResolvedValue({ data: [] });

    await expect(lookupNft({ contract, id: "99999" })).resolves.toEqual({
      status: "missing",
    });
  });

  it("does not mistake a failed request for a missing token", async () => {
    mockFetchUrl.mockRejectedValue(new Error("HTTP error! status: 503"));

    await expect(lookupNft({ contract, id: "12" })).resolves.toEqual({
      status: "unavailable",
    });
  });

  it("does not mistake a malformed response for a missing token", async () => {
    mockFetchUrl.mockResolvedValue({});

    await expect(lookupNft({ contract, id: "12" })).resolves.toEqual({
      status: "unavailable",
    });
  });

  it("queries the requested API path", async () => {
    mockFetchUrl.mockResolvedValue({ data: [] });

    await lookupNft({ contract, id: "3", apiPath: "nfts_memelab" });

    expect(mockFetchUrl).toHaveBeenCalledWith(
      `https://api.test.6529.io/api/nfts_memelab?contract=${contract}&id=3`
    );
  });
});
