import { fetchWikimediaCard } from "@/services/api/wikimedia-card";

const jsonResponse = (body: unknown) =>
  ({
    ok: true,
    json: async () => body,
  }) as Response;

const unavailableCard = {
  kind: "unavailable",
  canonicalUrl: "https://en.wikipedia.org/wiki/Example",
  pageUrl: "https://en.wikipedia.org/wiki/Example",
  source: "wikipedia",
  reason: "upstream-error",
};

const articleCard = {
  kind: "article",
  canonicalUrl: "https://en.wikipedia.org/wiki/Example",
  pageUrl: "https://en.wikipedia.org/wiki/Example",
  source: "wikipedia",
  title: "Example",
  lang: "en",
};

describe("fetchWikimediaCard", () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  it("retries a URL whose card came back unavailable", async () => {
    const url = "https://en.wikipedia.org/wiki/Example?retry=1";
    fetchMock
      .mockResolvedValueOnce(jsonResponse(unavailableCard))
      .mockResolvedValueOnce(jsonResponse(articleCard));

    await expect(fetchWikimediaCard(url)).resolves.toMatchObject({
      kind: "unavailable",
    });
    await expect(fetchWikimediaCard(url)).resolves.toMatchObject({
      kind: "article",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps serving an available card from the cache", async () => {
    const url = "https://en.wikipedia.org/wiki/Example?cached=1";
    fetchMock.mockResolvedValueOnce(jsonResponse(articleCard));

    await fetchWikimediaCard(url);
    await expect(fetchWikimediaCard(url)).resolves.toMatchObject({
      kind: "article",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
