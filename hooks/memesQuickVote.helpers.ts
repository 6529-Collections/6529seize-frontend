import { formatNumberWithCommas } from "@/helpers/Helpers";

const QUICK_VOTE_DEFAULT_PERCENTAGE = 0.01;
const MAX_QUICK_VOTE_AMOUNTS = 5;

export type MemesQuickVoteStats = {
  readonly leftThisRoundCount: number;
  readonly uncastPower: number | null;
  readonly unratedCount: number;
  readonly votingLabel: string | null;
};

type QuickVoteableDropLike =
  | {
      readonly context_profile_context?: {
        readonly max_rating?: number | null;
        readonly min_rating?: number | null;
        readonly rating?: number | null;
      } | null;
    }
  | null
  | undefined;

type QuickVoteRatingRange = {
  readonly maxRating: number;
  readonly minRating: number;
};

const normalizeMinRating = (value: number | null | undefined): number =>
  typeof value === "number" && Number.isFinite(value) ? Math.ceil(value) : 0;

const normalizeMaxRating = (value: number | null | undefined): number =>
  typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : 0;

export const getQuickVoteRatingRange = (
  drop: QuickVoteableDropLike
): QuickVoteRatingRange => ({
  maxRating: normalizeMaxRating(drop?.context_profile_context?.max_rating),
  minRating: normalizeMinRating(drop?.context_profile_context?.min_rating),
});

export const getQuickVoteAbsoluteRemainingPower = (
  range: QuickVoteRatingRange
): number =>
  Math.max(
    Math.max(0, range.maxRating),
    Math.abs(Math.min(0, range.minRating))
  );

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
      entry === 0 ||
      seen.has(entry)
    ) {
      continue;
    }

    seen.add(entry);
    amounts.push(entry);
  }

  return amounts.slice(-MAX_QUICK_VOTE_AMOUNTS);
};
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

export const formatMemesQuickVoteLeftThisRoundText = (count: number): string =>
  `${formatNumberWithCommas(count)} left this round`;

export const formatMemesQuickVoteUnratedText = (count: number): string =>
  `${formatNumberWithCommas(count)} unrated`;

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
  rangeOrMaxRating: QuickVoteRatingRange | number
): number | null => {
  const range =
    typeof rangeOrMaxRating === "number"
      ? { maxRating: normalizeMaxRating(rangeOrMaxRating), minRating: 0 }
      : {
          maxRating: normalizeMaxRating(rangeOrMaxRating.maxRating),
          minRating: normalizeMinRating(rangeOrMaxRating.minRating),
        };
  const allowsNegativeVotes = range.minRating < 0;
  const parsedValue =
    typeof rawValue === "number" ? rawValue : Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsedValue) || range.minRating > range.maxRating) {
    return null;
  }

  const roundedValue = Math.round(parsedValue);

  if (!allowsNegativeVotes) {
    if (range.maxRating <= 0) {
      return null;
    }

    return Math.max(1, Math.min(roundedValue, range.maxRating));
  }

  const clampedValue = Math.max(
    range.minRating,
    Math.min(roundedValue, range.maxRating)
  );

  return clampedValue === 0 ? null : clampedValue;
};

export const isMemesQuickVoteVoteableDrop = (
  drop: QuickVoteableDropLike
): boolean => {
  const profileContext = drop?.context_profile_context;
  const range = getQuickVoteRatingRange(drop);

  return (
    profileContext?.rating === 0 && (range.maxRating > 0 || range.minRating < 0)
  );
};
