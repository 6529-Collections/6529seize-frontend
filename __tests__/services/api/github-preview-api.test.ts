import type { GithubPreviewResponse } from "@/services/api/github-preview-api";

describe("fetchGithubPreview", () => {
  const originalFetch = globalThis.fetch;
  const fetchMock = jest.fn();

  const loadApi = async () => import("@/services/api/github-preview-api");

  const createResponse = (
    body: unknown,
    options: { ok?: boolean | undefined } = {}
  ) =>
    ({
      ok: options.ok ?? true,
      json: async () => body,
    }) as Response;

  beforeEach(() => {
    jest.resetModules();
    fetchMock.mockReset();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  it("batches same-tick preview requests into one POST", async () => {
    const firstUrl =
      "https://github.com/6529-Collections/6529seize-frontend/pull/2688";
    const secondUrl =
      "https://github.com/6529-Collections/6529seize-frontend/pull/2604";
    const firstPreview: GithubPreviewResponse = {
      type: "github.pull_request",
      owner: "6529-Collections",
      repo: "6529seize-frontend",
      number: 2688,
      title: "First PR",
      state: "open",
      reviewState: "none",
      mergeableState: "clean",
      merged: false,
      draft: false,
      url: firstUrl,
    };
    const secondPreview: GithubPreviewResponse = {
      type: "github.pull_request",
      owner: "6529-Collections",
      repo: "6529seize-frontend",
      number: 2604,
      title: "Second PR",
      state: "merged",
      reviewState: "approved",
      mergeableState: "clean",
      merged: true,
      draft: false,
      url: secondUrl,
    };
    fetchMock.mockResolvedValueOnce(
      createResponse({
        results: [
          { url: firstUrl, preview: firstPreview },
          { url: secondUrl, preview: secondPreview },
        ],
        errors: [],
      })
    );

    const { fetchGithubPreview } = await loadApi();
    const first = fetchGithubPreview(firstUrl);
    const second = fetchGithubPreview(secondUrl);

    expect(fetchMock).not.toHaveBeenCalled();
    await expect(Promise.all([first, second])).resolves.toEqual([
      firstPreview,
      secondPreview,
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/github-preview",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ urls: [firstUrl, secondUrl] }),
      })
    );
  });

  it("dedupes duplicate normalized URLs inside a queued batch", async () => {
    const url =
      "https://github.com/6529-Collections/6529seize-frontend/issues/2701";
    const preview: GithubPreviewResponse = {
      type: "github.issue",
      owner: "6529-Collections",
      repo: "6529seize-frontend",
      number: 2701,
      title: "Issue",
      state: "open",
      assignees: [],
      url,
    };
    fetchMock.mockResolvedValueOnce(
      createResponse({
        results: [{ url, preview }],
        errors: [],
      })
    );

    const { fetchGithubPreview } = await loadApi();
    const first = fetchGithubPreview(url);
    const second = fetchGithubPreview(` ${url} `);

    await expect(Promise.all([first, second])).resolves.toEqual([
      preview,
      preview,
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        body: JSON.stringify({ urls: [url] }),
      })
    );
  });

  it("returns cached previews without adding the URL to a later batch", async () => {
    const url =
      "https://github.com/6529-Collections/6529seize-frontend/pull/2724";
    const preview: GithubPreviewResponse = {
      type: "github.pull_request",
      owner: "6529-Collections",
      repo: "6529seize-frontend",
      number: 2724,
      title: "Cached PR",
      state: "open",
      reviewState: "none",
      mergeableState: "clean",
      merged: false,
      draft: false,
      url,
    };
    fetchMock.mockResolvedValueOnce(
      createResponse({
        results: [{ url, preview }],
        errors: [],
      })
    );

    const { fetchGithubPreview } = await loadApi();
    await expect(fetchGithubPreview(url)).resolves.toEqual(preview);
    await expect(fetchGithubPreview(url)).resolves.toEqual(preview);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects individual URLs returned in batch errors", async () => {
    const successfulUrl =
      "https://github.com/6529-Collections/6529seize-frontend/pull/2604";
    const failedUrl =
      "https://github.com/6529-Collections/6529seize-frontend/pull/2601";
    const preview: GithubPreviewResponse = {
      type: "github.pull_request",
      owner: "6529-Collections",
      repo: "6529seize-frontend",
      number: 2604,
      title: "Successful PR",
      state: "open",
      reviewState: "none",
      mergeableState: "clean",
      merged: false,
      draft: false,
      url: successfulUrl,
    };
    fetchMock.mockResolvedValueOnce(
      createResponse({
        results: [{ url: successfulUrl, preview }],
        errors: [{ url: failedUrl, error: "GitHub preview unavailable." }],
      })
    );

    const { fetchGithubPreview } = await loadApi();
    const successful = fetchGithubPreview(successfulUrl);
    const failed = fetchGithubPreview(failedUrl);

    await expect(successful).resolves.toEqual(preview);
    await expect(failed).rejects.toThrow("GitHub preview unavailable.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("removes failed non-OK batch requests from cache", async () => {
    const url =
      "https://github.com/6529-Collections/6529seize-frontend/pull/2601";
    const preview: GithubPreviewResponse = {
      type: "github.pull_request",
      owner: "6529-Collections",
      repo: "6529seize-frontend",
      number: 2601,
      title: "Recovered PR",
      state: "open",
      reviewState: "none",
      mergeableState: "clean",
      merged: false,
      draft: false,
      url,
    };
    fetchMock
      .mockResolvedValueOnce(
        createResponse({ error: "Batch request failed." }, { ok: false })
      )
      .mockResolvedValueOnce(
        createResponse({
          results: [{ url, preview }],
          errors: [],
        })
      );

    const { fetchGithubPreview } = await loadApi();

    await expect(fetchGithubPreview(url)).rejects.toThrow(
      "Batch request failed."
    );
    await expect(fetchGithubPreview(url)).resolves.toEqual(preview);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not let stale rejected batch promises delete newer cache entries", async () => {
    const url =
      "https://github.com/6529-Collections/6529seize-frontend/pull/2688";
    const refreshedPreview: GithubPreviewResponse = {
      type: "github.pull_request",
      owner: "6529-Collections",
      repo: "6529seize-frontend",
      number: 2688,
      title: "Refreshed PR",
      state: "open",
      reviewState: "approved",
      mergeableState: "clean",
      merged: false,
      draft: false,
      url,
    };
    let resolveBatch!: (response: Response) => void;
    const batchResponse = new Promise<Response>((resolve) => {
      resolveBatch = resolve;
    });
    fetchMock
      .mockReturnValueOnce(batchResponse)
      .mockResolvedValueOnce(createResponse(refreshedPreview));

    const { fetchGithubPreview } = await loadApi();
    const staleBatchRequest = fetchGithubPreview(url);
    await Promise.resolve();

    await expect(
      fetchGithubPreview(url, { bypassCache: true })
    ).resolves.toEqual(refreshedPreview);

    resolveBatch(
      createResponse({ error: "Stale batch failed." }, { ok: false })
    );
    await expect(staleBatchRequest).rejects.toThrow("Stale batch failed.");
    await expect(fetchGithubPreview(url)).resolves.toEqual(refreshedPreview);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps explicit refreshes as direct cache-busting GET requests", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1782037797581);
    const url =
      "https://github.com/6529-Collections/6529seize-frontend/pull/2688";
    const preview: GithubPreviewResponse = {
      type: "github.pull_request",
      owner: "6529-Collections",
      repo: "6529seize-frontend",
      number: 2688,
      title: "Fresh PR",
      state: "open",
      reviewState: "approved",
      mergeableState: "clean",
      merged: false,
      draft: false,
      url,
    };
    fetchMock.mockResolvedValueOnce(createResponse(preview));

    const { fetchGithubPreview } = await loadApi();
    await expect(
      fetchGithubPreview(url, { bypassCache: true })
    ).resolves.toEqual(preview);

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/github-preview?url=${encodeURIComponent(
        url
      )}&refresh=1&ts=1782037797581`,
      expect.objectContaining({
        headers: { Accept: "application/json" },
      })
    );
  });
});
