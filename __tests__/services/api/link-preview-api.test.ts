import type { LinkPreviewResponse } from "@/services/api/link-preview-api";

describe("fetchLinkPreview", () => {
  const originalFetch = global.fetch;
  const fetchMock = jest.fn();

  const loadApi = async () => import("@/services/api/link-preview-api");

  const createResponse = (
    body: unknown,
    options: { ok?: boolean | undefined } = {}
  ) =>
    ({
      ok: options.ok ?? true,
      json: async () => body,
    }) as Response;

  const createPendingJsonResponse = (
    options: { ok?: boolean | undefined } = {}
  ) => {
    const json = jest.fn(
      () =>
        new Promise<never>(() => {
          // Intentionally keep the body reader pending.
        })
    );

    return {
      response: {
        ok: options.ok ?? true,
        json,
      } as unknown as Response,
      json,
    };
  };

  type Deferred<T> = {
    readonly promise: Promise<T>;
    readonly resolve: (value: T) => void;
  };

  const createDeferred = <T>(): Deferred<T> => {
    let resolveDeferred!: (value: T) => void;
    const promise = new Promise<T>((resolve) => {
      resolveDeferred = resolve;
    });

    return {
      promise,
      resolve: resolveDeferred,
    };
  };

  const flushMicrotasks = async (): Promise<void> => {
    await Promise.resolve();
    await Promise.resolve();
  };

  const getFetchSignal = (callIndex: number): AbortSignal => {
    const init = fetchMock.mock.calls[callIndex]?.[1] as
      | RequestInit
      | undefined;
    const signal = init?.signal;

    if (!(signal instanceof AbortSignal)) {
      throw new Error(`Fetch call ${callIndex} did not include AbortSignal`);
    }

    return signal;
  };

  const createAbortError = (): Error => {
    const error = new Error("The operation was aborted.");
    error.name = "AbortError";

    return error;
  };

  const createAbortableFetchResponse = (
    init: RequestInit | undefined
  ): Promise<Response> => {
    const signal = init?.signal;

    if (!(signal instanceof AbortSignal)) {
      return Promise.reject(new Error("Missing AbortSignal"));
    }

    return new Promise<Response>((_resolve, reject) => {
      signal.addEventListener(
        "abort",
        () => {
          reject(createAbortError());
        },
        { once: true }
      );
    });
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    global.fetch = originalFetch;
  });

  it("batches same-tick calls into one POST", async () => {
    const firstPreview: LinkPreviewResponse = {
      requestUrl: "https://one.example/article",
      title: "One",
    };
    const secondPreview: LinkPreviewResponse = {
      requestUrl: "https://two.example/article",
      title: "Two",
    };
    fetchMock.mockResolvedValueOnce(
      createResponse({
        results: {
          "https://one.example/article": firstPreview,
          "https://two.example/article": secondPreview,
        },
        errors: {},
      })
    );

    const { fetchLinkPreview } = await loadApi();
    const first = fetchLinkPreview("https://one.example/article");
    const second = fetchLinkPreview("https://two.example/article");

    expect(fetchMock).not.toHaveBeenCalled();

    jest.runOnlyPendingTimers();

    await expect(first).resolves.toEqual(firstPreview);
    await expect(second).resolves.toEqual(secondPreview);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/open-graph",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          urls: ["https://one.example/article", "https://two.example/article"],
        }),
      })
    );
    expect(getFetchSignal(0).aborted).toBe(false);
  });

  it("normalizes Manifold original images in batch responses", async () => {
    const preview: LinkPreviewResponse = {
      requestUrl: "https://manifold.xyz/@serhiikovbasyuk",
      title: "Serhii Kovbasyuk | Manifold",
      image: {
        url: "https://assets.manifold.xyz/original/8e55d2cffbeebf1ef17e8013ae10658068efc83344b3b2b28aab060df502efe3.jpg",
        secureUrl:
          "https://assets.manifold.xyz/original/8e55d2cffbeebf1ef17e8013ae10658068efc83344b3b2b28aab060df502efe3.jpg",
      },
      images: [
        {
          url: "https://assets.manifold.xyz/original/8e55d2cffbeebf1ef17e8013ae10658068efc83344b3b2b28aab060df502efe3.jpg",
          secureUrl:
            "https://assets.manifold.xyz/original/8e55d2cffbeebf1ef17e8013ae10658068efc83344b3b2b28aab060df502efe3.jpg",
        },
      ],
    };
    fetchMock.mockResolvedValueOnce(
      createResponse({
        results: {
          "https://manifold.xyz/@serhiikovbasyuk": preview,
        },
        errors: {},
      })
    );

    const { fetchLinkPreview } = await loadApi();
    const request = fetchLinkPreview("https://manifold.xyz/@serhiikovbasyuk");

    jest.runOnlyPendingTimers();

    await expect(request).resolves.toEqual(
      expect.objectContaining({
        image: {
          url: "https://assets.manifold.xyz/optimized/8e55d2cffbeebf1ef17e8013ae10658068efc83344b3b2b28aab060df502efe3/w_800.jpg",
          secureUrl:
            "https://assets.manifold.xyz/optimized/8e55d2cffbeebf1ef17e8013ae10658068efc83344b3b2b28aab060df502efe3/w_800.jpg",
        },
        images: [
          {
            url: "https://assets.manifold.xyz/optimized/8e55d2cffbeebf1ef17e8013ae10658068efc83344b3b2b28aab060df502efe3/w_800.jpg",
            secureUrl:
              "https://assets.manifold.xyz/optimized/8e55d2cffbeebf1ef17e8013ae10658068efc83344b3b2b28aab060df502efe3/w_800.jpg",
          },
        ],
      })
    );
  });

  it("splits same-tick calls into POST chunks of 5 urls", async () => {
    const urls = [
      "https://one.example/article",
      "https://two.example/article",
      "https://three.example/article",
      "https://four.example/article",
      "https://five.example/article",
      "https://six.example/article",
    ];
    const previews = urls.map(
      (url, index): LinkPreviewResponse => ({
        requestUrl: url,
        title: `Preview ${index + 1}`,
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

    const { fetchLinkPreview } = await loadApi();
    const requests = urls.map((url) => fetchLinkPreview(url));

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

  it("limits active POST chunks to 2 and keeps chunk promises independent", async () => {
    const urls = Array.from(
      { length: 11 },
      (_value, index) => `https://example.com/article-${index}`
    );
    const previews = urls.map(
      (url, index): LinkPreviewResponse => ({
        requestUrl: url,
        title: `Preview ${index}`,
      })
    );
    const chunkResponses = [
      createDeferred<Response>(),
      createDeferred<Response>(),
      createDeferred<Response>(),
    ];
    let fetchCallIndex = 0;
    fetchMock.mockImplementation(() => {
      const response = chunkResponses[fetchCallIndex];
      fetchCallIndex += 1;

      if (response === undefined) {
        return Promise.reject(new Error("Unexpected fetch call"));
      }

      return response.promise;
    });

    const { fetchLinkPreview } = await loadApi();
    const requests = urls.map((url) => fetchLinkPreview(url));
    const firstChunk = Promise.all(requests.slice(0, 5));
    const secondChunk = Promise.all(requests.slice(5, 10));
    const firstChunkResolved = jest.fn();
    void firstChunk.then(firstChunkResolved, () => undefined);

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

    chunkResponses[1]?.resolve(
      createResponse({
        results: Object.fromEntries(
          urls.slice(5, 10).map((url, index) => [url, previews[index + 5]])
        ),
        errors: {},
      })
    );

    await expect(secondChunk).resolves.toEqual(previews.slice(5, 10));
    expect(firstChunkResolved).not.toHaveBeenCalled();
    await flushMicrotasks();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2]?.[1]).toEqual(
      expect.objectContaining({
        body: JSON.stringify({ urls: urls.slice(10) }),
      })
    );

    chunkResponses[2]?.resolve(
      createResponse({
        results: {
          [urls[10]!]: previews[10],
        },
        errors: {},
      })
    );
    chunkResponses[0]?.resolve(
      createResponse({
        results: Object.fromEntries(
          urls.slice(0, 5).map((url, index) => [url, previews[index]])
        ),
        errors: {},
      })
    );

    await expect(Promise.all(requests)).resolves.toEqual(previews);
  });

  it("shares one pending promise for duplicate urls", async () => {
    const preview: LinkPreviewResponse = {
      requestUrl: "https://one.example/article",
      title: "One",
    };
    fetchMock.mockResolvedValueOnce(
      createResponse({
        results: {
          "https://one.example/article": preview,
        },
        errors: {},
      })
    );

    const { fetchLinkPreview } = await loadApi();
    const first = fetchLinkPreview(" https://one.example/article ");
    const second = fetchLinkPreview("https://one.example/article");

    expect(second).toBe(first);

    jest.runOnlyPendingTimers();

    await expect(first).resolves.toEqual(preview);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        body: JSON.stringify({ urls: ["https://one.example/article"] }),
      })
    );
  });

  it("returns cached previews without adding the url to a later batch", async () => {
    const preview: LinkPreviewResponse = {
      requestUrl: "https://one.example/article",
      title: "One",
    };
    fetchMock.mockResolvedValueOnce(
      createResponse({
        results: {
          "https://one.example/article": preview,
        },
        errors: {},
      })
    );

    const { fetchLinkPreview } = await loadApi();
    const first = fetchLinkPreview("https://one.example/article");
    jest.runOnlyPendingTimers();
    await expect(first).resolves.toEqual(preview);

    fetchMock.mockClear();
    const cached = fetchLinkPreview("https://one.example/article");

    await expect(cached).resolves.toEqual(preview);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects only the caller whose url failed in the batch", async () => {
    const goodPreview: LinkPreviewResponse = {
      requestUrl: "https://good.example/article",
      title: "Good",
    };
    const retryPreview: LinkPreviewResponse = {
      requestUrl: "https://bad.example/article",
      title: "Retry",
    };
    fetchMock
      .mockResolvedValueOnce(
        createResponse({
          results: {
            "https://good.example/article": goodPreview,
          },
          errors: {
            "https://bad.example/article": "Invalid or forbidden URL",
          },
        })
      )
      .mockResolvedValueOnce(
        createResponse({
          results: {
            "https://bad.example/article": retryPreview,
          },
          errors: {},
        })
      );

    const { fetchLinkPreview } = await loadApi();
    const good = fetchLinkPreview("https://good.example/article");
    const bad = fetchLinkPreview("https://bad.example/article");

    jest.runOnlyPendingTimers();

    await expect(good).resolves.toEqual(goodPreview);
    await expect(bad).rejects.toThrow("Invalid or forbidden URL");

    const retry = fetchLinkPreview("https://bad.example/article");
    jest.runOnlyPendingTimers();

    await expect(retry).resolves.toEqual(retryPreview);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("ignores inherited batch result and error keys", async () => {
    fetchMock.mockResolvedValueOnce(
      createResponse({
        results: {},
        errors: {},
      })
    );

    const { fetchLinkPreview } = await loadApi();
    const request = fetchLinkPreview("constructor");

    jest.runOnlyPendingTimers();

    await expect(request).rejects.toThrow(
      "Failed to fetch link preview metadata."
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        body: JSON.stringify({ urls: ["constructor"] }),
      })
    );
  });

  it("falls back to single GET requests when the batch request fails", async () => {
    const firstPreview: LinkPreviewResponse = {
      requestUrl: "https://one.example/article",
      title: "One",
    };
    const secondPreview: LinkPreviewResponse = {
      requestUrl: "https://two.example/article",
      title: "Two",
    };
    fetchMock
      .mockRejectedValueOnce(new Error("batch unavailable"))
      .mockResolvedValueOnce(createResponse(firstPreview))
      .mockResolvedValueOnce(createResponse(secondPreview));

    const { fetchLinkPreview } = await loadApi();
    const first = fetchLinkPreview("https://one.example/article");
    const second = fetchLinkPreview("https://two.example/article");

    jest.runOnlyPendingTimers();

    await expect(first).resolves.toEqual(firstPreview);
    await expect(second).resolves.toEqual(secondPreview);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/open-graph");
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "/api/open-graph?url=https%3A%2F%2Fone.example%2Farticle"
    );
    expect(fetchMock.mock.calls[2]?.[0]).toBe(
      "/api/open-graph?url=https%3A%2F%2Ftwo.example%2Farticle"
    );
    expect(getFetchSignal(1).aborted).toBe(false);
    expect(getFetchSignal(2).aborted).toBe(false);
  });

  it("normalizes Manifold original images in single GET fallback responses", async () => {
    const preview: LinkPreviewResponse = {
      requestUrl: "https://manifold.xyz/@artist/id/123",
      title: "Manifold listing",
      image: {
        url: "https://assets.manifold.xyz/original/f7858d47e672a94c82e37cfe602f5bd8ed3a722167f8321f85ebab276b88b184.png",
      },
    };
    fetchMock
      .mockRejectedValueOnce(new Error("batch unavailable"))
      .mockResolvedValueOnce(createResponse(preview));

    const { fetchLinkPreview } = await loadApi();
    const request = fetchLinkPreview("https://manifold.xyz/@artist/id/123");

    jest.runOnlyPendingTimers();

    await expect(request).resolves.toEqual(
      expect.objectContaining({
        image: {
          url: "https://assets.manifold.xyz/optimized/f7858d47e672a94c82e37cfe602f5bd8ed3a722167f8321f85ebab276b88b184/w_800.png",
        },
      })
    );
  });

  it("aborts timed-out single GET fallback requests", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("batch unavailable"))
      .mockImplementationOnce((_input: unknown, init?: RequestInit) =>
        createAbortableFetchResponse(init)
      );

    const { fetchLinkPreview } = await loadApi();
    const request = fetchLinkPreview("https://slow.example/article");

    jest.runOnlyPendingTimers();
    await flushMicrotasks();
    await flushMicrotasks();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const singleRequestSignal = getFetchSignal(1);
    expect(singleRequestSignal.aborted).toBe(false);

    jest.advanceTimersByTime(10_000);

    await expect(request).rejects.toThrow(
      "Failed to fetch link preview metadata. Request timed out."
    );
    expect(singleRequestSignal.aborted).toBe(true);
  });

  it("times out when single GET fallback json stalls and clears the failed cache entry", async () => {
    const url = "https://slow.example/article";
    const { response: stalledResponse, json } = createPendingJsonResponse();
    const retryPreview: LinkPreviewResponse = {
      requestUrl: url,
      title: "Retry",
    };
    fetchMock
      .mockRejectedValueOnce(new Error("batch unavailable"))
      .mockResolvedValueOnce(stalledResponse)
      .mockResolvedValueOnce(
        createResponse({
          results: {
            [url]: retryPreview,
          },
          errors: {},
        })
      );

    const { fetchLinkPreview } = await loadApi();
    const request = fetchLinkPreview(url);

    jest.runOnlyPendingTimers();
    await flushMicrotasks();
    await flushMicrotasks();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(json).toHaveBeenCalledTimes(1);
    const singleRequestSignal = getFetchSignal(1);
    expect(singleRequestSignal.aborted).toBe(false);

    jest.advanceTimersByTime(10_000);

    await expect(request).rejects.toThrow(
      "Failed to fetch link preview metadata. Request timed out."
    );
    expect(singleRequestSignal.aborted).toBe(true);

    const retry = fetchLinkPreview(url);
    jest.runOnlyPendingTimers();

    await expect(retry).resolves.toEqual(retryPreview);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("falls back to single GET requests when batch response json times out", async () => {
    const firstUrl = "https://one.example/article";
    const secondUrl = "https://two.example/article";
    const firstPreview: LinkPreviewResponse = {
      requestUrl: firstUrl,
      title: "One",
    };
    const secondPreview: LinkPreviewResponse = {
      requestUrl: secondUrl,
      title: "Two",
    };
    const { response: stalledBatchResponse, json } =
      createPendingJsonResponse();
    fetchMock
      .mockResolvedValueOnce(stalledBatchResponse)
      .mockResolvedValueOnce(createResponse(firstPreview))
      .mockResolvedValueOnce(createResponse(secondPreview));

    const { fetchLinkPreview } = await loadApi();
    const first = fetchLinkPreview(firstUrl);
    const second = fetchLinkPreview(secondUrl);

    jest.runOnlyPendingTimers();
    await flushMicrotasks();
    await flushMicrotasks();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(json).toHaveBeenCalledTimes(1);
    const batchSignal = getFetchSignal(0);
    expect(batchSignal.aborted).toBe(false);

    jest.advanceTimersByTime(10_000);

    await expect(Promise.all([first, second])).resolves.toEqual([
      firstPreview,
      secondPreview,
    ]);
    expect(batchSignal.aborted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "/api/open-graph?url=https%3A%2F%2Fone.example%2Farticle"
    );
    expect(fetchMock.mock.calls[2]?.[0]).toBe(
      "/api/open-graph?url=https%3A%2F%2Ftwo.example%2Farticle"
    );
  });

  it("uses OpenGraph error body from non-ok single GET fallback responses", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("batch unavailable"))
      .mockResolvedValueOnce(
        createResponse(
          { error: "Preview metadata is unavailable for this URL." },
          { ok: false }
        )
      );

    const { fetchLinkPreview } = await loadApi();
    const request = fetchLinkPreview("https://blocked.example/article");

    jest.runOnlyPendingTimers();

    await expect(request).rejects.toThrow(
      "Preview metadata is unavailable for this URL."
    );
  });
});
