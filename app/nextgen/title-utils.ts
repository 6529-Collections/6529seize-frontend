const cleanTitleParts = (
  parts: readonly (string | null | undefined)[]
): string[] =>
  parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

export function getNextgenTitle(
  ...parts: readonly (string | null | undefined)[]
): string {
  const title = cleanTitleParts(parts).join(" | ");
  return title || "NextGen";
}
