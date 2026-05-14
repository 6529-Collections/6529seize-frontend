import LruTtlCache from "@/lib/cache/lruTtl";

export type GithubPreviewIssueState =
  | "open"
  | "closed_completed"
  | "closed_not_planned"
  | "closed";

export interface GithubIssuePreviewResponse {
  readonly type: "github.issue";
  readonly owner: string;
  readonly repo: string;
  readonly number: number;
  readonly title: string | null;
  readonly state: GithubPreviewIssueState;
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
  readonly url: string;
}

export type GithubPreviewResponse =
  | GithubIssuePreviewResponse
  | GithubPullRequestPreviewResponse;

export interface GithubPreviewEnvelope {
  readonly githubPreview?: GithubPreviewResponse | null | undefined;
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
  url: string
): Promise<GithubPreviewResponse> => {
  const normalized = normalizeUrl(url);
  if (!normalized) {
    throw new Error("A valid URL is required to fetch GitHub metadata.");
  }

  const cached = previewCache.get(normalized);
  if (cached) {
    return cached;
  }

  const params = new URLSearchParams({ url: normalized });
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
      previewCache.delete(normalized);
      throw error;
    });

  previewCache.set(normalized, request);
  return request;
};
