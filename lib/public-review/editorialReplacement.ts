import "next/dist/compiled/server-only";

const TRANSFORMATION_ERROR =
  "The current Stream review editorial transformation is out of date";

export function getRequiredEditorialMatch(
  markdown: string,
  pattern: RegExp,
  sectionName: string
): RegExpMatchArray {
  const initialLastIndex = pattern.lastIndex;
  pattern.lastIndex = 0;
  const match = pattern.exec(markdown);
  pattern.lastIndex = initialLastIndex;
  if (match === null) {
    throw new Error(`${TRANSFORMATION_ERROR}: ${sectionName}.`);
  }
  return match;
}

export function replaceRequiredEditorialMarkdown(
  markdown: string,
  pattern: string | RegExp,
  replacement: string,
  sectionName: string
): string {
  const matches =
    typeof pattern === "string"
      ? markdown.includes(pattern)
      : markdown.search(pattern) !== -1;
  if (!matches) {
    throw new Error(`${TRANSFORMATION_ERROR}: ${sectionName}.`);
  }
  return markdown.replace(pattern, replacement);
}
