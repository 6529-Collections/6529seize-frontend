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

  const createPreview = (
    url: string,
    tweetId: string,
    text: string
  ): TweetPreview => ({
    tweetId,
    url,
    text,
  });

  const createBatchSuccessResponse = (previews: readonly TweetPreview[]) =>
    createResponse({
      results: Object.fromEntries(
        previews.map((preview) => [preview.url, preview])
      ),
      errors: {},
    });

  const createDeferred = <T>() => {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((promiseResolve, promiseReject) => {
      resolve = promiseResolve;
      reject = promiseReject;
    });

    return { promise, resolve, reject };
  };

  const waitForFetchCalls = async (count: number): Promise<void> => {
    for (
      let attempts = 0;
      attempts < 20 && fetchMock.mock.calls.length < count;
      attempts += 1
    ) {
      await Promise.resolve();
    }
  };

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
    const firstPreview = createPreview(firstUrl, "1001", "First post");
    const secondPreview = createPreview(secondUrl, "1002", "Second post");
    fetchMock.mockResolvedValueOnce(
      createBatchSuccessResponse([firstPreview, secondPreview])
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
    const previews = urls.map((url, index) =>
      createPreview(url, `${4000 + index}`, `Post ${index + 1}`)
    );
    fetchMock
      .mockResolvedValueOnce(createBatchSuccessResponse(previews.slice(0, 5)))
      .mockResolvedValueOnce(createBatchSuccessResponse(previews.slice(5, 6)));

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

  it("limits active POST chunks and starts queued chunks after completion", async () => {
    const urls = Array.from(
      { length: 11 },
      (_value, index) => `https://x.com/user/status/${5000 + index}`
    );
    const previews = urls.map((url, index) =>
      createPreview(url, `${5000 + index}`, `Post ${index + 1}`)
    );
    const batchResponse = (start: number, end: number) =>
      createBatchSuccessResponse(previews.slice(start, end));
    const firstBatch = createDeferred<Response>();
    const secondBatch = createDeferred<Response>();
    fetchMock
      .mockReturnValueOnce(firstBatch.promise)
      .mockReturnValueOnce(secondBatch.promise)
      .mockResolvedValueOnce(batchResponse(10, 11));

    const { fetchTwitterPreview } = await loadApi();
    const requests = urls.map((url) => fetchTwitterPreview(url));

    jest.runOnlyPendingTimers();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        body: JSON.stringify({ urls: urls.slice(0, 5) }),
      })
    );
    expect(fetchMock.mock.calls[1]?.[1]).toEqual(
      expect.objectContaining({
        body: JSON.stringify({ urls: urls.slice(5, 10) }),
      })
    );

    firstBatch.resolve(batchResponse(0, 5));
    await waitForFetchCalls(3);

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2]?.[1]).toEqual(
      expect.objectContaining({
        body: JSON.stringify({ urls: urls.slice(10, 11) }),
      })
    );

    secondBatch.resolve(batchResponse(5, 10));

    await expect(Promise.all(requests)).resolves.toEqual(previews);
  });

  it("shares one pending promise for duplicate tweet IDs", async () => {
    const firstUrl = "https://x.com/first/status/1001";
    const secondUrl = "https://twitter.com/second/status/1001";
    const preview = createPreview(firstUrl, "1001", "Shared post");
    fetchMock.mockResolvedValueOnce(createBatchSuccessResponse([preview]));

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
    const goodPreview = createPreview(goodUrl, "2001", "Good post");
    const retryPreview = createPreview(badUrl, "2002", "Recovered post");
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
      .mockResolvedValueOnce(createBatchSuccessResponse([retryPreview]));

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

  it("rejects and clears cache when the batch omits the requested URL", async () => {
    const url = "https://x.com/missing/status/2003";
    const retryPreview = createPreview(url, "2003", "Recovered post");
    fetchMock
      .mockResolvedValueOnce(
        createResponse({
          results: {},
          errors: {},
        })
      )
      .mockResolvedValueOnce(createBatchSuccessResponse([retryPreview]));

    const { fetchTwitterPreview } = await loadApi();
    const request = fetchTwitterPreview(url);

    jest.runOnlyPendingTimers();

    await expect(request).rejects.toThrow(
      "Failed to fetch Twitter/X preview metadata."
    );

    const retry = fetchTwitterPreview(url);
    jest.runOnlyPendingTimers();

    await expect(retry).resolves.toEqual(retryPreview);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to a single GET request when a one-url POST batch fails", async () => {
    const url = "https://x.com/first/status/3001";
    const preview = createPreview(url, "3001", "First post");
    fetchMock
      .mockRejectedValueOnce(new Error("batch unavailable"))
      .mockResolvedValueOnce(createResponse(preview));

    const { fetchTwitterPreview } = await loadApi();
    const request = fetchTwitterPreview(url);

    jest.runOnlyPendingTimers();

    await expect(request).resolves.toEqual(preview);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/twitter/preview");
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "/api/twitter/preview?url=https%3A%2F%2Fx.com%2Ffirst%2Fstatus%2F3001"
    );
  });

  it("does not fan out GET requests when a multi-url POST batch fails", async () => {
    const firstUrl = "https://x.com/first/status/3001";
    const secondUrl = "https://x.com/second/status/3002";
    fetchMock.mockRejectedValueOnce(new Error("batch unavailable"));

    const { fetchTwitterPreview } = await loadApi();
    const first = fetchTwitterPreview(firstUrl);
    const second = fetchTwitterPreview(secondUrl);

    jest.runOnlyPendingTimers();

    await expect(first).rejects.toThrow("batch unavailable");
    await expect(second).rejects.toThrow("batch unavailable");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/twitter/preview");
  });
});
