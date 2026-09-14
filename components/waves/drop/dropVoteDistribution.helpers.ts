import type { ApiDropVoteDistribution } from "@/generated/models/ApiDropVoteDistribution";
import type { ApiDropVoter } from "@/generated/models/ApiDropVoter";

export interface VoteSide {
  readonly positive: boolean;
  readonly total: number;
  readonly remainder: number;
  readonly voters: readonly ApiDropVoter[];
}

function isVoteEntry(entry: unknown): entry is ApiDropVoter {
  if (
    entry === null ||
    typeof entry !== "object" ||
    !("vote" in entry) ||
    !("voter" in entry)
  ) {
    return false;
  }
  const voter = entry.voter;
  return (
    typeof entry.vote === "number" &&
    Number.isSafeInteger(entry.vote) &&
    voter !== null &&
    typeof voter === "object" &&
    "id" in voter &&
    typeof voter.id === "string" &&
    voter.id.trim().length > 0
  );
}

function getVoteSide(
  total: number,
  voters: unknown,
  positive: boolean
): VoteSide | null {
  const direction = positive ? 1 : -1;
  if (
    !Number.isSafeInteger(total) ||
    total * direction < 0 ||
    !Array.isArray(voters) ||
    voters.length > 3
  ) {
    return null;
  }
  const entries: readonly unknown[] = voters;
  if (
    !entries.every(isVoteEntry) ||
    entries.some((entry) => entry.vote * direction <= 0)
  ) {
    return null;
  }
  const listedTotal = entries.reduce((sum, entry) => sum + entry.vote, 0);
  if (
    !Number.isSafeInteger(listedTotal) ||
    Math.abs(listedTotal) > Math.abs(total)
  ) {
    return null;
  }
  return {
    positive,
    total,
    remainder: total - listedTotal,
    voters: [...entries].sort(
      (left, right) => Math.abs(right.vote) - Math.abs(left.vote)
    ),
  };
}

export function getVoteSides(
  distribution: ApiDropVoteDistribution | undefined
): readonly [VoteSide, VoteSide] | null {
  if (!distribution) {
    return null;
  }
  const positive = getVoteSide(
    distribution.positive_total,
    distribution.positive_votes,
    true
  );
  const negative = getVoteSide(
    distribution.negative_total,
    distribution.negative_votes,
    false
  );
  if (!positive || !negative) {
    return null;
  }
  const grossTotal = positive.total - negative.total;
  const voterIds = [...negative.voters, ...positive.voters].map(
    (entry) => entry.voter.id
  );
  if (
    !Number.isSafeInteger(grossTotal) ||
    grossTotal <= 0 ||
    new Set(voterIds).size !== voterIds.length
  ) {
    return null;
  }
  return [negative, positive];
}
