/**
 * Parses a string of token IDs into an array of numbers.
 * Supports single IDs, comma-separated lists, and ranges (e.g. "1,2,4-6,10").
 */
export function parseTokenIds(input: string): number[] {
  if (!input || !input.trim()) {
    return [];
  }

  const result: number[] = [];
  const segments = input.split(",");

  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed) continue;

    if (trimmed.includes("-")) {
      const parts = trimmed.split("-");
      if (parts.length === 2) {
        const start = parseInt(parts[0].trim(), 10);
        const end = parseInt(parts[1].trim(), 10);

        if (!isNaN(start) && !isNaN(end)) {
          const [min, max] = start <= end ? [start, end] : [end, start];
          for (let i = min; i <= max; i++) {
            result.push(i);
          }
        }
      }
    } else {
      const id = parseInt(trimmed, 10);
      if (!isNaN(id)) {
        result.push(id);
      }
    }
  }
  // Return unique sorted IDs
  return Array.from(new Set(result)).sort((a, b) => a - b);
}
