import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";

export const ALL_GROUP_MENTION_TEXT = "@all";

const createAllGroupMentionPattern = () =>
  /(^|[^A-Za-z0-9_@])(@all)(?![A-Za-z0-9_@])/g;

export const getMentionedGroupsFromParts = (
  parts: readonly {
    readonly mentioned_groups?:
      | readonly ApiDropGroupMention[]
      | null
      | undefined;
  }[],
  canMentionAll: boolean
): ApiDropGroupMention[] => {
  if (!canMentionAll) {
    return [];
  }

  return parts.some((part) =>
    part.mentioned_groups?.includes(ApiDropGroupMention.All)
  )
    ? [ApiDropGroupMention.All]
    : [];
};

export const hasMentionedGroup = (
  mentionedGroups: readonly ApiDropGroupMention[] | null | undefined,
  group: ApiDropGroupMention
) => mentionedGroups?.includes(group) ?? false;

export const areMentionedGroupsEqual = (
  a: readonly ApiDropGroupMention[],
  b: readonly ApiDropGroupMention[]
) => {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((group) => b.includes(group));
};

export const markAllGroupMentionTokens = ({
  content,
  marker,
}: {
  readonly content: string;
  readonly marker: string;
}) =>
  content.replace(
    createAllGroupMentionPattern(),
    (_match, prefix: string, token: string) =>
      `${prefix}${marker}${token}${marker}`
  );
