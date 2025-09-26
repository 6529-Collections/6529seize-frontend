const REG_EXP_ESCAPE_PATTERN = /[.*+?^${}()|[\]\\]/g;
const REG_EXP_ESCAPE_PREFIX = String.fromCodePoint(92);

/**
 * Escapes characters with special meaning in regular expressions so the input can be safely embedded.
 */
export function escapeRegExp(value: string): string {
  return value.replaceAll(
    REG_EXP_ESCAPE_PATTERN,
    (match) => REG_EXP_ESCAPE_PREFIX + match
  );
}
