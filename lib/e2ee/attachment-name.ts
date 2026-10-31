/**
 * Attachment names are chosen by whoever sent or imported the file, and the
 * payload allows 255 characters of anything. Every name the app shows or
 * saves as goes through `safeAttachmentName` first.
 */

/** Longest name shown, saved as, or written by the import. */
const MAX_NAME_CHARS = 120;
/** Extensions longer than this are not kept when a name is shortened. */
const MAX_EXTENSION_CHARS = 16;

/**
 * C0/C1 controls, bidirectional marks or overrides and invisible separators,
 * which can disguise a name (for example "evil<RLO>gnp.exe").
 */
function isUnsafeNameChar(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return (
    code < 0x20 ||
    (code >= 0x7f && code <= 0x9f) ||
    code === 0x061c ||
    code === 0x200b ||
    code === 0x200e ||
    code === 0x200f ||
    (code >= 0x202a && code <= 0x202e) ||
    (code >= 0x2066 && code <= 0x2069) ||
    code === 0xfeff
  );
}

/** A separator becomes "_", any whitespace one space, the rest itself. */
function mapNameChar(char: string): string {
  if (char === "/" || char === "\\") {
    return "_";
  }
  return /\s/u.test(char) ? " " : char;
}

/**
 * One linear pass (no backtracking regexes over attacker-chosen names):
 * drop unsafe characters and collapse runs of "_" or spaces they map to.
 */
function nameChars(raw: string): string[] {
  const chars: string[] = [];
  for (const char of raw.normalize("NFC")) {
    if (isUnsafeNameChar(char)) {
      continue;
    }
    const mapped = mapNameChar(char);
    const isRun = (mapped === "_" || mapped === " ") && chars.at(-1) === mapped;
    if (!isRun) {
      chars.push(mapped);
    }
  }
  return chars;
}

/** Without leading or trailing dots and spaces. */
function trimNameEdges(chars: readonly string[]): string[] {
  const isEdge = (char: string | undefined) => char === "." || char === " ";
  let start = 0;
  let end = chars.length;
  while (start < end && isEdge(chars[start])) {
    start += 1;
  }
  while (end > start && isEdge(chars[end - 1])) {
    end -= 1;
  }
  return chars.slice(start, end);
}

/**
 * A plain file name: NFC, no path separators, control or bidi characters,
 * no leading dots, at most 120 characters with the extension kept, or the
 * fallback when nothing is left.
 */
export function safeAttachmentName(raw: string, fallback: string): string {
  const name = trimNameEdges(nameChars(raw));
  if (name.length === 0) {
    return fallback;
  }
  if (name.length <= MAX_NAME_CHARS) {
    return name.join("");
  }
  const dot = name.lastIndexOf(".");
  const extension =
    dot > 0 && name.length - dot <= MAX_EXTENSION_CHARS ? name.slice(dot) : [];
  return name
    .slice(0, MAX_NAME_CHARS - extension.length)
    .concat(extension)
    .join("");
}
