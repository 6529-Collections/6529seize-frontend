import { markdownToPlainText } from "@/helpers/waves/waveDescriptionPreview";

export const LONG_DROP_CONTENT_CHARACTER_THRESHOLD = 900;
export const LONG_DROP_CONTENT_LINE_THRESHOLD = 12;
export const LONG_DROP_PREVIEW_CHARACTER_LIMIT = 700;

interface DropContentPreview {
  readonly isLong: boolean;
  readonly text: string;
}

const findLastWhitespaceRunStart = (text: string): number => {
  let whitespaceRunStart = -1;

  for (let index = text.length - 1; index > 0; index -= 1) {
    if (/\s/.test(text.charAt(index))) {
      whitespaceRunStart = index;
    } else if (whitespaceRunStart >= 0) {
      break;
    }
  }

  return whitespaceRunStart;
};

const truncateAtWordBoundary = (text: string, limit: number): string => {
  if (text.length <= limit) {
    return text;
  }

  const candidate = text.slice(0, limit + 1);
  const lastWhitespaceIndex = findLastWhitespaceRunStart(candidate);
  const truncated =
    lastWhitespaceIndex > 0
      ? candidate.slice(0, lastWhitespaceIndex)
      : text.slice(0, limit);

  return `${truncated.trimEnd()}…`;
};

export const getDropContentPreview = (content: string): DropContentPreview => {
  const source = content.trim();
  const lineCount = source.length === 0 ? 0 : source.split(/\r?\n/).length;
  const mightBeLong =
    source.length > LONG_DROP_CONTENT_CHARACTER_THRESHOLD ||
    lineCount > LONG_DROP_CONTENT_LINE_THRESHOLD;

  if (!mightBeLong) {
    return {
      isLong: false,
      text: source,
    };
  }

  const text = markdownToPlainText(source, {
    includeImageUrls: false,
    includeLinkDestinations: false,
  });
  const isLong =
    text.length > 0 &&
    (text.length > LONG_DROP_CONTENT_CHARACTER_THRESHOLD ||
      lineCount > LONG_DROP_CONTENT_LINE_THRESHOLD);

  return {
    isLong,
    text: isLong
      ? truncateAtWordBoundary(text, LONG_DROP_PREVIEW_CHARACTER_LIMIT)
      : text,
  };
};
