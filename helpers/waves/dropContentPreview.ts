import { markdownToPlainText } from "@/helpers/waves/waveDescriptionPreview";

export const LONG_DROP_CONTENT_CHARACTER_THRESHOLD = 1100;
export const LONG_DROP_CONTENT_LINE_THRESHOLD = 20;
export const LONG_DROP_PREVIEW_CHARACTER_LIMIT = 900;

interface DropContentPreview {
  readonly isLong: boolean;
}

export const getDropContentPreview = (content: string): DropContentPreview => {
  const source = content.trim();
  const lineCount = source.length === 0 ? 0 : source.split(/\r?\n/).length;
  const mightBeLong =
    source.length > LONG_DROP_CONTENT_CHARACTER_THRESHOLD ||
    lineCount > LONG_DROP_CONTENT_LINE_THRESHOLD;

  if (!mightBeLong) {
    return {
      isLong: false,
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

  return { isLong };
};
