import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";

export const GROUP_MENTION_TEXT: Readonly<Record<ApiDropGroupMention, string>> =
  {
    [ApiDropGroupMention.All]: "@all",
    [ApiDropGroupMention.Contributors]: "@contributors",
    [ApiDropGroupMention.Admins]: "@admins",
    [ApiDropGroupMention.Devs6529]: "@devs6529",
  };

const createGroupMentionPattern = (group: ApiDropGroupMention) =>
  new RegExp(
    `(^|[^A-Z0-9_@])(${GROUP_MENTION_TEXT[group]})(?![A-Z0-9_@])`,
    "gi"
  );

const createGroupMentionMarkPattern = (group: ApiDropGroupMention) =>
  new RegExp(
    `(?<![A-Z0-9_@])(${GROUP_MENTION_TEXT[group]})(?![A-Z0-9_@])`,
    "gi"
  );

export const getMentionedGroupsFromText = (
  content: string,
  canMentionAll: boolean
): ApiDropGroupMention[] =>
  Object.values(ApiDropGroupMention).filter(
    (group) =>
      (group !== ApiDropGroupMention.All || canMentionAll) &&
      createGroupMentionPattern(group).test(content)
  );

export const getMentionedGroupsFromParts = (
  parts: readonly {
    readonly mentioned_groups?: readonly ApiDropGroupMention[] | null;
  }[],
  canMentionAll: boolean
): ApiDropGroupMention[] =>
  Object.values(ApiDropGroupMention).filter(
    (group) =>
      (group !== ApiDropGroupMention.All || canMentionAll) &&
      parts.some((part) => part.mentioned_groups?.includes(group))
  );

export const hasMentionedGroup = (
  mentionedGroups: readonly ApiDropGroupMention[] | null | undefined,
  group: ApiDropGroupMention
) => mentionedGroups?.includes(group) ?? false;

export const areMentionedGroupsEqual = (
  a: readonly ApiDropGroupMention[],
  b: readonly ApiDropGroupMention[]
) => a.length === b.length && a.every((group) => b.includes(group));

export const markGroupMentionTokens = ({
  content,
  group,
  marker,
}: {
  readonly content: string;
  readonly group: ApiDropGroupMention;
  readonly marker: string;
}) =>
  content.replace(
    createGroupMentionMarkPattern(group),
    (_match, token: string) => `${marker}${token}${marker}`
  );
