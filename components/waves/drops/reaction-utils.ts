import { ApiIdentity } from "@/generated/models/ObjectSerializer";
import { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { ApiDropReaction } from "@/generated/models/ApiDropReaction";

export type ReactionEntry = {
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

export const duplicateProfilesWithoutUser = (
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
    const filteredProfiles = duplicateProfilesWithoutUser(entry.profiles, userId);

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
    if (entries[index].reaction === reactionCode) {
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

  const fallbackId = profile.primary_wallet ?? "";

  return {
    id: profile.id ?? fallbackId,
    handle: profile.handle ?? null,
    pfp: profile.pfp ?? null,
    banner1_color: profile.banner1 ?? null,
    banner2_color: profile.banner2 ?? null,
    cic: profile.cic ?? 0,
    rep: profile.rep ?? 0,
    tdh: profile.tdh ?? 0,
    tdh_rate: profile.tdh_rate ?? 0,
    level: profile.level ?? 0,
    primary_address: profile.primary_wallet ?? "",
    subscribed_actions: [],
    archived: false,
    active_main_stage_submission_ids:
      profile.active_main_stage_submission_ids ?? [],
    winner_main_stage_drop_ids: profile.winner_main_stage_drop_ids ?? [],
  };
};
