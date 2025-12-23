export const TOOLTIP_STYLES = {
  padding: "4px 8px",
  background: "#37373E",
  color: "white",
  fontSize: "13px",
  fontWeight: 500,
  borderRadius: "6px",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  zIndex: 99999,
  pointerEvents: "none" as const,
} as const;

const INVALID_ATTR_CHARS = /[^a-zA-Z0-9_-]/g;
const HASH_RADIX = 36;
const UINT32_RANGE = 0x100000000;
const INT32_MAX = 0x7fffffff;

function hashTooltipSource(input: string): string {
  let hash = 0;

  for (let index = 0; index < input.length; ) {
    const codePoint = input.codePointAt(index) ?? 0;
    hash = (hash << 5) - hash + codePoint;
    const truncated = Math.trunc(hash);
    const unsigned = ((truncated % UINT32_RANGE) + UINT32_RANGE) % UINT32_RANGE;
    hash = unsigned > INT32_MAX ? unsigned - UINT32_RANGE : unsigned; // force 32-bit integer math without bitwise ops
    index += codePoint > 0xffff ? 2 : 1;
  }

  return Math.abs(hash).toString(HASH_RADIX);
}

export function buildTooltipId(
  ...parts: Array<string | number | null | undefined>
): string {
  const raw = parts
    .filter((part) => part !== null && part !== undefined)
    .map(String)
    .join("-");

  if (!raw) {
    return "tooltip";
  }

  const sanitized = raw
    .replaceAll(INVALID_ATTR_CHARS, "-")
    .toLowerCase()
    .replaceAll(/-+/g, "-")
    .replaceAll(/(?:^-|-$)/g, "");

  if (sanitized === raw) {
    return sanitized;
  }

  const uniqueSuffix = hashTooltipSource(raw);

  return `${sanitized}-${uniqueSuffix}`;
}
