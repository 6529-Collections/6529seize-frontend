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

interface GithubPreviewBatchResponse {
  readonly results?:
    | readonly {
        readonly url: string;
        readonly preview: GithubPreviewResponse;
      }[]
    | undefined;
  readonly errors?:
    | readonly {
        readonly url: string;
        readonly error: string;
      }[]
    | undefined;
}

type PendingGithubPreviewRequest = {
  readonly url: string;
  readonly promise: Promise<GithubPreviewResponse>;
  readonly resolve: (value: GithubPreviewResponse) => void;
  readonly reject: (reason: Error) => void;
};

const GITHUB_PREVIEW_CACHE_TTL_MS = 2 * 60 * 1000;
const GITHUB_PREVIEW_CACHE_MAX_ITEMS = 200;
const GITHUB_PREVIEW_BATCH_MAX_URLS = 10;
const GITHUB_PREVIEW_METADATA_ERROR_MESSAGE =
  "Failed to fetch GitHub preview metadata.";

const previewCache = new LruTtlCache<string, Promise<GithubPreviewResponse>>({
  max: GITHUB_PREVIEW_CACHE_MAX_ITEMS,
  ttlMs: GITHUB_PREVIEW_CACHE_TTL_MS,
});

const pendingPreviewBatch = new Map<string, PendingGithubPreviewRequest>();
const refreshRequests = new Map<string, Promise<GithubPreviewResponse>>();
let batchFlushScheduled = false;

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

  return GITHUB_PREVIEW_METADATA_ERROR_MESSAGE;
};

const toError = (error: unknown): Error =>
  error instanceof Error
    ? error
    : new Error(GITHUB_PREVIEW_METADATA_ERROR_MESSAGE);

const clearGithubPreviewCacheOnError = (
  promise: Promise<GithubPreviewResponse>,
  cacheKey: string
): Promise<GithubPreviewResponse> => {
  const cachedPromiseRef: {
    current: Promise<GithubPreviewResponse> | undefined;
  } = { current: undefined };
  const cachedPromise = (async () => {
    try {
      return await promise;
    } catch (error: unknown) {
      if (previewCache.get(cacheKey) === cachedPromiseRef.current) {
        previewCache.delete(cacheKey);
      }
      throw error;
    }
  })();
  cachedPromiseRef.current = cachedPromise;

  return cachedPromise;
};

const scheduleBatchFlush = (): void => {
  if (batchFlushScheduled) {
    return;
  }

  batchFlushScheduled = true;
  globalThis.queueMicrotask(flushGithubPreviewBatch);
};

const chunkRequests = (
  requests: readonly PendingGithubPreviewRequest[]
): PendingGithubPreviewRequest[][] => {
  const chunks: PendingGithubPreviewRequest[][] = [];
  for (
    let index = 0;
    index < requests.length;
    index += GITHUB_PREVIEW_BATCH_MAX_URLS
  ) {
    chunks.push(requests.slice(index, index + GITHUB_PREVIEW_BATCH_MAX_URLS));
  }

  return chunks;
};

const sendGithubPreviewBatch = async (
  requests: readonly PendingGithubPreviewRequest[]
): Promise<void> => {
  try {
    const urls = requests.map((request) => request.url);
    const response = await fetch("/api/github-preview", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ urls }),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    const body = (await response.json()) as GithubPreviewBatchResponse;
    const results = new Map(
      (body.results ?? []).map((result) => [result.url, result.preview])
    );
    const errors = new Map(
      (body.errors ?? []).map((error) => [error.url, error.error])
    );

    requests.forEach((request) => {
      const result = results.get(request.url);
      if (result) {
        request.resolve(result);
        return;
      }

      request.reject(
        new Error(
          errors.get(request.url) ?? GITHUB_PREVIEW_METADATA_ERROR_MESSAGE
        )
      );
    });
  } catch (error: unknown) {
    const reason = toError(error);
    requests.forEach((request) => request.reject(reason));
  }
};

function flushGithubPreviewBatch(): void {
  batchFlushScheduled = false;
  const requests = Array.from(pendingPreviewBatch.values());
  pendingPreviewBatch.clear();

  chunkRequests(requests).forEach((chunk) => {
    void sendGithubPreviewBatch(chunk);
  });
}

const queueGithubPreviewRequest = (
  normalizedUrl: string
): Promise<GithubPreviewResponse> => {
  const pendingRequest = pendingPreviewBatch.get(normalizedUrl);
  if (pendingRequest) {
    return pendingRequest.promise;
  }

  let resolveRequest!: (value: GithubPreviewResponse) => void;
  let rejectRequest!: (reason: Error) => void;
  const rawPromise = new Promise<GithubPreviewResponse>((resolve, reject) => {
    resolveRequest = resolve;
    rejectRequest = reject;
  });
  const promise = clearGithubPreviewCacheOnError(rawPromise, normalizedUrl);

  pendingPreviewBatch.set(normalizedUrl, {
    url: normalizedUrl,
    promise,
    resolve: resolveRequest,
    reject: rejectRequest,
  });
  scheduleBatchFlush();

  return promise;
};

const fetchGithubPreviewRefresh = (
  normalizedUrl: string
): Promise<GithubPreviewResponse> => {
  const pendingRefresh = refreshRequests.get(normalizedUrl);
  if (pendingRefresh) {
    return pendingRefresh;
  }

  const params = new URLSearchParams({ url: normalizedUrl });
  params.set("refresh", "1");
  params.set("ts", Date.now().toString());

  const request = fetch(`/api/github-preview?${params.toString()}`, {
    headers: { Accept: "application/json" },
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      return (await response.json()) as GithubPreviewResponse;
    })
    .then((preview) => {
      previewCache.set(normalizedUrl, Promise.resolve(preview));
      return preview;
    })
    .finally(() => {
      refreshRequests.delete(normalizedUrl);
    });

  refreshRequests.set(normalizedUrl, request);

  return request;
};

export const fetchGithubPreview = (
  url: string,
  options?: FetchGithubPreviewOptions
): Promise<GithubPreviewResponse> => {
  const normalized = normalizeUrl(url);
  if (!normalized) {
    return Promise.reject(
      new Error("A valid URL is required to fetch GitHub metadata.")
    );
  }

  const bypassCache = options?.bypassCache === true;
  if (bypassCache) {
    return fetchGithubPreviewRefresh(normalized);
  }

  const cached = previewCache.get(normalized);
  if (cached) {
    return cached;
  }

  const request = queueGithubPreviewRequest(normalized);

  previewCache.set(normalized, request);

  return request;
};
