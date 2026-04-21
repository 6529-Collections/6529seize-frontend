import type { ApiIdentity } from "@/generated/models/ObjectSerializer";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ApiDropReaction } from "@/generated/models/ApiDropReaction";
import { getBannerColorValue } from "@/helpers/profile-banner.helpers";

type ReactionEntry = {
  reaction: string;
  profiles: ApiProfileMin[];
  [key: string]: unknown;
};

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

export const findReactionIndex = (
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
  };
};

type StructuredReactionError = {
  response?: {
    body?: unknown;
  };
};

const isNonEmptyUnknownArray = (value: unknown): value is readonly unknown[] =>
  Array.isArray(value) && value.length > 0;

const getDetailsFirstMessage = (details: unknown): string | null => {
  if (!isNonEmptyUnknownArray(details)) {
    return null;
  }

  const [firstDetail] = details;
  if (firstDetail === null || typeof firstDetail !== "object") {
    return null;
  }

  const message = (firstDetail as { message?: unknown }).message;
  if (typeof message === "string" && message.trim().length > 0) {
    return message;
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

export const getReactionErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (error !== null && typeof error === "object") {
    const structuredError = error as StructuredReactionError;
    const safeMessage = getStructuredReactionBodyMessage(
      structuredError.response?.body
    );
    if (safeMessage) {
      return safeMessage;
    }
  }

  return fallback;
};
