import { getNodeEnv, publicEnv } from "@/config/env";
import type { ApiDropVoter } from "@/generated/models/ApiDropVoter";
import type { ApiDropVotersPage } from "@/generated/models/ApiDropVotersPage";
import type { ApiDropVoteSummary } from "@/generated/models/ApiDropVoteSummary";
import { commonApiFetch } from "@/services/api/common-api";
import {
  getDropEndpointId,
  getNormalizedDropId,
} from "@/services/api/wave-drops-v2-helpers";

const PREVIEW_PAGE_SIZE = 100;
const PREVIEW_MAX_VOTERS = 1000;

const isLoopback = (hostname: string): boolean =>
  ["localhost", "127.0.0.1", "[::1]"].includes(hostname);

// Temporary design preview using real, existing API reads. Production uses
// backend summaries; this path does not validate their SQL or performance.
export function isLocalVotePreviewEnabled(): boolean {
  if (getNodeEnv() !== "development") {
    return false;
  }
  try {
    return isLoopback(new URL(publicEnv.BASE_ENDPOINT).hostname);
  } catch {
    return false;
  }
}

function isValidPreviewVoter(entry: unknown): boolean {
  if (
    typeof entry !== "object" ||
    entry === null ||
    !("vote" in entry) ||
    !("voter" in entry)
  ) {
    return false;
  }
  const voter = entry.voter;
  return (
    Number.isSafeInteger(entry.vote) &&
    typeof voter === "object" &&
    voter !== null &&
    "id" in voter &&
    typeof voter.id === "string" &&
    voter.id.trim().length > 0
  );
}

async function fetchPreviewPage(
  dropId: string,
  page: number,
  pageSize: number,
  signal?: AbortSignal
): Promise<ApiDropVotersPage> {
  if (
    !isLocalVotePreviewEnabled() ||
    typeof window === "undefined" ||
    !isLoopback(window.location.hostname)
  ) {
    throw new Error("Vote design preview is available only on localhost.");
  }
  const result = await commonApiFetch<ApiDropVotersPage>({
    endpoint: `v2/drops/${getDropEndpointId(getNormalizedDropId(dropId))}/votes`,
    params: {
      page: String(page),
      page_size: String(pageSize),
      sort_direction: "DESC",
    },
    signal,
  });
  const expectedLength = Math.max(
    0,
    Math.min(pageSize, result.count - (page - 1) * pageSize)
  );
  if (
    !Number.isSafeInteger(result.count) ||
    result.count < 0 ||
    result.page !== page ||
    result.next !== result.count > page * pageSize ||
    !Array.isArray(result.data) ||
    result.data.length !== expectedLength ||
    result.data.some((entry) => !isValidPreviewVoter(entry))
  ) {
    throw new Error("Incomplete vote data for the local design preview.");
  }
  return result;
}

export async function fetchLargestVotePreview(
  dropId: string,
  signal?: AbortSignal
): Promise<ApiDropVoter | null> {
  // The existing endpoint orders by absolute current allocation descending.
  // Tied voters may differ from the backend summary's deterministic tie-break.
  const result = await fetchPreviewPage(dropId, 1, 1, signal);
  const largest = result.data[0];
  return largest && largest.vote !== 0 ? largest : null;
}

export async function fetchDropVoteSummaryPreview(
  dropId: string,
  signal?: AbortSignal
): Promise<ApiDropVoteSummary> {
  const first = await fetchPreviewPage(dropId, 1, PREVIEW_PAGE_SIZE, signal);
  if (first.count > PREVIEW_MAX_VOTERS) {
    throw new Error("This drop exceeds the local vote preview limit.");
  }
  const voters = [...first.data];
  const pages = Math.ceil(first.count / PREVIEW_PAGE_SIZE);
  for (let page = 2; page <= pages; page += 1) {
    const result = await fetchPreviewPage(
      dropId,
      page,
      PREVIEW_PAGE_SIZE,
      signal
    );
    if (result.count !== first.count) {
      throw new Error("Votes changed while loading the local design preview.");
    }
    voters.push(...result.data);
  }
  // Existing pagination is not an atomic snapshot. Reject detectable drift
  // instead of showing incomplete totals; same-count edits can still occur.
  if (new Set(voters.map((entry) => entry.voter.id)).size !== first.count) {
    throw new Error("Votes changed while loading the local design preview.");
  }
  voters.sort((left, right) => {
    const magnitude = Math.abs(right.vote) - Math.abs(left.vote);
    if (magnitude !== 0) {
      return magnitude;
    }
    return left.voter.id < right.voter.id ? -1 : 1;
  });
  const positive = voters.filter((entry) => entry.vote > 0);
  const negative = voters.filter((entry) => entry.vote < 0);
  const positiveTotal = positive.reduce((sum, entry) => sum + entry.vote, 0);
  const negativeTotal = negative.reduce((sum, entry) => sum + entry.vote, 0);
  if (
    !Number.isSafeInteger(positiveTotal) ||
    !Number.isSafeInteger(negativeTotal) ||
    !Number.isSafeInteger(positiveTotal - negativeTotal)
  ) {
    throw new RangeError("Vote amounts exceed the local preview's safe range.");
  }
  if (positiveTotal === 0 && negativeTotal === 0) {
    return {};
  }
  return {
    vote_distribution: {
      positive_total: positiveTotal,
      negative_total: negativeTotal,
      positive_votes: positive.slice(0, 3),
      negative_votes: negative.slice(0, 3),
    },
  };
}
