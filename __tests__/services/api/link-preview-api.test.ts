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
  });
});
