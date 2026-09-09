/**
 * @jest-environment node
 */

import type { NextRequest } from "next/server";

let mockGithubToken: string | undefined;

jest.mock("@/config/serverEnv", () => ({
  get serverEnv() {
    return { GITHUB_LINK_STATUS_PREVIEW_TOKEN: mockGithubToken };
  },
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(body), init),
  },
}));

type GithubRoute = typeof import("../../../app/api/github-preview/route");

const API_BASE = "https://api.github.com";
const PRIVATE_MARKER = "confidential fixture metadata";
const PUBLIC_TITLE = "Public issue";
const CLASSIC_TOKEN = "ghp_test";
const issueUrl = "https://github.com/o/r/issues/1";
const jsonResponse = (body: unknown, scopes?: string) =>
  new Response(JSON.stringify(body), {
    headers: scopes === undefined ? {} : { "x-oauth-scopes": scopes },
  });
const notFoundResponse = () =>
  new Response(JSON.stringify({ message: "Not Found" }), { status: 404 });
const requestFor = (url: string, refresh = false): NextRequest =>
  ({
    nextUrl: new URL(
      `https://app.local/api/github-preview?url=${encodeURIComponent(url)}${refresh ? "&refresh=1" : ""}`
    ),
  }) as NextRequest;
const batchRequestFor = (urls: readonly string[]): Request =>
  new Request("https://app.local/api/github-preview", {
    method: "POST",
    body: JSON.stringify({ urls }),
  });
const authorization = (init?: RequestInit) =>
  new Headers(init?.headers).get("authorization");
const publicIssue = { title: PUBLIC_TITLE, state: "open" };
const discussion = {
  title: PRIVATE_MARKER,
  number: 12,
  comments: { totalCount: 3 },
};

describe("GitHub preview public access boundary", () => {
  const originalFetch = globalThis.fetch;
  const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>();
  let route: GithubRoute;

  beforeEach(async () => {
    jest.resetModules();
    mockGithubToken = undefined;
    fetchMock.mockReset();
    globalThis.fetch = fetchMock;
    route = await import("../../../app/api/github-preview/route");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  it.each([
    "github_pat_test",
    "ghs_test",
    "unrecognized-token-fixture",
  ])("uses anonymous REST for unverified token type %s", async (token) => {
    mockGithubToken = token;
    fetchMock.mockImplementation(async (_url, init) => {
      if (authorization(init)) {
        return jsonResponse({ title: PRIVATE_MARKER });
      }
      return notFoundResponse();
    });
    const urls = [
      "https://github.com/o/r",
      issueUrl,
      "https://github.com/o/r/pull/1",
      "https://github.com/o/r/blob/main/secret.txt#L1-L3",
      "https://github.com/o/r/tree/main/src",
      "https://github.com/o/r/commit/abc123",
      "https://github.com/o/r/releases/tag/v1",
      "https://github.com/o/r/releases/latest",
      "https://github.com/o/r/actions",
      "https://github.com/o/r/actions/runs/1",
      "https://github.com/o/r/actions/workflows/ci.yml",
    ];

    for (const url of urls) {
      const response = await route.GET(requestFor(url));
      expect(await response.text()).not.toContain(PRIVATE_MARKER);
    }
    const batch = await route.POST(batchRequestFor(urls.slice(0, 10)));
    expect(await batch.text()).not.toContain(PRIVATE_MARKER);
    expect(fetchMock).toHaveBeenCalled();
    for (const [, init] of fetchMock.mock.calls) {
      expect(authorization(init)).toBeNull();
      expect(init?.cache).toBe("no-store");
    }
  });

  it.each(["repo", "public_repo", "repo:status", "read:discussion", undefined])(
    "falls back anonymously when the classic token probe reports %s",
    async (scopes) => {
      mockGithubToken = CLASSIC_TOKEN;
      fetchMock
        .mockResolvedValueOnce(jsonResponse({}, scopes))
        .mockResolvedValueOnce(jsonResponse(publicIssue));

      const response = await route.GET(requestFor(issueUrl));

      await expect(response.json()).resolves.toMatchObject({
        title: PUBLIC_TITLE,
      });
      expect(fetchMock.mock.calls[0]?.[0]).toBe(`${API_BASE}/rate_limit`);
      expect(authorization(fetchMock.mock.calls[0]?.[1])).toBe(
        `Bearer ${CLASSIC_TOKEN}`
      );
      expect(authorization(fetchMock.mock.calls[1]?.[1])).toBeNull();
    }
  );

  it("retains authenticated rate headroom for a verified no-scope classic token", async () => {
    mockGithubToken = CLASSIC_TOKEN;
    fetchMock.mockImplementation(async (url) =>
      jsonResponse(String(url).endsWith("/rate_limit") ? {} : publicIssue, "")
    );

    const responses = await Promise.all([
      route.GET(requestFor(issueUrl)),
      route.GET(requestFor("https://github.com/o/r/issues/2")),
    ]);

    for (const response of responses) {
      await expect(response.json()).resolves.toMatchObject({
        title: PUBLIC_TITLE,
      });
    }
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(
      fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/rate_limit"))
    ).toHaveLength(1);
    for (const [, init] of fetchMock.mock.calls) {
      expect(authorization(init)).toBe(`Bearer ${CLASSIC_TOKEN}`);
    }
  });

  it.each(["repo", undefined])(
    "discards the authenticated body if its response scopes become %s",
    async (scopes) => {
      mockGithubToken = CLASSIC_TOKEN;
      const privateResponse = jsonResponse({ title: PRIVATE_MARKER }, scopes);
      const parsePrivateBody = jest.spyOn(privateResponse, "json");
      fetchMock
        .mockResolvedValueOnce(jsonResponse({}, ""))
        .mockResolvedValueOnce(privateResponse)
        .mockResolvedValueOnce(jsonResponse(publicIssue));

      const first = await route.GET(requestFor(issueUrl));
      const cached = await route.GET(requestFor(issueUrl));

      await expect(first.json()).resolves.toMatchObject({
        title: PUBLIC_TITLE,
      });
      await expect(cached.json()).resolves.toMatchObject({
        title: PUBLIC_TITLE,
      });
      expect(parsePrivateBody).not.toHaveBeenCalled();
      expect(authorization(fetchMock.mock.calls[2]?.[1])).toBeNull();
      expect(fetchMock).toHaveBeenCalledTimes(3);
    }
  );

  it("does not reuse token eligibility after the configured credential changes", async () => {
    mockGithubToken = CLASSIC_TOKEN;
    fetchMock
      .mockResolvedValueOnce(jsonResponse({}, ""))
      .mockResolvedValueOnce(jsonResponse(publicIssue, ""))
      .mockResolvedValueOnce(jsonResponse({}, "repo"))
      .mockResolvedValueOnce(jsonResponse(publicIssue));
    await route.GET(requestFor(issueUrl));

    mockGithubToken = "ghp_different_fixture";
    await route.GET(requestFor("https://github.com/o/r/issues/2"));

    expect(fetchMock.mock.calls[2]?.[0]).toBe(`${API_BASE}/rate_limit`);
    expect(authorization(fetchMock.mock.calls[3]?.[1])).toBeNull();
  });

  it("uses anonymous REST when the eligibility probe fails", async () => {
    mockGithubToken = CLASSIC_TOKEN;
    fetchMock
      .mockRejectedValueOnce(new Error("network unavailable"))
      .mockResolvedValueOnce(jsonResponse(publicIssue));

    const response = await route.GET(requestFor(issueUrl));

    await expect(response.json()).resolves.toMatchObject({
      title: PUBLIC_TITLE,
    });
    expect(authorization(fetchMock.mock.calls[1]?.[1])).toBeNull();
  });

  it.each([true, undefined])(
    "omits unpublished release metadata with draft=%s",
    async (draft) => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          draft,
          name: PRIVATE_MARKER,
          tag_name: "unpublished-secret-tag",
          published_at: "2026-09-01T00:00:00Z",
        })
      );

      const response = await route.GET(
        requestFor("https://github.com/o/r/releases/tag/v1")
      );

      await expect(response.json()).resolves.toMatchObject({
        title: "v1",
        tagName: "v1",
        publishedAt: null,
      });
    }
  );

  it.each([
    { visibility: "PRIVATE", isPrivate: true },
    { visibility: "INTERNAL", isPrivate: true },
    { visibility: "PUBLIC", isPrivate: true },
    { visibility: "PUBLIC" },
    { isPrivate: false },
    {},
  ])(
    "rejects discussion visibility %j without caching it",
    async (visibility) => {
      mockGithubToken = "github_pat_discussion_fixture";
      fetchMock.mockImplementation(async () =>
        jsonResponse({
          data: {
            repository: {
              ...visibility,
              discussion,
              discussions: { nodes: [discussion] },
            },
          },
        })
      );
      const url = "https://github.com/o/r/discussions/12";

      const first = await route.GET(requestFor(url));
      const repeated = await route.GET(requestFor(url));
      const batch = await route.POST(
        batchRequestFor([url, "https://github.com/o/r/discussions"])
      );

      expect(first.status).toBe(400);
      expect(repeated.status).toBe(400);
      for (const response of [first, repeated, batch]) {
        expect(await response.text()).not.toContain(PRIVATE_MARKER);
      }
      expect(fetchMock).toHaveBeenCalledTimes(4);
      for (const [, init] of fetchMock.mock.calls) {
        const requestBody: { query: string } = JSON.parse(String(init?.body));
        expect(requestBody.query).toContain("visibility");
        expect(requestBody.query).toContain("isPrivate");
      }
    }
  );

  it("preserves public discussion lists with the visibility decision in the same response", async () => {
    mockGithubToken = "github_pat_discussion_fixture";
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: {
          repository: {
            visibility: "PUBLIC",
            isPrivate: false,
            discussions: {
              nodes: [{ ...discussion, title: "Public discussion" }],
            },
          },
        },
      })
    );

    const response = await route.GET(
      requestFor("https://github.com/o/r/discussions")
    );

    await expect(response.json()).resolves.toMatchObject({
      type: "github.discussion",
      title: "Public discussion",
      comments: 3,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not expose upstream GraphQL error text", async () => {
    mockGithubToken = "github_pat_discussion_fixture";
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ errors: [{ message: PRIVATE_MARKER }] })
    );

    const response = await route.GET(
      requestFor("https://github.com/o/r/discussions/12")
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "GitHub GraphQL request failed.",
    });
  });

  it("expires previously public metadata and rechecks visibility on refresh", async () => {
    mockGithubToken = "github_pat_discussion_fixture";
    const now = jest.spyOn(Date, "now").mockReturnValue(1_000);
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            repository: {
              visibility: "PUBLIC",
              isPrivate: false,
              discussion: { title: "Previously public" },
            },
          },
        })
      )
      .mockImplementation(async () =>
        jsonResponse({
          data: {
            repository: { visibility: "PRIVATE", isPrivate: true, discussion },
          },
        })
      );
    const url = "https://github.com/o/r/discussions/12";

    await route.GET(requestFor(url));
    now.mockReturnValue(120_000);
    const cached = await route.GET(requestFor(url));
    await expect(cached.json()).resolves.toMatchObject({
      title: "Previously public",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const refreshed = await route.GET(requestFor(url, true));
    expect(refreshed.status).toBe(400);
    expect(await refreshed.text()).not.toContain(PRIVATE_MARKER);
    now.mockReturnValue(121_001);
    const expired = await route.GET(requestFor(url));
    expect(expired.status).toBe(400);
    expect(await expired.text()).not.toContain(PRIVATE_MARKER);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
