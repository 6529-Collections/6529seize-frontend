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
    String.raw`(^|[^\p{L}\p{N}_@])(${GROUP_MENTION_TEXT[group]})(?![\p{L}\p{N}_@])`,
    "iu"
  );

const createGroupMentionMarkPattern = (group: ApiDropGroupMention) =>
  new RegExp(
    String.raw`(?<![\p{L}\p{N}_@])(${GROUP_MENTION_TEXT[group]})(?![\p{L}\p{N}_@])`,
    "giu"
  );

const GROUP_MENTION_PATTERNS: Readonly<Record<ApiDropGroupMention, RegExp>> = {
  [ApiDropGroupMention.All]: createGroupMentionPattern(ApiDropGroupMention.All),
  [ApiDropGroupMention.Contributors]: createGroupMentionPattern(
    ApiDropGroupMention.Contributors
  ),
  [ApiDropGroupMention.Admins]: createGroupMentionPattern(
    ApiDropGroupMention.Admins
  ),
  [ApiDropGroupMention.Devs6529]: createGroupMentionPattern(
    ApiDropGroupMention.Devs6529
  ),
};

const GROUP_MENTION_MARK_PATTERNS: Readonly<
  Record<ApiDropGroupMention, RegExp>
> = {
  [ApiDropGroupMention.All]: createGroupMentionMarkPattern(
    ApiDropGroupMention.All
  ),
  [ApiDropGroupMention.Contributors]: createGroupMentionMarkPattern(
    ApiDropGroupMention.Contributors
  ),
  [ApiDropGroupMention.Admins]: createGroupMentionMarkPattern(
    ApiDropGroupMention.Admins
  ),
  [ApiDropGroupMention.Devs6529]: createGroupMentionMarkPattern(
    ApiDropGroupMention.Devs6529
  ),
};

export const getMentionedGroupsFromText = (
  content: string,
  canMentionAll: boolean
): ApiDropGroupMention[] =>
  // @all keeps its creator/admin permission gate. The other platform-managed
  // groups are intentionally available to any author who can post; the API
  // resolves recipients against the wave's visibility and access groups.
  Object.values(ApiDropGroupMention).filter(
    (group) =>
      (group !== ApiDropGroupMention.All || canMentionAll) &&
      GROUP_MENTION_PATTERNS[group].test(content)
  );

export const getMentionedGroupsFromParts = (
  parts: readonly {
    readonly mentioned_groups?: readonly ApiDropGroupMention[] | null;
  }[],
  canMentionAll: boolean
): ApiDropGroupMention[] =>
  // Part metadata describes global tokens in the current displayed content;
  // it is not a notification-delivery or audience audit record.
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
    GROUP_MENTION_MARK_PATTERNS[group],
    (_match, token: string) => `${marker}${token}${marker}`
  );
