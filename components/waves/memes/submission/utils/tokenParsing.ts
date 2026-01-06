/**
 * Validates token ID format.
 * Valid formats: "1", "1,2,3", "1-5", "1,2,5-10"
 * Returns null if valid, error message if invalid.
 */
export function validateTokenIdFormat(input: string): string | null {
  if (!input.trim()) {
    return null; // Empty is valid
  }

  const segments = input.split(",");

  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed) continue;

    if (trimmed.includes("-")) {
      const parts = trimmed.split("-");
      if (parts.length !== 2) {
        return "Invalid range format. Use: 1-5";
      }
      const [startRaw, endRaw] = parts;
      if (!startRaw || !endRaw) {
        return "Invalid range format. Use: 1-5";
      }
      const start = Number.parseInt(startRaw.trim(), 10);
      const end = Number.parseInt(endRaw.trim(), 10);
      if (Number.isNaN(start) || Number.isNaN(end)) {
        return "Invalid range. Use numbers only: 1-5";
      }
      if (start < 0 || end < 0) {
        return "Invalid range. Token IDs must be non-negative.";
      }
      if (start > end) {
        return "Invalid range. Start must be less than end.";
      }
      if (start === end) {
        return "Invalid range. Use a single token ID instead of a range.";
      }
    } else {
      const id = Number.parseInt(trimmed, 10);
      if (Number.isNaN(id)) {
        return "Invalid token ID. Use: 1,2,5-10";
      }
      if (id < 0) {
        return "Invalid token ID. Must be non-negative.";
      }
    }
  }

  return null;
}
