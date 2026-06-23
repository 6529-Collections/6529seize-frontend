import LruTtlCache from "@/lib/cache/lruTtl";
import { serverEnv } from "@/config/serverEnv";
import {
  detectExternalFileKind,
  getDefaultMimeTypeForExtension,
  getFileExtension,
  isBinaryFileKind,
} from "@/lib/link-preview/fileKinds";
import type {
  GithubActionsPreviewResponse,
  GithubPreviewChecks,
  GithubPreviewLabel,
  GithubCommitPreviewResponse,
  GithubContentPreviewResponse,
  GithubDiscussionPreviewResponse,
  GithubIssuePreviewResponse,
  GithubPreviewResponse,
  GithubPullRequestPreviewResponse,
  GithubReleasePreviewResponse,
  GithubRepositoryPreviewResponse,
} from "@/services/api/github-preview-api";

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_GRAPHQL_URL = `${GITHUB_API_BASE}/graphql`;
const CACHE_TTL_MS = 2 * 60 * 1000;
const CACHE_MAX_ITEMS = 500;
const FETCH_TIMEOUT_MS = 5000;
const GITHUB_NUMBER_PATTERN = /^\d+$/;
const CONTENT_REF_SPLIT_LIMIT = 8;
const CONTENT_EXCERPT_MAX_BYTES = 64 * 1024;
const CONTENT_EXCERPT_MAX_LINES = 5;
const CONTENT_EXCERPT_MAX_LINE_LENGTH = 160;

const cache = new LruTtlCache<string, GithubPreviewResponse>({
  max: CACHE_MAX_ITEMS,
  ttlMs: CACHE_TTL_MS,
});
const inFlight = new Map<string, Promise<GithubPreviewResponse>>();

class GithubApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

interface GithubResourceBase {
  readonly href: string;
  readonly owner: string;
  readonly repo: string;
}

interface GithubRepositoryResource extends GithubResourceBase {
  readonly kind: "repository";
}

interface GithubIssueResource extends GithubResourceBase {
  readonly kind: "issue";
  readonly number: number;
}

interface GithubPullResource extends GithubResourceBase {
  readonly kind: "pull";
  readonly number: number;
}

interface GithubContentResource extends GithubResourceBase {
  readonly kind: "content";
  readonly mode: "blob" | "tree";
  readonly segments: readonly string[];
  readonly lineStart: number | null;
  readonly lineEnd: number | null;
}

interface GithubCommitResource extends GithubResourceBase {
  readonly kind: "commit";
  readonly ref: string;
}

interface GithubReleaseResource extends GithubResourceBase {
  readonly kind: "release";
  readonly tag: string | null;
}

interface GithubActionsResource extends GithubResourceBase {
  readonly kind: "actions";
  readonly runId: number | null;
  readonly workflowId: string | null;
}

interface GithubDiscussionResource extends GithubResourceBase {
  readonly kind: "discussion";
  readonly number: number | null;
}

type GithubResource =
  | GithubRepositoryResource
  | GithubIssueResource
  | GithubPullResource
  | GithubContentResource
  | GithubCommitResource
  | GithubReleaseResource
  | GithubActionsResource
  | GithubDiscussionResource;

interface GithubIssueApiResponse {
  readonly html_url?: string | null;
  readonly title?: string | null;
  readonly state?: string | null;
  readonly state_reason?: string | null;
  readonly user?: { readonly login?: string | null } | null;
  readonly created_at?: string | null;
  readonly updated_at?: string | null;
  readonly closed_at?: string | null;
  readonly comments?: number | null;
  readonly labels?:
    | readonly {
        readonly name?: string | null;
        readonly color?: string | null;
      }[]
    | null
    | undefined;
  readonly assignee?: { readonly login?: string | null } | null;
  readonly assignees?:
    | readonly { readonly login?: string | null }[]
    | null
    | undefined;
  readonly pull_request?: unknown;
}

interface GithubPullApiResponse {
  readonly html_url?: string | null;
  readonly title?: string | null;
  readonly state?: string | null;
  readonly merged?: boolean | null;
  readonly draft?: boolean | null;
  readonly mergeable_state?: string | null;
  readonly issue_url?: string | null;
  readonly user?: { readonly login?: string | null } | null;
  readonly created_at?: string | null;
  readonly updated_at?: string | null;
  readonly closed_at?: string | null;
  readonly comments?: number | null;
  readonly review_comments?: number | null;
  readonly commits?: number | null;
  readonly additions?: number | null;
  readonly deletions?: number | null;
  readonly changed_files?: number | null;
  readonly base?:
    | {
        readonly ref?: string | null;
      }
    | null
    | undefined;
  readonly head?:
    | {
        readonly ref?: string | null;
        readonly sha?: string | null;
      }
    | null
    | undefined;
}

interface GithubPullReviewApiResponse {
  readonly id?: number | null;
  readonly user?: { readonly login?: string | null } | null;
  readonly state?: string | null;
  readonly submitted_at?: string | null;
}

interface GithubRepositoryApiResponse {
  readonly full_name?: string | null;
  readonly description?: string | null;
  readonly default_branch?: string | null;
  readonly language?: string | null;
  readonly stargazers_count?: number | null;
  readonly forks_count?: number | null;
  readonly open_issues_count?: number | null;
  readonly visibility?: string | null;
  readonly private?: boolean | null;
  readonly archived?: boolean | null;
  readonly updated_at?: string | null;
  readonly pushed_at?: string | null;
  readonly topics?: readonly string[] | null;
  readonly license?: { readonly spdx_id?: string | null } | null;
  readonly html_url?: string | null;
}

interface GithubContentApiItem {
  readonly type?: string | null;
  readonly name?: string | null;
  readonly path?: string | null;
  readonly html_url?: string | null;
  readonly size?: number | null;
  readonly content?: string | null;
  readonly encoding?: string | null;
}

type GithubContentApiResponse =
  | GithubContentApiItem
  | readonly GithubContentApiItem[];

interface GithubCommitApiResponse {
  readonly html_url?: string | null;
  readonly sha?: string | null;
  readonly commit?: {
    readonly message?: string | null;
    readonly author?: {
      readonly name?: string | null;
      readonly date?: string | null;
    } | null;
    readonly committer?: {
      readonly name?: string | null;
      readonly date?: string | null;
    } | null;
  } | null;
  readonly author?: { readonly login?: string | null } | null;
  readonly committer?: { readonly login?: string | null } | null;
  readonly stats?:
    | {
        readonly additions?: number | null;
        readonly deletions?: number | null;
      }
    | null
    | undefined;
  readonly files?: readonly unknown[] | null;
}

interface GithubCombinedStatusApiResponse {
  readonly state?: string | null;
  readonly total_count?: number | null;
  readonly target_url?: string | null;
  readonly statuses?: readonly unknown[] | null;
}

interface GithubCheckRunApiResponse {
  readonly status?: string | null;
  readonly conclusion?: string | null;
  readonly html_url?: string | null;
}

interface GithubCheckRunsApiResponse {
  readonly total_count?: number | null;
  readonly check_runs?: readonly GithubCheckRunApiResponse[] | null;
}

interface GithubReleaseApiResponse {
  readonly html_url?: string | null;
  readonly name?: string | null;
  readonly tag_name?: string | null;
  readonly draft?: boolean | null;
  readonly prerelease?: boolean | null;
  readonly published_at?: string | null;
}

interface GithubActionsRunApiResponse {
  readonly html_url?: string | null;
  readonly name?: string | null;
  readonly display_title?: string | null;
  readonly status?: string | null;
  readonly conclusion?: string | null;
  readonly run_number?: number | null;
  readonly event?: string | null;
}

interface GithubActionsRunsApiResponse {
  readonly workflow_runs?: readonly GithubActionsRunApiResponse[] | null;
}

interface GithubWorkflowApiResponse {
  readonly html_url?: string | null;
  readonly name?: string | null;
  readonly path?: string | null;
  readonly state?: string | null;
}

interface GithubDiscussionGraphqlNode {
  readonly title?: string | null;
  readonly url?: string | null;
  readonly number?: number | null;
  readonly closed?: boolean | null;
  readonly answerChosenAt?: string | null;
  readonly category?: { readonly name?: string | null } | null;
  readonly comments?: { readonly totalCount?: number | null } | null;
}

interface GithubDiscussionGraphqlData {
  readonly repository?: {
    readonly discussion?: GithubDiscussionGraphqlNode | null;
    readonly discussions?: {
      readonly totalCount?: number | null;
      readonly nodes?: readonly GithubDiscussionGraphqlNode[] | null;
    } | null;
  } | null;
}

interface GithubGraphqlResponse<T> {
  readonly data?: T | null;
  readonly errors?:
    | readonly { readonly message?: string | null }[]
    | null
    | undefined;
}

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

const isGithubApiNotFoundError = (error: unknown): error is GithubApiError =>
  error instanceof GithubApiError && error.status === 404;

const isGithubContentApiDirectoryResponse = (
  content: GithubContentApiResponse
): content is readonly GithubContentApiItem[] => Array.isArray(content);

const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const encodePathPart = (value: string): string => encodeURIComponent(value);

const encodeGithubPath = (path: string): string =>
  path.split("/").map(encodePathPart).join("/");

const toPositiveNumber = (value: string | undefined): number | null => {
  if (!value || !GITHUB_NUMBER_PATTERN.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const parseGithubLineAnchor = (
  hash: string
): { readonly lineStart: number | null; readonly lineEnd: number | null } => {
  const normalized = hash.replace(/^#/, "");
  const match = /^L(\d+)(?:-L(\d+))?$/i.exec(normalized);
  if (!match) {
    return { lineStart: null, lineEnd: null };
  }

  const lineStart = toPositiveNumber(match[1]);
  const lineEnd = toPositiveNumber(match[2]);
  if (!lineStart) {
    return { lineStart: null, lineEnd: null };
  }

  return {
    lineStart,
    lineEnd: lineEnd && lineEnd >= lineStart ? lineEnd : lineStart,
  };
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
    throw new Error("Only github.com repository URLs are supported.");
  }

  const [owner, repo, kindSegment, ...rest] = parsed.pathname
    .split("/")
    .filter(Boolean)
    .map(safeDecode);

  if (!owner || !repo) {
    throw new Error("Only github.com repository URLs are supported.");
  }

  const base = { href: rawUrl.trim(), owner, repo };
  const number = toPositiveNumber(rest[0]);
  const lineRange = parseGithubLineAnchor(parsed.hash);

  switch (kindSegment) {
    case undefined:
    case "pulls":
      return { ...base, kind: "repository" };
    case "issues":
      if (!rest[0]) {
        return { ...base, kind: "repository" };
      }
      if (number) {
        return { ...base, kind: "issue", number };
      }
      throw new Error("Only github.com repository URLs are supported.");
    case "pull":
      if (number) {
        return { ...base, kind: "pull", number };
      }
      throw new Error("Only github.com repository URLs are supported.");
    case "blob":
      if (rest.length < 2) {
        throw new Error("Only github.com repository URLs are supported.");
      }
      return {
        ...base,
        kind: "content",
        mode: kindSegment,
        segments: rest,
        ...lineRange,
      };
    case "tree":
      if (rest.length < 1) {
        throw new Error("Only github.com repository URLs are supported.");
      }
      return {
        ...base,
        kind: "content",
        mode: kindSegment,
        segments: rest,
        lineStart: null,
        lineEnd: null,
      };
    case "commit":
      if (!rest[0]) {
        throw new Error("Only github.com repository URLs are supported.");
      }
      return { ...base, kind: "commit", ref: rest[0] };
    case "releases":
      return {
        ...base,
        kind: "release",
        tag: rest[0] === "tag" && rest[1] ? rest.slice(1).join("/") : null,
      };
    case "actions":
      return {
        ...base,
        kind: "actions",
        runId: rest[0] === "runs" ? toPositiveNumber(rest[1]) : null,
        workflowId: rest[0] === "workflows" && rest[1] ? rest[1] : null,
      };
    case "discussions":
      return { ...base, kind: "discussion", number };
    default:
      throw new Error("Only github.com repository URLs are supported.");
  }
};

const getResourceCacheKey = (resource: GithubResource): string => {
  const base = [resource.owner, resource.repo];

  switch (resource.kind) {
    case "repository":
      return JSON.stringify(["github-preview", "repository", ...base]);
    case "issue":
      return JSON.stringify([
        "github-preview",
        "issue",
        ...base,
        resource.number,
      ]);
    case "pull":
      return JSON.stringify([
        "github-preview",
        "pull",
        ...base,
        resource.number,
      ]);
    case "content":
      return JSON.stringify([
        "github-preview",
        "content",
        ...base,
        resource.mode,
        resource.lineStart,
        resource.lineEnd,
        ...resource.segments,
      ]);
    case "commit":
      return JSON.stringify([
        "github-preview",
        "commit",
        ...base,
        resource.ref,
      ]);
    case "release":
      return JSON.stringify([
        "github-preview",
        "release",
        ...base,
        resource.tag,
      ]);
    case "actions":
      return JSON.stringify([
        "github-preview",
        "actions",
        ...base,
        resource.runId,
        resource.workflowId,
      ]);
    case "discussion":
      return JSON.stringify([
        "github-preview",
        "discussion",
        ...base,
        resource.number,
      ]);
  }
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
      throw new GithubApiError(
        `GitHub request failed with status ${response.status}.`,
        response.status
      );
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

const fetchGithubGraphql = async <T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> => {
  const githubToken = serverEnv?.GITHUB_LINK_STATUS_PREVIEW_TOKEN;
  if (!githubToken) {
    throw new Error("GitHub discussion preview metadata is unavailable.");
  }

  const { controller, cancel } = createAbortController();

  try {
    const response = await fetch(GITHUB_GRAPHQL_URL, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${githubToken}`,
        "content-type": "application/json",
        "user-agent": "6529seize-github-preview/1.0",
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new GithubApiError(
        `GitHub GraphQL request failed with status ${response.status}.`,
        response.status
      );
    }

    const body = (await response.json()) as GithubGraphqlResponse<T>;
    const [firstError] = body.errors ?? [];
    if (firstError) {
      throw new Error(firstError.message ?? "GitHub GraphQL request failed.");
    }

    if (!body.data) {
      throw new Error("GitHub GraphQL response did not include data.");
    }

    return body.data;
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

const getIssueAssignees = (
  issue: GithubIssueApiResponse
): readonly string[] => {
  const assignees =
    issue.assignees
      ?.map((assignee) => assignee.login)
      .filter((login): login is string => Boolean(login)) ?? [];

  if (assignees.length > 0) {
    return assignees;
  }

  const legacyAssignee = issue.assignee?.login;
  return legacyAssignee ? [legacyAssignee] : [];
};

const getLabels = (
  labels: GithubIssueApiResponse["labels"]
): readonly GithubPreviewLabel[] => {
  return (
    labels
      ?.map((label): GithubPreviewLabel | null => {
        const name = label.name?.trim();
        if (!name) {
          return null;
        }

        return {
          name,
          color: label.color?.trim() || null,
        };
      })
      .filter((label): label is GithubPreviewLabel => label !== null) ?? []
  );
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

const FAILURE_CHECK_CONCLUSIONS = new Set([
  "failure",
  "timed_out",
  "cancelled",
  "action_required",
]);

const NEUTRAL_CHECK_CONCLUSIONS = new Set(["neutral", "skipped"]);

const toCombinedStatusState = (
  value: string | null | undefined
): GithubPreviewChecks["state"] => {
  switch (value) {
    case "success":
      return "success";
    case "failure":
    case "error":
      return "failure";
    case "pending":
      return "pending";
    default:
      return "unknown";
  }
};

const buildCheckSummaryFromRuns = (
  response: GithubCheckRunsApiResponse
): GithubPreviewChecks | null => {
  const runs = response.check_runs ?? [];
  if (runs.length === 0 && !response.total_count) {
    return null;
  }

  if (
    typeof response.total_count === "number" &&
    response.total_count > runs.length
  ) {
    return null;
  }

  let successful = 0;
  let failed = 0;
  let pending = 0;
  let neutral = 0;
  let skipped = 0;
  let firstUrl: string | null = null;

  for (const run of runs) {
    firstUrl ??= run.html_url ?? null;
    if (run.status !== "completed") {
      pending += 1;
      continue;
    }

    if (run.conclusion === "success") {
      successful += 1;
      continue;
    }

    if (run.conclusion && FAILURE_CHECK_CONCLUSIONS.has(run.conclusion)) {
      failed += 1;
      continue;
    }

    if (run.conclusion === "skipped") {
      skipped += 1;
      continue;
    }

    if (run.conclusion && NEUTRAL_CHECK_CONCLUSIONS.has(run.conclusion)) {
      neutral += 1;
    }
  }

  const total = response.total_count ?? runs.length;
  const state: GithubPreviewChecks["state"] =
    failed > 0
      ? "failure"
      : pending > 0
        ? "pending"
        : total > 0 && successful === total
          ? "success"
          : skipped > 0
            ? "skipped"
            : neutral > 0
              ? "neutral"
              : "unknown";

  return {
    state,
    total,
    successful,
    failed,
    pending,
    url: firstUrl,
  };
};

const buildCheckSummaryFromCombinedStatus = (
  status: GithubCombinedStatusApiResponse
): GithubPreviewChecks => ({
  state: toCombinedStatusState(status.state),
  total: status.total_count ?? status.statuses?.length ?? null,
  successful: null,
  failed: null,
  pending: null,
  url: status.target_url ?? null,
});

const resolvePullChecks = async (
  resource: GithubPullResource,
  sha: string | null | undefined
): Promise<GithubPreviewChecks | null> => {
  if (!sha) {
    return null;
  }

  const encodedOwner = encodeURIComponent(resource.owner);
  const encodedRepo = encodeURIComponent(resource.repo);
  const encodedSha = encodePathPart(sha);

  const [runs, status] = await Promise.all([
    fetchGithubJson<GithubCheckRunsApiResponse>(
      `/repos/${encodedOwner}/${encodedRepo}/commits/${encodedSha}/check-runs?per_page=50`
    ).catch(() => null),
    fetchGithubJson<GithubCombinedStatusApiResponse>(
      `/repos/${encodedOwner}/${encodedRepo}/commits/${encodedSha}/status`
    ).catch(() => null),
  ]);

  return (
    (runs ? buildCheckSummaryFromRuns(runs) : null) ??
    (status ? buildCheckSummaryFromCombinedStatus(status) : null)
  );
};

const buildPullPreview = (
  resource: GithubPullResource,
  pull: GithubPullApiResponse,
  reviews: readonly GithubPullReviewApiResponse[],
  issue: GithubIssueApiResponse | null,
  checks: GithubPreviewChecks | null
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
  author: pull.user?.login ?? issue?.user?.login ?? null,
  createdAt: pull.created_at ?? issue?.created_at ?? null,
  updatedAt: pull.updated_at ?? issue?.updated_at ?? null,
  closedAt: pull.closed_at ?? issue?.closed_at ?? null,
  comments: issue?.comments ?? pull.comments ?? null,
  reviewComments: pull.review_comments ?? null,
  commits: pull.commits ?? null,
  changedFiles: pull.changed_files ?? null,
  additions: pull.additions ?? null,
  deletions: pull.deletions ?? null,
  baseRef: pull.base?.ref ?? null,
  headRef: pull.head?.ref ?? null,
  headSha: pull.head?.sha ?? null,
  labels: getLabels(issue?.labels),
  checks,
  url:
    pull.html_url ??
    `https://github.com/${resource.owner}/${resource.repo}/pull/${resource.number}`,
});

const resolvePullPreview = async (
  resource: GithubPullResource
): Promise<GithubPullRequestPreviewResponse> => {
  const encodedOwner = encodeURIComponent(resource.owner);
  const encodedRepo = encodeURIComponent(resource.repo);
  const pull = await fetchGithubJson<GithubPullApiResponse>(
    `/repos/${encodedOwner}/${encodedRepo}/pulls/${resource.number}`
  );
  const [reviews, issue, checks] = await Promise.all([
    fetchGithubJson<GithubPullReviewApiResponse[]>(
      `/repos/${encodedOwner}/${encodedRepo}/pulls/${resource.number}/reviews`
    ).catch(() => []),
    pull.issue_url
      ? fetchGithubJson<GithubIssueApiResponse>(
          `/repos/${encodedOwner}/${encodedRepo}/issues/${resource.number}`
        ).catch(() => null)
      : Promise.resolve(null),
    resolvePullChecks(resource, pull.head?.sha).catch(() => null),
  ]);

  return buildPullPreview(resource, pull, reviews, issue, checks);
};

const resolveIssuePreview = async (
  resource: GithubIssueResource
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
    author: issue.user?.login ?? null,
    createdAt: issue.created_at ?? null,
    updatedAt: issue.updated_at ?? null,
    closedAt: issue.closed_at ?? null,
    comments: issue.comments ?? null,
    labels: getLabels(issue.labels),
    assignees: getIssueAssignees(issue),
    url:
      issue.html_url ??
      `https://github.com/${resource.owner}/${resource.repo}/issues/${resource.number}`,
  };
};

const resolveRepositoryPreview = async (
  resource: GithubRepositoryResource
): Promise<GithubRepositoryPreviewResponse> => {
  const repository = await fetchGithubJson<GithubRepositoryApiResponse>(
    `/repos/${encodeURIComponent(resource.owner)}/${encodeURIComponent(
      resource.repo
    )}`
  );

  return {
    type: "github.repository",
    owner: resource.owner,
    repo: resource.repo,
    title: repository.full_name ?? `${resource.owner}/${resource.repo}`,
    description: repository.description ?? null,
    defaultBranch: repository.default_branch ?? null,
    language: repository.language ?? null,
    stars: repository.stargazers_count ?? null,
    forks: repository.forks_count ?? null,
    openIssues: repository.open_issues_count ?? null,
    visibility:
      repository.visibility ?? (repository.private === true ? "private" : null),
    archived: repository.archived === true,
    updatedAt: repository.updated_at ?? null,
    pushedAt: repository.pushed_at ?? null,
    topics: repository.topics ?? [],
    license: repository.license?.spdx_id ?? null,
    url:
      repository.html_url ??
      `https://github.com/${resource.owner}/${resource.repo}`,
  };
};

const buildContentCandidates = (
  segments: readonly string[]
): readonly { readonly ref: string; readonly path: string }[] => {
  const maxRefSegments = Math.min(segments.length, CONTENT_REF_SPLIT_LIMIT);
  const candidates: { readonly ref: string; readonly path: string }[] = [];

  for (let index = 1; index <= maxRefSegments; index += 1) {
    candidates.push({
      ref: segments.slice(0, index).join("/"),
      path: segments.slice(index).join("/"),
    });
  }

  return candidates;
};

const getFallbackContentTitle = (
  resource: GithubContentResource,
  path: string
): string => {
  const [lastSegment] = path.split("/").filter(Boolean).slice(-1);
  if (lastSegment) {
    return lastSegment;
  }

  return resource.mode === "tree" ? resource.repo : "Code";
};

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  cjs: "JavaScript",
  css: "CSS",
  go: "Go",
  html: "HTML",
  java: "Java",
  js: "JavaScript",
  json: "JSON",
  jsx: "JavaScript",
  md: "Markdown",
  mdx: "MDX",
  mjs: "JavaScript",
  py: "Python",
  rs: "Rust",
  scss: "SCSS",
  sh: "Shell",
  sol: "Solidity",
  sql: "SQL",
  ts: "TypeScript",
  tsx: "TypeScript",
  txt: "Text",
  yml: "YAML",
  yaml: "YAML",
};

const getFileLanguage = (path: string | null | undefined): string | null => {
  const extension = getFileExtension(path);
  return extension ? (EXTENSION_LANGUAGE_MAP[extension] ?? null) : null;
};

const truncateExcerptLine = (line: string): string => {
  const normalized = line.replace(/\t/g, "  ").trimEnd();
  if (normalized.length <= CONTENT_EXCERPT_MAX_LINE_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, CONTENT_EXCERPT_MAX_LINE_LENGTH - 3)}...`;
};

function decodeGithubContentBuffer(
  content: GithubContentApiItem
): Buffer | null {
  if (
    content.encoding !== "base64" ||
    !content.content ||
    (typeof content.size === "number" &&
      content.size > CONTENT_EXCERPT_MAX_BYTES)
  ) {
    return null;
  }

  try {
    const buffer = Buffer.from(content.content.replace(/\s/g, ""), "base64");
    return buffer.byteLength <= CONTENT_EXCERPT_MAX_BYTES ? buffer : null;
  } catch {
    return null;
  }
}

function hasBinaryBytePattern(buffer: Buffer): boolean {
  if (buffer.includes(0)) {
    return true;
  }

  if (buffer.length === 0) {
    return false;
  }

  let controlByteCount = 0;
  for (const byte of buffer) {
    const isAllowedControl = byte === 9 || byte === 10 || byte === 13;
    if (byte < 32 && !isAllowedControl) {
      controlByteCount += 1;
    }
  }

  return controlByteCount / buffer.length > 0.05;
}

const decodeTextContent = (
  content: GithubContentApiItem,
  isBinary: boolean
): { readonly text: string | null; readonly detectedBinary: boolean } => {
  if (isBinary) {
    return { text: null, detectedBinary: true };
  }

  const buffer = decodeGithubContentBuffer(content);
  if (!buffer || hasBinaryBytePattern(buffer)) {
    return { text: null, detectedBinary: Boolean(buffer) };
  }

  return { text: buffer.toString("utf8"), detectedBinary: false };
};

const buildContentExcerpt = (
  content: GithubContentApiItem,
  resource: GithubContentResource,
  isBinary: boolean
): {
  readonly lineCount: number | null;
  readonly excerpt: readonly string[] | null;
  readonly lineStart: number | null;
  readonly lineEnd: number | null;
  readonly detectedBinary: boolean;
} => {
  const decoded = decodeTextContent(content, isBinary);
  if (!decoded.text) {
    return {
      lineCount: null,
      excerpt: null,
      lineStart: resource.lineStart,
      lineEnd: resource.lineEnd,
      detectedBinary: decoded.detectedBinary,
    };
  }

  const lines = decoded.text.replace(/\r\n/g, "\n").split("\n");
  const lineCount = lines.length;
  const requestedStart = resource.lineStart ?? 1;
  if (requestedStart > lineCount) {
    return {
      lineCount,
      excerpt: null,
      lineStart: null,
      lineEnd: null,
      detectedBinary: false,
    };
  }

  const normalizedLineEnd = resource.lineStart
    ? Math.min(resource.lineEnd ?? resource.lineStart, lineCount)
    : null;
  const startIndex = Math.max(0, requestedStart - 1);
  const endIndex =
    normalizedLineEnd && normalizedLineEnd >= requestedStart
      ? normalizedLineEnd
      : Math.min(lines.length, startIndex + CONTENT_EXCERPT_MAX_LINES);
  const excerpt = lines
    .slice(startIndex, Math.max(startIndex + 1, endIndex))
    .slice(0, CONTENT_EXCERPT_MAX_LINES)
    .map(truncateExcerptLine);

  return {
    lineCount,
    excerpt,
    lineStart: resource.lineStart,
    lineEnd: normalizedLineEnd,
    detectedBinary: false,
  };
};

const countDirectoryItems = (
  content: readonly GithubContentApiItem[],
  type: "file" | "dir"
): number => content.filter((item) => item.type === type).length;

const buildContentPreview = (
  resource: GithubContentResource,
  candidate: { readonly ref: string; readonly path: string },
  content: GithubContentApiResponse
): GithubContentPreviewResponse => {
  if (isGithubContentApiDirectoryResponse(content)) {
    const entries = content
      .map((item) => item.name)
      .filter((name): name is string => Boolean(name))
      .slice(0, 4);

    return {
      type: "github.directory",
      owner: resource.owner,
      repo: resource.repo,
      title: getFallbackContentTitle(resource, candidate.path),
      path: candidate.path || null,
      ref: candidate.ref,
      size: null,
      itemCount: content.length,
      extension: null,
      fileKind: null,
      mimeType: null,
      isBinary: null,
      language: null,
      lineCount: null,
      excerpt: null,
      entries,
      fileCount: countDirectoryItems(content, "file"),
      directoryCount: countDirectoryItems(content, "dir"),
      url: resource.href,
    };
  }

  const type =
    content.type === "dir" || resource.mode === "tree"
      ? "github.directory"
      : "github.file";
  const path = content.path ?? (candidate.path || null);
  const extension = type === "github.file" ? getFileExtension(path) : null;
  const mimeType =
    type === "github.file" ? getDefaultMimeTypeForExtension(extension) : null;
  const fileKind =
    type === "github.file"
      ? detectExternalFileKind({ extension, contentType: mimeType })
      : null;
  const isBinaryByKind =
    type === "github.file" && fileKind ? isBinaryFileKind(fileKind) : null;
  const contentExcerpt =
    type === "github.file"
      ? buildContentExcerpt(content, resource, Boolean(isBinaryByKind))
      : null;
  const { detectedBinary, ...contentExcerptResponse } = contentExcerpt ?? {
    lineCount: null,
    excerpt: null,
    lineStart: null,
    lineEnd: null,
    detectedBinary: false,
  };
  const isBinary =
    type === "github.file"
      ? Boolean(isBinaryByKind || detectedBinary)
      : null;

  return {
    type,
    owner: resource.owner,
    repo: resource.repo,
    title: content.name ?? getFallbackContentTitle(resource, candidate.path),
    path,
    ref: candidate.ref,
    size: typeof content.size === "number" ? content.size : null,
    itemCount: null,
    extension,
    fileKind,
    mimeType,
    isBinary,
    language:
      type === "github.file"
        ? getFileLanguage(path)
        : null,
    ...contentExcerptResponse,
    entries: null,
    fileCount: null,
    directoryCount: null,
    url: content.html_url ?? resource.href,
  };
};

const resolveContentPreview = async (
  resource: GithubContentResource
): Promise<GithubContentPreviewResponse> => {
  if (resource.segments.length === 0) {
    throw new Error("Only github.com repository URLs are supported.");
  }

  let lastNotFound: Error | null = null;

  for (const candidate of buildContentCandidates(resource.segments)) {
    const encodedOwner = encodeURIComponent(resource.owner);
    const encodedRepo = encodeURIComponent(resource.repo);
    const encodedPath = candidate.path
      ? `/${encodeGithubPath(candidate.path)}`
      : "";
    const params = new URLSearchParams({ ref: candidate.ref });

    try {
      const content = await fetchGithubJson<GithubContentApiResponse>(
        `/repos/${encodedOwner}/${encodedRepo}/contents${encodedPath}?${params.toString()}`
      );
      return buildContentPreview(resource, candidate, content);
    } catch (error) {
      if (!isGithubApiNotFoundError(error)) {
        throw error;
      }
      lastNotFound = error;
    }
  }

  throw lastNotFound ?? new Error("GitHub content preview metadata not found.");
};

const getCommitTitle = (commit: GithubCommitApiResponse): string | null => {
  const [firstLine] = commit.commit?.message?.split(/\r?\n/) ?? [];
  const title = firstLine?.trim();
  return title && title.length > 0 ? title : null;
};

const resolveCommitPreview = async (
  resource: GithubCommitResource
): Promise<GithubCommitPreviewResponse> => {
  const commit = await fetchGithubJson<GithubCommitApiResponse>(
    `/repos/${encodeURIComponent(resource.owner)}/${encodeURIComponent(
      resource.repo
    )}/commits/${encodePathPart(resource.ref)}`
  );
  const sha = commit.sha ?? resource.ref;

  return {
    type: "github.commit",
    owner: resource.owner,
    repo: resource.repo,
    title: getCommitTitle(commit),
    sha,
    shortSha: sha.slice(0, 12),
    author:
      commit.author?.login ??
      commit.commit?.author?.name ??
      commit.committer?.login ??
      commit.commit?.committer?.name ??
      null,
    committedAt:
      commit.commit?.author?.date ?? commit.commit?.committer?.date ?? null,
    additions: commit.stats?.additions ?? null,
    deletions: commit.stats?.deletions ?? null,
    changedFiles: commit.files?.length ?? null,
    url:
      commit.html_url ??
      `https://github.com/${resource.owner}/${resource.repo}/commit/${sha}`,
  };
};

const getReleaseState = (
  release: GithubReleaseApiResponse
): GithubReleasePreviewResponse["state"] => {
  if (release.draft === true) {
    return "draft";
  }

  if (release.prerelease === true) {
    return "prerelease";
  }

  return "published";
};

const buildReleasePreview = (
  resource: GithubReleaseResource,
  release: GithubReleaseApiResponse
): GithubReleasePreviewResponse => {
  const tagName = release.tag_name ?? resource.tag;

  return {
    type: "github.release",
    owner: resource.owner,
    repo: resource.repo,
    title: release.name ?? tagName ?? "Release",
    tagName,
    state: getReleaseState(release),
    publishedAt: release.published_at ?? null,
    url:
      release.html_url ??
      (tagName
        ? `https://github.com/${encodeURIComponent(
            resource.owner
          )}/${encodeURIComponent(resource.repo)}/releases/tag/${encodeGithubPath(
            tagName
          )}`
        : resource.href),
  };
};

const fallbackReleasePreview = (
  resource: GithubReleaseResource
): GithubReleasePreviewResponse => ({
  type: "github.release",
  owner: resource.owner,
  repo: resource.repo,
  title: resource.tag ?? "Releases",
  tagName: resource.tag,
  state: "published",
  publishedAt: null,
  url: resource.href,
});

const resolveReleasePreview = async (
  resource: GithubReleaseResource
): Promise<GithubReleasePreviewResponse> => {
  const encodedOwner = encodeURIComponent(resource.owner);
  const encodedRepo = encodeURIComponent(resource.repo);
  const endpoint = resource.tag
    ? `/repos/${encodedOwner}/${encodedRepo}/releases/tags/${encodePathPart(
        resource.tag
      )}`
    : `/repos/${encodedOwner}/${encodedRepo}/releases/latest`;

  try {
    const release = await fetchGithubJson<GithubReleaseApiResponse>(endpoint);
    return buildReleasePreview(resource, release);
  } catch (error) {
    if (isGithubApiNotFoundError(error)) {
      return fallbackReleasePreview(resource);
    }
    throw error;
  }
};

const buildActionsRunPreview = (
  resource: GithubActionsResource,
  run: GithubActionsRunApiResponse
): GithubActionsPreviewResponse => ({
  type: "github.actions",
  owner: resource.owner,
  repo: resource.repo,
  title:
    run.display_title ??
    run.name ??
    (run.run_number ? `Workflow run #${run.run_number}` : "Workflow run"),
  status: run.status ?? null,
  conclusion: run.conclusion ?? null,
  runNumber: run.run_number ?? null,
  event: run.event ?? null,
  url: run.html_url ?? resource.href,
});

const resolveActionsPreview = async (
  resource: GithubActionsResource
): Promise<GithubActionsPreviewResponse> => {
  const encodedOwner = encodeURIComponent(resource.owner);
  const encodedRepo = encodeURIComponent(resource.repo);

  if (resource.runId) {
    const run = await fetchGithubJson<GithubActionsRunApiResponse>(
      `/repos/${encodedOwner}/${encodedRepo}/actions/runs/${resource.runId}`
    );
    return buildActionsRunPreview(resource, run);
  }

  if (resource.workflowId) {
    const workflow = await fetchGithubJson<GithubWorkflowApiResponse>(
      `/repos/${encodedOwner}/${encodedRepo}/actions/workflows/${encodePathPart(
        resource.workflowId
      )}`
    );

    return {
      type: "github.actions",
      owner: resource.owner,
      repo: resource.repo,
      title: workflow.name ?? workflow.path ?? "Workflow",
      status: workflow.state ?? null,
      conclusion: null,
      runNumber: null,
      event: null,
      url: workflow.html_url ?? resource.href,
    };
  }

  const runs = await fetchGithubJson<GithubActionsRunsApiResponse>(
    `/repos/${encodedOwner}/${encodedRepo}/actions/runs?per_page=1`
  );
  const [latestRun] = runs.workflow_runs ?? [];

  if (!latestRun) {
    return {
      type: "github.actions",
      owner: resource.owner,
      repo: resource.repo,
      title: "Actions",
      status: null,
      conclusion: null,
      runNumber: null,
      event: null,
      url: resource.href,
    };
  }

  return buildActionsRunPreview(resource, latestRun);
};

const getDiscussionState = (
  discussion: GithubDiscussionGraphqlNode
): GithubDiscussionPreviewResponse["state"] => {
  if (discussion.answerChosenAt) {
    return "answered";
  }

  if (discussion.closed === true) {
    return "closed";
  }

  return "open";
};

const buildDiscussionPreview = (
  resource: GithubDiscussionResource,
  discussion: GithubDiscussionGraphqlNode | null
): GithubDiscussionPreviewResponse => ({
  type: "github.discussion",
  owner: resource.owner,
  repo: resource.repo,
  number: discussion?.number ?? resource.number,
  title:
    discussion?.title ??
    (resource.number ? `Discussion #${resource.number}` : "Discussions"),
  category: discussion?.category?.name ?? null,
  comments: discussion?.comments?.totalCount ?? null,
  state: discussion ? getDiscussionState(discussion) : null,
  url: discussion?.url ?? resource.href,
});

const resolveDiscussionPreview = async (
  resource: GithubDiscussionResource
): Promise<GithubDiscussionPreviewResponse> => {
  if (!serverEnv?.GITHUB_LINK_STATUS_PREVIEW_TOKEN) {
    return buildDiscussionPreview(resource, null);
  }

  const data = await fetchGithubGraphql<GithubDiscussionGraphqlData>(
    resource.number
      ? `
        query GithubDiscussionPreview($owner: String!, $repo: String!, $number: Int!) {
          repository(owner: $owner, name: $repo) {
            discussion(number: $number) {
              title
              url
              number
              closed
              answerChosenAt
              category { name }
              comments { totalCount }
            }
          }
        }
      `
      : `
        query GithubDiscussionsPreview($owner: String!, $repo: String!) {
          repository(owner: $owner, name: $repo) {
            discussions(first: 1, orderBy: { field: UPDATED_AT, direction: DESC }) {
              totalCount
              nodes {
                title
                url
                number
                closed
                answerChosenAt
                category { name }
                comments { totalCount }
              }
            }
          }
        }
      `,
    {
      owner: resource.owner,
      repo: resource.repo,
      ...(resource.number ? { number: resource.number } : {}),
    }
  );

  const discussion =
    data.repository?.discussion ??
    data.repository?.discussions?.nodes?.[0] ??
    null;

  return buildDiscussionPreview(resource, discussion);
};

const resolvePreviewForResource = async (
  resource: GithubResource
): Promise<GithubPreviewResponse> => {
  switch (resource.kind) {
    case "issue":
      return resolveIssuePreview(resource);
    case "pull":
      return resolvePullPreview(resource);
    case "repository":
      return resolveRepositoryPreview(resource);
    case "content":
      return resolveContentPreview(resource);
    case "commit":
      return resolveCommitPreview(resource);
    case "release":
      return resolveReleasePreview(resource);
    case "actions":
      return resolveActionsPreview(resource);
    case "discussion":
      return resolveDiscussionPreview(resource);
  }
};

export const resolveGithubPreview = async (
  rawUrl: string | null,
  options?: { readonly bypassCache?: boolean | undefined }
): Promise<GithubPreviewResponse> => {
  const resource = parseGithubResource(rawUrl);
  const cacheKey = getResourceCacheKey(resource);
  const bypassCache = options?.bypassCache === true;
  const cached = bypassCache ? undefined : cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  if (!bypassCache) {
    const pending = inFlight.get(cacheKey);
    if (pending) {
      return pending;
    }
  }

  const previewRequest = resolvePreviewForResource(resource);

  if (bypassCache) {
    return previewRequest;
  }

  inFlight.set(cacheKey, previewRequest);

  try {
    const preview = await previewRequest;
    cache.set(cacheKey, preview);
    return preview;
  } catch (error) {
    cache.delete(cacheKey);
    throw error;
  } finally {
    inFlight.delete(cacheKey);
  }
};
