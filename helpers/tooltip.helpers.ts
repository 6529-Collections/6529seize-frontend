const INVALID_ATTR_CHARS = /[^a-zA-Z0-9_-]/g;

export function buildTooltipId(
  ...parts: Array<string | number | null | undefined>
): string {
  const raw = parts
    .filter((part) => part !== null && part !== undefined)
    .map((part) => String(part))
    .join("-");

  if (!raw) {
    return "tooltip";
  }

  return raw.replace(INVALID_ATTR_CHARS, "-");
}
