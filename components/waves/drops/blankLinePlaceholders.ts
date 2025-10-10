// Zero-width space used to keep otherwise empty paragraphs visible in Lexical.
const BLANK_LINE_PLACEHOLDER = "\u200B";

export const addBlankLinePlaceholders = (markdown: string): string => {
  if (!markdown) {
    return markdown;
  }

  return markdown.replaceAll(/\n{3,}/g, (match) => {
    const extraNewLines = match.length - 2;
    const placeholderSegment = (`${BLANK_LINE_PLACEHOLDER}\n`).repeat(
      extraNewLines
    );

    return `\n\n${placeholderSegment}`;
  });
};

export const removeBlankLinePlaceholders = (markdown: string): string => {
  if (!markdown) {
    return markdown;
  }

  return markdown.replaceAll(BLANK_LINE_PLACEHOLDER, "");
};

export default {
  addBlankLinePlaceholders,
  removeBlankLinePlaceholders,
};
