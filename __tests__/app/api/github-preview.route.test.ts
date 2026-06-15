/**
 * @jest-environment node
 */

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
        assignees: [{ login: "alice" }, { login: "bob" }],
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
      assignees: ["alice", "bob"],
    });
  });

  it("maps unassigned GitHub issues", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        html_url: "https://github.com/o/r/issues/6",
        title: "Needs owner",
        state: "open",
        state_reason: null,
        assignees: [],
      })
    );

    const response = await GET(requestFor("https://github.com/o/r/issues/6"));

    await expect(response.json()).resolves.toMatchObject({
      type: "github.issue",
      state: "open",
      number: 6,
      assignees: [],
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

  it("rejects GitHub URLs with partial digit issue numbers", async () => {
    const response = await GET(
      requestFor("https://github.com/o/r/issues/123abc")
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Only github.com repository URLs are supported.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps repository links", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        full_name: "6529-Collections/6529seize-frontend",
        description: "6529 Seize frontend",
        default_branch: "main",
        language: "TypeScript",
        stargazers_count: 42,
        forks_count: 7,
        open_issues_count: 5,
        visibility: "public",
        archived: false,
        html_url: "https://github.com/6529-Collections/6529seize-frontend",
      })
    );

    const response = await GET(
      requestFor("https://github.com/6529-Collections/6529seize-frontend")
    );

    await expect(response.json()).resolves.toMatchObject({
      type: "github.repository",
      title: "6529-Collections/6529seize-frontend",
      description: "6529 Seize frontend",
      language: "TypeScript",
      stars: 42,
      forks: 7,
    });
  });

  it("maps GitHub file links", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        type: "file",
        name: "GithubLinkPreview.tsx",
        path: "components/waves/github/GithubLinkPreview.tsx",
        size: 12345,
        html_url:
          "https://github.com/o/r/blob/main/components/waves/github/GithubLinkPreview.tsx",
      })
    );

    const response = await GET(
      requestFor(
        "https://github.com/o/r/blob/main/components/waves/github/GithubLinkPreview.tsx#L12"
      )
    );

    await expect(response.json()).resolves.toMatchObject({
      type: "github.file",
      title: "GithubLinkPreview.tsx",
      path: "components/waves/github/GithubLinkPreview.tsx",
      ref: "main",
      size: 12345,
    });
  });

  it("tries longer ref splits for file links on slash-named branches", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ message: "Not Found" }, { status: 404 })
      )
      .mockResolvedValueOnce(
        jsonResponse({
          type: "file",
          name: "app.ts",
          path: "src/app.ts",
          size: 10,
          html_url: "https://github.com/o/r/blob/feature/work/src/app.ts",
        })
      );

    const response = await GET(
      requestFor("https://github.com/o/r/blob/feature/work/src/app.ts")
    );

    await expect(response.json()).resolves.toMatchObject({
      type: "github.file",
      ref: "feature/work",
      path: "src/app.ts",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("maps GitHub directory links", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse([
        { type: "file", name: "a.ts", path: "src/a.ts" },
        { type: "file", name: "b.ts", path: "src/b.ts" },
      ])
    );

    const response = await GET(
      requestFor("https://github.com/o/r/tree/main/src")
    );

    await expect(response.json()).resolves.toMatchObject({
      type: "github.directory",
      title: "src",
      path: "src",
      ref: "main",
      itemCount: 2,
    });
  });

  it("maps commit links", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        html_url: "https://github.com/o/r/commit/abc123",
        sha: "abc1234567890",
        commit: {
          message: "Ship richer GitHub previews\n\nDetails",
          author: { name: "Alice", date: "2026-06-15T00:00:00Z" },
        },
        author: { login: "alice" },
      })
    );

    const response = await GET(
      requestFor("https://github.com/o/r/commit/abc123")
    );

    await expect(response.json()).resolves.toMatchObject({
      type: "github.commit",
      title: "Ship richer GitHub previews",
      shortSha: "abc123456789",
      author: "alice",
    });
  });

  it("maps release links", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        html_url: "https://github.com/o/r/releases/tag/v1.0.0",
        name: "Version 1",
        tag_name: "v1.0.0",
        draft: false,
        prerelease: true,
        published_at: "2026-06-15T00:00:00Z",
      })
    );

    const response = await GET(
      requestFor("https://github.com/o/r/releases/tag/v1.0.0")
    );

    await expect(response.json()).resolves.toMatchObject({
      type: "github.release",
      title: "Version 1",
      tagName: "v1.0.0",
      state: "prerelease",
    });
  });

  it("maps GitHub Actions run links", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        html_url: "https://github.com/o/r/actions/runs/99",
        name: "CI",
        display_title: "Run tests",
        status: "completed",
        conclusion: "success",
        run_number: 418,
        event: "pull_request",
      })
    );

    const response = await GET(
      requestFor("https://github.com/o/r/actions/runs/99")
    );

    await expect(response.json()).resolves.toMatchObject({
      type: "github.actions",
      title: "Run tests",
      status: "completed",
      conclusion: "success",
      runNumber: 418,
    });
  });

  it("maps GitHub discussion links with GraphQL metadata", async () => {
    process.env["SSR_CLIENT_ID"] = "test-client";
    process.env["SSR_CLIENT_SECRET"] = "test-secret";
    process.env["GITHUB_LINK_STATUS_PREVIEW_TOKEN"] = "test-token";
    await loadRoute();

    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: {
          repository: {
            discussion: {
              title: "Preview all GitHub resources",
              url: "https://github.com/o/r/discussions/12",
              number: 12,
              closed: false,
              answerChosenAt: "2026-06-15T00:00:00Z",
              category: { name: "Ideas" },
              comments: { totalCount: 3 },
            },
          },
        },
      })
    );

    const response = await GET(
      requestFor("https://github.com/o/r/discussions/12")
    );

    await expect(response.json()).resolves.toMatchObject({
      type: "github.discussion",
      title: "Preview all GitHub resources",
      number: 12,
      category: "Ideas",
      comments: 3,
      state: "answered",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/graphql",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      })
    );

    delete process.env["SSR_CLIENT_ID"];
    delete process.env["SSR_CLIENT_SECRET"];
    delete process.env["GITHUB_LINK_STATUS_PREVIEW_TOKEN"];
  });

  it("deduplicates concurrent uncached status requests", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        html_url: "https://github.com/o/r/issues/11",
        title: "Concurrent issue",
        state: "open",
        state_reason: null,
      })
    );

    const [first, second] = await Promise.all([
      GET(requestFor("https://github.com/o/r/issues/11")),
      GET(requestFor("https://github.com/o/r/issues/11")),
    ]);

    await expect(first.json()).resolves.toMatchObject({ state: "open" });
    await expect(second.json()).resolves.toMatchObject({ state: "open" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
