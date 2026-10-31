import MemeLabCardLayout from "@/app/meme-lab/[id]/layout";
import { MEMELAB_CONTRACT } from "@/constants/constants";
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
const NOT_FOUND_ERROR = { digest: "NEXT_HTTP_ERROR_FALLBACK;404" };
const children = <p>card</p>;

function renderLayout(id: string) {
  return MemeLabCardLayout({
    children,
    params: Promise.resolve({ id }),
  });
}

describe("Meme Lab card layout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("answers not found before any streaming boundary when the card is unknown", async () => {
    mockFetchUrl.mockResolvedValue({ data: [] });

    await expect(renderLayout("99999999")).rejects.toMatchObject(
      NOT_FOUND_ERROR
    );
  });

  it.each(["0", "abc", "-5"])(
    "answers not found for the invalid id %s without calling the API",
    async (id) => {
      await expect(renderLayout(id)).rejects.toMatchObject(NOT_FOUND_ERROR);

      expect(mockFetchUrl).not.toHaveBeenCalled();
    }
  );

  it("renders a published card", async () => {
    mockFetchUrl.mockResolvedValue({
      data: [{ id: 4, contract: MEMELAB_CONTRACT }],
    });

    await expect(renderLayout("4")).resolves.toBe(children);
  });

  it("keeps rendering when the API is unavailable so the client can retry", async () => {
    mockFetchUrl.mockRejectedValue(new Error("HTTP error! status: 503"));
    jest.spyOn(console, "warn").mockImplementation(() => undefined);

    await expect(renderLayout("4")).resolves.toBe(children);
  });
});
