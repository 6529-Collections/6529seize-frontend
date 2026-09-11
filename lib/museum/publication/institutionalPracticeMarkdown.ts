const EXACT_LEVEL_ONE_HEADING = /^# ([^\r\n]+)$/u;

export function parseInstitutionalPracticeHeading(
  markdown: string
): string | null {
  const firstLine = markdown.split(/\r?\n/u, 1)[0] ?? "";
  const match = EXACT_LEVEL_ONE_HEADING.exec(firstLine);
  const title = match?.[1];
  if (
    title?.length === undefined ||
    title.length === 0 ||
    title.trim() !== title
  ) {
    return null;
  }
  return title;
}
