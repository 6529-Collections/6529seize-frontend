import { mapMarkdownProse } from "@/helpers/waves/mapMarkdownProse";

export const normalizeDropMarkdownContent = (
  content: string | null
): string | null => {
  if (content === null || content.length === 0) {
    return content;
  }

  return mapMarkdownProse(content, (prose) =>
    prose.replaceAll(/\n{3,}/g, (match: string) => {
      const extraBlankLines = match.length - 2;
      const fillerParagraphs = new Array(extraBlankLines)
        .fill("&nbsp;")
        .join("\n\n");
      return `\n\n${fillerParagraphs}\n\n`;
    })
  );
};
