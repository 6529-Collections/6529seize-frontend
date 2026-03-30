const QUICK_VOTE_DEFAULT_PERCENTAGE = 0.01;
const MAX_QUICK_VOTE_AMOUNTS = 5;

export type MemesQuickVoteStats = {
  readonly uncastPower: number | null;
  readonly unratedCount: number;
  readonly votingLabel: string | null;
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
