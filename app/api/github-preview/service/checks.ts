import type { GithubPreviewChecks } from "@/services/api/github-preview-api";
import type {
  GithubCheckRunApiResponse,
  GithubCheckRunsApiResponse,
  GithubCombinedStatusApiResponse,
} from "./types";

const FAILURE_CHECK_CONCLUSIONS = new Set([
  "failure",
  "timed_out",
  "cancelled",
  "action_required",
]);

const NEUTRAL_CHECK_CONCLUSIONS = new Set(["neutral", "skipped"]);

interface CheckRunCounts {
  readonly successful: number;
  readonly failed: number;
  readonly pending: number;
  readonly neutral: number;
  readonly skipped: number;
}

type CheckRunCountKey = keyof CheckRunCounts;

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

const canSummarizeCheckRuns = (
  response: GithubCheckRunsApiResponse,
  runs: readonly GithubCheckRunApiResponse[]
): boolean => {
  if (runs.length === 0 && !response.total_count) {
    return false;
  }

  return (
    typeof response.total_count !== "number" ||
    response.total_count <= runs.length
  );
};

const getCheckRunCountKey = (
  run: GithubCheckRunApiResponse
): CheckRunCountKey | null => {
  if (run.status !== "completed") {
    return "pending";
  }

  if (run.conclusion === "success") {
    return "successful";
  }

  if (run.conclusion && FAILURE_CHECK_CONCLUSIONS.has(run.conclusion)) {
    return "failed";
  }

  if (run.conclusion === "skipped") {
    return "skipped";
  }

  return run.conclusion && NEUTRAL_CHECK_CONCLUSIONS.has(run.conclusion)
    ? "neutral"
    : null;
};

const countCheckRuns = (
  runs: readonly GithubCheckRunApiResponse[]
): CheckRunCounts => {
  const counts = {
    successful: 0,
    failed: 0,
    pending: 0,
    neutral: 0,
    skipped: 0,
  };

  for (const run of runs) {
    const key = getCheckRunCountKey(run);
    if (key) {
      counts[key] += 1;
    }
  }

  return counts;
};

const getCheckSummaryState = (
  counts: CheckRunCounts,
  total: number
): GithubPreviewChecks["state"] => {
  if (counts.failed > 0) {
    return "failure";
  }

  if (counts.pending > 0) {
    return "pending";
  }

  if (total > 0 && counts.successful === total) {
    return "success";
  }

  if (counts.skipped > 0) {
    return "skipped";
  }

  return counts.neutral > 0 ? "neutral" : "unknown";
};

export const buildCheckSummaryFromRuns = (
  response: GithubCheckRunsApiResponse
): GithubPreviewChecks | null => {
  const runs = response.check_runs ?? [];
  if (!canSummarizeCheckRuns(response, runs)) {
    return null;
  }

  const counts = countCheckRuns(runs);
  let firstUrl: string | null = null;

  for (const run of runs) {
    firstUrl ??= run.html_url ?? null;
  }

  const total = response.total_count ?? runs.length;

  return {
    state: getCheckSummaryState(counts, total),
    total,
    successful: counts.successful,
    failed: counts.failed,
    pending: counts.pending,
    url: firstUrl,
  };
};

export const buildCheckSummaryFromCombinedStatus = (
  status: GithubCombinedStatusApiResponse
): GithubPreviewChecks => ({
  state: toCombinedStatusState(status.state),
  total: status.total_count ?? status.statuses?.length ?? null,
  successful: null,
  failed: null,
  pending: null,
  url: status.target_url ?? null,
});
