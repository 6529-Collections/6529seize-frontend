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

const MAX_LENGTH = 100;

const ALLOWED_CHAR = /^[\p{L}\p{N}?!,.'() -]$/u;

interface RepCategoryViolation {
  readonly key: MessageKey;
  readonly params?: Readonly<Record<string, string | number>>;
}

/**
 * A locale-neutral label for a disallowed character. Printable characters
 * show as themselves in quotes; control/invisible characters (line breaks,
 * tabs, zero-width spaces, direction overrides, …) render as nothing in a
 * message, so name them by Unicode code point (e.g. U+200B) instead — which
 * also avoids embedding English words like "tab" into an interpolated,
 * otherwise-translated sentence.
 */
// A char renders invisibly if it is a control/format char (\p{C}) or a
// separator other than a plain space (\p{Z} excluding " ") — e.g. tab,
// newline, NBSP, zero-width space, direction overrides.
const rendersInvisible = (char: string): boolean =>
  /\p{C}/u.test(char) || (char !== " " && /\p{Z}/u.test(char));

const describeChar = (char: string): string => {
  if (rendersInvisible(char)) {
    const codePoint = char.codePointAt(0) ?? 0;
    return `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`;
  }
  return `"${char}"`;
};

export function getRepCategoryViolation(
  category: string
): RepCategoryViolation | null {
  // Code points, not UTF-16 units — matching the server pattern's u-flag.
  const chars = Array.from(category);
  // Precedence is intentional and single-message: length → leading dash →
  // disallowed characters. The error surface shows one reason at a time, so
  // do not "fix" this into multi-error output.
  if (chars.length > MAX_LENGTH) {
    return {
      key: "rep.categories.validation.tooLong",
      params: { length: chars.length, max: MAX_LENGTH },
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
