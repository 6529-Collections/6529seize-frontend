import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropWithoutWave } from "@/generated/models/ApiDropWithoutWave";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import { Time } from "@/helpers/time";

export const MEMES_QUICK_VOTE_DISCOVERY_PAGE_SIZE = 20 as const;
export const MEMES_QUICK_VOTE_REPLENISH_THRESHOLD = 5 as const;
export const MEMES_QUICK_VOTE_SUMMARY_PAGE_SIZE = 1 as const;
const QUICK_VOTE_DEFAULT_PERCENTAGE = 0.01;
const MAX_QUICK_VOTE_AMOUNTS = 5;

export type MemesQuickVoteStats = {
  readonly uncastPower: number | null;
  readonly unratedCount: number;
  readonly votingLabel: string | null;
};

export const sanitizeStoredDropIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const ids: string[] = [];

  for (const entry of value) {
    if (typeof entry !== "string") {
      continue;
    }

    const trimmed = entry.trim();

    if (trimmed.length === 0 || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    ids.push(trimmed);
  }

  return ids;
};

export const sanitizeStoredAmounts = (value: unknown): number[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<number>();
  const amounts: number[] = [];

  for (const entry of value) {
    if (
      typeof entry !== "number" ||
      !Number.isFinite(entry) ||
      !Number.isInteger(entry) ||
      entry <= 0 ||
      seen.has(entry)
    ) {
      continue;
    }

    seen.add(entry);
    amounts.push(entry);
  }

  return amounts.slice(-MAX_QUICK_VOTE_AMOUNTS);
};

export const buildMemesQuickVoteApiDrop = (
  drop: ApiDropWithoutWave,
  wave: ApiWaveMin
): ApiDrop => ({
  ...drop,
  wave,
});

export const deriveMemesQuickVoteStatsFromDrop = ({
  count,
  drop,
}: {
  readonly count: number;
  readonly drop: ApiDrop | null;
}): MemesQuickVoteStats => {
  if (count <= 0 || !drop) {
    return {
      uncastPower: null,
      unratedCount: 0,
      votingLabel: null,
    };
  }

  const uncastPower = drop.context_profile_context?.max_rating ?? null;

  return {
    uncastPower:
      typeof uncastPower === "number" && uncastPower > 0 ? uncastPower : null,
    unratedCount: count,
    votingLabel: WAVE_VOTING_LABELS[drop.wave.voting_credit_type],
  };
};

export const isMemesQuickVoteDiscoverableDrop = ({
  drop,
  now = Time.currentMillis(),
  waveId,
}: {
  readonly drop: ApiDrop | null | undefined;
  readonly now?: number | undefined;
  readonly waveId?: string | null | undefined;
}): boolean => {
  if (drop?.drop_type !== ApiDropType.Participatory) {
    return false;
  }

  if (waveId && drop.wave.id !== waveId) {
    return false;
  }

  const profileContext = drop.context_profile_context;

  if (
    profileContext?.rating !== 0 ||
    typeof profileContext.max_rating !== "number"
  ) {
    return false;
  }

  if (
    !drop.wave.authenticated_user_eligible_to_vote ||
    drop.id.startsWith("temp-")
  ) {
    return false;
  }

  const votingPeriodStart = drop.wave.voting_period_start;

  if (votingPeriodStart !== null && now < votingPeriodStart) {
    return false;
  }

  const votingPeriodEnd = drop.wave.voting_period_end;

  return votingPeriodEnd === null || now <= votingPeriodEnd;
};

export const getMemesQuickVoteRemainingCount = ({
  count,
  floor = 0,
  hiddenCount = 0,
  optimisticVoteCount = 0,
}: {
  readonly count: number | null;
  readonly floor?: number | undefined;
  readonly hiddenCount?: number | undefined;
  readonly optimisticVoteCount?: number | undefined;
}): number =>
  Math.max(
    floor,
    Math.max(0, (count ?? 0) - optimisticVoteCount - hiddenCount)
  );

export const appendSkippedDropId = (
  ids: readonly string[],
  dropId: string
): string[] => [...ids.filter((value) => value !== dropId), dropId];

export const addRecentQuickVoteAmount = (
  amounts: readonly number[],
  amount: number
): number[] =>
  [...amounts.filter((value) => value !== amount), amount].slice(
    -MAX_QUICK_VOTE_AMOUNTS
  );

export const getDisplayQuickVoteAmounts = (
  amounts: readonly number[]
): number[] => [...amounts].sort((left, right) => left - right);

export const getDefaultQuickVoteAmount = (maxRating: number): number => {
  const normalizedMaxRating = Math.max(1, Math.floor(maxRating));
  return Math.max(
    1,
    Math.min(
      normalizedMaxRating,
      Math.round(normalizedMaxRating * QUICK_VOTE_DEFAULT_PERCENTAGE)
    )
  );
};

export const normalizeQuickVoteAmount = (
  rawValue: number | string,
  maxRating: number
): number | null => {
  const parsedValue =
    typeof rawValue === "number" ? rawValue : Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsedValue) || maxRating <= 0) {
    return null;
  }

  return Math.max(1, Math.min(Math.round(parsedValue), Math.floor(maxRating)));
};
