import type { MessageKey } from "@/i18n/messages/en-US";

/**
 * Client-side mirror of the backend rep-category rules
 * (6529seize-backend src/entities/IAbusivenessDetectionResult.ts and
 * src/profiles/rep-category-rules.ts): 1-100 characters of unicode
 * letters/numbers, spaces, dashes and , . ? ! ' ( ) — with the dash allowed
 * anywhere except first position (leading dashes are spreadsheet formula
 * triggers in exports and read as negative signs next to rep amounts).
 *
 * Mirroring here lets the UI name the exact broken rule in the user's
 * locale instantly, instead of round-tripping for an English server error.
 * The server stays authoritative; drift only ever costs one extra round
 * trip, never acceptance of an invalid category.
 */

export const REP_CATEGORY_MAX_LENGTH = 100;

const ALLOWED_CHAR = /^[\p{L}\p{N}?!,.'() -]$/u;

export interface RepCategoryViolation {
  readonly key: MessageKey;
  readonly params?: Readonly<Record<string, string | number>>;
}

const describeChar = (char: string): string => {
  switch (char) {
    case "\n":
    case "\r":
      return "line break";
    case "\t":
      return "tab";
    default:
      return `"${char}"`;
  }
};

export function getRepCategoryViolation(
  category: string
): RepCategoryViolation | null {
  // Code points, not UTF-16 units — matching the server pattern's u-flag.
  const chars = Array.from(category);
  if (chars.length > REP_CATEGORY_MAX_LENGTH) {
    return {
      key: "rep.categories.validation.tooLong",
      params: { length: chars.length, max: REP_CATEGORY_MAX_LENGTH },
    };
  }
  if (category.startsWith("-")) {
    return { key: "rep.categories.validation.leadingDash" };
  }
  const disallowed = Array.from(
    new Set(chars.filter((char) => !ALLOWED_CHAR.test(char)))
  );
  if (disallowed.length > 0) {
    return {
      key: "rep.categories.validation.disallowedChars",
      params: { chars: disallowed.map(describeChar).join(", ") },
    };
  }
  return null;
}
