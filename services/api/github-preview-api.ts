import LruTtlCache from "@/lib/cache/lruTtl";

export type GithubPreviewIssueState =
  | "open"
  | "closed_completed"
  | "closed_not_planned"
  | "closed";

export interface GithubPreviewLabel {
  readonly name: string;
  readonly color?: string | null | undefined;
}

export interface GithubPreviewChecks {
  readonly state:
    | "success"
    | "failure"
    | "pending"
    | "neutral"
    | "skipped"
    | "unknown";
  readonly total: number | null;
  readonly successful: number | null;
  readonly failed: number | null;
  readonly pending: number | null;
  readonly url?: string | null | undefined;
}

export interface GithubIssuePreviewResponse {
  readonly type: "github.issue";
  readonly owner: string;
  readonly repo: string;
  readonly number: number;
  readonly title: string | null;
  readonly state: GithubPreviewIssueState;
  readonly author?: string | null | undefined;
  readonly createdAt?: string | null | undefined;
  readonly updatedAt?: string | null | undefined;
  readonly closedAt?: string | null | undefined;
  readonly comments?: number | null | undefined;
  readonly labels?: readonly GithubPreviewLabel[] | null | undefined;
  readonly assignees: readonly string[];
  readonly url: string;
}

export interface GithubPullRequestPreviewResponse {
  readonly type: "github.pull_request";
  readonly owner: string;
  readonly repo: string;
  readonly number: number;
  readonly title: string | null;
  readonly state: "open" | "closed" | "merged" | "draft";
  readonly reviewState: "approved" | "changes_requested" | "none";
  readonly mergeableState: string | null;
  readonly merged: boolean;
  readonly draft: boolean;
  readonly author?: string | null | undefined;
  readonly createdAt?: string | null | undefined;
  readonly updatedAt?: string | null | undefined;
  readonly closedAt?: string | null | undefined;
  readonly comments?: number | null | undefined;
  readonly reviewComments?: number | null | undefined;
  readonly commits?: number | null | undefined;
  readonly changedFiles?: number | null | undefined;
  readonly additions?: number | null | undefined;
  readonly deletions?: number | null | undefined;
  readonly baseRef?: string | null | undefined;
  readonly headRef?: string | null | undefined;
  readonly headSha?: string | null | undefined;
  readonly labels?: readonly GithubPreviewLabel[] | null | undefined;
  readonly checks?: GithubPreviewChecks | null | undefined;
  readonly url: string;
}

export interface GithubRepositoryPreviewResponse {
  readonly type: "github.repository";
  readonly owner: string;
  readonly repo: string;
  readonly title: string | null;
  readonly description: string | null;
  readonly defaultBranch: string | null;
  readonly language: string | null;
  readonly stars: number | null;
  readonly forks: number | null;
  readonly openIssues: number | null;
  readonly visibility: string | null;
  readonly archived: boolean;
  readonly updatedAt?: string | null | undefined;
  readonly pushedAt?: string | null | undefined;
  readonly topics?: readonly string[] | null | undefined;
  readonly license?: string | null | undefined;
  readonly url: string;
}

export interface GithubContentPreviewResponse {
  readonly type: "github.file" | "github.directory";
  readonly owner: string;
  readonly repo: string;
  readonly title: string | null;
  readonly path: string | null;
  readonly ref: string | null;
  readonly size: number | null;
  readonly itemCount: number | null;
  readonly language?: string | null | undefined;
  readonly lineCount?: number | null | undefined;
  readonly lineStart?: number | null | undefined;
  readonly lineEnd?: number | null | undefined;
  readonly excerpt?: readonly string[] | null | undefined;
  readonly entries?: readonly string[] | null | undefined;
  readonly fileCount?: number | null | undefined;
  readonly directoryCount?: number | null | undefined;
  readonly url: string;
}

export interface GithubCommitPreviewResponse {
  readonly type: "github.commit";
  readonly owner: string;
  readonly repo: string;
  readonly title: string | null;
  readonly sha: string;
  readonly shortSha: string;
  readonly author: string | null;
  readonly committedAt: string | null;
  readonly additions?: number | null | undefined;
  readonly deletions?: number | null | undefined;
  readonly changedFiles?: number | null | undefined;
  readonly url: string;
}

export interface GithubReleasePreviewResponse {
  readonly type: "github.release";
  readonly owner: string;
  readonly repo: string;
  readonly title: string | null;
  readonly tagName: string | null;
  readonly state: "draft" | "prerelease" | "published";
  readonly publishedAt: string | null;
  readonly url: string;
}

export interface GithubActionsPreviewResponse {
  readonly type: "github.actions";
  readonly owner: string;
  readonly repo: string;
  readonly title: string | null;
  readonly status: string | null;
  readonly conclusion: string | null;
  readonly runNumber: number | null;
  readonly event: string | null;
  readonly url: string;
}

export interface GithubDiscussionPreviewResponse {
  readonly type: "github.discussion";
  readonly owner: string;
  readonly repo: string;
  readonly number: number | null;
  readonly title: string | null;
  readonly category: string | null;
  readonly comments: number | null;
  readonly state: "open" | "closed" | "answered" | null;
  readonly url: string;
}

export type GithubStatusPreviewResponse =
  | GithubIssuePreviewResponse
  | GithubPullRequestPreviewResponse;

export type GithubPreviewResponse =
  | GithubStatusPreviewResponse
  | GithubRepositoryPreviewResponse
  | GithubContentPreviewResponse
  | GithubCommitPreviewResponse
  | GithubReleasePreviewResponse
  | GithubActionsPreviewResponse
  | GithubDiscussionPreviewResponse;

export interface GithubPreviewEnvelope {
  readonly githubPreview?: GithubPreviewResponse | null | undefined;
}

interface FetchGithubPreviewOptions {
  readonly bypassCache?: boolean | undefined;
}

const GITHUB_PREVIEW_CACHE_TTL_MS = 2 * 60 * 1000;
const GITHUB_PREVIEW_CACHE_MAX_ITEMS = 200;

const previewCache = new LruTtlCache<string, Promise<GithubPreviewResponse>>({
  max: GITHUB_PREVIEW_CACHE_MAX_ITEMS,
  ttlMs: GITHUB_PREVIEW_CACHE_TTL_MS,
});

const normalizeUrl = (url: string): string => url.trim();

const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string" && body.error.length > 0) {
      return body.error;
    }
  } catch {
    // ignore parse errors
  }

  return "Failed to fetch GitHub preview metadata.";
};

export const fetchGithubPreview = async (
  url: string,
  options?: FetchGithubPreviewOptions
): Promise<GithubPreviewResponse> => {
  const normalized = normalizeUrl(url);
  if (!normalized) {
    throw new Error("A valid URL is required to fetch GitHub metadata.");
  }

  const bypassCache = options?.bypassCache === true;
  if (!bypassCache) {
    const cached = previewCache.get(normalized);
    if (cached) {
      return cached;
    }
  }

  const params = new URLSearchParams({ url: normalized });
  if (bypassCache) {
    params.set("refresh", "1");
    params.set("ts", Date.now().toString());
  }

  const request = fetch(`/api/github-preview?${params.toString()}`, {
    headers: { Accept: "application/json" },
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      return (await response.json()) as GithubPreviewResponse;
    })
    .catch((error) => {
      if (!bypassCache) {
        previewCache.delete(normalized);
      }
      throw error;
    });

  if (!bypassCache) {
    previewCache.set(normalized, request);
  }

  return request;
};
