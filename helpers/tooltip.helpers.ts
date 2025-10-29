const INVALID_ATTR_CHARS = /[^a-zA-Z0-9_-]/g;
const HASH_RADIX = 36;

function hashTooltipSource(input: string): string {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0; // force 32-bit integer math
  }

  return Math.abs(hash).toString(HASH_RADIX);
}

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

  const sanitized = raw.replace(INVALID_ATTR_CHARS, "-");

  if (sanitized === raw) {
    return sanitized;
  }

  const uniqueSuffix = hashTooltipSource(raw);

  return `${sanitized}-${uniqueSuffix}`;
}
