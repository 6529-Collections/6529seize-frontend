import LruTtlCache from "@/lib/cache/lruTtl";
import { serverEnv } from "@/config/serverEnv";
import type {
  GithubIssuePreviewResponse,
  GithubPreviewResponse,
  GithubPullRequestPreviewResponse,
} from "@/services/api/github-preview-api";

const GITHUB_API_BASE = "https://api.github.com";
const CACHE_TTL_MS = 2 * 60 * 1000;
const CACHE_MAX_ITEMS = 500;
const FETCH_TIMEOUT_MS = 5000;

const cache = new LruTtlCache<string, GithubPreviewResponse>({
  max: CACHE_MAX_ITEMS,
  ttlMs: CACHE_TTL_MS,
});

interface GithubResource {
  readonly owner: string;
  readonly repo: string;
  readonly number: number;
  readonly kind: "issue" | "pull";
}

interface GithubIssueApiResponse {
  readonly html_url?: string | null;
  readonly title?: string | null;
  readonly state?: string | null;
  readonly state_reason?: string | null;
  readonly pull_request?: unknown;
}

interface GithubPullApiResponse {
  readonly html_url?: string | null;
  readonly title?: string | null;
  readonly state?: string | null;
  readonly merged?: boolean | null;
  readonly draft?: boolean | null;
  readonly mergeable_state?: string | null;
}

interface GithubPullReviewApiResponse {
  readonly id?: number | null;
  readonly user?: { readonly login?: string | null } | null;
  readonly state?: string | null;
  readonly submitted_at?: string | null;
}

type GithubResourceKind = GithubResource["kind"];
type GithubReviewApiState = "APPROVED" | "CHANGES_REQUESTED" | "DISMISSED";

const createAbortController = (): {
  readonly controller: AbortController;
  readonly cancel: () => void;
} => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  return {
    controller,
    cancel: () => clearTimeout(timeout),
  };
};

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === "AbortError";

const toGithubRequestError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }

  return new Error("GitHub request failed.");
};

const parseGithubResource = (rawUrl: string | null): GithubResource => {
  if (!rawUrl) {
    throw new Error("A url query parameter is required.");
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid GitHub URL.");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Invalid GitHub URL protocol.");
  }

  const hostname = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  if (hostname !== "github.com") {
    throw new Error(
      "Only github.com issue and pull request URLs are supported."
    );
  }

  const [owner, repo, kindSegment, numberSegment] = parsed.pathname
    .split("/")
    .filter(Boolean);
  const kind = getGithubResourceKind(kindSegment);
  const number = Number.parseInt(numberSegment ?? "", 10);

  if (!owner || !repo || !kind || !Number.isInteger(number) || number <= 0) {
    throw new Error(
      "Only github.com issue and pull request URLs are supported."
    );
  }

  return { owner, repo, kind, number };
};

const getGithubResourceKind = (
  kindSegment: string | undefined
): GithubResourceKind | null => {
  if (kindSegment === "issues") {
    return "issue";
  }

  if (kindSegment === "pull") {
    return "pull";
  }

  return null;
};

const fetchGithubJson = async <T>(path: string): Promise<T> => {
  const { controller, cancel } = createAbortController();
  const githubToken = serverEnv?.GITHUB_LINK_STATUS_PREVIEW_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "user-agent": "6529seize-github-preview/1.0",
  };

  if (githubToken) {
    headers["Authorization"] = `Bearer ${githubToken}`;
  }

  try {
    const response = await fetch(`${GITHUB_API_BASE}${path}`, {
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`GitHub request failed with status ${response.status}.`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (isAbortError(error)) {
      throw new Error("GitHub request timed out.");
    }

    throw toGithubRequestError(error);
  } finally {
    cancel();
  }
};

const getIssueState = (
  issue: GithubIssueApiResponse
): GithubIssuePreviewResponse["state"] => {
  if (issue.state !== "closed") {
    return "open";
  }

  if (issue.state_reason === "completed") {
    return "closed_completed";
  }

  if (issue.state_reason === "not_planned") {
    return "closed_not_planned";
  }

  return "closed";
};

const getPullRequestState = (
  pull: GithubPullApiResponse
): GithubPullRequestPreviewResponse["state"] => {
  if (pull.merged === true) {
    return "merged";
  }

  if (pull.draft === true && pull.state === "open") {
    return "draft";
  }

  return pull.state === "closed" ? "closed" : "open";
};

const REVIEW_STATE_PRIORITY = {
  CHANGES_REQUESTED: 2,
  APPROVED: 1,
} as const;

const toMeaningfulReviewState = (
  state: string | null | undefined
): GithubReviewApiState | null => {
  const normalized = state?.toUpperCase();
  if (
    normalized === "APPROVED" ||
    normalized === "CHANGES_REQUESTED" ||
    normalized === "DISMISSED"
  ) {
    return normalized;
  }

  return null;
};

const isReviewStateActive = (
  state: GithubReviewApiState
): state is "APPROVED" | "CHANGES_REQUESTED" => state !== "DISMISSED";

const toPreviewReviewState = (
  state: "APPROVED" | "CHANGES_REQUESTED"
): GithubPullRequestPreviewResponse["reviewState"] => {
  if (state === "CHANGES_REQUESTED") {
    return "changes_requested";
  }

  return "approved";
};

const shouldReplaceReview = (
  current: GithubPullReviewApiResponse | undefined,
  next: GithubPullReviewApiResponse
): boolean => {
  if (!current) {
    return true;
  }

  return getReviewTimestamp(next) >= getReviewTimestamp(current);
};

const getLatestMeaningfulReviewsByUser = (
  reviews: readonly GithubPullReviewApiResponse[]
): Map<string, GithubPullReviewApiResponse> => {
  const latestMeaningfulReviewByUser = new Map<
    string,
    GithubPullReviewApiResponse
  >();

  for (const review of reviews) {
    if (!toMeaningfulReviewState(review.state)) {
      continue;
    }

    const user = review.user?.login;
    if (!user) {
      continue;
    }

    const current = latestMeaningfulReviewByUser.get(user);
    if (shouldReplaceReview(current, review)) {
      latestMeaningfulReviewByUser.set(user, review);
    }
  }

  return latestMeaningfulReviewByUser;
};

const getHighestPriorityReviewState = (
  reviews: Iterable<GithubPullReviewApiResponse>
): GithubPullRequestPreviewResponse["reviewState"] => {
  let highestPriority = 0;
  let reviewState: GithubPullRequestPreviewResponse["reviewState"] = "none";

  for (const review of reviews) {
    const state = toMeaningfulReviewState(review.state);
    if (!state || !isReviewStateActive(state)) {
      continue;
    }

    const priority = REVIEW_STATE_PRIORITY[state];
    if (priority > highestPriority) {
      highestPriority = priority;
      reviewState = toPreviewReviewState(state);
    }
  }

  return reviewState;
};

const getReviewTimestamp = (review: GithubPullReviewApiResponse): number => {
  if (review.submitted_at) {
    const timestamp = Date.parse(review.submitted_at);
    if (Number.isFinite(timestamp)) {
      return timestamp;
    }
  }

  return review.id ?? 0;
};

const getPullRequestReviewState = (
  reviews: readonly GithubPullReviewApiResponse[]
): GithubPullRequestPreviewResponse["reviewState"] => {
  const latestMeaningfulReviewByUser =
    getLatestMeaningfulReviewsByUser(reviews);
  return getHighestPriorityReviewState(latestMeaningfulReviewByUser.values());
};

const buildPullPreview = (
  resource: GithubResource,
  pull: GithubPullApiResponse,
  reviews: readonly GithubPullReviewApiResponse[]
): GithubPullRequestPreviewResponse => ({
  type: "github.pull_request",
  owner: resource.owner,
  repo: resource.repo,
  number: resource.number,
  title: pull.title ?? null,
  state: getPullRequestState(pull),
  reviewState: getPullRequestReviewState(reviews),
  mergeableState: pull.mergeable_state ?? null,
  merged: pull.merged === true,
  draft: pull.draft === true,
  url:
    pull.html_url ??
    `https://github.com/${resource.owner}/${resource.repo}/pull/${resource.number}`,
});

const resolvePullPreview = async (
  resource: GithubResource
): Promise<GithubPullRequestPreviewResponse> => {
  const encodedOwner = encodeURIComponent(resource.owner);
  const encodedRepo = encodeURIComponent(resource.repo);
  const pull = await fetchGithubJson<GithubPullApiResponse>(
    `/repos/${encodedOwner}/${encodedRepo}/pulls/${resource.number}`
  );
  const reviews = await fetchGithubJson<GithubPullReviewApiResponse[]>(
    `/repos/${encodedOwner}/${encodedRepo}/pulls/${resource.number}/reviews`
  ).catch(() => []);

  return buildPullPreview(resource, pull, reviews);
};

const resolveIssuePreview = async (
  resource: GithubResource
): Promise<GithubPreviewResponse> => {
  const issue = await fetchGithubJson<GithubIssueApiResponse>(
    `/repos/${encodeURIComponent(resource.owner)}/${encodeURIComponent(
      resource.repo
    )}/issues/${resource.number}`
  );

  if (issue.pull_request !== undefined && issue.pull_request !== null) {
    return resolvePullPreview({ ...resource, kind: "pull" });
  }

  return {
    type: "github.issue",
    owner: resource.owner,
    repo: resource.repo,
    number: resource.number,
    title: issue.title ?? null,
    state: getIssueState(issue),
    url:
      issue.html_url ??
      `https://github.com/${resource.owner}/${resource.repo}/issues/${resource.number}`,
  };
};

export const resolveGithubPreview = async (
  rawUrl: string | null,
  options?: { readonly bypassCache?: boolean | undefined }
): Promise<GithubPreviewResponse> => {
  const resource = parseGithubResource(rawUrl);
  const cacheKey = `${resource.owner}/${resource.repo}/${resource.kind}/${resource.number}`;
  const bypassCache = options?.bypassCache === true;
  const cached = bypassCache ? undefined : cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const preview =
    resource.kind === "pull"
      ? await resolvePullPreview(resource)
      : await resolveIssuePreview(resource);

  cache.set(cacheKey, preview);
  return preview;
};
