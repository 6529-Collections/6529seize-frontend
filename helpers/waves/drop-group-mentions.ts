import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";

export const GROUP_MENTION_TEXT: Readonly<Record<ApiDropGroupMention, string>> =
  {
    [ApiDropGroupMention.All]: "@all",
    [ApiDropGroupMention.Contributors]: "@contributors",
    [ApiDropGroupMention.Admins]: "@admins",
    [ApiDropGroupMention.Devs6529]: "@devs6529",
  };

const GROUP_MENTION_PATTERNS: Readonly<Record<ApiDropGroupMention, RegExp>> = {
  [ApiDropGroupMention.All]: /(?<![\p{L}\p{N}_@])(@all)(?![\p{L}\p{N}_@])/iu,
  [ApiDropGroupMention.Contributors]:
    /(?<![\p{L}\p{N}_@])(@contributors)(?![\p{L}\p{N}_@])/iu,
  [ApiDropGroupMention.Admins]:
    /(?<![\p{L}\p{N}_@])(@admins)(?![\p{L}\p{N}_@])/iu,
  [ApiDropGroupMention.Devs6529]:
    /(?<![\p{L}\p{N}_@])(@devs6529)(?![\p{L}\p{N}_@])/iu,
};

const GROUP_MENTION_MARK_PATTERN_FACTORIES: Readonly<
  Record<ApiDropGroupMention, () => RegExp>
> = {
  [ApiDropGroupMention.All]: () =>
    /(?<![\p{L}\p{N}_@])(@all)(?![\p{L}\p{N}_@])/giu,
  [ApiDropGroupMention.Contributors]: () =>
    /(?<![\p{L}\p{N}_@])(@contributors)(?![\p{L}\p{N}_@])/giu,
  [ApiDropGroupMention.Admins]: () =>
    /(?<![\p{L}\p{N}_@])(@admins)(?![\p{L}\p{N}_@])/giu,
  [ApiDropGroupMention.Devs6529]: () =>
    /(?<![\p{L}\p{N}_@])(@devs6529)(?![\p{L}\p{N}_@])/giu,
};

export const isAdminOnlyGroupMention = (group: ApiDropGroupMention): boolean =>
  group === ApiDropGroupMention.All ||
  group === ApiDropGroupMention.Contributors;

export const getMentionedGroupsFromText = (
  content: string,
  canMentionAdminOnlyGroups: boolean
): ApiDropGroupMention[] =>
  Object.values(ApiDropGroupMention).filter(
    (group) =>
      (!isAdminOnlyGroupMention(group) || canMentionAdminOnlyGroups) &&
      GROUP_MENTION_PATTERNS[group].test(content)
  );

export const getMentionedGroupsFromParts = (
  parts: readonly {
    readonly mentioned_groups?: readonly ApiDropGroupMention[] | null;
  }[],
  canMentionAdminOnlyGroups: boolean
): ApiDropGroupMention[] =>
  // Part metadata describes global tokens in the current displayed content;
  // it is not a notification-delivery or audience audit record.
  Object.values(ApiDropGroupMention).filter(
    (group) =>
      (!isAdminOnlyGroupMention(group) || canMentionAdminOnlyGroups) &&
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
    GROUP_MENTION_MARK_PATTERN_FACTORIES[group](),
    (_match, token: string) => `${marker}${token}${marker}`
  );
