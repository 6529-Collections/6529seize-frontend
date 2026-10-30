import "next/dist/compiled/server-only";

import { load } from "cheerio";

/**
 * Remote pages are read with a byte cap, but link-preview metadata sits near
 * the top of a document. Scanning only this prefix bounds per-request work.
 */
const DEFAULT_SCAN_MAX_CHARS = 1024 * 1024;
const MAX_METADATA_ELEMENTS = 2048;
const MAX_TRACKED_TAG_NAME_LENGTH = "plaintext".length;

const METADATA_VOID_TAGS = new Set(["link", "meta"]);
const METADATA_TEXT_TAGS = new Set(["script", "title"]);
// End tags of elements whose contents the HTML tokenizer reads as text.
const RAW_TEXT_END_TAG_PATTERNS = new Map<string, RegExp>([
  ["iframe", /<\/iframe[\t\n\f\r />]/gi],
  ["noembed", /<\/noembed[\t\n\f\r />]/gi],
  ["noframes", /<\/noframes[\t\n\f\r />]/gi],
  ["noscript", /<\/noscript[\t\n\f\r />]/gi],
  ["script", /<\/script[\t\n\f\r />]/gi],
  ["style", /<\/style[\t\n\f\r />]/gi],
  ["textarea", /<\/textarea[\t\n\f\r />]/gi],
  ["title", /<\/title[\t\n\f\r />]/gi],
  ["xmp", /<\/xmp[\t\n\f\r />]/gi],
]);
const COMMENT_END_PATTERN = /--!?>/g;
// The JSON string escape for "<" (a backslash, then "u003C"), then "!--".
const ESCAPED_SCRIPT_COMMENT_OPEN = `${String.fromCodePoint(92)}u003C!--`;

const TAB = 9;
const LINE_FEED = 10;
const FORM_FEED = 12;
const CARRIAGE_RETURN = 13;
const SPACE = 32;
const EXCLAMATION_MARK = 33;
const DOUBLE_QUOTE = 34;
const SINGLE_QUOTE = 39;
const SLASH = 47;
const EQUALS = 61;
const GREATER_THAN = 62;
const QUESTION_MARK = 63;

interface ScannedToken {
  /** Index just past the token. */
  readonly end: number;
  /** Markup to keep for metadata queries, if the token is a metadata element. */
  readonly markup?: string | undefined;
}

interface HtmlMetadataOptions {
  /** Characters of `html` to scan; defaults to the first 1 MiB. */
  readonly maxChars?: number | undefined;
}

/**
 * Reads the code point at `index`, or -1 past the end. Scans still step one
 * UTF-16 code unit at a time and only compare against ASCII values, which
 * neither half of a surrogate pair (nor a combined astral code point) equals.
 */
const codeAt = (source: string, index: number): number =>
  source.codePointAt(index) ?? -1;

const isTagWhitespace = (code: number): boolean =>
  code === TAB ||
  code === LINE_FEED ||
  code === FORM_FEED ||
  code === CARRIAGE_RETURN ||
  code === SPACE;

const isAsciiLetter = (code: number): boolean =>
  (code >= 65 && code <= 90) || (code >= 97 && code <= 122);

const endsTagName = (code: number): boolean =>
  isTagWhitespace(code) || code === SLASH || code === GREATER_THAN;

const endsAttributeName = (code: number): boolean =>
  endsTagName(code) || code === EQUALS;

const endsUnquotedValue = (code: number): boolean =>
  isTagWhitespace(code) || code === GREATER_THAN;

function skipUntil(
  source: string,
  start: number,
  stop: (code: number) => boolean
): number {
  let index = start;
  while (index < source.length && !stop(codeAt(source, index))) {
    index += 1;
  }
  return index;
}

function skipWhitespace(source: string, start: number): number {
  return skipUntil(source, start, (code) => !isTagWhitespace(code));
}

/**
 * Returns the index just past an attribute value that starts at `start`, or
 * -1 when a quoted value is not closed before the input ends.
 */
function skipAttributeValue(source: string, start: number): number {
  const index = skipWhitespace(source, start);
  const code = codeAt(source, index);
  if (code === DOUBLE_QUOTE || code === SINGLE_QUOTE) {
    const closingQuote = source.indexOf(source.charAt(index), index + 1);
    return closingQuote === -1 ? -1 : closingQuote + 1;
  }
  return skipUntil(source, index, endsUnquotedValue);
}

/**
 * Follows the HTML tokenizer's attribute states from `start` (just after a
 * tag name) and returns the index of the `>` that closes the tag, or -1 when
 * the input ends first. Each step moves forward, so the scan is linear.
 */
function findTagEnd(source: string, start: number): number {
  let index = start;
  while (index < source.length) {
    const code = codeAt(source, index);
    if (code === GREATER_THAN) {
      return index;
    }
    if (isTagWhitespace(code) || code === SLASH) {
      index += 1;
      continue;
    }
    // An attribute name; its first character may be "=".
    index = skipWhitespace(
      source,
      skipUntil(source, index + 1, endsAttributeName)
    );
    if (codeAt(source, index) === EQUALS) {
      index = skipAttributeValue(source, index + 1);
      if (index === -1) {
        return -1;
      }
    }
  }
  return -1;
}

function findCommentEnd(source: string, start: number): number {
  if (source.startsWith(">", start)) {
    return start + 1;
  }
  if (source.startsWith("->", start)) {
    return start + 2;
  }
  COMMENT_END_PATTERN.lastIndex = start;
  const match = COMMENT_END_PATTERN.exec(source);
  return match ? match.index + match[0].length : -1;
}

/**
 * Keeps only the leading "<" of a copied start tag. Inside attribute values
 * "&lt;" decodes back to "<", so values are unchanged, but no copied tag can
 * open further elements when the flat document is parsed.
 */
const neutralizeStartTag = (tag: string): string =>
  `<${tag.slice(1).replaceAll("<", "&lt;")}`;

/**
 * Rewrites every "<!--" in copied script text with "<" spelled as its JSON
 * string escape (a backslash, then "u003C").
 *
 * Guarantee: copied script text never contains a `</script` end tag (the scan
 * stops at the first one followed by whitespace, "/", or ">") and, after this
 * rewrite, never contains "<!--", the only sequence that moves the tokenizer
 * into its escaped script states. So each copied script ends exactly at its
 * appended `</script>` and cannot absorb the elements copied after it.
 *
 * Consumers only read script text as JSON (JSON-LD, `__NEXT_DATA__`). In valid
 * JSON "<!--" can only occur inside strings, where the escape decodes back to
 * "<", so the parsed value is unchanged. Text of other scripts may change;
 * nothing reads it.
 */
const neutralizeScriptText = (text: string): string =>
  text.replaceAll("<!--", ESCAPED_SCRIPT_COMMENT_OPEN);

function readRawTextElement(
  source: string,
  name: string,
  startTag: string,
  contentStart: number
): ScannedToken | null {
  const endTagPattern = RAW_TEXT_END_TAG_PATTERNS.get(name);
  if (!endTagPattern) {
    return { end: contentStart };
  }

  endTagPattern.lastIndex = contentStart;
  const endTag = endTagPattern.exec(source);
  if (!endTag) {
    return null;
  }

  const endTagClose = findTagEnd(source, endTag.index + name.length + 2);
  if (endTagClose === -1) {
    return null;
  }

  if (!METADATA_TEXT_TAGS.has(name)) {
    return { end: endTagClose + 1 };
  }

  const text = source.slice(contentStart, endTag.index);
  return {
    end: endTagClose + 1,
    markup: `${neutralizeStartTag(startTag)}${
      name === "script" ? neutralizeScriptText(text) : text
    }</${name}>`,
  };
}

function readStartTag(source: string, start: number): ScannedToken | null {
  const nameEnd = skipUntil(source, start + 1, endsTagName);
  const tagClose = findTagEnd(source, nameEnd);
  if (tagClose === -1) {
    return null;
  }

  const name =
    nameEnd - start - 1 <= MAX_TRACKED_TAG_NAME_LENGTH
      ? source.slice(start + 1, nameEnd).toLowerCase()
      : "";
  if (name === "plaintext") {
    // Everything after <plaintext> is text.
    return null;
  }

  const startTag = source.slice(start, tagClose + 1);
  if (METADATA_VOID_TAGS.has(name)) {
    return { end: tagClose + 1, markup: neutralizeStartTag(startTag) };
  }

  return readRawTextElement(source, name, startTag, tagClose + 1);
}

/**
 * Skips an end tag, comment, doctype, or other markup declaration at `start`.
 * Returns null when the input ends inside it.
 */
function skipNonElementTag(source: string, start: number): number | null {
  if (source.startsWith("<!--", start)) {
    const end = findCommentEnd(source, start + 4);
    return end === -1 ? null : end;
  }

  const isEndTag =
    codeAt(source, start + 1) === SLASH &&
    isAsciiLetter(codeAt(source, start + 2));
  const close = isEndTag
    ? findTagEnd(source, skipUntil(source, start + 2, endsTagName))
    : source.indexOf(">", start + 2);
  return close === -1 ? null : close + 1;
}

function readToken(source: string, start: number): ScannedToken | null {
  const next = codeAt(source, start + 1);
  if (isAsciiLetter(next)) {
    return readStartTag(source, start);
  }

  if (next === SLASH || next === EXCLAMATION_MARK || next === QUESTION_MARK) {
    const end = skipNonElementTag(source, start);
    return end === null ? null : { end };
  }

  // A "<" that does not open a tag is text.
  return { end: start + 1 };
}

/**
 * Copies the metadata elements (`meta`, `link`, `title`, `script`) of
 * untrusted HTML into a flat document, in source order. The scan is a single
 * forward pass that follows the HTML tokenizer's rules for tags, comments, and
 * raw-text elements, and the copy has no nesting, so both the scan and any
 * parse of its output stay linear in the input size.
 */
function extractMetadataMarkup(html: string, maxChars: number): string {
  const source = html.length > maxChars ? html.slice(0, maxChars) : html;
  const elements: string[] = [];
  let index = 0;

  while (elements.length < MAX_METADATA_ELEMENTS) {
    const tagStart = source.indexOf("<", index);
    if (tagStart === -1) {
      break;
    }

    const token = readToken(source, tagStart);
    if (!token) {
      // The input ends inside this token, so nothing after it is markup.
      break;
    }

    if (token.markup) {
      elements.push(token.markup);
    }
    index = token.end;
  }

  return elements.join("");
}

/**
 * Loads only the metadata elements of untrusted remote HTML for Cheerio
 * queries. Use this instead of `load(html)` for fetched pages: document
 * structure outside `meta`, `link`, `title`, and `script` elements is dropped,
 * and only the first `maxChars` characters are scanned.
 */
export function loadHtmlMetadata(
  html: string,
  { maxChars = DEFAULT_SCAN_MAX_CHARS }: HtmlMetadataOptions = {}
): ReturnType<typeof load> {
  return load(extractMetadataMarkup(html, maxChars));
}
