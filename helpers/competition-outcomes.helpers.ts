import { formatInteger } from "@/i18n/format";

export function formatOutcomePositions(
  positions: readonly number[],
  locale: Parameters<typeof formatInteger>[0]
): string {
  const ordered = Array.from(new Set(positions)).sort((a, b) => a - b);
  const ranges: string[] = [];
  for (let index = 0; index < ordered.length; index++) {
    const start = ordered[index]!;
    let end = start;
    while (ordered[index + 1] === end + 1) end = ordered[++index]!;
    ranges.push(
      start === end
        ? formatInteger(locale, start)
        : `${formatInteger(locale, start)}–${formatInteger(locale, end)}`
    );
  }
  return ranges.join(", ");
}
