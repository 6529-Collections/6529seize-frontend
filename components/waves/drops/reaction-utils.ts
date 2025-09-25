import { ApiProfileMin } from "../../../generated/models/ApiProfileMin";

export type ReactionEntry = {
  reaction: string;
  profiles: ApiProfileMin[];
  [key: string]: unknown;
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
