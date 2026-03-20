import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { convertApiDropToExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import { Time } from "@/helpers/time";

export const MEMES_WAVE_DROPS_LIMIT = 20 as const;
const QUICK_VOTE_DEFAULT_PERCENTAGE = 0.01;
const MAX_QUICK_VOTE_AMOUNTS = 5;

export type MemesQuickVoteStats = {
  readonly uncastPower: number | null;
  readonly unratedCount: number;
  readonly votingLabel: string | null;
};

export const sanitizeStoredSerials = (value: unknown): number[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<number>();
  const serials: number[] = [];

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
    serials.push(entry);
  }

  return serials;
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

const isMemesQuickVoteEligibleDrop = (
  drop: ApiDrop,
  now = Time.currentMillis()
): boolean => {
  const profileContext = drop.context_profile_context;

  if (drop.drop_type !== ApiDropType.Participatory) {
    return false;
  }

  if (profileContext?.rating !== 0 || profileContext.max_rating <= 0) {
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

  if (votingPeriodEnd !== null && now > votingPeriodEnd) {
    return false;
  }

  return true;
};

export const getMemesQuickVoteEligibleDrops = (
  drops: readonly ApiDrop[],
  now = Time.currentMillis()
): ApiDrop[] => drops.filter((drop) => isMemesQuickVoteEligibleDrop(drop, now));

export const deriveMemesQuickVoteStats = (
  drops: readonly ApiDrop[]
): MemesQuickVoteStats => {
  const eligibleDrops = getMemesQuickVoteEligibleDrops(drops);

  if (eligibleDrops.length === 0) {
    return {
      uncastPower: null,
      unratedCount: 0,
      votingLabel: null,
    };
  }

  let uncastPower = 0;
  let votingLabel: string | null = null;

  for (const drop of eligibleDrops) {
    const profileContext = drop.context_profile_context;

    if (!profileContext) {
      continue;
    }

    votingLabel ??= WAVE_VOTING_LABELS[drop.wave.voting_credit_type];
    uncastPower = Math.max(uncastPower, profileContext.max_rating);
  }

  return {
    uncastPower: uncastPower > 0 ? uncastPower : null,
    unratedCount: eligibleDrops.length,
    votingLabel,
  };
};

export const deriveMemesQuickVoteEffectiveDrops = (
  drops: readonly ApiDrop[],
  votedSerials: readonly number[],
  optimisticRemainingPower: number | null
): readonly ApiDrop[] => {
  if (votedSerials.length === 0 && optimisticRemainingPower === null) {
    return drops;
  }

  const votedSet = new Set(votedSerials);

  return drops.flatMap((drop) => {
    if (votedSet.has(drop.serial_no)) {
      return [];
    }

    const profileContext = drop.context_profile_context;
    const maxRating = profileContext?.max_rating;

    if (
      optimisticRemainingPower === null ||
      profileContext?.rating !== 0 ||
      typeof maxRating !== "number"
    ) {
      return [drop];
    }

    const nextMaxRating = Math.max(
      0,
      Math.min(maxRating, optimisticRemainingPower)
    );

    if (nextMaxRating === maxRating) {
      return [drop];
    }

    return [
      {
        ...drop,
        context_profile_context: {
          ...profileContext,
          max_rating: nextMaxRating,
        },
      },
    ];
  });
};

export const buildMemesQuickVoteQueue = (
  drops: readonly ApiDrop[],
  skippedSerials: readonly number[]
): ExtendedDrop[] => {
  const eligibleDrops = getMemesQuickVoteEligibleDrops(drops).map(
    convertApiDropToExtendedDrop
  );
  const skippedSet = new Set(skippedSerials);
  const deferredDrops = new Map<number, ExtendedDrop>();
  const queue: ExtendedDrop[] = [];

  for (const drop of eligibleDrops) {
    if (!skippedSet.has(drop.serial_no)) {
      queue.push(drop);
      continue;
    }

    deferredDrops.set(drop.serial_no, drop);
  }

  for (const serialNo of skippedSerials) {
    const deferredDrop = deferredDrops.get(serialNo);

    if (deferredDrop) {
      queue.push(deferredDrop);
    }
  }

  return queue;
};

export const appendSkippedSerial = (
  serials: readonly number[],
  serialNo: number
): number[] => [...serials.filter((value) => value !== serialNo), serialNo];

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
