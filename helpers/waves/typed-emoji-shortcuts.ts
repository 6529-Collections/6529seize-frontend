const SLIGHTLY_SMILING_FACE = ":slightly_smiling_face:";
const GRINNING_FACE = ":grinning:";
const WINKING_FACE = ":wink:";
const SLIGHTLY_FROWNING_FACE = ":slightly_frowning_face:";
const TONGUE_FACE = ":stuck_out_tongue:";
const CRYING_FACE = ":cry:";
const OPEN_MOUTH_FACE = ":open_mouth:";
const NEUTRAL_FACE = ":neutral_face:";

const TYPED_EMOJI_SHORTCUTS = [
  [":)", SLIGHTLY_SMILING_FACE],
  [":-)", SLIGHTLY_SMILING_FACE],
  [":D", GRINNING_FACE],
  [":-D", GRINNING_FACE],
  [";)", WINKING_FACE],
  [";-)", WINKING_FACE],
  [":(", SLIGHTLY_FROWNING_FACE],
  [":-(", SLIGHTLY_FROWNING_FACE],
  [":P", TONGUE_FACE],
  [":-P", TONGUE_FACE],
  [":p", TONGUE_FACE],
  [":-p", TONGUE_FACE],
  [":'(", CRYING_FACE],
  [":'-(", CRYING_FACE],
  [":O", OPEN_MOUTH_FACE],
  [":-O", OPEN_MOUTH_FACE],
  [":o", OPEN_MOUTH_FACE],
  [":-o", OPEN_MOUTH_FACE],
  [":|", NEUTRAL_FACE],
  [":-|", NEUTRAL_FACE],
] as const;

const ORDERED_SHORTCUTS = [...TYPED_EMOJI_SHORTCUTS].sort(
  ([left], [right]) => right.length - left.length
);
const FENCE_START_PATTERN = /^ {0,3}(`{3,}|~{3,})/;
const FENCE_CLOSE_PATTERN = /^ {0,3}(`{3,}|~{3,})\s*$/;
const LEADING_BOUNDARY_PATTERN = /[\s([{]/;
const TRAILING_BOUNDARY_PATTERN = /[\s.!?,;)\]}]/;

const hasLeadingBoundary = (value: string, index: number): boolean =>
  index === 0 || LEADING_BOUNDARY_PATTERN.test(value.charAt(index - 1));

const hasTrailingBoundary = (value: string, index: number): boolean =>
  index === value.length || TRAILING_BOUNDARY_PATTERN.test(value.charAt(index));

const isFollowedByExtraClosingParen = (
  value: string,
  shortcut: string,
  index: number
): boolean =>
  shortcut.endsWith(")") && value.charAt(index + shortcut.length) === ")";

const getShortcutReplacement = (
  value: string,
  index: number
): { readonly shortcut: string; readonly replacement: string } | null => {
  if (!hasLeadingBoundary(value, index)) {
    return null;
  }

  for (const [shortcut, replacement] of ORDERED_SHORTCUTS) {
    if (
      value.startsWith(shortcut, index) &&
      hasTrailingBoundary(value, index + shortcut.length) &&
      !isFollowedByExtraClosingParen(value, shortcut, index)
    ) {
      return { shortcut, replacement };
    }
  }

  return null;
};

const normalizeTextSegment = (value: string): string => {
  let normalized = "";
  let index = 0;

  while (index < value.length) {
    const shortcut = getShortcutReplacement(value, index);
    if (shortcut !== null) {
      normalized += shortcut.replacement;
      index += shortcut.shortcut.length;
      continue;
    }

    normalized += value.charAt(index);
    index += 1;
  }

  return normalized;
};

const normalizeInlineCodeSafeText = (value: string): string => {
  let normalized = "";
  let index = 0;

  while (index < value.length) {
    const codeStartIndex = value.indexOf("`", index);
    if (codeStartIndex === -1) {
      normalized += normalizeTextSegment(value.slice(index));
      break;
    }

    normalized += normalizeTextSegment(value.slice(index, codeStartIndex));

    const openingMatch = /`+/.exec(value.slice(codeStartIndex));
    if (openingMatch === null) {
      normalized += value.slice(codeStartIndex);
      break;
    }

    const delimiter = openingMatch[0];
    const codeContentStartIndex = codeStartIndex + delimiter.length;
    const codeEndIndex = value.indexOf(delimiter, codeContentStartIndex);
    if (codeEndIndex === -1) {
      normalized += value.slice(codeStartIndex);
      break;
    }

    const codeEndDelimiterIndex = codeEndIndex + delimiter.length;
    normalized += value.slice(codeStartIndex, codeEndDelimiterIndex);
    index = codeEndDelimiterIndex;
  }

  return normalized;
};

const getFenceDelimiter = (line: string): string | null => {
  const match = FENCE_START_PATTERN.exec(line);
  return match?.[1] ?? null;
};

const getClosingFenceDelimiter = (line: string): string | null => {
  const match = FENCE_CLOSE_PATTERN.exec(line);
  return match?.[1] ?? null;
};

const closesFence = (line: string, fenceDelimiter: string): boolean => {
  const closingDelimiter = getClosingFenceDelimiter(line);
  return (
    closingDelimiter !== null &&
    closingDelimiter.startsWith(fenceDelimiter.slice(0, 1)) &&
    closingDelimiter.length >= fenceDelimiter.length
  );
};

export const normalizeTypedEmojiShortcuts = (markdown: string): string => {
  if (markdown.length === 0) {
    return markdown;
  }

  const lines = markdown.split(/(\n)/);
  let activeFenceDelimiter: string | null = null;

  return lines
    .map((line) => {
      if (line === "\n") {
        return line;
      }

      if (activeFenceDelimiter !== null) {
        if (closesFence(line, activeFenceDelimiter)) {
          activeFenceDelimiter = null;
        }
        return line;
      }

      const openingFenceDelimiter = getFenceDelimiter(line);
      if (openingFenceDelimiter !== null) {
        activeFenceDelimiter = openingFenceDelimiter;
        return line;
      }

      return normalizeInlineCodeSafeText(line);
    })
    .join("");
};
