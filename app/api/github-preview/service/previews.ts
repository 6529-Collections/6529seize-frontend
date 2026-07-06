import { serverEnv } from "@/config/serverEnv";
import type {
  GithubActionsPreviewResponse,
  GithubPreviewChecks,
  GithubPreviewLabel,
  GithubCommitPreviewResponse,
  GithubDiscussionPreviewResponse,
  GithubIssuePreviewResponse,
  GithubPullRequestPreviewResponse,
  GithubReleasePreviewResponse,
  GithubRepositoryPreviewResponse,
  GithubPreviewResponse,
} from "@/services/api/github-preview-api";
import { resolveContentPreview } from "./content";
import {
  fetchGithubGraphql,
  fetchGithubJson,
  isGithubApiNotFoundError,
} from "./fetchers";
import { encodeGithubPath, encodePathPart } from "./resource";
import type {
  GithubActionsResource,
  GithubActionsRunApiResponse,
  GithubActionsRunsApiResponse,
  GithubCheckRunsApiResponse,
  GithubCombinedStatusApiResponse,
  GithubCommitApiResponse,
  GithubCommitResource,
  GithubDiscussionGraphqlData,
  GithubDiscussionGraphqlNode,
  GithubDiscussionResource,
  GithubIssueApiResponse,
  GithubIssueResource,
  GithubPullApiResponse,
  GithubPullResource,
  GithubPullReviewApiResponse,
  GithubReleaseApiResponse,
  GithubReleaseResource,
  GithubRepositoryApiResponse,
  GithubRepositoryResource,
  GithubResource,
  GithubReviewApiState,
  GithubWorkflowApiResponse,
} from "./types";
import {
  buildCheckSummaryFromCombinedStatus,
  buildCheckSummaryFromRuns,
} from "./checks";

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

export const resolvePreviewForResource = async (
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
