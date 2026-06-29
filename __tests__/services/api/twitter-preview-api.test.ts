import type { TweetPreview } from "@/lib/twitter";

describe("fetchTwitterPreview", () => {
  const originalFetch = globalThis.fetch;
  const fetchMock = jest.fn();

  const loadApi = async () => import("@/services/api/twitter-preview-api");

  const createResponse = (
    body: unknown,
    options: { ok?: boolean | undefined } = {}
  ) =>
    ({
      ok: options.ok ?? true,
      json: async () => body,
    }) as Response;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();
    fetchMock.mockReset();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    globalThis.fetch = originalFetch;
  });

  it("batches same-tick calls into one POST", async () => {
    const firstUrl = "https://x.com/first/status/1001";
    const secondUrl = "https://twitter.com/second/status/1002";
    const firstPreview: TweetPreview = {
      tweetId: "1001",
      url: firstUrl,
      text: "First post",
    };
    const secondPreview: TweetPreview = {
      tweetId: "1002",
      url: secondUrl,
      text: "Second post",
    };
    fetchMock.mockResolvedValueOnce(
      createResponse({
        results: {
          [firstUrl]: firstPreview,
          [secondUrl]: secondPreview,
        },
        errors: {},
      })
    );

    const { fetchTwitterPreview } = await loadApi();
    const first = fetchTwitterPreview(firstUrl);
    const second = fetchTwitterPreview(secondUrl);

    expect(fetchMock).not.toHaveBeenCalled();

    jest.runOnlyPendingTimers();

    await expect(Promise.all([first, second])).resolves.toEqual([
      firstPreview,
      secondPreview,
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/twitter/preview",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ urls: [firstUrl, secondUrl] }),
      })
    );
  });

  it("splits same-tick calls into POST chunks of 5 URLs", async () => {
    const urls = Array.from(
      { length: 6 },
      (_value, index) => `https://x.com/user/status/${4000 + index}`
    );
    const previews = urls.map(
      (url, index): TweetPreview => ({
        tweetId: `${4000 + index}`,
        url,
        text: `Post ${index + 1}`,
      })
    );
    fetchMock
      .mockResolvedValueOnce(
        createResponse({
          results: Object.fromEntries(
            urls.slice(0, 5).map((url, index) => [url, previews[index]])
          ),
          errors: {},
        })
      )
      .mockResolvedValueOnce(
        createResponse({
          results: {
            [urls[5]!]: previews[5],
          },
          errors: {},
        })
      );

    const { fetchTwitterPreview } = await loadApi();
    const requests = urls.map((url) => fetchTwitterPreview(url));

    jest.runOnlyPendingTimers();

    await expect(Promise.all(requests)).resolves.toEqual(previews);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        body: JSON.stringify({ urls: urls.slice(0, 5) }),
      })
    );
    expect(fetchMock.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        body: JSON.stringify({ urls: [urls[5]] }),
      })
    );
  });

  it("shares one pending promise for duplicate tweet IDs", async () => {
    const firstUrl = "https://x.com/first/status/1001";
    const secondUrl = "https://twitter.com/second/status/1001";
    const preview: TweetPreview = {
      tweetId: "1001",
      url: firstUrl,
      text: "Shared post",
    };
    fetchMock.mockResolvedValueOnce(
      createResponse({
        results: {
          [firstUrl]: preview,
        },
        errors: {},
      })
    );

    const { fetchTwitterPreview } = await loadApi();
    const first = fetchTwitterPreview(firstUrl);
    const second = fetchTwitterPreview(secondUrl);

    expect(second).toBe(first);

    jest.runOnlyPendingTimers();

    await expect(first).resolves.toEqual(preview);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        body: JSON.stringify({ urls: [firstUrl] }),
      })
    );
  });

  it("rejects only the URL that failed in the batch and clears it for retry", async () => {
    const goodUrl = "https://x.com/good/status/2001";
    const badUrl = "https://x.com/bad/status/2002";
    const goodPreview: TweetPreview = {
      tweetId: "2001",
      url: goodUrl,
      text: "Good post",
    };
    const retryPreview: TweetPreview = {
      tweetId: "2002",
      url: badUrl,
      text: "Recovered post",
    };
    fetchMock
      .mockResolvedValueOnce(
        createResponse({
          results: {
            [goodUrl]: goodPreview,
          },
          errors: {
            [badUrl]: "Invalid Twitter/X status URL.",
          },
        })
      )
      .mockResolvedValueOnce(
        createResponse({
          results: {
            [badUrl]: retryPreview,
          },
          errors: {},
        })
      );

    const { fetchTwitterPreview } = await loadApi();
    const good = fetchTwitterPreview(goodUrl);
    const bad = fetchTwitterPreview(badUrl);

    jest.runOnlyPendingTimers();

    await expect(good).resolves.toEqual(goodPreview);
    await expect(bad).rejects.toThrow("Invalid Twitter/X status URL.");

    const retry = fetchTwitterPreview(badUrl);
    jest.runOnlyPendingTimers();

    await expect(retry).resolves.toEqual(retryPreview);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to single GET requests when the POST batch fails", async () => {
    const firstUrl = "https://x.com/first/status/3001";
    const secondUrl = "https://x.com/second/status/3002";
    const firstPreview: TweetPreview = {
      tweetId: "3001",
      url: firstUrl,
      text: "First post",
    };
    const secondPreview: TweetPreview = {
      tweetId: "3002",
      url: secondUrl,
      text: "Second post",
    };
    fetchMock
      .mockRejectedValueOnce(new Error("batch unavailable"))
      .mockResolvedValueOnce(createResponse(firstPreview))
      .mockResolvedValueOnce(createResponse(secondPreview));

    const { fetchTwitterPreview } = await loadApi();
    const first = fetchTwitterPreview(firstUrl);
    const second = fetchTwitterPreview(secondUrl);

    jest.runOnlyPendingTimers();

    await expect(Promise.all([first, second])).resolves.toEqual([
      firstPreview,
      secondPreview,
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/twitter/preview");
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "/api/twitter/preview?url=https%3A%2F%2Fx.com%2Ffirst%2Fstatus%2F3001"
    );
    expect(fetchMock.mock.calls[2]?.[0]).toBe(
      "/api/twitter/preview?url=https%3A%2F%2Fx.com%2Fsecond%2Fstatus%2F3002"
    );
  });
});
