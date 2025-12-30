/**
 * Validates token ID format.
 * Valid formats: "1", "1,2,3", "1-5", "1,2,5-10"
 * Returns null if valid, error message if invalid.
 */
export function validateTokenIdFormat(input: string): string | null {
  if (!input || !input.trim()) {
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
      const start = parseInt(parts[0].trim(), 10);
      const end = parseInt(parts[1].trim(), 10);
      if (isNaN(start) || isNaN(end)) {
        return "Invalid range. Use numbers only: 1-5";
      }
    } else {
      const id = parseInt(trimmed, 10);
      if (isNaN(id)) {
        return "Invalid token ID. Use: 1,2,5-10";
      }
    }
  }

  return null;
}
