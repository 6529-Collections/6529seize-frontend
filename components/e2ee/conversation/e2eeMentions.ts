import type { E2eeMember } from "@/lib/e2ee/types";

const MENTION_TOKEN = /@([A-Za-z0-9_.-]+)/g;
const MENTION_QUERY_BEFORE_CARET = /(?:^|\s)@([A-Za-z0-9_.-]{0,32})$/;

type MentionSegment =
  | { readonly kind: "text"; readonly start: number; readonly value: string }
  | {
      readonly kind: "mention";
      readonly start: number;
      readonly value: string;
      readonly profileId: string;
    };

const handleIndex = (members: readonly E2eeMember[]): Map<string, string> => {
  const index = new Map<string, string>();
  for (const member of members) {
    if (member.handle) {
      index.set(member.handle.toLowerCase(), member.profileId);
    }
  }
  return index;
};

/**
 * Splits message text into plain runs and `@handle` mentions of members the
 * message actually mentions. Unknown handles stay plain text.
 */
export function splitMentions(
  text: string,
  members: readonly E2eeMember[],
  mentionedProfileIds: readonly string[]
): MentionSegment[] {
  if (mentionedProfileIds.length === 0) {
    return [{ kind: "text", start: 0, value: text }];
  }
  const mentioned = new Set(mentionedProfileIds);
  const handles = handleIndex(members);
  const segments: MentionSegment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(MENTION_TOKEN)) {
    const handle = match[1];
    const profileId = handle ? handles.get(handle.toLowerCase()) : undefined;
    if (profileId === undefined || !mentioned.has(profileId)) {
      continue;
    }
    if (match.index > cursor) {
      segments.push({
        kind: "text",
        start: cursor,
        value: text.slice(cursor, match.index),
      });
    }
    segments.push({
      kind: "mention",
      start: match.index,
      value: match[0],
      profileId,
    });
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) {
    segments.push({ kind: "text", start: cursor, value: text.slice(cursor) });
  }
  return segments;
}

/** Profile ids of members whose `@handle` appears in the text. */
export function collectMentionIds(
  text: string,
  members: readonly E2eeMember[]
): string[] {
  const handles = handleIndex(members);
  const ids = new Set<string>();
  for (const match of text.matchAll(MENTION_TOKEN)) {
    const handle = match[1];
    const profileId = handle ? handles.get(handle.toLowerCase()) : undefined;
    if (profileId) {
      ids.add(profileId);
    }
  }
  return [...ids];
}

export interface ActiveMentionQuery {
  /** Index of the "@" in the text. */
  readonly start: number;
  readonly query: string;
}

/** The `@query` the caret is typing, if any. */
export function getActiveMentionQuery(
  text: string,
  caret: number
): ActiveMentionQuery | null {
  const before = text.slice(0, caret);
  const match = MENTION_QUERY_BEFORE_CARET.exec(before);
  if (!match) {
    return null;
  }
  const query = match[1] ?? "";
  return { start: caret - query.length - 1, query };
}

/** Members matching a mention query (handle prefix first), viewer excluded. */
export function filterMentionCandidates(
  members: readonly E2eeMember[],
  query: string,
  selfProfileId: string | null,
  limit = 6
): E2eeMember[] {
  const needle = query.toLowerCase();
  const candidates = members.filter(
    (member) =>
      member.profileId !== selfProfileId &&
      member.handle?.toLowerCase().includes(needle) === true
  );
  candidates.sort((a, b) => {
    const aPrefix = a.handle?.toLowerCase().startsWith(needle) ? 0 : 1;
    const bPrefix = b.handle?.toLowerCase().startsWith(needle) ? 0 : 1;
    return aPrefix - bPrefix;
  });
  return candidates.slice(0, limit);
}
