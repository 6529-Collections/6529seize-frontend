import MemeCardLayout from "@/app/the-memes/[id]/layout";
import { MEMES_CONTRACT } from "@/constants/constants";
import { fetchUrl } from "@/services/6529api";

jest.mock("@/services/6529api", () => ({
  fetchUrl: jest.fn(),
}));

jest.mock("@/components/meme-calendar/meme-calendar.helpers", () => ({
  getCanonicalNextMintNumber: () => 123,
}));

jest.mock("@/config/env", () => ({
  publicEnv: {
    API_ENDPOINT: "https://api.test.6529.io",
    BASE_ENDPOINT: "https://6529.io",
  },
}));

const mockFetchUrl = fetchUrl as jest.Mock;
const NOT_FOUND_ERROR = { digest: "NEXT_HTTP_ERROR_FALLBACK;404" };
const children = <p>card</p>;

function renderLayout(id: string) {
  return MemeCardLayout({
    children,
    params: Promise.resolve({ id }),
  });
}

describe("The Memes card layout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("answers not found before any streaming boundary when the card is unknown", async () => {
    mockFetchUrl.mockResolvedValue({ data: [] });

    await expect(renderLayout("999999999")).rejects.toMatchObject(
      NOT_FOUND_ERROR
    );
  });

  it.each(["0", "-1", "abc", "1.5", "1e3"])(
    "answers not found for the invalid id %s without calling the API",
    async (id) => {
      await expect(renderLayout(id)).rejects.toMatchObject(NOT_FOUND_ERROR);

      expect(mockFetchUrl).not.toHaveBeenCalled();
    }
  );

  it("renders a published card", async () => {
    mockFetchUrl.mockImplementation((url: string) =>
      Promise.resolve({
        data: url.includes("/api/nfts?")
          ? [{ id: 7, contract: MEMES_CONTRACT }]
          : [{ id: 7 }],
      })
    );

    await expect(renderLayout("7")).resolves.toBe(children);
  });

  it("renders the confirmed upcoming mint before it is published", async () => {
    mockFetchUrl.mockResolvedValue({ data: [] });

    await expect(renderLayout("123")).resolves.toBe(children);
  });

  it("keeps rendering when the API is unavailable so the client can retry", async () => {
    mockFetchUrl.mockRejectedValue(new Error("HTTP error! status: 503"));
    jest.spyOn(console, "warn").mockImplementation(() => undefined);

    await expect(renderLayout("7")).resolves.toBe(children);
  });
});
