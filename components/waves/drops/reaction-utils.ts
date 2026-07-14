import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ApiDropReaction } from "@/generated/models/ApiDropReaction";
import { getBannerColorValue } from "@/helpers/profile-banner.helpers";
import { extractRetryAfterMs } from "@/helpers/reactions/reactionRateLimit";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { isWaveReactionDisabledApiError } from "@/utils/monitoring/dropReactionErrorClassification";

type ReactionEntry = {
  reaction: string;
  profiles: ApiProfileMin[];
  [key: string]: unknown;
};

export const getReactionCount = (
  reaction: Pick<ApiDropReaction, "profiles"> & { readonly count?: unknown }
): number => {
  if (
    typeof reaction.count === "number" &&
    Number.isFinite(reaction.count) &&
    reaction.count >= 0
  ) {
    return reaction.count;
  }

  return reaction.profiles.length;
};

const withReactionCount = (
  entry: ReactionEntry,
  count: number
): ReactionEntry => ({
  ...entry,
  count: Math.max(0, count),
});

export const cloneReactionEntries = (
  reactions: readonly ApiDropReaction[] | null | undefined
): ReactionEntry[] => {
  if (!reactions || reactions.length === 0) {
    return [];
  }

  return reactions.map((reaction) => ({
    ...reaction,
    profiles: [...reaction.profiles],
  }));
};

const duplicateProfilesWithoutUser = (
  profiles: ApiProfileMin[],
  userId: string | null
): ApiProfileMin[] => {
  if (!userId) {
    return [...profiles];
  }

  const filteredProfiles: ApiProfileMin[] = [];

  for (const profile of profiles) {
    if (profile.id !== userId) {
      filteredProfiles.push(profile);
    }
  }

  return filteredProfiles;
};

export const removeUserFromReactions = (
  entries: ReactionEntry[],
  userId: string | null
): ReactionEntry[] => {
  const sanitizedEntries: ReactionEntry[] = [];

  for (const entry of entries) {
    const filteredProfiles = duplicateProfilesWithoutUser(
      entry.profiles,
      userId
    );

    if (filteredProfiles.length > 0) {
      sanitizedEntries.push({
        ...entry,
        profiles: filteredProfiles,
      });
    }
  }

  return sanitizedEntries;
};

const findReactionIndex = (
  entries: ReactionEntry[],
  reactionCode: string
): number => {
  for (let index = 0; index < entries.length; index += 1) {
    if (entries[index]?.reaction === reactionCode) {
      return index;
    }
  }

  return -1;
};

export const applyProfileReactionToEntries = ({
  entries,
  nextReaction,
  previousReaction,
  profileMin,
}: {
  readonly entries: ReactionEntry[];
  readonly nextReaction: string | null;
  readonly previousReaction: string | null;
  readonly profileMin: ApiProfileMin;
}): ReactionEntry[] => {
  const normalizedPreviousReaction =
    previousReaction === nextReaction ? null : previousReaction;
  const userId = profileMin.id;
  const nextEntries: ReactionEntry[] = [];

  for (const entry of entries) {
    const filteredProfiles = duplicateProfilesWithoutUser(
      entry.profiles,
      userId
    );
    const shouldDecrement =
      normalizedPreviousReaction !== null &&
      entry.reaction === normalizedPreviousReaction;
    const nextCount = getReactionCount(entry) - (shouldDecrement ? 1 : 0);

    if (nextCount > 0) {
      nextEntries.push(
        withReactionCount(
          {
            ...entry,
            profiles: filteredProfiles,
          },
          nextCount
        )
      );
    }
  }

  if (nextReaction === null) {
    return nextEntries;
  }

  const existingIndex = findReactionIndex(nextEntries, nextReaction);
  if (existingIndex >= 0) {
    const target = nextEntries[existingIndex]!;
    const hasProfile = target.profiles.some(
      (profile) => profile.id === profileMin.id
    );
    nextEntries[existingIndex] = withReactionCount(
      {
        ...target,
        profiles: hasProfile
          ? target.profiles
          : [...target.profiles, profileMin],
      },
      getReactionCount(target) + 1
    );
    return nextEntries;
  }

  nextEntries.push(
    withReactionCount(
      {
        reaction: nextReaction,
        profiles: [profileMin],
      },
      1
    )
  );

  return nextEntries;
};

export const toProfileMin = (
  profile: ApiIdentity | null
): ApiProfileMin | null => {
  if (!profile) {
    return null;
  }

  return {
    id: profile.id ?? profile.primary_wallet,
    handle: profile.handle ?? null,
    pfp: profile.pfp ?? null,
    banner1_color: getBannerColorValue(profile.banner1),
    banner2_color: getBannerColorValue(profile.banner2),
    cic: profile.cic,
    rep: profile.rep,
    tdh: profile.tdh,
    tdh_rate: profile.tdh_rate,
    xtdh: profile.xtdh,
    xtdh_rate: profile.xtdh_rate,
    level: profile.level,
    primary_address: profile.primary_wallet,
    subscribed_actions: [],
    archived: false,
    active_main_stage_submission_ids: profile.active_main_stage_submission_ids,
    winner_main_stage_drop_ids: profile.winner_main_stage_drop_ids,
    is_wave_creator: profile.is_wave_creator,
    artist_of_prevote_cards: profile.artist_of_prevote_cards,
    profile_wave_id: profile.profile_wave_id,
    classification: profile.classification,
    sub_classification: profile.sub_classification,
  };
};

type StructuredReactionError = Error & {
  status?: unknown;
  headers?: unknown;
  response?: {
    status?: unknown;
    statusText?: unknown;
    body?: unknown;
    headers?: unknown;
  } | null;
};

const isNonEmptyUnknownArray = (value: unknown): value is readonly unknown[] =>
  Array.isArray(value) && value.length > 0;

const getDetailsFirstMessage = (details: unknown): string | null => {
  if (!isNonEmptyUnknownArray(details)) {
    return null;
  }

  for (const detail of details) {
    if (detail === null || typeof detail !== "object") {
      continue;
    }

    const message = (detail as { message?: unknown }).message;
    if (typeof message !== "string") {
      continue;
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length > 0) {
      return trimmedMessage;
    }
  }

  return null;
};

// Reaction toasts should only surface messages from known API JSON fields.
const getStructuredReactionBodyMessage = (body: unknown): string | null => {
  if (typeof body === "string") {
    try {
      return getStructuredReactionBodyMessage(JSON.parse(body) as unknown);
    } catch {
      return null;
    }
  }

  if (body === null || typeof body !== "object") {
    return null;
  }

  const bodyRecord = body as Record<string, unknown>;
  const errorMessage = bodyRecord["error"];
  if (typeof errorMessage === "string" && errorMessage.trim().length > 0) {
    return errorMessage;
  }

  const message = bodyRecord["message"];
  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }

  return getDetailsFirstMessage(bodyRecord["details"]);
};

const hasNoStructuredReactionBody = (body: unknown): boolean => {
  if (body === null || body === undefined) {
    return true;
  }

  if (typeof body === "string") {
    if (body.trim().length === 0) {
      return true;
    }

    try {
      return hasNoStructuredReactionBody(JSON.parse(body) as unknown);
    } catch {
      return false;
    }
  }

  return getStructuredReactionBodyMessage(body) === null;
};

const getStructuredReactionStatus = (
  error: StructuredReactionError
): number | null => {
  const directStatus = error.status;
  if (typeof directStatus === "number") {
    return directStatus;
  }

  const responseStatus = error.response?.status;
  if (typeof responseStatus === "number") {
    return responseStatus;
  }

  return null;
};

type RetryAfterDurationUnit = "seconds" | "minutes";

const RETRY_AFTER_MESSAGE_KEYS = {
  seconds: {
    one: "drops.reactions.rateLimit.retryAfter.seconds.one",
    other: "drops.reactions.rateLimit.retryAfter.seconds.other",
  },
  minutes: {
    one: "drops.reactions.rateLimit.retryAfter.minutes.one",
    other: "drops.reactions.rateLimit.retryAfter.minutes.other",
  },
} as const satisfies Record<
  RetryAfterDurationUnit,
  Record<"one" | "other", MessageKey>
>;

const getRetryAfterMessageKey = (
  locale: SupportedLocale,
  unit: RetryAfterDurationUnit,
  count: number
): MessageKey => {
  const pluralCategory = new Intl.PluralRules(locale).select(count);

  return RETRY_AFTER_MESSAGE_KEYS[unit][
    pluralCategory === "one" ? "one" : "other"
  ];
};

const getRetryAfterDurationMessage = (
  retryAfterMs: number,
  locale: SupportedLocale
): string => {
  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  if (seconds < 60) {
    return t(locale, getRetryAfterMessageKey(locale, "seconds", seconds), {
      count: formatInteger(locale, seconds),
    });
  }

  const minutes = Math.ceil(seconds / 60);
  return t(locale, getRetryAfterMessageKey(locale, "minutes", minutes), {
    count: formatInteger(locale, minutes),
  });
};

const getRateLimitReactionMessage = (
  error: StructuredReactionError,
  locale: SupportedLocale
): string => {
  const retryAfterMs = extractRetryAfterMs(error);
  if (retryAfterMs !== null && retryAfterMs > 0) {
    return getRetryAfterDurationMessage(retryAfterMs, locale);
  }

  return t(locale, "drops.reactions.rateLimit.retryAfter.moment");
};

const getEmptyStructuredReactionStatusMessage = (
  error: StructuredReactionError,
  status: number | null,
  locale: SupportedLocale
): string | null => {
  switch (status) {
    case 401:
      return "Unauthorized";
    case 429:
      return getRateLimitReactionMessage(error, locale);
    case null:
      return null;
    default:
      return null;
  }
};

const getEmptyStructuredReactionStatusText = (
  error: StructuredReactionError
): string | null => {
  const statusText = error.response?.statusText;
  if (typeof statusText !== "string") {
    return null;
  }

  const trimmedStatusText = statusText.trim();

  if (trimmedStatusText.length === 0) {
    return null;
  }

  return trimmedStatusText;
};

const getEmptyStructuredReactionFallbackMessage = (
  error: StructuredReactionError
): string | null => {
  const message = error.message;
  if (typeof message !== "string") {
    return null;
  }

  const trimmedMessage = message.trim();

  if (trimmedMessage.length === 0) {
    return null;
  }

  return trimmedMessage;
};

export const getReactionErrorMessage = (
  error: unknown,
  fallback: string,
  locale: SupportedLocale = DEFAULT_LOCALE
): string => {
  if (error !== null && typeof error === "object") {
    const structuredError = error as StructuredReactionError;
    const structuredStatus = getStructuredReactionStatus(structuredError);
    if (isWaveReactionDisabledApiError(error)) {
      return t(locale, "drops.reactions.capabilityDisabled");
    }
    if (structuredStatus === 429) {
      return getRateLimitReactionMessage(structuredError, locale);
    }
    if (structuredStatus === 504) {
      return t(locale, "drops.reactions.requestTimedOut");
    }

    const structuredResponse = structuredError.response;
    if (structuredResponse !== null && structuredResponse !== undefined) {
      const structuredBody = structuredResponse.body;
      const safeMessage = getStructuredReactionBodyMessage(structuredBody);
      if (safeMessage) {
        return safeMessage;
      }

      if (!hasNoStructuredReactionBody(structuredBody)) {
        return fallback;
      }
    }

    const statusMessage = getEmptyStructuredReactionStatusMessage(
      structuredError,
      structuredStatus,
      locale
    );
    if (statusMessage) {
      return statusMessage;
    }

    const statusText = getEmptyStructuredReactionStatusText(structuredError);
    if (statusText) {
      return statusText;
    }

    const fallbackMessage =
      getEmptyStructuredReactionFallbackMessage(structuredError);
    if (fallbackMessage) {
      return fallbackMessage;
    }
  }

  return fallback;
};
