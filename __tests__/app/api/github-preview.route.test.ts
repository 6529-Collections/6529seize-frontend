const nextResponseJson = jest.fn(
  (body: unknown, init?: { status?: number | undefined }) => ({
    status: init?.status ?? 200,
    json: async () => body,
  })
);

jest.mock("next/server", () => ({
  NextResponse: { json: nextResponseJson },
}));

type GetHandler = typeof import("../../../app/api/github-preview/route").GET;

let GET: GetHandler;

async function loadRoute(): Promise<void> {
  jest.resetModules();
  ({ GET } = await import("../../../app/api/github-preview/route"));
}

describe("github-preview API route", () => {
  const originalFetch = globalThis.fetch;
  const fetchMock = jest.fn();

  beforeEach(async () => {
    nextResponseJson.mockClear();
    fetchMock.mockReset();
    globalThis.fetch = fetchMock;
    await loadRoute();
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  const requestFor = (url: string, refresh = false) =>
    ({
      nextUrl: new URL(
        `https://app.local/api/github-preview?url=${encodeURIComponent(url)}${
          refresh ? "&refresh=1" : ""
        }`
      ),
    }) as any;

  const jsonResponse = (body: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(body), {
      headers: { "content-type": "application/json" },
      ...init,
    });

  it("maps open GitHub issues", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        html_url:
          "https://github.com/6529-Collections/6529seize-frontend/issues/2308",
        title: "Remove tab",
        state: "open",
        state_reason: null,
      })
    );

    const response = await GET(
      requestFor(
        "https://github.com/6529-Collections/6529seize-frontend/issues/2308"
      )
    );

    await expect(response.json()).resolves.toMatchObject({
      type: "github.issue",
      state: "open",
      number: 2308,
    });
  });

  it("maps completed and not planned issue closures", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          html_url: "https://github.com/o/r/issues/1",
          title: "Done",
          state: "closed",
          state_reason: "completed",
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          html_url: "https://github.com/o/r/issues/2",
          title: "Nope",
          state: "closed",
          state_reason: "not_planned",
        })
      );

    const completed = await GET(requestFor("https://github.com/o/r/issues/1"));
    const notPlanned = await GET(requestFor("https://github.com/o/r/issues/2"));

    await expect(completed.json()).resolves.toMatchObject({
      state: "closed_completed",
    });
    await expect(notPlanned.json()).resolves.toMatchObject({
      state: "closed_not_planned",
    });
  });

  it("bypasses cached status when refresh is requested", async () => {
    const url = "https://github.com/o/r/issues/10";
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          html_url: url,
          title: "Live issue",
          state: "open",
          state_reason: null,
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          html_url: url,
          title: "Live issue",
          state: "closed",
          state_reason: "completed",
        })
      );

    const initial = await GET(requestFor(url));
    const cached = await GET(requestFor(url));
    const refreshed = await GET(requestFor(url, true));

    await expect(initial.json()).resolves.toMatchObject({ state: "open" });
    await expect(cached.json()).resolves.toMatchObject({ state: "open" });
    await expect(refreshed.json()).resolves.toMatchObject({
      state: "closed_completed",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("maps pull request state", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          html_url: "https://github.com/o/r/pull/3",
          title: "Ship it",
          state: "closed",
          merged: true,
          draft: false,
          mergeable_state: "clean",
        })
      )
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 1,
            user: { login: "alice" },
            state: "APPROVED",
            submitted_at: "2024-01-01T00:00:00Z",
          },
        ])
      );

    const response = await GET(requestFor("https://github.com/o/r/pull/3"));

    await expect(response.json()).resolves.toMatchObject({
      type: "github.pull_request",
      state: "merged",
      merged: true,
      reviewState: "approved",
      mergeableState: "clean",
    });
  });

  it("resolves issue URLs that point at pull requests as pull requests", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          html_url: "https://github.com/o/r/issues/4",
          title: "PR issue",
          state: "open",
          pull_request: {},
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          html_url: "https://github.com/o/r/pull/4",
          title: "PR issue",
          state: "open",
          merged: false,
          draft: true,
          mergeable_state: "unknown",
        })
      )
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 1,
            user: { login: "alice" },
            state: "COMMENTED",
            submitted_at: "2024-01-01T00:00:00Z",
          },
        ])
      );

    const response = await GET(requestFor("https://github.com/o/r/issues/4"));

    await expect(response.json()).resolves.toMatchObject({
      type: "github.pull_request",
      state: "draft",
      draft: true,
      reviewState: "none",
    });
  });

  it("collapses reviews to latest meaningful state per reviewer", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          html_url: "https://github.com/o/r/pull/5",
          title: "Reviewed",
          state: "open",
          merged: false,
          draft: false,
          mergeable_state: "clean",
        })
      )
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 1,
            user: { login: "alice" },
            state: "APPROVED",
            submitted_at: "2024-01-01T00:00:00Z",
          },
          {
            id: 2,
            user: { login: "bob" },
            state: "APPROVED",
            submitted_at: "2024-01-02T00:00:00Z",
          },
          {
            id: 3,
            user: { login: "bob" },
            state: "CHANGES_REQUESTED",
            submitted_at: "2024-01-03T00:00:00Z",
          },
        ])
      );

    const response = await GET(requestFor("https://github.com/o/r/pull/5"));

    await expect(response.json()).resolves.toMatchObject({
      type: "github.pull_request",
      state: "open",
      reviewState: "changes_requested",
    });
  });

  it("still returns pull request state when review metadata is unavailable", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          html_url: "https://github.com/o/r/pull/6",
          title: "No reviews available",
          state: "open",
          merged: false,
          draft: false,
          mergeable_state: "blocked",
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({ message: "API rate limit exceeded" }, { status: 403 })
      );

    const response = await GET(requestFor("https://github.com/o/r/pull/6"));

    await expect(response.json()).resolves.toMatchObject({
      type: "github.pull_request",
      state: "open",
      reviewState: "none",
      mergeableState: "blocked",
    });
  });
});
